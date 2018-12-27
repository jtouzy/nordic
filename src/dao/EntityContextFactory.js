class EntityContextFactory {
  static from(daoClassOrEntityProperties) {
    switch (typeof daoClassOrEntityProperties) {
      case 'function':
        return EntityContextFactory.getEntityContextFromClass(daoClassOrEntityProperties)
      case 'string':
        return EntityContextFactory.getEntityContextFromString(daoClassOrEntityProperties)
      case 'object':
        return EntityContextFactory.getEntityContextFromObject(daoClassOrEntityProperties)
      default:
        throw new Error(`Can't create entity context. No identifier given.`)
    }
  }
  static getEntityContextFromString(daoContextString) {
    return { schema: 'public', table: daoContextString }
  }
  static getEntityContextFromObject(entity) {
    if (!('table' in entity) || !('schema' in entity)) {
      throw new Error(`Missing 'table' or 'schema' property on entity context '${entity}'.`)
    }
    const { table, schema } = entity
    return { schema, table }
  }
  static getEntityContextFromClass(daoClass) {
    if ('entity' in daoClass && daoClass.entity instanceof Function) {
      const entity = daoClass.entity()
      if (typeof entity === 'string') {
        return this.getEntityContextFromString(entity)
      } else if (entity instanceof Object) {
        return this.getEntityContextFromObject(entity)
      } else {
        throw new Error(`The 'entity()' static function must return string or object type.`)
      }
    } else {
      throw new Error(`Cannot find entity identifier in given Dao object. You must define 'entity()' static function.`)
    }
  }
}

module.exports = EntityContextFactory
