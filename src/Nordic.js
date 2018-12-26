const Dao = require('./dao/Dao')
const DatabaseMetadataProxy = require('./database/DatabaseMetadataProxy')
const DatabaseProxy = require('./database/DatabaseProxy')

class Nordic {
  initialize({ host, port, database, user, password }) {
    this.$databaseProxy = new DatabaseProxy({ host, port, database, user, password })
  }
  async getDao(daoClassOrTableName) {
    let daoInstance
    if (typeof daoClassOrTableName === 'function') {
      daoInstance = new daoClassOrTableName()
    } else {
      let context = {}
      if (typeof daoClassOrTableName === 'string') {
        context = this.$getDaoContextFromString(daoClassOrTableName)
      } else if (typeof daoClassOrTableName === 'object') {
        let { schema, table } = daoClassOrTableName
        context = this.$getDaoContextFromObject(schema, table)
      } else {
        throw new Error(`Can't create Dao instance`)
      }
      daoInstance = new Dao(context)
    }
    // Inject
    return Object.assign(daoInstance, {
      $databaseProxy: this.$databaseProxy,
      $tableMetadata: await this.getTableMetadata(daoInstance.$context)
    })
  }
  $getDaoContextFromString(table) {
    return { schema: 'public', table }
  }
  $getDaoContextFromObject(schema, table) {
    return { schema, table }
  }
  async getTableMetadata({ schema, table }) {
    const databaseMetadata = await this.getDatabaseMetadata()
    if (!Object.keys(databaseMetadata).find(s => s === schema)) {
      throw new Error(`Missing schema '${schema}' in database metadata.`)
    }
    const tableMd = databaseMetadata[schema].find(t => t.name === table)
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
      this.$databaseMetadata = tables.reduce((accumulator, table) => {
        return Object.assign(accumulator, {
          [table.table_schema]: (accumulator[table.table_schema] || []).concat([{
            name: table.table_name,
            schema: table.table_schema,
            columns: tableColumns.filter(c => {
              return c.table_schema === table.table_schema && c.table_name === table.table_name
            }).map(c => {
              return {
                name: c.column_name,
                required: c.is_nullable !== 'YES',
                dataType: c.data_type
              }
            })
          }])
        })
      }, {})
    }
    return this.$databaseMetadata
  }
  async shutdown() {
    await this.$databaseProxy.close()
  }
}

const instance = new Nordic()
module.exports = instance
