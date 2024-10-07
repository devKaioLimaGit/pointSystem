const Hours = require("../model/hours/Hours");
const Users = require("../model/users/Users");


// Define as associações entre os modelos
Users.hasMany(Hours, {
    foreignKey: 'userId',
    onDelete: 'CASCADE' // Configura a exclusão em cascata
});
Hours.belongsTo(Users, {
    foreignKey: 'userId'
});


// Sincroniza os modelos com o banco de dados
async function syncModels() {
    try {
        await Users.sync({ force: false }); // Sincroniza Users primeiro
        await Hours.sync({ force: false }); // Em seguida, sincroniza Hours
        console.log('Modelos sincronizados com sucesso');
    } catch (error) {
        console.error('Erro ao sincronizar modelos:', error);
    }
}

// Chama a função syncModels
syncModels();

// Exporta os modelos e associações
module.exports = {
    Hours,
    Users
};
