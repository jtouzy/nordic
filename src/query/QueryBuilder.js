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
    const { text, values } = this.getSelectQuery()
    return {
      text: this.$appendWhereConditionIfNeeded(text, conditions),
      values: values.concat(conditions.values)
    }
  }
  getInsertQuery(createdValues) {
    const createdValuesKeys = Object.keys(createdValues)
    const replacementValues = createdValuesKeys.reduce((accumulator, key, index) => {
      return Object.assign(accumulator, {
        text: (accumulator.text || []).concat([`$${index+1}`]),
        values: (accumulator.values || []).concat([createdValues[key]])
      })
    }, {})
    return {
      text: `INSERT INTO ${this.getTableWithSchemaClause()} (${createdValuesKeys.join(', ')}) VALUES (${replacementValues.text.join(', ')})`,
      values: replacementValues.values
    }
  }
  getUpdateQuery(updatedValues, conditionsObject) {
    const updateExpression = this.getConditionsWithObject(updatedValues, ',')
    const conditions = this.getConditionsWithObject(conditionsObject, 'AND', updateExpression.values.length)
    return {
      text: this.$appendWhereConditionIfNeeded(`UPDATE ${this.getTableWithSchemaClause()} SET ${updateExpression.text}`, conditions),
      values: updateExpression.values.concat(conditions.values)
    }
  }
  getDeleteQuery(conditionsObject) {
    const conditions = this.getConditionsWithObject(conditionsObject)
    return {
      text: this.$appendWhereConditionIfNeeded(`DELETE FROM ${this.getTableWithSchemaClause()}`, conditions),
      values: conditions.values
    }
  }
  getFromClauseWithTableMetadata() {
    return `${this.getTableWithSchemaClause()} AS ${this.$tableMetadata.name}`
  }
  getTableWithSchemaClause() {
    return `${this.$tableMetadata.schema}.${this.$tableMetadata.name}`
  }
  $appendWhereConditionIfNeeded(query, conditions) {
    const hasConditions = conditions && conditions.values && conditions.values.length > 0
    return `${query}${hasConditions ? ` WHERE ${conditions.text}` : ''}`
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
