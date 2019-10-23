const fs = require('fs')
const Dao = require('./dao/Dao')
const DatabaseMetadataProxy = require('./database/DatabaseMetadataProxy')
const DatabaseProxy = require('./database/DatabaseProxy')
const DataProxy = require('./data/DataProxy')
const EntityContextFactory = require('./dao/EntityContextFactory')

class Nordic {
  initialize({ host, port, database, user, password, options }) {
    const { transform, metadata, metadataPath, logger } = (options || {})
    this.$initializeDataProxy(transform)
    this.$initializeDatabaseMetadata(metadata, metadataPath)
    this.$databaseProxy = new DatabaseProxy({ 
      host, port, database, user, password, metadata: this.$databaseMetadata, options: { logger }
    })
  }
  $initializeDataProxy(transformOptions) {
    this.$dataProxy = new DataProxy(transformOptions)
  }
  $initializeDatabaseMetadata(metadata, metadataPath) {
    if (metadata) {
      this.$databaseMetadata = metadata
    } else if (metadataPath) {
      const fileContent = fs.readFileSync(metadataPath, 'utf8')
      this.$databaseMetadata = JSON.parse(fileContent)
    }
  }
  async getDao(daoClassOrEntityProperties) {
    const entityContext = EntityContextFactory.from(daoClassOrEntityProperties)
    const tableMetadata = await this.getTableMetadata(entityContext)
    const daoContext = {
      tableMetadata,
      databaseProxy: this.$databaseProxy,
      dataProxy: this.$dataProxy
    }
    if (daoClassOrEntityProperties instanceof Function) {
      return new daoClassOrEntityProperties(daoContext)
    } else {
      return new Dao(daoContext)
    }
  }
  async rawQuery(text, values) {
    await this.getDatabaseMetadata()
    const queryValues = (values || {})
    const valuesKeys = Object.keys(queryValues)
    let nextIndex = 1
    const result = await this.$databaseProxy.query({
      text: valuesKeys.reduce((accumulator, key, index) => {
        let keyReplacement
        const value = queryValues[key]
        if (Array.isArray(value)) {
          keyReplacement = value.map(v => {
            nextIndex = nextIndex + 1
            return `$${nextIndex - 1}`
          }).join(', ')
        } else {
          keyReplacement = `$${nextIndex}`
          nextIndex = nextIndex + 1
        }
        return accumulator.split(`:${key}`).join(keyReplacement)
      }, text),
      values: valuesKeys.reduce((accumulator, key) => {
        const value = queryValues[key]
        return accumulator.concat(Array.isArray(value) ? value : [value])
      }, [])
    })
    return this.$dataProxy.databaseToObject(result)
  }
  async getTableMetadata({ schema, table }) {
    const databaseMetadata = await this.getDatabaseMetadata()
    if (!Object.keys(databaseMetadata.schemas).find(s => s === schema)) {
      throw new Error(`Missing schema '${schema}' in database metadata.`)
    }
    const tableMd = databaseMetadata.schemas[schema].find(t => t.name === table)
    if (!tableMd) {
      throw new Error(`Missing table '${table}' in '${schema}' schema metadata.`)
    }
    return tableMd
  }
  async getDatabaseMetadata() {
    if (!this.$databaseMetadata) {
      const databaseMetadataProxy = new DatabaseMetadataProxy(this.$databaseProxy)
      const tables = await databaseMetadataProxy.findTables()
      const tableColumns = await databaseMetadataProxy.findColumnsOfTables(tables)
      const dataTypes = {}
      const schemas = tables.reduce((accumulator, table) => {
        return Object.assign(accumulator, {
          [table.table_schema]: (accumulator[table.table_schema] || []).concat([{
            name: table.table_name,
            schema: table.table_schema,
            columns: tableColumns.filter(c => {
              return c.table_schema === table.table_schema && c.table_name === table.table_name
            }).map(c => {
              dataTypes[c.data_type_id] = c.data_type
              return {
                name: c.column_name,
                required: c.is_nullable !== 'YES',
                primaryKey: c.is_primary,
                dataType: c.data_type,
                dataTypeId: c.data_type_id,
                dataTypeAlias: c.data_type_alias
              }
            })
          }])
        })
      }, {})
      this.$databaseMetadata = { schemas, dataTypes }
      this.$databaseProxy.setMetadata(this.$databaseMetadata)
    }
    return this.$databaseMetadata
  }
  async commit() {
    await this.$databaseProxy.commit()
  }
  async rollback() {
    await this.$databaseProxy.rollback()
  }
  async shutdown(commitTransaction = true) {
    await this.$databaseProxy.close(commitTransaction)
  }
}

module.exports = Nordic
