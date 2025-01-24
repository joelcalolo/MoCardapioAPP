const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    define: dbConfig.define
  }
);

// Testar a conexão
sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');
  })
  .catch(err => {
    console.error('❌ Erro ao conectar com o banco de dados:', err);
  });

const db = {
  sequelize,
  Sequelize
};

// Importar modelos
db.User = require('./User')(sequelize);
db.Kitchen = require('./Kitchen')(sequelize);
db.DeliveryPerson = require('./DeliveryPerson')(sequelize);
db.Customer = require('./Customer')(sequelize);
db.Dish = require('./Dish')(sequelize);
db.Order = require('./Order')(sequelize);
db.OrderItem = require('./OrderItem')(sequelize);
db.Message = require('./Message')(sequelize);

// Definir associações
db.User.hasOne(db.Kitchen);
db.Kitchen.belongsTo(db.User);

db.User.hasOne(db.DeliveryPerson);
db.DeliveryPerson.belongsTo(db.User);

db.User.hasOne(db.Customer);
db.Customer.belongsTo(db.User);

db.Kitchen.hasMany(db.Dish);
db.Dish.belongsTo(db.Kitchen);

db.Customer.hasMany(db.Order);
db.Order.belongsTo(db.Customer);

db.Kitchen.hasMany(db.Order);
db.Order.belongsTo(db.Kitchen);

db.DeliveryPerson.hasMany(db.Order);
db.Order.belongsTo(db.DeliveryPerson);

db.Order.hasMany(db.OrderItem);
db.OrderItem.belongsTo(db.Order);

db.Dish.hasMany(db.OrderItem);
db.OrderItem.belongsTo(db.Dish);

db.User.hasMany(db.Message, { as: 'SentMessages', foreignKey: 'senderId' });
db.User.hasMany(db.Message, { as: 'ReceivedMessages', foreignKey: 'receiverId' });
db.Message.belongsTo(db.User, { as: 'Sender', foreignKey: 'senderId' });
db.Message.belongsTo(db.User, { as: 'Receiver', foreignKey: 'receiverId' });

module.exports = db;