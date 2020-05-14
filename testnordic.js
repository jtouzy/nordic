const environmentManager = require('@codeglacier/utils-env')
const Nordic = require('./src/Nordic')
const Dao = require('./src/dao/Dao')
const toCamelCase = require('lodash.camelcase')
const toSnakeCase = require('lodash.snakecase')




const fn = async() => {
  environmentManager.configure({ app: 'scorego', environment: 'DEV' })
  const config = await environmentManager.getDatabaseConfig()
  const { host, database, port } = config.source
  const { user, password } = config.users.admin
  const nordic = new Nordic()
  nordic.initialize({
    host, port, database, user, password,
    options: {
      metadata: config.metadata,
      transform: {
        databaseToObjectKeyTransform: toCamelCase,
        objectToDatabaseKeyTransform: toSnakeCase
      }
    }
  })
  /*const res = await nordic.rawQuery(`SELECT c.*,
  CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary
FROM information_schema.columns c LEFT JOIN (
SELECT ku.table_schema, ku.table_name, ku.column_name
 FROM information_schema.table_constraints AS tc, information_schema.key_column_usage AS ku
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.constraint_name = ku.constraint_name
) pk ON c.table_schema = pk.table_schema
 AND c.table_name = pk.table_name
 AND c.column_name = pk.column_name
WHERE c.table_schema = 'public'
AND c.table_name = 'account'`)
console.log(res)*/
//const res = await nordic.rawQuery('SELECT * from match where id = \'ZKy4LlL2\'')
//const res = await nordic.rawQuery(`SELECT oid, typname FROM pg_type WHERE oid IN (52957)`)

  try {
    await nordic.rawQuery('UPDATE item FROM account WHERE id = :id', { id: 'titititi' })
  } catch (error) {
    console.log(error)
  }
  await nordic.shutdown(false)
}

fn()
