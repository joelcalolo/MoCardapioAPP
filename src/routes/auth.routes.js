const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// TODO: Importar controller de autenticação
// const authController = require('../controllers/auth.controller');

// Rota de login
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
], (req, res) => {
  // TODO: Implementar lógica de login
  res.status(501).json({ message: 'Rota de login a ser implementada' });
});

// Rota de registro
router.post('/register', [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('type').isIn(['kitchen', 'delivery', 'admin']).withMessage('Tipo de usuário inválido')
], (req, res) => {
  // TODO: Implementar lógica de registro
  res.status(501).json({ message: 'Rota de registro a ser implementada' });
});

module.exports = router;