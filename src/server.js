require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { sequelize } = require('./models');
const logger = require('./config/logger');

const app = express();

// Configuração CORS mais permissiva para desenvolvimento
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configurar morgan para logs HTTP
app.use(morgan('dev'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requisições detalhado
app.use((req, res, next) => {
  logger.info('Nova requisição', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
    ip: req.ip
  });
  next();
});

// Rota de teste
app.get('/test', (req, res) => {
  res.json({ message: 'API está funcionando!' });
});

// Rotas da API
app.use('/api', routes);

// Tratamento de erros detalhado
app.use((err, req, res, next) => {
  logger.error('Erro na aplicação:', {
    error: {
      message: err.message,
      stack: err.stack
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body
    }
  });

  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor sem esperar pelo banco de dados em desenvolvimento
const PORT = process.env.PORT || 3000;

app.listen(PORT, 'localhost', () => {
  logger.info(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

// Tentar conectar ao banco de dados em background
sequelize.authenticate()
  .then(() => {
    logger.info('✅ Conexão com o banco de dados estabelecida');
    return sequelize.sync({ force: false });
  })
  .then(() => {
    logger.info('✅ Modelos sincronizados com o banco de dados');
  })
  .catch(err => {
    logger.error('❌ Erro ao conectar com o banco de dados:', err);
  });

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  logger.error('Erro não capturado:', err);
});

process.on('unhandledRejection', (err) => {
  logger.error('Promise rejeitada não tratada:', err);
});