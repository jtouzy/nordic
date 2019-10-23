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
        SELECT c.table_schema, c.table_name, c.column_name, c.is_nullable, c.data_type,
               CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary,
               t.oid AS data_type_id, c.udt_name AS data_type_alias
          FROM information_schema.columns c LEFT JOIN (
            SELECT ku.table_schema, ku.table_name, ku.column_name
              FROM information_schema.table_constraints AS tc, information_schema.key_column_usage AS ku
             WHERE tc.constraint_type = 'PRIMARY KEY'
               AND tc.constraint_name = ku.constraint_name
          ) pk ON c.table_schema = pk.table_schema AND c.table_name = pk.table_name 
               AND c.column_name = pk.column_name,
               pg_type t
         WHERE t.typname = c.udt_name
           AND c.table_schema = ANY($1)
           AND c.table_name = ANY($2)
      `,
      values: [tables.map(t => t.table_schema), tables.map(t => t.table_name)]
    })
  }
}

module.exports = DatabaseMetadataProxy
