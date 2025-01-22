const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// TODO: Importar controller de pedidos
// const orderController = require('../controllers/order.controller');

// Rotas públicas para clientes fazerem pedidos
router.post('/', (req, res) => {
  res.status(501).json({ message: 'Rota de criação de pedido a ser implementada' });
});

// Rotas protegidas
router.use(authMiddleware);

// Listar pedidos (filtrado por tipo de usuário)
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Rota de listagem de pedidos a ser implementada' });
});

// Detalhes do pedido
router.get('/:id', (req, res) => {
  res.status(501).json({ message: 'Rota de detalhes do pedido a ser implementada' });
});

// Atualizar status do pedido (aceitar/recusar - cozinha e entregador)
router.patch('/:id/status', (req, res) => {
  res.status(501).json({ message: 'Rota de atualização de status do pedido a ser implementada' });
});

module.exports = router;