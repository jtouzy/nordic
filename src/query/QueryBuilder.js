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
  getUpdateQuery(updatedValues, conditionsObject) {
    const updateExpression = this.getConditionsWithObject(updatedValues, ',')
    const conditions = this.getConditionsWithObject(conditionsObject, 'AND', updateExpression.values.length)
    const hasConditions = conditions.values.length > 0
    return {
      text: `UPDATE ${this.getTableWithSchemaClause()} SET ${updateExpression.text} ${hasConditions ? `WHERE ${conditions.text}` : ''}`,
      values: updateExpression.values.concat(conditions.values)
    }
  }
  getFromClauseWithTableMetadata() {
    return `${this.getTableWithSchemaClause()} AS ${this.$tableMetadata.name}`
  }
  getTableWithSchemaClause() {
    return `${this.$tableMetadata.schema}.${this.$tableMetadata.name}`
  }
  getConditionsWithObject(conditionsObject, separator = 'AND', indexOffset = 0) {
    const conditionKeys = Object.keys(conditionsObject || {})
    return {
      text: conditionKeys.map((key, index) => `${key} = $${indexOffset+index+1}`).join(` ${separator} `),
      values: conditionKeys.map(key => conditionsObject[key])
    }
  }
}

module.exports = QueryBuilder
