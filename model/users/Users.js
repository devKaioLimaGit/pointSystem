const Sequelize = require("sequelize");
const Connection = require("../../database/bankconnection");

const Users = Connection.define("users", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  surname: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  cpf: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  institution: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  course: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  period: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  image: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  shift: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  prohibited: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  exit: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  roles: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  resetPasswordToken: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  resetPasswordExpires: {
    type: Sequelize.DATE,
    allowNull: true,
  },
});

module.exports = Users;
