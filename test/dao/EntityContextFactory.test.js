const { expect } = require('chai')
const EntityContextFactory = require('../../src/dao/EntityContextFactory')

class EntityProviderMockWithValidStringValue {
  static entity() {
    return 'articles'
  }
}

class EntityProviderMockWithValidObjectValue {
  static entity() {
    return {
      schema: 'secured',
      table: 'articles'
    }
  }
}

class EntityProviderMockWithInvalidObjectValue {
  static entity() {
    return {
      schema: 'secured'
    }
  }
}

describe('EntityContextFactory.from', () => {
  it('Should throw error if nothing is given', () => {
    expect(() => { EntityContextFactory.from() }).to.throw(Error)
  })
  it('Should resolve context if a string entity is given', () => {
    const context = EntityContextFactory.from('articles')
    expect(context).to.be.eql({ schema: 'public', table: 'articles' })
  })
  it('Should resolve context if an object entity is given', () => {
    const context = EntityContextFactory.from({ schema: 'secured', table: 'articles' })
    expect(context).to.be.eql({ schema: 'secured', table: 'articles' })
  })
  it('Should resolve context if a class with string entity is given', () => {
    const context = EntityContextFactory.from(EntityProviderMockWithValidStringValue)
    expect(context).to.be.eql({ schema: 'public', table: 'articles' })
  })
  it('Should resolve context if a class with object entity is given', () => {
    const context = EntityContextFactory.from(EntityProviderMockWithValidObjectValue)
    expect(context).to.be.eql({ schema: 'secured', table: 'articles' })
  })
  it('Should throw error if context is a class with invalid entity object', () => {
    expect(() => { EntityContextFactory.from(EntityProviderMockWithInvalidObjectValue) }).to.throw(Error)
  })
})
