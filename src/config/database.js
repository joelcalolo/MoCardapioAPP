require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '12345678',
    database: process.env.DB_NAME || 'mocardapio',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '12345678',
    database: process.env.DB_NAME + '_test' || 'mocardapio_test',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  },
  production: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '123',
    database: process.env.DB_NAME + '_production' || 'mocardapio_production',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  }
};