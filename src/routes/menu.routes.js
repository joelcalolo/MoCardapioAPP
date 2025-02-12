const express = require('express');
const router = express.Router();
const { authMiddleware, checkUserType } = require('../middleware/auth.middleware');
const { Dish, Kitchen } = require('../models');

// Rotas públicas
router.get('/', async (req, res) => {
  try {
    const pratos = await Dish.findAll({
      where: { disponivel: true },
      include: [{
        model: Kitchen,
        as: 'fornecedor',
        where: { disponivel: true },
        attributes: ['nome', 'localizacao', 'especialidade']
      }]
    });
    res.json(pratos);
  } catch (error) {
    console.error('Erro ao listar pratos:', error);
    res.status(500).json({ error: 'Erro ao listar pratos' });
  }
});

// Listar pratos por fornecedor (rota pública)
router.get('/fornecedor/:fornecedorId', async (req, res) => {
  try {
    const pratos = await Dish.findAll({
      where: { 
        fornecedor_id: req.params.fornecedorId
      },
      include: [{
        model: Kitchen,
        as: 'fornecedor',
        attributes: ['nome', 'localizacao', 'especialidade']
      }]
    });
    res.json(pratos);
  } catch (error) {
    console.error('Erro ao listar pratos do fornecedor:', error);
    res.status(500).json({ error: 'Erro ao listar pratos do fornecedor' });
  }
});

// Rotas protegidas
router.use(authMiddleware);

// Listar pratos do fornecedor logado
router.get('/meus-pratos', checkUserType('fornecedor'), async (req, res) => {
  try {
    const pratos = await Dish.findAll({
      where: { 
        fornecedor_id: req.profile.id
      },
      include: [{
        model: Kitchen,
        as: 'fornecedor',
        attributes: ['nome', 'localizacao', 'especialidade']
      }]
    });
    res.json(pratos);
  } catch (error) {
    console.error('Erro ao listar pratos:', error);
    res.status(500).json({ error: 'Erro ao listar pratos' });
  }
});

// Listar pratos indisponíveis
router.get('/indisponiveis', checkUserType('fornecedor'), async (req, res) => {
  try {
    const pratos = await Dish.findAll({
      where: { 
        fornecedor_id: req.profile.id,
        disponivel: false
      }
    });
    res.json(pratos);
  } catch (error) {
    console.error('Erro ao listar pratos indisponíveis:', error);
    res.status(500).json({ error: 'Erro ao listar pratos indisponíveis' });
  }
});

// Atualizar disponibilidade do prato
router.patch('/:id/disponibilidade', checkUserType('fornecedor'), async (req, res) => {
  try {
    const { disponivel } = req.body;
    const prato = await Dish.findOne({
      where: { 
        id: req.params.id,
        fornecedor_id: req.profile.id
      }
    });

    if (!prato) {
      return res.status(404).json({ error: 'Prato não encontrado' });
    }

    await prato.update({ disponivel });
    res.json(prato);
  } catch (error) {
    console.error('Erro ao atualizar disponibilidade:', error);
    res.status(500).json({ error: 'Erro ao atualizar disponibilidade' });
  }
});

// Criar novo prato (apenas fornecedores)
router.post('/', checkUserType('fornecedor'), async (req, res) => {
  try {
    const { nome, descricao, preco } = req.body;
    const fornecedor = req.profile;

    const prato = await Dish.create({
      fornecedor_id: fornecedor.id,
      nome,
      descricao,
      preco,
      disponivel: true
    });

    res.status(201).json(prato);
  } catch (error) {
    console.error('Erro ao criar prato:', error);
    res.status(500).json({ error: 'Erro ao criar prato' });
  }
});

// Atualizar prato (apenas fornecedor dono do prato)
router.put('/:id', checkUserType('fornecedor'), async (req, res) => {
  try {
    const { nome, descricao, preco, disponivel } = req.body;
    const fornecedor = req.profile;

    const prato = await Dish.findOne({
      where: { 
        id: req.params.id,
        fornecedor_id: fornecedor.id
      }
    });

    if (!prato) {
      return res.status(404).json({ error: 'Prato não encontrado' });
    }

    await prato.update({
      nome: nome || prato.nome,
      descricao: descricao || prato.descricao,
      preco: preco || prato.preco,
      disponivel: disponivel !== undefined ? disponivel : prato.disponivel
    });

    res.json(prato);
  } catch (error) {
    console.error('Erro ao atualizar prato:', error);
    res.status(500).json({ error: 'Erro ao atualizar prato' });
  }
});

// Excluir prato (apenas fornecedor dono do prato)
router.delete('/:id', checkUserType('fornecedor'), async (req, res) => {
  try {
    const fornecedor = req.profile;

    const prato = await Dish.findOne({
      where: { 
        id: req.params.id,
        fornecedor_id: fornecedor.id
      }
    });

    if (!prato) {
      return res.status(404).json({ error: 'Prato não encontrado' });
    }

    // Em vez de excluir, apenas marca como indisponível
    await prato.update({ disponivel: false });

    res.json({ message: 'Prato removido com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir prato:', error);
    res.status(500).json({ error: 'Erro ao excluir prato' });
  }
});

module.exports = router;