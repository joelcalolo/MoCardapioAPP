const express = require('express');
const router = express.Router();
const { authMiddleware, checkUserType } = require('../middleware/auth.middleware');
const { Order, OrderItem, Dish, Kitchen, Customer, DeliveryPerson } = require('../models');
const { body } = require('express-validator');

// Validações para criação de pedido
const orderValidations = [
  body('fornecedor_id').isUUID().withMessage('ID do fornecedor inválido'),
  body('itens').isArray().withMessage('Itens devem ser um array'),
  body('itens.*.prato_id').isUUID().withMessage('ID do prato inválido'),
  body('itens.*.quantidade').isInt({ min: 1 }).withMessage('Quantidade deve ser maior que 0')
];

// Criar pedido (requer autenticação)
router.post('/', authMiddleware, checkUserType('cliente'), orderValidations, async (req, res) => {
  try {
    const { fornecedor_id, itens } = req.body;
    const cliente = req.profile;

    // Verificar se o fornecedor existe e está disponível
    const fornecedor = await Kitchen.findOne({
      where: { id: fornecedor_id, disponivel: true }
    });

    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado ou indisponível' });
    }

    // Calcular total do pedido e verificar disponibilidade dos pratos
    let total = 0;
    const pratosVerificados = await Promise.all(
      itens.map(async (item) => {
        const prato = await Dish.findOne({
          where: { id: item.prato_id, disponivel: true }
        });

        if (!prato) {
          throw new Error(`Prato ${item.prato_id} não encontrado ou indisponível`);
        }

        const subtotal = prato.preco * item.quantidade;
        total += subtotal;

        return {
          prato,
          quantidade: item.quantidade,
          subtotal
        };
      })
    );

    // Criar pedido
    const pedido = await Order.create({
      cliente_id: cliente.id,
      fornecedor_id,
      status: 'pendente',
      total
    });

    // Criar itens do pedido
    await Promise.all(
      pratosVerificados.map(({ prato, quantidade, subtotal }) =>
        OrderItem.create({
          pedido_id: pedido.id,
          prato_id: prato.id,
          quantidade,
          subtotal
        })
      )
    );

    // Buscar pedido completo com relacionamentos
    const pedidoCompleto = await Order.findOne({
      where: { id: pedido.id },
      include: [
        {
          model: OrderItem,
          as: 'itens',
          include: [{ model: Dish, as: 'prato' }]
        },
        { model: Kitchen, as: 'fornecedor' },
        { model: Customer, as: 'cliente' }
      ]
    });

    res.status(201).json(pedidoCompleto);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// Rotas protegidas
router.use(authMiddleware);

// Listar pedidos (filtrado por tipo de usuário)
router.get('/', async (req, res) => {
  try {
    const { user, profile } = req;
    let where = {};

    // Filtrar pedidos baseado no tipo de usuário
    switch (user.tipo) {
      case 'cliente':
        where.cliente_id = profile.id;
        break;
      case 'fornecedor':
        where.fornecedor_id = profile.id;
        break;
      case 'entregador':
        where.entregador_id = profile.id;
        break;
      case 'admin':
        // Admin pode ver todos os pedidos
        break;
      default:
        return res.status(403).json({ error: 'Tipo de usuário não autorizado' });
    }

    const pedidos = await Order.findAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'itens',
          include: [{ model: Dish, as: 'prato' }]
        },
        { model: Kitchen, as: 'fornecedor' },
        { model: Customer, as: 'cliente' },
        { model: DeliveryPerson, as: 'entregador' }
      ],
      order: [['criado_em', 'DESC']]
    });

    res.json(pedidos);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
});

// Detalhes do pedido
router.get('/:id', async (req, res) => {
  try {
    const { user, profile } = req;
    const pedidoId = req.params.id;

    const pedido = await Order.findOne({
      where: { id: pedidoId },
      include: [
        {
          model: OrderItem,
          as: 'itens',
          include: [{ model: Dish, as: 'prato' }]
        },
        { model: Kitchen, as: 'fornecedor' },
        { model: Customer, as: 'cliente' },
        { model: DeliveryPerson, as: 'entregador' }
      ]
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Verificar permissão
    const temPermissao = user.tipo === 'admin' ||
      (user.tipo === 'cliente' && pedido.cliente_id === profile.id) ||
      (user.tipo === 'fornecedor' && pedido.fornecedor_id === profile.id) ||
      (user.tipo === 'entregador' && pedido.entregador_id === profile.id);

    if (!temPermissao) {
      return res.status(403).json({ error: 'Sem permissão para ver este pedido' });
    }

    res.json(pedido);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

// Atualizar status do pedido
router.patch('/:id/status', async (req, res) => {
  try {
    const { user, profile } = req;
    const { status } = req.body;
    const pedidoId = req.params.id;

    const pedido = await Order.findByPk(pedidoId);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Verificar permissões e regras de negócio para atualização de status
    switch (user.tipo) {
      case 'fornecedor':
        if (pedido.fornecedor_id !== profile.id) {
          return res.status(403).json({ error: 'Sem permissão para atualizar este pedido' });
        }
        if (!['aceito', 'preparando', 'pronto', 'cancelado'].includes(status)) {
          return res.status(400).json({ error: 'Status inválido para fornecedor' });
        }
        break;

      case 'entregador':
        if (pedido.entregador_id !== profile.id) {
          return res.status(403).json({ error: 'Sem permissão para atualizar este pedido' });
        }
        if (!['entregando', 'entregue'].includes(status)) {
          return res.status(400).json({ error: 'Status inválido para entregador' });
        }
        break;

      case 'admin':
        // Admin pode atualizar para qualquer status
        break;

      default:
        return res.status(403).json({ error: 'Sem permissão para atualizar status' });
    }

    await pedido.update({ status });

    // Buscar pedido atualizado com todos os relacionamentos
    const pedidoAtualizado = await Order.findOne({
      where: { id: pedidoId },
      include: [
        {
          model: OrderItem,
          as: 'itens',
          include: [{ model: Dish, as: 'prato' }]
        },
        { model: Kitchen, as: 'fornecedor' },
        { model: Customer, as: 'cliente' },
        { model: DeliveryPerson, as: 'entregador' }
      ]
    });

    res.json(pedidoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({ error: 'Erro ao atualizar status do pedido' });
  }
});

module.exports = router;