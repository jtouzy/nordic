const DataProxy = require('../data/DataProxy')
const QueryBuilder = require('../query/QueryBuilder')

class Dao {
  constructor(context) {
    if (typeof context === 'undefined') {
      throw new Error('Missing context object in dao instance. Maybe you forgot to call super constructor with context ?')
    }
    const { tableMetadata, databaseProxy, dataProxy, propertiesMapping, timeStamppedColumns } = context
    // TODO add controls to check null
    this.$tableMetadata = tableMetadata
    this.$databaseProxy = databaseProxy
    this.$dataProxy = dataProxy
    this.$queryBuilder = new QueryBuilder(this.$tableMetadata, propertiesMapping, timeStamppedColumns)
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
    const convertedObjectOrArray = this.$toDatabaseObject(objectOrArray)
    const query = this.$queryBuilder.getInsertQuery(convertedObjectOrArray)
    const result = await this.$databaseProxy.queryWithTransaction(query)
    return this.$dataProxy.databaseToObject(!Array.isArray(objectOrArray) ? result[0] : result)
  }
  async update(object) {
    const convertedObject = this.$toDatabaseObject(object)
    const conditionsObject = this.$getPrimaryKeyConditionsFromObject(convertedObject)
    const updatedValues = this.$getUpdatedValuesFrom(convertedObject, conditionsObject, { excludeConditions: true })
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
    const convertedObject = this.$toDatabaseObject(object)
    const conditionsObject = this.$getPrimaryKeyConditionsFromObject(convertedObject)
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
  $getOnlyRelatedObjectOrArray(objectOrArray) {
    if (Array.isArray(objectOrArray)) {
      return objectOrArray.map((object) => this.$getOnlyRelatedObject(object))
    } else {
      return this.$getOnlyRelatedObject(objectOrArray)
    }
  }
  $getOnlyRelatedObject(object) {
    const columnIds = (this.$tableMetadata.columns || []).map(c => c.name)
    return Object.keys(object).filter((k) => columnIds.includes(k)).reduce((accumulator, next) => {
      return Object.assign(accumulator, { [next]: object[next] })
    }, {})
  }
  $getUpdatedValuesFrom(object, conditionsObject, options = { excludeConditions: false }) {
    const { excludeConditions } = options
    const conditionKeys = Object.keys(conditionsObject)
    return Object.keys(object).reduce((accumulator, key) => {
      if (excludeConditions && conditionKeys.includes(key)) {
        return accumulator
      } else {
        return Object.assign(accumulator, { [key]: object[key] })
      }
    }, {})
  }
  $getPrimaryKeyConditionsFromObject(object) {
    const primaryKeys = this.$tableMetadata.columns.filter(c => c.primaryKey)
    if (primaryKeys.length === 0) {
      throw new Error(`No conditions has been given, and no primary keys is registered : can't do update`)
    }
    const requiredPrimaryKeyNames = primaryKeys.filter(k => k.required).map(k => k.name)
    const convertedObjectKeys = Object.keys(object)
    const notIncludedInObjectKeys = requiredPrimaryKeyNames.filter(k => !convertedObjectKeys.includes(k))
    if (notIncludedInObjectKeys.length > 0) {
      throw new Error(`Some properties (${notIncludedInObjectKeys.join(',')}) are not included in updated object, but they are required for update`)
    }
    return primaryKeys.reduce((accumulator, key) => {
      const submittedValue = object[key.name]
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
      return this.$toDatabaseObject(argument)
    } else if (typeof argument === 'function') {
      return this.$toDatabaseObject(argument())
    } else {
      return argument
    }
  }
  $toDatabaseObject(objectOrArray) {
    return this.$getOnlyRelatedObjectOrArray(
      Array.isArray(objectOrArray) ? 
        objectOrArray.map((object) => this.$dataProxy.objectToDatabase(object)) : 
        this.$dataProxy.objectToDatabase(objectOrArray)
    )
  }
}

module.exports = Dao
