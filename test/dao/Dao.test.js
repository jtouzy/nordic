const { expect } = require('chai')
const Dao = require('../../src/dao/Dao')

class MockedDatabaseProxy {
  constructor() {
    this.$queries = []
    this.$data = [
      { article_id: 1, title: 'article1' },
      { article_id: 2, title: 'article2' }
    ]
  }
  query(query) {
    this.$queries.push(query)
    const values = query.values
    if (values.length === 1) {
      return Promise.resolve(this.$data.filter(a => a.article_id === values[0]))
    } else {
      return Promise.resolve(this.$data)
    }
  }
}

const provideDaoWithTableWithNoPrimaryKeys = () => {
  return new Dao({
    tableMetadata: {
      schema: 'secured',
      name: 'articles',
      columns: [
        { name: 'article_id', required: true, primaryKey: false },
        { name: 'title', required: true, primaryKey: false }
      ]
    }
  })
}

const provideDaoWithTableWithOnePrimaryKey = () => {
  const mockedDatabaseProxy = new MockedDatabaseProxy()
  return new Dao({
    tableMetadata: {
      schema: 'secured',
      name: 'articles',
      columns: [
        { name: 'article_id', required: true, primaryKey: true },
        { name: 'title', required: true, primaryKey: false }
      ]
    },
    databaseProxy: mockedDatabaseProxy
  })
}

const provideDaoWithTableWithTwoPrimaryKeysWithOneRequired = () => {
  return new Dao({
    tableMetadata: {
      schema: 'secured',
      name: 'articles',
      columns: [
        { name: 'article_id', required: true, primaryKey: true },
        { name: 'article_reference', required: false, primaryKey: true }
      ]
    }
  })
}

const daoProviderWithMockedDatabaseProxy = (schema, table) => {
  const mockedDatabaseProxy = new MockedDatabaseProxy()
  return new Dao({
    tableMetadata: { schema, name: table },
    databaseProxy: mockedDatabaseProxy
  })
}

const provideDaoAndFindAllWithMockedDatabaseProxy = async (schema, table) => {
  const dao = daoProviderWithMockedDatabaseProxy('secured', 'articles')
  const databaseProxy = dao.$databaseProxy
  const result = await dao.findAll()
  return { dao, result }
}

const provideDaoAndFindOneWithMockedDatabaseProxy = async (schema, table, query) => {
  const dao = daoProviderWithMockedDatabaseProxy('secured', 'articles')
  const databaseProxy = dao.$databaseProxy
  const result = await dao.findOne(query)
  return { dao, result }
}

const provideDaoAndUpdateWithMockedDatabaseProxy = async (schema, table, object) => {
  const dao = provideDaoWithTableWithOnePrimaryKey()
  const databaseProxy = dao.$databaseProxy
  await dao.update(object)
  return dao
}

const provideDaoAndDeleteWithMockedDatabaseProxy = async (schema, table, object) => {
  const dao = provideDaoWithTableWithOnePrimaryKey()
  const databaseProxy = dao.$databaseProxy
  await dao.delete(object)
  return dao
}

describe('Dao.constructor', () => {
  it('Should be fine if context object is set', () => {
    expect(() => { new Dao({}) }).to.not.throw(Error)
  })
  it('Should throw error if context object is not set', () => {
    expect(() => { new Dao() }).to.throw(Error)
  })
})

describe('Dao.findAll', () => {
  it('Should send SQL SELECT to database proxy', async () => {
    const { dao } = await provideDaoAndFindAllWithMockedDatabaseProxy('secured', 'articles')
    const databaseProxy = dao.$databaseProxy
    expect(databaseProxy.$queries).to.be.eql([{
      text: 'SELECT * FROM secured.articles AS articles',
      values: []
    }])
  })
  it('Should return values as transformed objects', async () => {
    const { result } = await provideDaoAndFindAllWithMockedDatabaseProxy('secured', 'articles')
    expect(result).to.be.eql([
      { articleId: 1, title: 'article1' },
      { articleId: 2, title: 'article2' }
    ])
  })
})

describe('Dao.findOne', () => {
  it('Should send SQL SELECT to database proxy', async () => {
    const { dao } = await provideDaoAndFindOneWithMockedDatabaseProxy('secured', 'articles', { articleId: 1 })
    const databaseProxy = dao.$databaseProxy
    expect(databaseProxy.$queries).to.be.eql([{
      text: 'SELECT * FROM secured.articles AS articles WHERE article_id = $1',
      values: [1]
    }])
  })
  it('Should return values as transformed objects', async () => {
    const { result } = await provideDaoAndFindOneWithMockedDatabaseProxy('secured', 'articles', { articleId: 1 })
    expect(result).to.be.eql({ articleId: 1, title: 'article1' })
  })
})

describe('Dao.update', () => {
  it('Should send SQL UPDATE to database proxy', async () => {
    const dao = await provideDaoAndUpdateWithMockedDatabaseProxy('secured', 'articles', { title: 'Toto', articleId: 1 })
    const databaseProxy = dao.$databaseProxy
    expect(databaseProxy.$queries).to.be.eql([{
      text: 'UPDATE secured.articles SET title = $1 WHERE article_id = $2',
      values: ['Toto', 1]
    }])
  })
})

describe('Dao.deleteOne', () => {
  it('Should send SQL DELETE with primary keys to database proxy', async () => {
    // Given
    const dao = provideDaoWithTableWithOnePrimaryKey()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.deleteOne({ title: 'Toto', articleId: 1 })
    // Expect
    expect(databaseProxy.$queries).to.be.eql([{
      text: 'DELETE FROM secured.articles WHERE article_id = $1',
      values: [1]
    }])
  })
})

describe('Dao.delete', () => {
  it('Should send SQL DELETE to database proxy', async () => {
    const dao = await provideDaoAndDeleteWithMockedDatabaseProxy('secured', 'articles', { title: 'Toto', articleId: 1 })
    const databaseProxy = dao.$databaseProxy
    expect(databaseProxy.$queries).to.be.eql([{
      text: 'DELETE FROM secured.articles WHERE title = $1 AND article_id = $2',
      values: ['Toto', 1]
    }])
  })
})

describe('Dao.$getUpdateConditionsObjectFromArguments', () => {
  // TODO add string argument test when implemented
  it('Should convert given object conditions for update', () => {
    // Given
    const dao = provideDaoWithTableWithOnePrimaryKey()
    // When
    const result = dao.$getUpdateConditionsObjectFromArguments({ articleId: 1, title: 'Todo' }, { articleReference: 1 })
    // Expect
    expect(result).to.be.eql({ article_reference: 1 })
  })
  it('Should convert given function conditions for update', () => {
    // Given
    const dao = provideDaoWithTableWithOnePrimaryKey()
    // When
    const result = dao.$getUpdateConditionsObjectFromArguments({ articleId: 1, title: 'Todo' }, () => { return { articleReference: 1 } })
    // Expect
    expect(result).to.be.eql({ article_reference: 1 })
  })
  it('Should convert primary keys as conditions for update if no conditions given', () => {
    // Given
    const dao = provideDaoWithTableWithOnePrimaryKey()
    // When
    const result = dao.$getUpdateConditionsObjectFromArguments({ articleId: 1, title: 'Todo' })
    // Expect
    expect(result).to.be.eql({ article_id: 1 })
  })
  it('Should convert primary keys as conditions for update if no conditions given, avoiding non-required primary keys', () => {
    // Given
    const dao = provideDaoWithTableWithTwoPrimaryKeysWithOneRequired()
    // When
    const result = dao.$getUpdateConditionsObjectFromArguments({ articleId: 1, title: 'Todo' })
    // Expect
    expect(result).to.be.eql({ article_id: 1 })
  })
  it('Should throw error if no conditions given and no primary keys given', () => {
    // Given
    const dao = provideDaoWithTableWithOnePrimaryKey()
    // When/Expect
    expect(() => { dao.$getUpdateConditionsObjectFromArguments({ title: 'Todo' }) }).to.throw(Error)
  })
  it('Should throw error if no conditions given and no primary keys in table', () => {
    // Given
    const dao = provideDaoWithTableWithNoPrimaryKeys()
    // When/Expect
    expect(() => { dao.$getUpdateConditionsObjectFromArguments({ title: 'Todo' }) }).to.throw(Error)
  })
})

describe('Dao.$getConditionsObjectFromArgument', () => {
  // TODO add string argument test when implemented
  it('Should convert regular object to database readable object', () => {
    const conditionArg = { articleId: 'article113' }
    const result = new Dao({}).$getConditionsObjectFromArgument(conditionArg)
    expect(result).to.be.eql({ article_id: 'article113' })
  })
  it('Should not convert database readable object', () => {
    const conditionArg = { article_id: 'article113' }
    const result = new Dao({}).$getConditionsObjectFromArgument(conditionArg)
    expect(result).to.be.eql({ article_id: 'article113' })
  })
  it('Should convert function argument with regular object as database readable object', () => {
    const conditionArg = () => { return { articleId: 'article113' } }
    const result = new Dao({}).$getConditionsObjectFromArgument(conditionArg)
    expect(result).to.be.eql({ article_id: 'article113' })
  })
  it('Should convert function argument with database readable object', () => {
    const conditionArg = () => { return { article_id: 'article113' } }
    const result = new Dao({}).$getConditionsObjectFromArgument(conditionArg)
    expect(result).to.be.eql({ article_id: 'article113' })
  })
})
