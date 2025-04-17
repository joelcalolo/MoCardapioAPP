const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { authMiddleware, checkUserType } = require('../middleware/auth.middleware');
const { Dish, Kitchen } = require('../models');
const bodyParser = require("body-parser");

// Criar a pasta "uploads" se não existir
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


// Configuração do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Salvar na pasta 'uploads'
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nome único para cada arquivo
    }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 🔹 Limite de 50MB
});

// Rota de upload
router.post('/uploads', upload.single('imagem'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }
  res.json({ 
    url: `/uploads/${req.file.filename}`,
    message: 'Upload realizado com sucesso' 
  });
});


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
router.post('/', checkUserType('fornecedor'), upload.single('imagem'), async (req, res) => {
  try {
    const { nome, descricao, preco } = req.body;
    const fornecedor = req.profile;

    // Verificar se a imagem foi enviada
    const imagem = req.file ? `/uploads/${req.file.filename}` : null;

    // Criar o prato no banco de dados com a URL da imagem
    const prato = await Dish.create({
      fornecedor_id: fornecedor.id, // Mantendo a lógica original
      nome,
      descricao,
      preco,
      imagem, // Salva a URL da imagem no banco
      disponivel: true,
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