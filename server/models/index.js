const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const env = process.env.NODE_ENV || 'development'
const config = require(__dirname + '/../config/config.json')[env]
const db = {}

// TODO set up production environment

// if (config.use_env_variable) {
//   var sequelize = new Sequelize(process.env[config.use_env_variable]);
// } else {
// var sequelize = new Sequelize(config.database, config.username, config.password, config);
// }

const username = config.username
const password = config.password
const host = config.host
const configdb = config.database

const postgresURI =
  'postgres://' + username + ':' + password + '@' + host + ':5432/' + configdb
const sequelize = new Sequelize(postgresURI, { logging: false })

;['./news-source.js', './article.js']
  .map(filname => path.join(__dirname, filname))
  .forEach(pathname => {
    const model = sequelize.import(pathname)
    db[model.name] = model
    if (model.associate) model.associate(db)
  })

db.sequelize = sequelize

module.exports = db
