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
  it('Should not start a transaction in database', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    const result = await dao.findAll()
    // Expect
    expect(databaseProxy.$transactionInProgress).to.be.equal(false)
  })
})

describe('Dao.find', () => {
  it('Should send SQL SELECT to database proxy with no conditions', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.find()
    // Expect
    expect(databaseProxy.$queries).to.be.eql([{
      text: 'SELECT * FROM secured.articles AS articles',
      values: []
    }])
  })
  it('Should send SQL SELECT to database proxy with conditions', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.find({ articleId: 1 })
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
    const result = await dao.find({ articleId: 1 })
    // Expect
    expect(result).to.be.eql([
      { articleId: 1, title: 'article1' }
    ])
  })
  it('Should not start a transaction in database', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    const result = await dao.find({ articleId: 1 })
    // Expect
    expect(databaseProxy.$transactionInProgress).to.be.equal(false)
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
  it('Should not start a transaction in database', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    const result = await dao.findOne({ articleId: 1 })
    // Expect
    expect(databaseProxy.$transactionInProgress).to.be.equal(false)
  })
})

describe('Dao.count', () => {
  it('Should send SQL SELECT to database proxy with no conditions', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.count()
    // Expect
    expect(databaseProxy.$queries).to.be.eql([{
      text: 'SELECT COUNT(*) as count FROM secured.articles AS articles',
      values: []
    }])
  })
  it('Should send SQL SELECT to database proxy with conditions', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.count({ articleId: 1 })
    // Expect
    expect(databaseProxy.$queries).to.be.eql([{
      text: 'SELECT COUNT(*) as count FROM secured.articles AS articles WHERE article_id = $1',
      values: [1]
    }])
  })
  it('Should return values as transformed objects', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    const result = await dao.count({ articleId: 1 })
    // Expect
    expect(result).to.be.equal(2)
  })
  it('Should not start a transaction in database', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    const result = await dao.count({ articleId: 1 })
    // Expect
    expect(databaseProxy.$transactionInProgress).to.be.equal(false)
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
      text: 'INSERT INTO secured.articles (title, article_id) VALUES ($1, $2) RETURNING *',
      values: ['Toto', 1]
    }])
  })
  it('Should start a transaction in database', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.create({ title: 'Toto', articleId: 1 })
    // Expect
    expect(databaseProxy.$transactionInProgress).to.be.equal(true)
  })
})

describe('Dao.update', () => {
  it('Should send SQL UPDATE with primary keys to database proxy', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.update({ title: 'Toto', articleId: 1 })
    // Expect
    expect(databaseProxy.$queries).to.be.eql([{
      text: 'UPDATE secured.articles SET title = $1 WHERE article_id = $2 RETURNING *',
      values: ['Toto', 1]
    }])
  })
  it('Should start a transaction in database', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.update({ title: 'Toto', articleId: 1 })
    // Expect
    expect(databaseProxy.$transactionInProgress).to.be.equal(true)
  })
})

describe('Dao.updateWithConditions', () => {
  it('Should send SQL UPDATE to database proxy', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.updateWithConditions({ title: 'Toto' }, { title: 'Titi' })
    // Expect
    expect(databaseProxy.$queries).to.be.eql([{
      text: 'UPDATE secured.articles SET title = $1 WHERE title = $2 RETURNING *',
      values: ['Toto', 'Titi']
    }])
  })
  it('Should start a transaction in database', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.updateWithConditions({ title: 'Toto' }, { title: 'Titi' })
    // Expect
    expect(databaseProxy.$transactionInProgress).to.be.equal(true)
  })
})

describe('Dao.delete', () => {
  it('Should send SQL DELETE with primary keys to database proxy', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.delete({ title: 'Toto', articleId: 1 })
    // Expect
    expect(databaseProxy.$queries).to.be.eql([{
      text: 'DELETE FROM secured.articles WHERE article_id = $1 RETURNING *',
      values: [1]
    }])
  })
  it('Should start a transaction in database', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.delete({ title: 'Toto', articleId: 1 })
    // Expect
    expect(databaseProxy.$transactionInProgress).to.be.equal(true)
  })
})

describe('Dao.deleteWithConditions', () => {
  it('Should send SQL DELETE to database proxy', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.deleteWithConditions({ title: 'Toto', articleId: 1 })
    // Expect
    expect(databaseProxy.$queries).to.be.eql([{
      text: 'DELETE FROM secured.articles WHERE title = $1 AND article_id = $2 RETURNING *',
      values: ['Toto', 1]
    }])
  })
  it('Should start a transaction in database', async () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns_withMockedDatabaseProxy()
    const databaseProxy = dao.$databaseProxy
    // When
    await dao.deleteWithConditions({ title: 'Toto', articleId: 1 })
    // Expect
    expect(databaseProxy.$transactionInProgress).to.be.equal(true)
  })
})

describe('Dao.$getPrimaryKeyConditionsFromObject', () => {
  it('Should convert primary keys as conditions for update if no conditions given', () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns()
    // When
    const result = dao.$getPrimaryKeyConditionsFromObject({ articleId: 1, title: 'Todo' })
    // Expect
    expect(result).to.be.eql({ article_id: 1 })
  })
  it('Should convert primary keys as conditions for update if no conditions given, avoiding non-required primary keys', () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withTwoPrimaryKeyAndOneRequired()
    // When
    const result = dao.$getPrimaryKeyConditionsFromObject({ articleId: 1, nonExistingColumn: 'Todo' })
    // Expect
    expect(result).to.be.eql({ article_id: 1 })
  })
  it('Should throw error if no conditions given and no primary keys given', () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns()
    // When/Expect
    expect(() => { dao.$getPrimaryKeyConditionsFromObject({ title: 'Todo' }) }).to.throw(Error)
  })
  it('Should throw error if no conditions given and no primary keys in table', () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withColumns_withNoPrimaryKeys_requiredColumns()
    // When/Expect
    expect(() => { dao.$getPrimaryKeyConditionsFromObject({ title: 'Todo' }) }).to.throw(Error)
  })
})

describe('Dao.$getConditionsObjectFromArgument', () => {
  // TODO add string argument test when implemented
  it('Should convert regular object to database readable object', () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns()
    // When
    const result = dao.$getConditionsObjectFromArgument({ articleId: 'article113' })
    // Expect
    expect(result).to.be.eql({ article_id: 'article113' })
  })
  it('Should not convert database readable object', () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns()
    // When
    const result = dao.$getConditionsObjectFromArgument({ article_id: 'article113' })
    // Expect
    expect(result).to.be.eql({ article_id: 'article113' })
  })
  it('Should convert function argument with regular object as database readable object', () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns()
    // When
    const result = dao.$getConditionsObjectFromArgument(() => { return { articleId: 'article113' } })
    // Expect
    expect(result).to.be.eql({ article_id: 'article113' })
  })
  it('Should convert function argument with database readable object', () => {
    // Given
    const dao = DataSetProvider.getDao_withTableMetadata_withNoColumns()
    // When
    const result = dao.$getConditionsObjectFromArgument(() => { return { article_id: 'article113' } })
    // Expect
    expect(result).to.be.eql({ article_id: 'article113' })
  })
})
