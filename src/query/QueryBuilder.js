class QueryBuilder {
  constructor() {
  }
  getSelectQueryWithConditionsObject(tableMetadata, conditionsObject) {
    const conditions = this.getConditionsWithObject(conditionsObject)
    const hasConditions = conditions.values.length > 0
    return {
      text: `
        SELECT *
          FROM ${this.getFromClauseWithTableMetadata(tableMetadata)}
          ${hasConditions ? `WHERE ${conditions.text}` : ''}
      `,
      values: conditions.values
    }
  }
  getFromClauseWithTableMetadata(tableMetadata) {
    return `${tableMetadata.schema}.${tableMetadata.name} AS ${tableMetadata.name}`
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
