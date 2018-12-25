class DatabaseMetadataProxy {
  constructor(databaseProxy) {
    this.$databaseProxy = databaseProxy
  }
  async findTables(schemas) {
    return await this.$databaseProxy.query({
      text: `
        SELECT table_schema, table_name
          FROM information_schema.tables
         WHERE table_schema = ANY($1)
      `,
      values: [schemas || ['public']]
    })
  }
  async findColumnsOfTables(tables) {
    return await this.$databaseProxy.query({
      text: `
        SELECT table_schema, table_name, column_name, is_nullable, data_type
          FROM information_schema.columns
         WHERE table_schema = ANY($1)
           AND table_name = ANY($2)
      `,
      values: [tables.map(t => t.table_schema), tables.map(t => t.table_name)]
    })
  }
}

module.exports = DatabaseMetadataProxy
