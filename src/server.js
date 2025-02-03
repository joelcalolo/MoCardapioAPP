require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { sequelize } = require('./models');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api', routes);

// Tratamento de erros detalhado
app.use((err, req, res, next) => {
  console.error('❌ Erro detalhado:');
  console.error('- Mensagem:', err.message);
  console.error('- Stack:', err.stack);
  console.error('- Detalhes:', err);

  // Enviar resposta com detalhes do erro em desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: err.message,
      stack: err.stack,
      details: err
    });
  } else {
    // Em produção, enviar mensagem genérica
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Sincronizar banco de dados e iniciar servidor
const PORT = process.env.PORT || 3000;

sequelize.sync({ force: false })
  .then(() => {
    console.log('✅ Banco de dados sincronizado');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Erro ao sincronizar banco de dados:', err);
  });