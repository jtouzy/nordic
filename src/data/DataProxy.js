class DataProxy {
  constructor(transformOptions) {
    this.$databaseToObjectKeyTransform = (transformOptions || {}).databaseToObjectKeyTransform
    this.$objectToDatabaseKeyTransform = (transformOptions || {}).objectToDatabaseKeyTransform
  }
  databaseToObject(data) {
    return this.$processData(data, this.$databaseToObjectKeyTransform)
  }
  objectToDatabase(data) {
    return this.$processData(data, this.$objectToDatabaseKeyTransform)
  }
  $processData(data, transformFn) {
    if (!transformFn || !(transformFn instanceof Function)) {
      return data
    }
    if (Array.isArray(data)) {
      return data.map((d) => this.$transformDeeply(d, transformFn))
    } else {
      return this.$transformDeeply(data, transformFn)
    }
  }
  $transformDeeply(data, transformFn) {
    if (data === null) {
      return data
    } else if (typeof data === 'object' && !(data instanceof Date)) {
      if (Array.isArray(data)) {
        return data.map((d) => this.$transformDeeply(d, transformFn))
      } else {
        return Object.keys(data).reduce((newObject, key) => {
          newObject[transformFn(key)] = this.$transformDeeply(data[key], transformFn)
          return newObject
        }, {})
      }
    } else {
      return data
    }
  }
}

module.exports = DataProxy
