const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');

// Validações comuns
const commonValidations = [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
];

// Validações específicas por tipo de usuário
const customerValidations = [
  body('address').notEmpty().withMessage('Endereço é obrigatório'),
  body('phone').notEmpty().withMessage('Telefone é obrigatório')
];

const kitchenValidations = [
  body('kitchenName').notEmpty().withMessage('Nome da cozinha é obrigatório'),
  body('location').notEmpty().withMessage('Localização é obrigatória'),
  body('specialty').notEmpty().withMessage('Especialidade é obrigatória')
];

const deliveryValidations = [
  body('vehicle').notEmpty().withMessage('Veículo é obrigatório')
];

// Rota de registro
router.post('/register', [
  ...commonValidations,
  body('type').isIn(['kitchen', 'customer', 'delivery', 'admin', 'customer_service'])
    .withMessage('Tipo de usuário inválido'),
  (req, res, next) => {
    // Aplicar validações específicas baseado no tipo de usuário
    const type = req.body.type;
    let specificValidations = [];
    
    switch (type) {
      case 'customer':
        specificValidations = customerValidations;
        break;
      case 'kitchen':
        specificValidations = kitchenValidations;
        break;
      case 'delivery':
        specificValidations = deliveryValidations;
        break;
    }
    
    Promise.all(specificValidations.map(validation => validation.run(req)))
      .then(() => next())
      .catch(next);
  }
], authController.register);

// Rota de login
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
], authController.login);

module.exports = router;