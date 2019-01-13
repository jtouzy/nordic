const { expect } = require('chai')
const toCamelCase = require('lodash.camelcase')
const toSnakeCase = require('lodash.snakecase')
const DataProxy = require('../../src/data/DataProxy')
const DataSetProvider = require('../_toolkit/DataSetProvider')

describe('DataProxy.objectToDatabase', () => {
  it('Should not convert object to database if no transform is given', () => {
    // Given
    const dataProxy = new DataProxy()
    // When
    const result = dataProxy.objectToDatabase({ articleId: 1 })
    // Expect
    expect(result).to.be.eql({ articleId: 1 })
  })
  it('Should convert object to database if a transform function is given', () => {
    // Given
    const dataProxy = new DataProxy({ objectToDatabaseKeyTransform: toSnakeCase })
    // When
    const result = dataProxy.objectToDatabase({ articleId: 1 })
    // Expect
    expect(result).to.be.eql({ article_id: 1 })
  })
  it('Should convert object to database if a transform function is given, with array values', () => {
    // Given
    const dataProxy = new DataProxy({ objectToDatabaseKeyTransform: toSnakeCase })
    // When
    const result = dataProxy.objectToDatabase({ articleId: 1, producers: [ { producerName: 'China', distance: 5000 } ] })
    // Expect
    expect(result).to.be.eql({ article_id: 1, producers: [ { producer_name: 'China', distance: 5000 } ] })
  })
})

describe('DataProxy.databaseToObject', () => {
  it('Should not convert database to object if no transform is given', () => {
    // Given
    const dataProxy = new DataProxy()
    // When
    const result = dataProxy.databaseToObject({ article_id: 1 })
    // Expect
    expect(result).to.be.eql({ article_id: 1 })
  })
  it('Should convert database to object if a transform function is given', () => {
    // Given
    const dataProxy = new DataProxy({ databaseToObjectKeyTransform: toCamelCase })
    // When
    const result = dataProxy.databaseToObject({ article_id: 1 })
    // Expect
    expect(result).to.be.eql({ articleId: 1 })
  })
  it('Should convert database to object if a transform function is given, with array values', () => {
    // Given
    const dataProxy = new DataProxy({ databaseToObjectKeyTransform: toCamelCase })
    // When
    const result = dataProxy.databaseToObject({ article_id: 1, producers: [ { producer_name: 'China', distance: 5000 } ] })
    // Expect
    expect(result).to.be.eql({ articleId: 1, producers: [ { producerName: 'China', distance: 5000 } ] })
  })
})
