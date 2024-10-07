const Sequelize = require("sequelize");
const Connection = require("../../database/bankconnection");
const Users = require("../users/Users"); // Importa o modelo Users

const Hours = Connection.define("hours", {
    prohibited: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    exit: {
        type: Sequelize.STRING,
        allowNull: true
    },
    request: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    denied: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    justify: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: ""
    },
    justifydenied:{
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: ""
    }
}, {
    timestamps: true
});

module.exports = Hours;