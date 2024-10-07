const Sequelize = require("sequelize")

const connection = new Sequelize("pointsystem", "root","12345",{
   host: 'localhost',
  dialect: 'mysql'
})

module.exports = connection;