const { Client } = require('pg')

class DatabaseProxy {
  constructor({ host, port, database, user, password }) {
    this.$pgClient = new Client({ host, port, database, user, password })
    this.$isConnected = false
    this.$isTransactionInProgress = false
  }
  async $connectIfNeeded() {
    if (!this.$isConnected) {
      await this.$pgClient.connect()
      this.$isConnected = true
    }
  }
  async $startTransactionIfNeeded() {
    if (!this.$isTransactionInProgress) {
      await this.$pgClient.query('BEGIN')
      this.$isTransactionInProgress = true
    }
  }
  async $closeTransactionIfNeeded(commitTransaction = false) {
    if (this.$isTransactionInProgress) {
      if (commitTransaction) {
        await this.$pgClient.query('COMMIT')
      } else {
        await this.$pgClient.query('ROLLBACK')
      }
      this.$isTransactionInProgress = false
    }
  }
  async $executeQuery(query) {
    const result = await this.$pgClient.query(query)
    return result.rows
  }
  async queryWithTransaction(query) {
    await this.$connectIfNeeded()
    await this.$startTransactionIfNeeded()
    return await this.$executeQuery(query)
  }
  async query(query) {
    await this.$connectIfNeeded()
    return await this.$executeQuery(query)
  }
  async close(commitTransaction = false) {
    if (this.$isConnected) {
      await this.$closeTransactionIfNeeded(commitTransaction)
      await this.$pgClient.end()
      this.$isConnected = false
    }
  }
}

module.exports = DatabaseProxy