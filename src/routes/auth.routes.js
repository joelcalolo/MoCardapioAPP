const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');

// Validações para login
const loginValidations = [
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').notEmpty().withMessage('Senha é obrigatória')
];

// Rota de login
router.post('/login', loginValidations, authController.login);

// Validações comuns para registro
const commonValidations = [
  body('nome').notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('tipo').isIn(['cliente', 'fornecedor', 'entregador']).withMessage('Tipo de usuário inválido')
];

// Validações específicas por tipo de usuário
const clienteValidations = [
  body('endereco').notEmpty().withMessage('Endereço é obrigatório'),
  body('telefone').notEmpty().withMessage('Telefone é obrigatório')
];

const fornecedorValidations = [
  body('nome_estabelecimento').notEmpty().withMessage('Nome do estabelecimento é obrigatório'),
  body('localizacao').notEmpty().withMessage('Localização é obrigatória'),
  body('especialidade').notEmpty().withMessage('Especialidade é obrigatória'),
  body('telefone').notEmpty().withMessage('Telefone é obrigatório')
];

const entregadorValidations = [
  body('veiculo').notEmpty().withMessage('Veículo é obrigatório'),
  body('telefone').notEmpty().withMessage('Telefone é obrigatório')
];

// Rota de registro
router.post('/register', [
  ...commonValidations,
  (req, res, next) => {
    const tipo = req.body.tipo;
    let specificValidations = [];
    
    switch (tipo) {
      case 'cliente':
        specificValidations = clienteValidations;
        break;
      case 'fornecedor':
        specificValidations = fornecedorValidations;
        break;
      case 'entregador':
        specificValidations = entregadorValidations;
        break;
    }
    
    Promise.all(specificValidations.map(validation => validation.run(req)))
      .then(() => next())
      .catch(next);
  }
], authController.register);

module.exports = router;