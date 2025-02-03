const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/database.js')[env];

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

// Importar modelos
const modelFiles = [
  require('./User'),
  require('./Customer'),
  require('./Kitchen'),
  require('./DeliveryPerson'),
  require('./Dish'),
  require('./Order'),
  require('./OrderItem'),
  require('./Message')
];

// Inicializar modelos
modelFiles.forEach(modelFile => {
  const model = modelFile(sequelize);
  db[model.name] = model;
});

// Configurar associações
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;