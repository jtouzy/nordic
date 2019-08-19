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
  it('Should generate SQL SELECT query with array condition', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const select = sut.getSelectQueryWithConditionsObject({ article_id: [randomData.articleId, randomData.productId] })
    expect(select.text).to.be.equal('SELECT * FROM secured.articles AS articles WHERE article_id IN ($1, $2)')
    expect(select.values).to.be.eql([randomData.articleId, randomData.productId])
  })
  it('Should generate SQL SELECT query with multiple conditions', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const select = sut.getSelectQueryWithConditionsObject({ article_id: randomData.articleId, product_id: randomData.productId })
    expect(select.text).to.be.equal('SELECT * FROM secured.articles AS articles WHERE article_id = $1 AND product_id = $2')
    expect(select.values).to.be.eql([randomData.articleId, randomData.productId])
  })
  it('Should generate SQL SELECT query with multiple conditions including one array', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const select = sut.getSelectQueryWithConditionsObject({ article_id: randomData.articleId, product_id: randomData.productId, reference_id: [randomData.articleId, randomData.productId] })
    expect(select.text).to.be.equal('SELECT * FROM secured.articles AS articles WHERE article_id = $1 AND product_id = $2 AND reference_id IN ($3, $4)')
    expect(select.values).to.be.eql([randomData.articleId, randomData.productId, randomData.articleId, randomData.productId])
  })
  it('Should generate SQL SELECT query with multiple conditions including two arrays', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const select = sut.getSelectQueryWithConditionsObject({ article_id: randomData.articleId, product_id: randomData.productId, reference_id: [randomData.articleId, randomData.productId], category_id: [randomData.articleId, randomData.productId] })
    expect(select.text).to.be.equal('SELECT * FROM secured.articles AS articles WHERE article_id = $1 AND product_id = $2 AND reference_id IN ($3, $4) AND category_id IN ($5, $6)')
    expect(select.values).to.be.eql([randomData.articleId, randomData.productId, randomData.articleId, randomData.productId, randomData.articleId, randomData.productId])
  })
})

describe('QueryBuilder.getSelectCountQueryWithConditionsObject', () => {
  it('Should generate basic SQL SELECT query (no conditions)', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const select = sut.getSelectCountQueryWithConditionsObject()
    expect(select.text).to.be.equal('SELECT COUNT(*) as count FROM secured.articles AS articles')
    expect(select.values).to.be.eql([])
  })
  it('Should generate SQL SELECT query with single condition', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const select = sut.getSelectCountQueryWithConditionsObject({ article_id: randomData.articleId })
    expect(select.text).to.be.equal('SELECT COUNT(*) as count FROM secured.articles AS articles WHERE article_id = $1')
    expect(select.values).to.be.eql([randomData.articleId])
  })
  it('Should generate SQL SELECT query with multiple conditions', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const select = sut.getSelectCountQueryWithConditionsObject({ article_id: randomData.articleId, product_id: randomData.productId })
    expect(select.text).to.be.equal('SELECT COUNT(*) as count FROM secured.articles AS articles WHERE article_id = $1 AND product_id = $2')
    expect(select.values).to.be.eql([randomData.articleId, randomData.productId])
  })
})

describe('QueryBuilder.getInsertQuery', () => {
  it('Should generate basic SQL INSERT query', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const insert = sut.getInsertQuery({ title: 'Toto', reference: 1 })
    expect(insert.text).to.be.equal('INSERT INTO secured.articles (title, reference) VALUES ($1, $2) RETURNING *')
    expect(insert.values).to.be.eql(['Toto', 1])
  })
  it('Should generate SQL INSERT query with boolean values', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const insert = sut.getInsertQuery([{ title: 'Toto', edited: false }])
    expect(insert.text).to.be.equal('INSERT INTO secured.articles (title, edited) VALUES ($1, $2) RETURNING *')
    expect(insert.values).to.be.eql(['Toto', false])
  })
  it('Should generate SQL INSERT query with array values', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const insert = sut.getInsertQuery([{ title: 'Toto', properties: ['random', 'cheap'] }])
    expect(insert.text).to.be.equal('INSERT INTO secured.articles (title, properties) VALUES ($1, $2) RETURNING *')
    expect(insert.values).to.be.eql(['Toto', ['random', 'cheap']])
  })
  it('Should generate SQL INSERT query with properties mapping', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' }, { tokens(item, value) { return `to_tsvector(${value})` } })
    const insert = sut.getInsertQuery([{ title: 'Toto', tokens: 'myToken', reference: 1 }])
    expect(insert.text).to.be.equal('INSERT INTO secured.articles (title, tokens, reference) VALUES ($1, to_tsvector($2), $3) RETURNING *')
    expect(insert.values).to.be.eql(['Toto', 'myToken', 1])
  })
  it('Should generate SQL INSERT query with multiple inserted values (2)', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const insert = sut.getInsertQuery([{ title: 'Toto', reference: 1 }, { title: 'Titi', reference: 2 }])
    expect(insert.text).to.be.equal('INSERT INTO secured.articles (title, reference) VALUES ($1, $2), ($3, $4) RETURNING *')
    expect(insert.values).to.be.eql(['Toto', 1, 'Titi', 2])
  })
  it('Should generate SQL INSERT query with multiple inserted values (3)', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const insert = sut.getInsertQuery([{ title: 'Toto', reference: 1 }, { title: 'Titi', reference: 2 }, { title: 'Tata', reference: 3 }])
    expect(insert.text).to.be.equal('INSERT INTO secured.articles (title, reference) VALUES ($1, $2), ($3, $4), ($5, $6) RETURNING *')
    expect(insert.values).to.be.eql(['Toto', 1, 'Titi', 2, 'Tata', 3])
  })
  it('Should generate SQL INSERT query with multiple inserted values, but different columns', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const insert = sut.getInsertQuery([{ title: 'Toto', reference: 1 }, { title: 'Titi', optional: 3 }])
    expect(insert.text).to.be.equal('INSERT INTO secured.articles (title, reference, optional) VALUES ($1, $2, $3), ($4, $5, $6) RETURNING *')
    expect(insert.values).to.be.eql(['Toto', 1, null, 'Titi', null, 3])
  })
  it('Should generate SQL INSERT query with multiple inserted values, but different columns and different count', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const insert = sut.getInsertQuery([{ title: 'Toto', reference: 1 }, { title: 'Titi', reference: 2, optional: 3 }])
    expect(insert.text).to.be.equal('INSERT INTO secured.articles (title, reference, optional) VALUES ($1, $2, $3), ($4, $5, $6) RETURNING *')
    expect(insert.values).to.be.eql(['Toto', 1, null, 'Titi', 2, 3])
  })
  it('Should generate SQL INSERT query with multiple inserted values, and properties mapping', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' }, { tokens(item, value) { return `to_tsvector(${value})` } })
    const insert = sut.getInsertQuery([{ title: 'Toto', reference: 1, tokens: 'myToken' }, { title: 'Titi', reference: 2, tokens: 'myToken2' }])
    expect(insert.text).to.be.equal('INSERT INTO secured.articles (title, reference, tokens) VALUES ($1, $2, to_tsvector($3)), ($4, $5, to_tsvector($6)) RETURNING *')
    expect(insert.values).to.be.eql(['Toto', 1, 'myToken', 'Titi', 2, 'myToken2'])
  })
})

describe('QueryBuilder.getUpdateQuery', () => {
  it('Should generate basic SQL UPDATE query', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const update = sut.getUpdateQuery({ title: 'Toto' }, { article_id: 1 })
    expect(update.text).to.be.equal('UPDATE secured.articles SET title = $1 WHERE article_id = $2 RETURNING *')
    expect(update.values).to.be.eql(['Toto', 1])
  })
  it('Should generate basic SQL UPDATE query with boolean values', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const update = sut.getUpdateQuery({ title: 'Toto', edited: false }, { article_id: 1 })
    expect(update.text).to.be.equal('UPDATE secured.articles SET title = $1, edited = $2 WHERE article_id = $3 RETURNING *')
    expect(update.values).to.be.eql(['Toto', false, 1])
  })
  it('Should generate SQL UPDATE query without conditions', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const update = sut.getUpdateQuery({ title: 'Toto' })
    expect(update.text).to.be.equal('UPDATE secured.articles SET title = $1 RETURNING *')
    expect(update.values).to.be.eql(['Toto'])
  })
  it('Should generate SQL UPDATE query with properties mapping', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' }, { tokens(item, value) { return `to_tsvector(${value})` } })
    const update = sut.getUpdateQuery({ title: 'Toto', tokens: 'myToken' })
    expect(update.text).to.be.equal('UPDATE secured.articles SET title = $1, tokens = to_tsvector($2) RETURNING *')
    expect(update.values).to.be.eql(['Toto', 'myToken'])
  })
  it('Should generate basic SQL UPDATE query including conditions with two arrays', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const update = sut.getUpdateQuery({ title: 'Toto' }, { article_id: randomData.articleId, product_id: randomData.productId, reference_id: [randomData.articleId, randomData.productId], category_id: [randomData.articleId, randomData.productId] })
    expect(update.text).to.be.equal('UPDATE secured.articles SET title = $1 WHERE article_id = $2 AND product_id = $3 AND reference_id IN ($4, $5) AND category_id IN ($6, $7) RETURNING *')
    expect(update.values).to.be.eql(['Toto', randomData.articleId, randomData.productId, randomData.articleId, randomData.productId, randomData.articleId, randomData.productId])
  })
})

describe('QueryBuilder.getDeleteQuery', () => {
  it('Should generate basic SQL DELETE query', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const deleteQuery = sut.getDeleteQuery({ article_id: 1 })
    expect(deleteQuery.text).to.be.equal('DELETE FROM secured.articles WHERE article_id = $1 RETURNING *')
    expect(deleteQuery.values).to.be.eql([1])
  })
  it('Should generate SQL DELETE query without conditions', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const deleteQuery = sut.getDeleteQuery()
    expect(deleteQuery.text).to.be.equal('DELETE FROM secured.articles RETURNING *')
    expect(deleteQuery.values).to.be.eql([])
  })
})

describe('QueryBuilder.getFromClauseWithTableMetadata', () => {
  it('Should generate FROM clause with alias', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const fromClause = sut.getFromClauseWithTableMetadata()
    expect(fromClause).to.be.equal('secured.articles AS articles')
  })
})

describe('QueryBuilder.$appendWhereConditionIfNeeded', () => {
  it('Should append WHERE clause where conditions given', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const condition = sut.$appendWhereConditionIfNeeded('SQL_STRING', { text: 'article_id = $1', values: [1] })
    expect(condition).to.be.equal('SQL_STRING WHERE article_id = $1 RETURNING *')
  })
  it('Should not append WHERE clause where no conditions given', () => {
    const sut = new QueryBuilder({ name: 'articles', schema: 'secured' })
    const condition = sut.$appendWhereConditionIfNeeded('SQL_STRING')
    expect(condition).to.be.equal('SQL_STRING RETURNING *')
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
  it('Should generate multiple conditions as text and array of values with given separator', () => {
    const sut = new QueryBuilder()
    const conditions = sut.getConditionsWithObject({ article_id: randomData.articleId, product_id: randomData.productId }, { separator: ',' })
    expect(conditions.text).to.be.equal('article_id = $1 , product_id = $2')
    expect(conditions.values).to.be.eql([randomData.articleId, randomData.productId])
  })
  it('Should generate multiple conditions as text and array of values with given separator and no spacing before', () => {
    const sut = new QueryBuilder()
    const conditions = sut.getConditionsWithObject({ article_id: randomData.articleId, product_id: randomData.productId }, { separator: ',', separatorSpaceBefore: false })
    expect(conditions.text).to.be.equal('article_id = $1, product_id = $2')
    expect(conditions.values).to.be.eql([randomData.articleId, randomData.productId])
  })
  it('Should generate multiple conditions as text and array of values with given offset in indexes', () => {
    const sut = new QueryBuilder()
    const conditions = sut.getConditionsWithObject({ article_id: randomData.articleId, product_id: randomData.productId }, { separator: 'AND', separatorSpaceBefore: true, indexOffset: 3 })
    expect(conditions.text).to.be.equal('article_id = $4 AND product_id = $5')
    expect(conditions.values).to.be.eql([randomData.articleId, randomData.productId])
  })
})
