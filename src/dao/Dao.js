class Dao {
  constructor(context, databaseProxy) {
    this.$context = context
    this.$databaseProxy = databaseProxy
  }
}

module.exports = Dao
