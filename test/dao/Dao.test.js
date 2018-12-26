const { expect } = require('chai')
const Dao = require('../../src/dao/Dao')

describe('Dao.constructor', () => {
  it('Should be fine if context object is set', () => {
    expect(() => { new Dao({}) }).to.not.throw(Error)
  })
  it('Should throw error if context object is not set', () => {
    expect(() => { new Dao() }).to.throw(Error)
  })
})

describe('Dao.$getConditionsObjectFromArgument', () => {
  // TODO add string argument test when implemented
  it('Should convert regular object to database readable object', () => {
    const conditionArg = { articleId: 'article113' }
    const result = new Dao({}).$getConditionsObjectFromArgument(conditionArg)
    expect(result).to.be.eql({ article_id: 'article113' })
  })
  it('Should not convert database readable object', () => {
    const conditionArg = { article_id: 'article113' }
    const result = new Dao({}).$getConditionsObjectFromArgument(conditionArg)
    expect(result).to.be.eql({ article_id: 'article113' })
  })
  it('Should convert function argument with regular object as database readable object', () => {
    const conditionArg = () => { return { articleId: 'article113' } }
    const result = new Dao({}).$getConditionsObjectFromArgument(conditionArg)
    expect(result).to.be.eql({ article_id: 'article113' })
  })
  it('Should convert function argument with database readable object', () => {
    const conditionArg = () => { return { article_id: 'article113' } }
    const result = new Dao({}).$getConditionsObjectFromArgument(conditionArg)
    expect(result).to.be.eql({ article_id: 'article113' })
  })
})
