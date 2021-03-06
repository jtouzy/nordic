const { Client, types } = require('pg')
const DatabaseToJavascriptTranslator = require('./DatabaseToJavascriptTranslator')

class DatabaseProxy {
  constructor({ host, port, database, user, password, metadata, options }) {
    this.$pgClient = new Client({ host, port, database, user, password })
    this.$isConnected = false
    this.$isTransactionInProgress = false
    this.$translator = new DatabaseToJavascriptTranslator({ metadata })
    const { logger, parsers } = (options || {})
    this.$logger = logger
    this.$initializeParsers(parsers)
  }
  $initializeParsers(parsers) {
    if (parsers) {
      Object.keys(parsers).forEach((databaseType) => {
        types.setTypeParser(Number(databaseType), parsers[databaseType])
      })
    }
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
        await this.commit()
      } else {
        await this.rollback()
      }
    }
  }
  async $executeQuery(query) {
    const result = await this.$pgClient.query(query)
    return this.$translator.translate(result)
  }
  setMetadata(metadata) {
    this.$translator.setMetadata(metadata)
  }
  async queryWithTransaction(query) {
    await this.$connectIfNeeded()
    await this.$startTransactionIfNeeded()
    if (typeof this.$logger === 'function') {
      this.$logger(query)
    }
    return await this.$executeQuery(query)
  }
  async query(query) {
    await this.$connectIfNeeded()
    if (typeof this.$logger === 'function') {
      this.$logger(query)
    }
    return await this.$executeQuery(query)
  }
  async commit() {
    await this.$pgClient.query('COMMIT')
    this.$isTransactionInProgress = false
  }
  async rollback() {
    await this.$pgClient.query('ROLLBACK')
    this.$isTransactionInProgress = false
  }
  async close(commitTransaction = true) {
    if (this.$isConnected) {
      await this.$closeTransactionIfNeeded(commitTransaction)
      await this.$pgClient.end()
      this.$isConnected = false
    }
  }
}

module.exports = DatabaseProxy
