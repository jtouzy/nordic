# nordic
Another nodejs ORM for postgres. Serverless and lightweight approach.

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

Then, on your dao instances, you have multiples functions available.
```javascript
// Find all items in given table
const allItems = articlesDao.findAll()

// Find one item in given table (with properties)
const item = articlesDao.findOne({ articleId: 1 })
// Find one item in given table (with primary key implicit => only working with single primary key)
const item = articlesDao.findOne(1)

// Create item
const myItem = { articleId: 1, title: 'My title' }
articlesDao.create(myItem)

// Update item
const myItem = articlesDao.findOne({ articleId: 1 })
myItem.title = 'My new title'
articlesDao.update(myItem)

// Delete item
const myItem = articlesDao.findOne({ articleId: 1 })
articlesDao.deleteOne(myItem)
```

**Completed documentation coming soon.**
