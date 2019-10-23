const { expect } = require('chai')
const DatabaseToJavascriptTranslator = require('../../src/database/DatabaseToJavascriptTranslator')

describe('DatabaseToJavascriptTranslator.translate', () => {
  it('Should not translate if no database metadata is given', () => {
    const sut = new DatabaseToJavascriptTranslator({})
    const result = sut.translate({ rows: [{ id: '1', title: 'Test' }, { id: '2', title: 'Test' }] })
    expect(result).to.be.eql([{ id: '1', title: 'Test' }, { id: '2', title: 'Test' }])
  })
  it('Should not translate if no ARRAY column is present in metadata', () => {
    const sut = new DatabaseToJavascriptTranslator({
      metadata: { dataTypes: { '100': 'TEXT', '200': 'NUMERIC' } }
    })
    const result = sut.translate({ 
      rows: [{ id: '1', title: 'Test' }, { id: '2', title: 'Test' }],
      fields: [{ name: 'id', dataTypeID: '200' }, { name: 'title', dataTypeID: '100' }]
    })
    expect(result).to.be.eql([{ id: '1', title: 'Test' }, { id: '2', title: 'Test' }])
  })
  it('Should translate if ARRAY column is present in metadata', () => {
    const sut = new DatabaseToJavascriptTranslator({
      metadata: { dataTypes: { '100': 'TEXT', '300': 'ARRAY' } }
    })
    const result = sut.translate({ 
      rows: [{ id: '1', producers: '{TEST1,TEST2}' }, { id: '2', producers: null }],
      fields: [{ name: 'id', dataTypeID: '200' }, { name: 'producers', dataTypeID: '300' }]
    })
    expect(result).to.be.eql([{ id: '1', producers: ['TEST1','TEST2'] }, { id: '2', producers: null }])
  })
})
