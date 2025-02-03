const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário com seu perfil específico
    const user = await User.findByPk(decoded.id, {
      include: [
        { association: 'cliente' },
        { association: 'fornecedor' },
        { association: 'entregador' }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Adicionar usuário e seu perfil ao request
    req.user = user;
    
    // Adicionar perfil específico baseado no tipo
    switch (user.tipo) {
      case 'cliente':
        req.profile = user.cliente;
        break;
      case 'fornecedor':
        req.profile = user.fornecedor;
        break;
      case 'entregador':
        req.profile = user.entregador;
        break;
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar tipo de usuário
const checkUserType = (...tipos) => {
  return (req, res, next) => {
    if (!tipos.includes(req.user.tipo)) {
      return res.status(403).json({ 
        error: 'Acesso não autorizado para este tipo de usuário' 
      });
    }
    next();
  };
};

module.exports = { authMiddleware, checkUserType };