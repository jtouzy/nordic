const DataProxy = require('../data/DataProxy')
const QueryBuilder = require('../query/QueryBuilder')

class Dao {
  constructor(context) {
    if (typeof context === 'undefined') {
      throw new Error('Missing context object in dao instance. Maybe you forgot to call super constructor with context ?')
    }
    const { tableMetadata, databaseProxy, dataProxy } = context
    // TODO add controls to check null
    this.$tableMetadata = tableMetadata
    this.$databaseProxy = databaseProxy
    this.$dataProxy = dataProxy
    this.$queryBuilder = new QueryBuilder(this.$tableMetadata)
  }
  async findAll() {
    const query = this.$queryBuilder.getSelectQuery()
    const result = await this.$databaseProxy.query(query)
    return result.length === 0 ? result : this.$dataProxy.databaseToObject(result)
  }
  async find(conditions) {
    const conditionsObject = this.$getConditionsObjectFromArgument(conditions)
    const query = this.$queryBuilder.getSelectQueryWithConditionsObject(conditionsObject)
    const result = await this.$databaseProxy.query(query)
    return this.$dataProxy.databaseToObject(result)
  }
  async findOne(conditions) {
    const result = await this.find(conditions)
    if (result.length > 1) {
      throw new Error(`Multiple rows fetched from database in a findOne() query`)
    }
    return result.length === 0 ? null : result[0]
  }
  async count(conditions) {
    const conditionsObject = this.$getConditionsObjectFromArgument(conditions)
    const query = this.$queryBuilder.getSelectCountQueryWithConditionsObject(conditionsObject)
    const result = await this.$databaseProxy.query(query)
    return parseInt(result[0].count)
  }
  async create(objectOrArray) {
    const convertedObjectOrArray = this.$dataProxy.objectToDatabase(objectOrArray)
    const query = this.$queryBuilder.getInsertQuery(convertedObjectOrArray)
    const result = await this.$databaseProxy.queryWithTransaction(query)
    return this.$dataProxy.databaseToObject(!Array.isArray(objectOrArray) ? result[0] : result)
  }
  async update(object) {
    const conditionsObject = this.$getPrimaryKeyConditionsFromObject(object)
    const updatedValues = this.$getUpdatedValuesFrom(object, conditionsObject, { excludeConditions: true })
    const query = this.$queryBuilder.getUpdateQuery(updatedValues, conditionsObject)
    const result = await this.$databaseProxy.queryWithTransaction(query)
    return this.$dataProxy.databaseToObject(result[0])
  }
  async updateWithConditions(object, conditions) {
    const conditionsObject = this.$getConditionsObjectFromArgument(conditions)
    const updatedValues = this.$getUpdatedValuesFrom(object, conditionsObject)
    const query = this.$queryBuilder.getUpdateQuery(updatedValues, conditionsObject)
    const result = await this.$databaseProxy.queryWithTransaction(query)
    return this.$dataProxy.databaseToObject(result)
  }
  async delete(object) {
    const conditionsObject = this.$getPrimaryKeyConditionsFromObject(object)
    const query = this.$queryBuilder.getDeleteQuery(conditionsObject)
    const result = await this.$databaseProxy.queryWithTransaction(query)
    return this.$dataProxy.databaseToObject(result[0])
  }
  async deleteWithConditions(conditions) {
    const conditionsObject = this.$getConditionsObjectFromArgument(conditions)
    const query = this.$queryBuilder.getDeleteQuery(conditionsObject)
    const result = await this.$databaseProxy.queryWithTransaction(query)
    return this.$dataProxy.databaseToObject(result)
  }
  $getUpdatedValuesFrom(object, conditionsObject, options = { excludeConditions: false }) {
    const { excludeConditions } = options
    const conditionKeys = Object.keys(conditionsObject)
    const convertedObject = this.$dataProxy.objectToDatabase(object)
    return Object.keys(convertedObject).reduce((accumulator, key) => {
      if (excludeConditions && conditionKeys.includes(key)) {
        return accumulator
      } else {
        return Object.assign(accumulator, { [key]: convertedObject[key] })
      }
    }, {})
  }
  $getPrimaryKeyConditionsFromObject(object) {
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
