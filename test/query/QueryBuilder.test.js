const { expect } = require('chai')
const QueryBuilder = require('../../src/query/QueryBuilder')

const randomData = {
  articleId: 'article113',
  productId: 'product114'
}

describe('QueryBuilder.getSelectQuery', () => {
  it('Should generate basic SQL SELECT query', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const select = sut.getSelectQuery()
    expect(select.text).to.be.equal('SELECT * FROM secured.articles AS articles')
    expect(select.values).to.be.eql([])
  })
})

describe('QueryBuilder.getSelectQueryWithConditionsObject', () => {
  it('Should generate basic SQL SELECT query (no conditions)', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const select = sut.getSelectQueryWithConditionsObject()
    expect(select.text).to.be.equal('SELECT * FROM secured.articles AS articles')
    expect(select.values).to.be.eql([])
  })
  it('Should generate SQL SELECT query with single condition', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const select = sut.getSelectQueryWithConditionsObject({ article_id: randomData.articleId })
    expect(select.text).to.be.equal('SELECT * FROM secured.articles AS articles WHERE article_id = $1')
    expect(select.values).to.be.eql([randomData.articleId])
  })
  it('Should generate SQL SELECT query with multiple conditions', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const select = sut.getSelectQueryWithConditionsObject({ article_id: randomData.articleId, product_id: randomData.productId })
    expect(select.text).to.be.equal('SELECT * FROM secured.articles AS articles WHERE article_id = $1 AND product_id = $2')
    expect(select.values).to.be.eql([randomData.articleId, randomData.productId])
  })
})

describe('QueryBuilder.getFromClauseWithTableMetadata', () => {
  it('Should generate FROM clause with alias', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const fromClause = sut.getFromClauseWithTableMetadata()
    expect(fromClause).to.be.equal('secured.articles AS articles')
  })
})

describe('QueryBuilder.getConditionsWithObject', () => {
  it('Should generate single condition text with one value', () => {
    const sut = new QueryBuilder()
    const conditions = sut.getConditionsWithObject({ article_id: randomData.articleId })
    expect(conditions.text).to.be.equal('article_id = $1')
    expect(conditions.values).to.be.eql([randomData.articleId])
  })
  it('Should generate multiple conditions as text and array of values', () => {
    const sut = new QueryBuilder()
    const conditions = sut.getConditionsWithObject({ article_id: randomData.articleId, product_id: randomData.productId })
    expect(conditions.text).to.be.equal('article_id = $1 AND product_id = $2')
    expect(conditions.values).to.be.eql([randomData.articleId, randomData.productId])
  })
})