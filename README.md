# nordic
Another nodejs ORM for postgres. Serverless and lightweight approach.

**⚠️ This doc is currently in progress, like the framework is under development.**

## Installation

Install nordic package with npm.

```
npm install nordic --save
```

## Basic usage

Simply get the nordic instance.

```javascript
const nordic = require('nordic')
```

Then, configure the nordic instance with the `initialize` function.

**Note that this line will only configure the client access to your db. No connection is made at this point.**

```javascript 
nordic.initialize({
  host: 'pg.mysuperhostname.myamazingcompany.mypowerfulamazonrdsserver.com',
  port: 5432,
  database: 'myawesomedatabase',
  user: 'myoverratedaccount',
  password: 'mysecuredp@ssword'
})
```

Then, you have access to Dao objects, based on your schemas/tables.
```javascript
// with table name (public schema by default)
const articlesDao = nordic.getDao('articles')

// with schema & table name
const articlesDao = nordic.getDao({ schema: 'secured', table: 'articles' })

// with custom class
const articlesDao = nordic.getDao(ArticlesDao)
```

Then, on your dao instances, you have multiples functions available (ES6 syntax in example below).

**Note that the first query you will made is gonna start the database connection.**

```javascript
// Find all items in given table
const allItems = await articlesDao.findAll()

// Find one item in given table (with properties)
const item = await articlesDao.findOne({ articleId: 1 })
// Find one item in given table (with primary key implicit => only working with single primary key)
const item = await articlesDao.findOne(1)

// Create item
const myItem = { articleId: 1, title: 'My title' }
await articlesDao.create(myItem)

// Update item
const myItem = await articlesDao.findOne({ articleId: 1 })
myItem.title = 'My new title'
await articlesDao.update(myItem)

// Delete item
const myItem = await articlesDao.findOne({ articleId: 1 })
await articlesDao.deleteOne(myItem)
```

## Customization

In addition to the database connection informations, you can send an `options` property to customize nordic configuration.

```javascript
nordic.initialize({
  ...,
  options: {}
})
```

Below, you can see all the available configuration options.

### Database objects vs. model objects keys

By default, no transformations are made to the objects fetched-from or stored-to database. You can configure two functions in the `options` property to transform keys during fetching or storing phases. 

*Note: To reduce dependencies, no methods is provided by default. But you can find examples of using lodash `toCamelCase` and `toSnakeCase` functions in [unit tests](https://github.com/jtouzy/nordic/blob/master/test/data/DataProxy.test.js))*

```javascript
{
  // Your object keys will be translated with this function when fetching objects from database.
  databaseToObjectKeyTransform: () => {},
  // Your object keys will be translated with this function when sending objects to database.
  objectToDatabaseKeyTransform: () => {}
}
```
