const DataProxy = require('../data/DataProxy')
const QueryBuilder = require('../query/QueryBuilder')

class Dao {
  constructor(context) {
    if (typeof context === 'undefined') {
      throw new Error('Missing context object in dao instance. Maybe you forgot to call super constructor with context ?')
    }
    this.$context = context
    this.$dataProxy = new DataProxy()
    this.$queryBuilder = new QueryBuilder()
  }
  async findOne(identifier) {
    const conditionsObject = this.$getConditionsObjectFromArgument(identifier)
    const query = this.$queryBuilder.getSelectQueryWithConditionsObject(this.$tableMetadata, conditionsObject)
    const result = await this.$databaseProxy.query(query)
    return this.$dataProxy.databaseToObject(result)
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
