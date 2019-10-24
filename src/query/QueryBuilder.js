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
    const filteredKeys = this.$filterTimeStampedColumnsKeysForInsert(allKeys)
    const valuesQuery = createdItems.map((newItem, index) => `(${allKeys.map((k, idx) => this.$usePropertiesMapping(newItem, k, `$${ idx + 1 + (filteredKeys.length*index) }`, 'INSERT')).join(', ')})`).join(', ')
    return {
      text: `INSERT INTO ${this.getTableWithSchemaClause()} (${allKeys.join(', ')}) VALUES ${valuesQuery} RETURNING *`,
      values: createdItems.reduce((accumulator, newItem) => {
        return accumulator.concat(filteredKeys.map(k => { return this.$switchUndefinedValue(newItem[k]) }))
      }, [])
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
  $filterTimeStampedColumnsKeysForInsert(itemKeys) {
    if (!this.$hasTimeStampedColumnsForInsert()) {
      return itemKeys
    }
    return itemKeys.filter((key) => key !== this.$timeStampedColumns.insert)
  }
  $filterTimeStampedColumnsKeysForUpdate(itemKeys) {
    if (!this.$hasTimeStampedColumnsForUpdate()) {
      return itemKeys
    }
    return itemKeys.filter((key) => key !== this.$timeStampedColumns.update)
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
  $usePropertiesMapping(item, key, value, operation) {
    if (!this.$propertiesMapping || !this.$propertiesMapping[key]) {
      return value
    }
    return this.$propertiesMapping[key](item, value, operation)
  }
  $switchUndefinedValue(value) {
    return typeof value === 'undefined' ? null : value
  }
  getConditionsWithObject(conditionsObject, options) {
    const { updateExpression, separator, separatorSpaceBefore, indexOffset } = Object.assign({
      updateExpression: false, separator: 'AND', separatorSpaceBefore: true, indexOffset: 0
    }, options)
    const conditionKeys = Object.keys(conditionsObject || {})
    let nextIndex = indexOffset + 1
    return {
      text: conditionKeys.reduce((accumulator, key) => {
        const value = conditionsObject[key]
        if (Array.isArray(value)) {
          return accumulator.concat([`${key} IN (${value.map(v => {
            nextIndex = nextIndex + 1
            return updateExpression ? this.$usePropertiesMapping(conditionsObject, key, `$${nextIndex - 1}`, 'UPDATE') : `$${nextIndex - 1}`
          }).join(', ')})`])
        } else {
          nextIndex = nextIndex + 1
          return accumulator.concat([`${key} = ${updateExpression ? this.$usePropertiesMapping(conditionsObject, key, `$${nextIndex - 1}`, 'UPDATE') : `$${nextIndex - 1}`}`])
        }
      }, []).join(`${separatorSpaceBefore ? ' ' : ''}${separator} `),
      values: conditionKeys.reduce((accumulator, key) => {
        if (updateExpression && this.$hasTimeStampedColumnsForUpdate() && key === this.$timeStampedColumns.update) {
          return accumulator
        }
        const value = conditionsObject[key]
        return accumulator.concat(Array.isArray(value) ? value : [this.$switchUndefinedValue(value)])
      }, [])
    }
  }
}

module.exports = QueryBuilder
