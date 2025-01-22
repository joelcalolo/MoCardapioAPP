const express = require('express');
const router = express.Router();

// Importação das rotas
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const menuRoutes = require('./menu.routes');
const orderRoutes = require('./order.routes');

// Definição das rotas
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/menus', menuRoutes);
router.use('/orders', orderRoutes);

module.exports = router;