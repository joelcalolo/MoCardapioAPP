const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// TODO: Importar controller de usuários
// const userController = require('../controllers/user.controller');

// Protege todas as rotas com autenticação
router.use(authMiddleware);

// Rota para obter perfil do usuário
router.get('/profile', (req, res) => {
  res.status(501).json({ message: 'Rota de perfil a ser implementada' });
});

// Rota para atualizar perfil
router.put('/profile', (req, res) => {
  res.status(501).json({ message: 'Rota de atualização de perfil a ser implementada' });
});

module.exports = router;