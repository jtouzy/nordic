class QueryBuilder {
  constructor(tableMetadata, propertiesMapping, timeStamppedColumns) {
    this.$tableMetadata = tableMetadata
    this.$propertiesMapping = propertiesMapping
    this.$timeStamppedColumns = timeStamppedColumns
    this.$initializeDefaultPropertiesMapping()
  }
  $initializeDefaultPropertiesMapping() {
    if (this.$hasTimeStamppedColumnsForInsert() || this.$hasTimeStamppedColumnsForUpdate()) {
      const propertiesMapping = this.$propertiesMapping || {}
      if (this.$hasTimeStamppedColumnsForUpdate()) {
        propertiesMapping[this.$timeStamppedColumns.update] = () => { return 'now()' }
      }
      if (this.$hasTimeStamppedColumnsForInsert()) {
        propertiesMapping[this.$timeStamppedColumns.insert] = () => { return 'now()'}
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
    createdItems = this.$appendTimeStamppedColumnsForInsert(createdItems)
    const allKeys = [... new Set(createdItems.reduce((accumulator, item) => {
      return accumulator.concat(Object.keys(item))
    }, []))]
    const valuesQuery = createdItems.map((newItem, index) => `(${allKeys.map((k, idx) => this.$usePropertiesMapping(newItem, k, `$${ idx + 1 + (allKeys.length*index) }`)).join(', ')})`).join(', ')
    return {
      text: `INSERT INTO ${this.getTableWithSchemaClause()} (${allKeys.join(', ')}) VALUES ${valuesQuery} RETURNING *`,
      values: createdItems.reduce((accumulator, newItem) => {
        return accumulator.concat(this.$filterTimeStamppedColumnsKeysForInsert(allKeys).map(k => { return this.$switchUndefinedValue(newItem[k]) }))
      }, [])
    }
  }
  getUpdateQuery(updated, conditionsObject) {
    const updatedValues = this.$appendTimeStamppedColumnsForUpdate(updated)
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
  $hasTimeStamppedColumnsForInsert() {
    return typeof this.$timeStamppedColumns === 'object' && this.$timeStamppedColumns.insert
  }
  $hasTimeStamppedColumnsForUpdate() {
    return typeof this.$timeStamppedColumns === 'object' && this.$timeStamppedColumns.update
  }
  $filterTimeStamppedColumnsKeysForInsert(itemKeys) {
    if (!this.$hasTimeStamppedColumnsForInsert()) {
      return itemKeys
    }
    return itemKeys.filter((key) => key !== this.$timeStamppedColumns.insert)
  }
  $filterTimeStamppedColumnsKeysForUpdate(itemKeys) {
    if (!this.$hasTimeStamppedColumnsForUpdate()) {
      return itemKeys
    }
    return itemKeys.filter((key) => key !== this.$timeStamppedColumns.update)
  }
  $appendTimeStamppedColumnsForInsert(createdItems) {
    if (!this.$hasTimeStamppedColumnsForInsert()) {
      return createdItems
    }
    return createdItems.map((item) => Object.assign({}, item, { [this.$timeStamppedColumns.insert]: '$NOW' }))
  }
  $appendTimeStamppedColumnsForUpdate(updatedValues) {
    if (!this.$hasTimeStamppedColumnsForUpdate()) {
      return updatedValues
    }
    return Object.assign({}, updatedValues, { [this.$timeStamppedColumns.update]: '$NOW' })
  }
  $appendWhereConditionIfNeeded(query, conditions, appendReturning = true) {
    const hasConditions = conditions && conditions.values && conditions.values.length > 0
    return `${query}${hasConditions ? ` WHERE ${conditions.text}` : ''}${appendReturning ? ' RETURNING *' : ''}`
  }
  $usePropertiesMapping(item, key, value) {
    if (!this.$propertiesMapping || !this.$propertiesMapping[key]) {
      return value
    }
    return this.$propertiesMapping[key](item, value)
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
            return updateExpression ? this.$usePropertiesMapping(conditionsObject, key, `$${nextIndex - 1}`) : `$${nextIndex - 1}`
          }).join(', ')})`])
        } else {
          nextIndex = nextIndex + 1
          return accumulator.concat([`${key} = ${updateExpression ? this.$usePropertiesMapping(conditionsObject, key, `$${nextIndex - 1}`) : `$${nextIndex - 1}`}`])
        }
      }, []).join(`${separatorSpaceBefore ? ' ' : ''}${separator} `),
      values: conditionKeys.reduce((accumulator, key) => {
        if (updateExpression && this.$hasTimeStamppedColumnsForUpdate() && key === this.$timeStamppedColumns.update) {
          return accumulator
        }
        const value = conditionsObject[key]
        return accumulator.concat(Array.isArray(value) ? value : [this.$switchUndefinedValue(value)])
      }, [])
    }
  }
}

module.exports = QueryBuilder
