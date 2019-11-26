const { expect } = require('chai')
const proxyquire = require('proxyquire').noCallThru()
const sinon = require('sinon')
const { types } = require('pg')

class FakeClient {
  constructor() {}
}

describe('DatabaseProxy.constructor', () => {
  it('Should initialize parsers when given', () => {
    // Given
    const fakeTypeParserSetter = sinon.fake()
    const parser = (newValue) => { return 'timestamp_replacement' }
    const DatabaseProxy = proxyquire('../../src/database/DatabaseProxy', {
      pg: {
        Client: FakeClient,
        types: {
          setTypeParser: fakeTypeParserSetter
        }
      }
    })
    // When
    new DatabaseProxy({
      options: {
        parsers: {
          [types.builtins.TIMESTAMP]: parser
        }
      }
    })
    // Then
    expect(fakeTypeParserSetter.calledOnce).to.be.true
    expect(fakeTypeParserSetter.lastCall.args).to.be.eql([1114, parser])
  })
})
