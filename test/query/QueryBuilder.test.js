const { expect } = require('chai')
const QueryBuilder = require('../../src/query/QueryBuilder')

describe('QueryBuilder.getFromClauseWithTableMetadata', () => {
  it('Should generate FROM clause with alias', () => {
    const sut = new QueryBuilder()
    const fromClause = sut.getFromClauseWithTableMetadata({ name: 'articles', schema: 'secured' })
    expect(fromClause).to.be.equal('secured.articles AS articles')
  })
})

describe('QueryBuilder.getConditionsWithObject', () => {
  it('Should generate single condition text with one value', () => {
    const sut = new QueryBuilder()
    const conditions = sut.getConditionsWithObject({ article_id: 'article113' })
    expect(conditions.text).to.be.equal('article_id = $1')
    expect(conditions.values).to.be.eql(['article113'])
  })
  it('Should generate multiple conditions as text and array of values', () => {
    const sut = new QueryBuilder()
    const conditions = sut.getConditionsWithObject({ article_id: 'article113', product_id: 'product114' })
    expect(conditions.text).to.be.equal('article_id = $1 AND product_id = $2')
    expect(conditions.values).to.be.eql(['article113', 'product114'])
  })
})
