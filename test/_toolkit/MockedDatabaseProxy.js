class MockedDatabaseProxy {
  constructor() {
    this.$transactionInProgress = false
    this.$loadMetadataQueryIsCalled = false
    this.$queries = []
    this.$data = [
      { article_id: 1, title: 'article1' },
      { article_id: 2, title: 'article2' }
    ]
  }
  setMetadata() {
  }
  queryWithTransaction(query) {
    this.$transactionInProgress = true
    return this.query(query)
  }
  query(query) {
    if (query.text.includes('table_schema')) {
      this.$loadMetadataQueryIsCalled = true
      return Promise.resolve([])
    }
    this.$queries.push(query)
    const values = query.values
    if (query.text.indexOf('COUNT(*)') !== -1) {
      return [{ count: this.$data.length }]
    } else {
      if (values.length === 1) {
        return Promise.resolve(this.$data.filter(a => a.article_id === values[0]))
      } else {
        return Promise.resolve(this.$data)
      }
    }
  }
}

module.exports = MockedDatabaseProxy
