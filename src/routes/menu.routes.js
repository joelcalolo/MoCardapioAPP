const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// TODO: Importar controller de cardápios
// const menuController = require('../controllers/menu.controller');

// Rotas públicas
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Rota de listagem de cardápios a ser implementada' });
});

router.get('/:id', (req, res) => {
  res.status(501).json({ message: 'Rota de detalhes do cardápio a ser implementada' });
});

// Rotas protegidas (apenas cozinhas podem modificar cardápios)
router.use(authMiddleware);

router.post('/', (req, res) => {
  res.status(501).json({ message: 'Rota de criação de cardápio a ser implementada' });
});

router.put('/:id', (req, res) => {
  res.status(501).json({ message: 'Rota de atualização de cardápio a ser implementada' });
});

router.delete('/:id', (req, res) => {
  res.status(501).json({ message: 'Rota de exclusão de cardápio a ser implementada' });
});

module.exports = router;