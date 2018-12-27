const DataProxy = require('../data/DataProxy')
const QueryBuilder = require('../query/QueryBuilder')

class Dao {
  constructor(context) {
    if (typeof context === 'undefined') {
      throw new Error('Missing context object in dao instance. Maybe you forgot to call super constructor with context ?')
    }
    const { tableMetadata, databaseProxy } = context
    this.$tableMetadata = tableMetadata
    this.$databaseProxy = databaseProxy
    this.$dataProxy = new DataProxy()
    this.$queryBuilder = new QueryBuilder(this.$tableMetadata)
  }
  async findAll() {
    const query = this.$queryBuilder.getSelectQuery()
    const result = await this.$databaseProxy.query(query)
    return result.length === 0 ? result : this.$dataProxy.databaseToObject(result)
  }
  async findOne(identifier) {
    const conditionsObject = this.$getConditionsObjectFromArgument(identifier)
    const query = this.$queryBuilder.getSelectQueryWithConditionsObject(conditionsObject)
    const result = await this.$databaseProxy.query(query)
    if (result.length > 1) {
      throw new Error(`Multiple rows fetched from database in a findOne() query`)
    }
    return result.length === 0 ? result : this.$dataProxy.databaseToObject(result[0])
  }
  async update(object, conditions) {
    const conditionsObject = this.$getUpdateConditionsObjectFromArguments(object, conditions)
    const conditionKeys = Object.keys(conditionsObject)
    const convertedObject = this.$dataProxy.objectToDatabase(object)
    const updatedValues = Object.keys(convertedObject).reduce((accumulator, key) => {
      if (conditionKeys.includes(key)) {
        return accumulator
      } else {
        return Object.assign(accumulator, { [key]: convertedObject[key] })
      }
    }, {})
    const query = this.$queryBuilder.getUpdateQuery(updatedValues, conditionsObject)
    await this.$databaseProxy.query(query)
  }
  $getUpdateConditionsObjectFromArguments(object, conditions) {
    if (!conditions) {
      const primaryKeys = this.$tableMetadata.columns.filter(c => c.primaryKey)
      if (primaryKeys.length === 0) {
        throw new Error(`No conditions has been given, and no primary keys is registered : can't do update`)
      }
      const convertedObject = this.$dataProxy.objectToDatabase(object)
      const requiredPrimaryKeyNames = primaryKeys.filter(k => k.required).map(k => k.name)
      const convertedObjectKeys = Object.keys(convertedObject)
      const notIncludedInObjectKeys = requiredPrimaryKeyNames.filter(k => !convertedObjectKeys.includes(k))
      if (notIncludedInObjectKeys.length > 0) {
        throw new Error(`Some properties (${notIncludedInObjectKeys.join(',')}) are not included in updated object, but they are required for update`)
      }
      return primaryKeys.reduce((accumulator, key) => {
        const submittedValue = convertedObject[key.name]
        if (submittedValue) {
          return Object.assign(accumulator, { [key.name]: submittedValue })
        } else {
          return accumulator
        }
      }, {})
    } else {
      return this.$getConditionsObjectFromArgument(conditions)
    }
  }
  $getConditionsObjectFromArgument(argument) {
    if (typeof argument === 'string') {
      return { id: argument } // TODO make with metadata columsn
    } else if (typeof argument === 'object') {
      return this.$dataProxy.objectToDatabase(argument)
    } else if (typeof argument === 'function') {
      return this.$dataProxy.objectToDatabase(argument())
    } else {
      return argument
    }
  }
}

module.exports = Dao
