class QueryBuilder {
  constructor(tableMetadata) {
    this.$tableMetadata = tableMetadata
  }
  getSelectQueryWithConditionsObject(conditionsObject) {
    const conditions = this.getConditionsWithObject(conditionsObject)
    const hasConditions = conditions.values.length > 0
    return {
      text: `
        SELECT *
          FROM ${this.getFromClauseWithTableMetadata()}
          ${hasConditions ? `WHERE ${conditions.text}` : ''}
      `,
      values: conditions.values
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
