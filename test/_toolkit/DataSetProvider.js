const MockedDatabaseProxy = require('./MockedDatabaseProxy')
const Dao = require('../../src/dao/Dao')

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
  // DATA SET - Dao
  // ***************************************************************************
  static getDao_withTableMetadata_withNoColumns_withMockedDatabaseProxy() {
    const mockedDatabaseProxy = new MockedDatabaseProxy()
    return new Dao({
      tableMetadata: this.getTableMetadata_withNoColumns(),
      databaseProxy: mockedDatabaseProxy
    })
  }
  static getDao_withTableMetadata_withColumns_withNoPrimaryKeys_requiredColumns() {
    return new Dao({
      tableMetadata: this.getTableMetadata_withColumns_withNoPrimaryKeys_requiredColumns()
    })
  }
  static getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns() {
    return new Dao({
      tableMetadata: this.getTableMetadata_withColumns_withOnePrimaryKey_requiredColumns()
    })
  }
  static getDao_withTableMetadata_withColumns_withOnePrimaryKey_requiredColumns_withMockedDatabaseProxy() {
    const mockedDatabaseProxy = new MockedDatabaseProxy()
    return new Dao({
      tableMetadata: this.getTableMetadata_withColumns_withOnePrimaryKey_requiredColumns(),
      databaseProxy: mockedDatabaseProxy
    })
  }
  static getDao_withTableMetadata_withColumns_withTwoPrimaryKeyAndOneRequired() {
    return new Dao({
      tableMetadata: this.getTableMetadata_withColumns_withTwoPrimaryKeysAndOneRequired()
    })
  }
}

module.exports = DataSetProvider
