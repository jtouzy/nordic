const DatabaseMetadataProxy = require('./database/DatabaseMetadataProxy')
const DatabaseProxy = require('./database/DatabaseProxy')

class Nordic {
  initialize({ host, port, database, user, password }) {
    this.$databaseProxy = new DatabaseProxy({ host, port, database, user, password })
  }
  getDao() {
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
