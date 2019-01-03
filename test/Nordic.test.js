const { expect } = require('chai')
const Nordic = require('../src/Nordic')
const MockedDatabaseProxy = require('./_toolkit/MockedDatabaseProxy')

describe('Nordic.rawQuery', () => {
  it('Should call database proxy with given query, with no parameters', async () => {
    // Given
    const mockedDatabaseProxy = new MockedDatabaseProxy()
    Nordic.$initializeDataProxy()
    Nordic.$databaseProxy = mockedDatabaseProxy
    // When
    await Nordic.rawQuery('SELECT * FROM articles')
    // Expect
    expect(mockedDatabaseProxy.$queries).to.be.eql([{
      text: 'SELECT * FROM articles',
      values: []
    }])
  })
  it('Should call database proxy with given query, with one parameter', async () => {
    // Given
    const mockedDatabaseProxy = new MockedDatabaseProxy()
    Nordic.$initializeDataProxy()
    Nordic.$databaseProxy = mockedDatabaseProxy
    // When
    await Nordic.rawQuery('SELECT * FROM articles WHERE article_id = :id', {
      id: 1
    })
    // Expect
    expect(mockedDatabaseProxy.$queries).to.be.eql([{
      text: 'SELECT * FROM articles WHERE article_id = $1',
      values: [1]
    }])
  })
  it('Should call database proxy with given query, with multiple parameters', async () => {
    // Given
    const mockedDatabaseProxy = new MockedDatabaseProxy()
    Nordic.$initializeDataProxy()
    Nordic.$databaseProxy = mockedDatabaseProxy
    // When
    await Nordic.rawQuery('SELECT * FROM articles WHERE article_id = :id AND article_title = :title', {
      id: 1,
      title: 'Title of article'
    })
    // Expect
    expect(mockedDatabaseProxy.$queries).to.be.eql([{
      text: 'SELECT * FROM articles WHERE article_id = $1 AND article_title = $2',
      values: [1, 'Title of article']
    }])
  })
  /*it('Should call database proxy with given query, with multiple parameters with same names', async () => {
    // Given
    const mockedDatabaseProxy = new MockedDatabaseProxy()
    Nordic.$initializeDataProxy()
    Nordic.$databaseProxy = mockedDatabaseProxy
    // When
    await Nordic.rawQuery('SELECT * FROM articles WHERE article_id = :id AND article_title = :id', {
      id: 1
    })
    // Expect
    expect(mockedDatabaseProxy.$queries).to.be.eql([{
      text: 'SELECT * FROM articles WHERE article_id = $1 AND article_title = $2',
      values: [1, 1]
    }])
  })*/
})
