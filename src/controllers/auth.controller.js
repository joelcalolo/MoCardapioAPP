const jwt = require('jsonwebtoken');
const { User, Customer, Kitchen, DeliveryPerson } = require('../models');
const logger = require('../config/logger');
const { validationResult } = require('express-validator');

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, senha } = req.body;
    logger.info('Tentativa de login:', { email });

    // Buscar usuário
    const user = await User.findOne({ 
      where: { email },
      include: [
        { association: 'cliente' },
        { association: 'fornecedor' },
        { association: 'entregador' }
      ]
    });

    if (!user) {
      logger.warn('Login falhou: usuário não encontrado', { email });
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isValidPassword = await user.comparePassword(senha);
    if (!isValidPassword) {
      logger.warn('Login falhou: senha incorreta', { email });
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar se JWT_SECRET está definido
    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET não está definido');
      throw new Error('Configuração de JWT ausente');
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, tipo: user.tipo },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Determinar o perfil baseado no tipo
    let profile = null;
    switch (user.tipo) {
      case 'cliente':
        profile = user.cliente;
        break;
      case 'fornecedor':
        profile = user.fornecedor;
        break;
      case 'entregador':
        profile = user.entregador;
        break;
    }

    logger.info('Login bem sucedido', { userId: user.id, userType: user.tipo });

    res.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo,
        profile
      },
      token
    });

  } catch (error) {
    logger.error('Erro ao processar login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nome, email, senha, tipo, ...profileData } = req.body;

    // Verificar se o email já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Criar usuário
    const user = await User.create({
      nome,
      email,
      senha,
      tipo
    });

    // Criar perfil específico baseado no tipo de usuário
    let profile;
    switch (tipo) {
      case 'cliente':
        profile = await Customer.create({
          usuario_id: user.id,
          endereco: profileData.endereco,
          telefone: profileData.telefone
        });
        break;
      case 'fornecedor':
        profile = await Kitchen.create({
          usuario_id: user.id,
          nome: profileData.nome_estabelecimento,
          localizacao: profileData.localizacao,
          especialidade: profileData.especialidade,
          telefone: profileData.telefone
        });
        break;
      case 'entregador':
        profile = await DeliveryPerson.create({
          usuario_id: user.id,
          veiculo: profileData.veiculo,
          telefone: profileData.telefone
        });
        break;
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, tipo: user.tipo },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo,
        profile
      },
      token
    });

  } catch (error) {
    logger.error('Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};