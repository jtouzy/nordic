class QueryBuilder {
  constructor(tableMetadata) {
    this.$tableMetadata = tableMetadata
  }
  getSelectQuery() {
    return {
      text: `SELECT * FROM ${this.getFromClauseWithTableMetadata()}`,
      values: []
    }
  }
  getSelectQueryWithConditionsObject(conditionsObject) {
    const conditions = this.getConditionsWithObject(conditionsObject)
    const hasConditions = conditions.values.length > 0
    const query = this.getSelectQuery()
    if (hasConditions) {
      return {
        text: `${query.text} WHERE ${conditions.text}`,
        values: query.values.concat(conditions.values)
      }
    } else {
      return query
    }
  }
  getFromClauseWithTableMetadata() {
    return `${this.$tableMetadata.schema}.${this.$tableMetadata.name} AS ${this.$tableMetadata.name}`
  }
  getConditionsWithObject(conditionsObject) {
    const conditionKeys = Object.keys(conditionsObject || {})
    return {
      text: conditionKeys.reduce((sql, conditionKey, index) => {
        return `${sql}${sql.length !== 0 ? ' AND ' : ''}${conditionKey} = $${index+1}`
      }, ''),
      values: conditionKeys.map(key => conditionsObject[key])
    }
  }
}

module.exports = QueryBuilder
