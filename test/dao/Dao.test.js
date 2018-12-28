const { expect } = require('chai')
const Dao = require('../../src/dao/Dao')
const DataSetProvider = require('../_toolkit/DataSetProvider')

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
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.findAll()
    // Expect
    expect(databaseProxy.$queries).to.be.eql([{
      text: 'SELECT * FROM secured.articles AS articles',
      values: []
    }])
  })
  it('Should return values as transformed objects', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    const result = await dao.findAll()
    // Expect
    expect(result).to.be.eql([
      { articleId: 1, title: 'article1' },
      { articleId: 2, title: 'article2' }
    ])
  })
})

describe('Dao.findOne', () => {
  it('Should send SQL SELECT to database proxy', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.findOne({ articleId: 1 })
    // Expect
    expect(databaseProxy.$queries).to.be.eql([{
      text: 'SELECT * FROM secured.articles AS articles WHERE article_id = $1',
      values: [1]
    }])
  })
  it('Should return values as transformed objects', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    const result = await dao.findOne({ articleId: 1 })
    // Expect
    expect(result).to.be.eql({ articleId: 1, title: 'article1' })
  })
})

describe('Dao.create', () => {
  it('Should send SQL INSERT to database proxy', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.create({ title: 'Toto', articleId: 1 })
    // Expect
    expect(databaseProxy.$queries).to.be.eql([{
      text: 'INSERT INTO secured.articles (title, article_id) VALUES ($1, $2)',
      values: ['Toto', 1]
    }])
  })
})

describe('Dao.update', () => {
  it('Should send SQL UPDATE to database proxy', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.update({ title: 'Toto', articleId: 1 })
    // Expect
    expect(databaseProxy.$queries).to.be.eql([{
      text: 'UPDATE secured.articles SET title = $1 WHERE article_id = $2',
      values: ['Toto', 1]
    }])
  })
})

describe('Dao.deleteOne', () => {
  it('Should send SQL DELETE with primary keys to database proxy', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns_withMockedDatabaseProxy()
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
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.delete({ title: 'Toto', articleId: 1 })
    // Expect
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
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns()
    // When
    const result = dao.$getUpdateConditionsObjectFromArguments({ articleId: 1, title: 'Todo' }, { articleReference: 1 })
    // Expect
    expect(result).to.be.eql({ article_reference: 1 })
  })
  it('Should convert given function conditions for update', () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns()
    // When
    const result = dao.$getUpdateConditionsObjectFromArguments({ articleId: 1, title: 'Todo' }, () => { return { articleReference: 1 } })
    // Expect
    expect(result).to.be.eql({ article_reference: 1 })
  })
  it('Should convert primary keys as conditions for update if no conditions given', () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns()
    // When
    const result = dao.$getUpdateConditionsObjectFromArguments({ articleId: 1, title: 'Todo' })
    // Expect
    expect(result).to.be.eql({ article_id: 1 })
  })
  it('Should convert primary keys as conditions for update if no conditions given, avoiding non-required primary keys', () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withTwoPrimaryKeyAndOneRequired()
    // When
    const result = dao.$getUpdateConditionsObjectFromArguments({ articleId: 1, nonExistingColumn: 'Todo' })
    // Expect
    expect(result).to.be.eql({ article_id: 1 })
  })
  it('Should throw error if no conditions given and no primary keys given', () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns()
    // When/Expect
    expect(() => { dao.$getUpdateConditionsObjectFromArguments({ title: 'Todo' }) }).to.throw(Error)
  })
  it('Should throw error if no conditions given and no primary keys in table', () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withNoPrimaryKeys_requiredColumns()
    // When/Expect
    expect(() => { dao.$getUpdateConditionsObjectFromArguments({ title: 'Todo' }) }).to.throw(Error)
  })
})

describe('Dao.$getConditionsObjectFromArgument', () => {
  // TODO add string argument test when implemented
  it('Should convert regular object to database readable object', () => {
    // Given
    const dao = new Dao({})
    // When
    const result = dao.$getConditionsObjectFromArgument({ articleId: 'article113' })
    // Expect
    expect(result).to.be.eql({ article_id: 'article113' })
  })
  it('Should not convert database readable object', () => {
    // Given
    const dao = new Dao({})
    // When
    const result = dao.$getConditionsObjectFromArgument({ article_id: 'article113' })
    // Expect
    expect(result).to.be.eql({ article_id: 'article113' })
  })
  it('Should convert function argument with regular object as database readable object', () => {
    // Given
    const dao = new Dao({})
    // When
    const result = dao.$getConditionsObjectFromArgument(() => { return { articleId: 'article113' } })
    // Expect
    expect(result).to.be.eql({ article_id: 'article113' })
  })
  it('Should convert function argument with database readable object', () => {
    // Given
    const dao = new Dao({})
    // When
    const result = dao.$getConditionsObjectFromArgument(() => { return { article_id: 'article113' } })
    // Expect
    expect(result).to.be.eql({ article_id: 'article113' })
  })
})
