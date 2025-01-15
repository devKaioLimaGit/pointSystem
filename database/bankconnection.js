const Sequelize = require("sequelize");

const connection = new Sequelize("pointsystem", "root", "12345", {
  host: "localhost",
  dialect: "mysql",
  port: 3066
});

module.exports = connection;
