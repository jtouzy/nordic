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
