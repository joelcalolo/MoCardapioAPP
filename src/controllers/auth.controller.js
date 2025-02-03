require('dotenv').config();
const { User, Customer, Kitchen, DeliveryPerson } = require('../models');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

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
          especialidade: profileData.especialidade
        });
        break;
      case 'entregador':
        profile = await DeliveryPerson.create({
          usuario_id: user.id,
          veiculo: profileData.veiculo
        });
        break;
      default:
        // Admin e atendimento não precisam de perfil adicional
        break;
    }

    // Verificar se JWT_SECRET está definido
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não está definido');
      throw new Error('Configuração de JWT ausente');
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, tipo: user.tipo },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo
      },
      profile,
      token
    });

  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Buscar usuário
    const user = await User.findOne({ 
      where: { email },
      include: [
        { model: Customer, as: 'cliente' },
        { model: Kitchen, as: 'fornecedor' },
        { model: DeliveryPerson, as: 'entregador' }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isValidPassword = await user.comparePassword(senha);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar se JWT_SECRET está definido
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não está definido');
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

    res.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo
      },
      profile,
      token
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};