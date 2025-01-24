const { Sequelize } = require('sequelize');
const config = require('../../config/config.json');

async function testConnection() {
  const sequelize = new Sequelize(
    config.development.database,
    config.development.username,
    config.development.password,
    {
      host: config.development.host,
      dialect: config.development.dialect,
      logging: false
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
    
    // Testar se as tabelas existem
    const tables = await sequelize.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📋 Tabelas encontradas no banco de dados:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });

  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error.message);
  } finally {
    await sequelize.close();
  }
}

testConnection();