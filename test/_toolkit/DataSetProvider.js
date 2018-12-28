const MockedDatabaseProxy = require('./MockedDatabaseProxy')
const Dao = require('../../src/dao/Dao')
const DataProxy = require('../../src/data/DataProxy')

const toCamelCase = require('lodash.camelcase')
const toSnakeCase = require('lodash.snakecase')

const securedSchema = 'secured'
const articlesTable = 'articles'
const articleIdColumnName = 'article_id'
const articleTitleColumnName = 'title'

class DataSetProvider {
  // ***************************************************************************
  // DATA SET - TableMetadata
  // ***************************************************************************
  static getTableMetadata_withNoColumns() {
    return {
      schema: securedSchema,
      name: articlesTable
    }
  }
  static getTableMetadata_withColumns_withNoPrimaryKeys_requiredColumns() {
    return Object.assign(this.getTableMetadata_withNoColumns(), {
      columns: [
        { name: articleIdColumnName, required: true, primaryKey: false },
        { name: articleTitleColumnName, required: true, primaryKey: false }
      ]
    })
  }
  static getTableMetadata_withColumns_withOnePrimaryKey_requiredColumns() {
    return Object.assign(this.getTableMetadata_withNoColumns(), {
      columns: [
        { name: articleIdColumnName, required: true, primaryKey: true },
        { name: articleTitleColumnName, required: true, primaryKey: false }
      ]
    })
  }
  static getTableMetadata_withColumns_withTwoPrimaryKeysAndOneRequired() {
    return Object.assign(this.getTableMetadata_withNoColumns(), {
      columns: [
        { name: articleIdColumnName, required: true, primaryKey: true },
        { name: articleTitleColumnName, required: false, primaryKey: true }
      ]
    })
  }
  // ***************************************************************************
  // DATA SET - DataProxy
  // ***************************************************************************
  static getDataProxy_withCamelToSnakeTransform() {
    return new DataProxy({
      objectToDatabaseKeyTransform: toSnakeCase,
      databaseToObjectKeyTransform: toCamelCase
    })
  }
  // ***************************************************************************
  // DATA SET - Dao
  // ***************************************************************************
  static getDao_withTableMetadata_withNoColumns() {
    return new Dao({
      tableMetadata: this.getTableMetadata_withNoColumns(),
      dataProxy: this.getDataProxy_withCamelToSnakeTransform()
    })
  }
  static getDao_withTableMetadata_withNoColumns_withMockedDatabaseProxy() {
    const mockedDatabaseProxy = new MockedDatabaseProxy()
    return new Dao({
      tableMetadata: this.getTableMetadata_withNoColumns(),
      databaseProxy: mockedDatabaseProxy,
      dataProxy: this.getDataProxy_withCamelToSnakeTransform()
    })
  }
  static getDao_withTableMetadata_withColumns_withNoPrimaryKeys_requiredColumns() {
    return new Dao({
      tableMetadata: this.getTableMetadata_withColumns_withNoPrimaryKeys_requiredColumns(),
      dataProxy: this.getDataProxy_withCamelToSnakeTransform()
    })
  }
  static getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns() {
    return new Dao({
      tableMetadata: this.getTableMetadata_withColumns_withOnePrimaryKey_requiredColumns(),
      dataProxy: this.getDataProxy_withCamelToSnakeTransform()
    })
  }
  static getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns_withMockedDatabaseProxy() {
    const mockedDatabaseProxy = new MockedDatabaseProxy()
    return new Dao({
      tableMetadata: this.getTableMetadata_withColumns_withOnePrimaryKey_requiredColumns(),
      databaseProxy: mockedDatabaseProxy,
      dataProxy: this.getDataProxy_withCamelToSnakeTransform()
    })
  }
  static getDao_withTableMetadata_withColumns_withTwoPrimaryKeyAndOneRequired() {
    return new Dao({
      tableMetadata: this.getTableMetadata_withColumns_withTwoPrimaryKeysAndOneRequired(),
      dataProxy: this.getDataProxy_withCamelToSnakeTransform()
    })
  }
}

module.exports = DataSetProvider
