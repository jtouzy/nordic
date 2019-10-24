class QueryBuilder {
  constructor(tableMetadata, propertiesMapping, timeStampedColumns) {
    this.$tableMetadata = tableMetadata
    this.$propertiesMapping = propertiesMapping
    this.$timeStampedColumns = timeStampedColumns
    this.$timeStampedColumnToken = '$NOW'
    this.$initializeDefaultPropertiesMapping()
  }
  $initializeDefaultPropertiesMapping() {
    if (this.$hasTimeStampedColumnsForInsert() || this.$hasTimeStampedColumnsForUpdate()) {
      const propertiesMapping = this.$propertiesMapping || {}
      if (this.$hasTimeStampedColumnsForUpdate()) {
        propertiesMapping[this.$timeStampedColumns.update] = (item, value, operation) => {
          return operation === 'INSERT' ? value : 'now()'
        }
      }
      if (this.$hasTimeStampedColumnsForInsert()) {
        propertiesMapping[this.$timeStampedColumns.insert] = (item, value, operation) => { 
          return operation === 'INSERT' ? 'now()' : value
        }
      }
      this.$propertiesMapping = propertiesMapping
    }
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
      text: this.$appendWhereConditionIfNeeded(text, conditions, false),
      values: values.concat(conditions.values)
    }
  }
  getSelectCountQueryWithConditionsObject(conditionsObject) {
    const conditions = this.getConditionsWithObject(conditionsObject)
    const { text, values } = this.getSelectCountQuery()
    return {
      text: this.$appendWhereConditionIfNeeded(text, conditions, false),
      values: values.concat(conditions.values)
    }
  }
  getInsertQuery(createdValues) {
    let createdItems = Array.isArray(createdValues) ? createdValues : [createdValues]
    if (createdItems.length === 0) {
      throw new Error(`Trying to insert an empty array.`)
    }
    createdItems = this.$appendTimeStampedColumnsForInsert(createdItems)
    const allKeys = [... new Set(createdItems.reduce((accumulator, item) => {
      return accumulator.concat(Object.keys(item))
    }, []))]
    let currentIndex = 1, values = [], valuesQuery = []  
    for (const rowItem of createdItems) {
      const rowValuesQuery = []
      for (const key of allKeys) {
        const rowItemValueForKey = rowItem[key]
        const valueKey = `$${currentIndex}`
        const { index: nextIndex, value: valuesQueryItem } = this.$usePropertiesMapping(rowItem, rowItemValueForKey, key, valueKey, 'INSERT', values, currentIndex)
        rowValuesQuery.push(valuesQueryItem)
        currentIndex = nextIndex
      }
      valuesQuery.push(rowValuesQuery)
    }
    valuesQuery = valuesQuery.map((rowValues) => `(${rowValues.join(', ')})`).join(', ')
    return {
      text: `INSERT INTO ${this.getTableWithSchemaClause()} (${allKeys.join(', ')}) VALUES ${valuesQuery} RETURNING *`,
      values
    }
  }
  getUpdateQuery(updated, conditionsObject) {
    const updatedValues = this.$appendTimeStampedColumnsForUpdate(updated)
    const updateExpression = this.getConditionsWithObject(updatedValues, { updateExpression: true, separator: ',', separatorSpaceBefore: false })
    const conditions = this.getConditionsWithObject(conditionsObject, { separator: 'AND', separatorSpaceBefore: true, indexOffset: updateExpression.values.length })
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
  $hasTimeStampedColumnsForInsert() {
    return typeof this.$timeStampedColumns === 'object' && this.$timeStampedColumns.insert
  }
  $hasTimeStampedColumnsForUpdate() {
    return typeof this.$timeStampedColumns === 'object' && this.$timeStampedColumns.update
  }
  $appendTimeStampedColumnsForInsert(createdItems) {
    if (!this.$hasTimeStampedColumnsForInsert()) {
      return createdItems
    }
    return createdItems.map((item) => {
      if (item.hasOwnProperty(this.$timeStampedColumns.insert)) {
        return item  
      }
      return Object.assign(item, { [this.$timeStampedColumns.insert]: this.$timeStampedColumnToken })
    })
  }
  $appendTimeStampedColumnsForUpdate(updatedValues) {
    if (!this.$hasTimeStampedColumnsForUpdate() || updatedValues.hasOwnProperty(this.$timeStampedColumns.update)) {
      return updatedValues
    }
    return Object.assign(updatedValues, { [this.$timeStampedColumns.update]: this.$timeStampedColumnToken })
  }
  $appendWhereConditionIfNeeded(query, conditions, appendReturning = true) {
    const hasConditions = conditions && conditions.values && conditions.values.length > 0
    return `${query}${hasConditions ? ` WHERE ${conditions.text}` : ''}${appendReturning ? ' RETURNING *' : ''}`
  }
  $usePropertiesMapping(item, valueForKey, key, value, operation, valuesArray, currentIndex) {
    let returnValue, newIndex = currentIndex
    if (!this.$propertiesMapping || !this.$propertiesMapping[key]) {
      returnValue = value
    } else {
      returnValue = this.$propertiesMapping[key](item, value, operation)
    }
    if (returnValue.includes(value)) {
      valuesArray.push(this.$switchUndefinedValue(valueForKey))
      newIndex = currentIndex + 1
    }
    return { index: newIndex, value: returnValue }
  }
  $switchUndefinedValue(value) {
    return typeof value === 'undefined' ? null : value
  }
  getConditionsWithObject(conditionsObject, options) {
    const { updateExpression, separator, separatorSpaceBefore, indexOffset } = Object.assign({
      updateExpression: false, separator: 'AND', separatorSpaceBefore: true, indexOffset: 0
    }, options)
    const conditionKeys = Object.keys(conditionsObject || {})
    let nextIndex = indexOffset + 1, conditions = [], values = []
    for (const key of conditionKeys) {
      const itemValueForKey = conditionsObject[key]
      if (Array.isArray(itemValueForKey) && updateExpression === false) {
        const inClause = itemValueForKey.map((itemValueForKeyArrayItem) => {
          const valueKey = `$${nextIndex}`
          const { index: calculatedIndex, value: queryItem } = this.$usePropertiesMapping(conditionsObject, itemValueForKeyArrayItem, key, valueKey, 'UPDATE', values, nextIndex)
          nextIndex = calculatedIndex
          return `${updateExpression ? queryItem : valueKey}`
        }).join(', ')
        conditions.push(`${key} IN (${inClause})`)
      } else {
        const valueKey = `$${nextIndex}`
        const { index: calculatedIndex, value: queryItem } = this.$usePropertiesMapping(conditionsObject, itemValueForKey, key, valueKey, 'UPDATE', values, nextIndex)
        nextIndex = calculatedIndex
        conditions.push(`${key} = ${updateExpression ? queryItem : valueKey}`)
      } 
    }
    return {
      text: conditions.join(`${separatorSpaceBefore ? ' ' : ''}${separator} `),
      values
    }
  }
}

module.exports = QueryBuilder
