const { User, Customer, Kitchen, DeliveryPerson } = require('../models');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, type, ...profileData } = req.body;

    // Verificar se o email já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Criar usuário
    const user = await User.create({
      name,
      email,
      password, // A senha será hasheada automaticamente pelo hook no modelo
      type
    });

    // Criar perfil específico baseado no tipo de usuário
    let profile;
    switch (type) {
      case 'customer':
        profile = await Customer.create({
          userId: user.id,
          address: profileData.address,
          phone: profileData.phone
        });
        break;
      case 'kitchen':
        profile = await Kitchen.create({
          userId: user.id,
          name: profileData.kitchenName,
          location: profileData.location,
          specialty: profileData.specialty
        });
        break;
      case 'delivery':
        profile = await DeliveryPerson.create({
          userId: user.id,
          vehicle: profileData.vehicle
        });
        break;
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, type: user.type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type
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
    const { email, password } = req.body;

    // Buscar usuário
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, type: user.type },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type
      },
      token
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};