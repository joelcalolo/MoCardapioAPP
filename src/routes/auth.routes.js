const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');

// Validações comuns
const commonValidations = [
  body('nome').notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
];

// Validações específicas por tipo de usuário
const clienteValidations = [
  body('endereco').notEmpty().withMessage('Endereço é obrigatório'),
  body('telefone').notEmpty().withMessage('Telefone é obrigatório')
];

const fornecedorValidations = [
  body('nome_estabelecimento').notEmpty().withMessage('Nome do estabelecimento é obrigatório'),
  body('localizacao').notEmpty().withMessage('Localização é obrigatória'),
  body('especialidade').notEmpty().withMessage('Especialidade é obrigatória')
];

const entregadorValidations = [
  body('veiculo').notEmpty().withMessage('Veículo é obrigatório')
];

// Rota de registro
router.post('/register', [
  ...commonValidations,
  body('tipo').isIn(['cliente', 'fornecedor', 'entregador', 'admin', 'atendimento'])
    .withMessage('Tipo de usuário inválido'),
  (req, res, next) => {
    // Aplicar validações específicas baseado no tipo de usuário
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

// Rota de login
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').notEmpty().withMessage('Senha é obrigatória')
], authController.login);

module.exports = router;