const toCamelCase = require('lodash.camelcase')

class DataProxy {
  constructor() {
  }
  databaseToObject(data) {
    if (Array.isArray(data)) {
      return data.map((d) => this.$processData(d))
    } else {
      return this.$processData(data)
    }
  }
  $processData(data) {
    return this.$transformToCamelCaseDeeply(data)
  }
  $transformToCamelCaseDeeply(data) {
    if (typeof data === 'object' && data !== null && !(data instanceof Date)) {
      return Object.keys(data).reduce((newObject, key) => {
        newObject[toCamelCase(key)] = this.$transformToCamelCaseDeeply(data[key])
        return newObject
      }, {})
    } else if (Array.isArray(data)) {
      return data.map((d) => this.$transformToCamelCaseDeeply(d))
    } else {
      return data
    }
  }
}

module.exports = DataProxy
