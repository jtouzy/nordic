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
  getSelectCountQuery() {
    return {
      text: `SELECT COUNT(*) as count FROM ${this.getFromClauseWithTableMetadata()}`,
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
  getSelectCountQueryWithConditionsObject(conditionsObject) {
    const conditions = this.getConditionsWithObject(conditionsObject)
    const { text, values } = this.getSelectCountQuery()
    return {
      text: this.$appendWhereConditionIfNeeded(text, conditions),
      values: values.concat(conditions.values)
    }
  }
  getInsertQuery(createdValues) {
    const createdItems = Array.isArray(createdValues) ? createdValues : [createdValues]
    if (createdItems.length === 0) {
      throw new Error(`Trying to insert an empty array.`)
    }
    const allKeys = [... new Set(createdItems.reduce((accumulator, item) => {
      return accumulator.concat(Object.keys(item))
    }, []))]
    const valuesQuery = createdItems.map((newItem, index) => `(${allKeys.map((k, idx) => `$${ idx + 1 + (allKeys.length*index) }`).join(', ')})`).join(', ')
    return {
      text: `INSERT INTO ${this.getTableWithSchemaClause()} (${allKeys.join(', ')}) VALUES ${valuesQuery}`,
      values: createdItems.reduce((accumulator, newItem) => {
        return accumulator.concat(allKeys.map(k => newItem[k] ? newItem[k] : null))
      }, [])
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
