const Sequelize = require('sequelize')
const pkg = require('../../package.json')

const {Client} = require('@elastic/elasticsearch')
const es = new Client({
  node: process.env.BONSAI_URL || 'http://localhost:9200'
})

const databaseName = pkg.name + (process.env.NODE_ENV === 'test' ? '-test' : '')

const db = new Sequelize(
  process.env.DATABASE_URL || `postgres://localhost:5432/${databaseName}`,
  {
    logging: false
  }
)
module.exports = {
  db,
  es
}

// This is a global Mocha hook used for resource cleanup.
// Otherwise, Mocha v4+ does not exit after tests.
if (process.env.NODE_ENV === 'test') {
  after('close database connection', () => db.close())
}
