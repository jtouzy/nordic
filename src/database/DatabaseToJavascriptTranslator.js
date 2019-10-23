class DatabaseToJavascriptTranslator {
  constructor({ metadata }) {
    this.$databaseMetadata = metadata
  }
  setMetadata(metadata) {
    this.$databaseMetadata = metadata
  }
  translate(result) {
    // No database metadata fetched yet: no translation
    if (!this.$databaseMetadata) {
      return result.rows
    }
    const resultTypeMapping = result.fields
      .map((field) => ({
        name: field.name, type: this.$databaseMetadata.dataTypes[field.dataTypeID]
      }))
      .filter((field) => field.type === 'ARRAY')
      .map((field) => field.name)
    // No array column found: no translation
    if (resultTypeMapping.length === 0) {
      return result.rows
    }
    // Translation for array columns
    return result.rows.map((object) => {
      return Object.assign(object, Object.keys(object).filter((key) => resultTypeMapping.includes(key)).reduce((acc, next) => {
        return Object.assign(acc, { [next]: this.$translateJSArray(object[next]) })
      }, {}))
    })
  }
  $translateJSArray(value) {
    if (value === undefined || value === null || value === '') {
      return value
    }
    if (!value.startsWith('{') || !value.endsWith('}')) {
      return value
    }
    return value.substring(1, value.length - 1).split(',')
  }
}

module.exports = DatabaseToJavascriptTranslator
