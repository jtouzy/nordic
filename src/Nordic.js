const Dao = require('./dao/Dao')
const DatabaseMetadataProxy = require('./database/DatabaseMetadataProxy')
const DatabaseProxy = require('./database/DatabaseProxy')
const EntityContextFactory = require('./dao/EntityContextFactory')

class Nordic {
  initialize({ host, port, database, user, password }) {
    this.$databaseProxy = new DatabaseProxy({ host, port, database, user, password })
  }
  async getDao(daoClassOrEntityProperties) {
    const entityContext = EntityContextFactory.from(daoClassOrEntityProperties)
    const tableMetadata = await this.getTableMetadata(entityContext)
    const daoContext = { tableMetadata, databaseProxy: this.$databaseProxy }
    if (daoClassOrTableName instanceof Function) {
      return new daoClassOrEntityProperties(daoContext)
    } else {
      return new Dao(daoContext)
    }
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
