const toCamelCase = require('lodash.camelcase')
const toSnakeCase = require('lodash.snakecase')

class DataProxy {
  constructor() {
  }
  databaseToObject(data) {
    return this.$processData(data, toCamelCase)
  }
  objectToDatabase(data) {
    return this.$processData(data, toSnakeCase)
  }
  $processData(data, transformFn) {
    if (Array.isArray(data)) {
      return data.map((d) => this.$transformDeeply(d, transformFn))
    } else {
      return this.$transformDeeply(data, transformFn)
    }
  }
  $transformDeeply(data, transformFn) {
    if (typeof data === 'object' && data !== null && !(data instanceof Date)) {
      return Object.keys(data).reduce((newObject, key) => {
        newObject[transformFn(key)] = this.$transformDeeply(data[key], transformFn)
        return newObject
      }, {})
    } else if (Array.isArray(data)) {
      return data.map((d) => this.$transformDeeply(d, transformFn))
    } else {
      return data
    }
  }
}

module.exports = DataProxy
