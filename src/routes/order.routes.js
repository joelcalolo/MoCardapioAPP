const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authMiddleware, checkUserType } = require('../middleware/auth.middleware');
const { Order, OrderItem, Dish, Kitchen, Customer, DeliveryPerson, User } = require('../models');
const { body } = require('express-validator');

// Validações para criação de pedido
const orderValidations = [
  body('fornecedor_id').isUUID().withMessage('ID do fornecedor inválido'),
  body('itens').isArray().withMessage('Itens devem ser um array'),
  body('itens.*.prato_id').isUUID().withMessage('ID do prato inválido'),
  body('itens.*.quantidade').isInt({ min: 1 }).withMessage('Quantidade deve ser maior que 0')
];

// Criar pedido (Cliente)
router.post('/', authMiddleware, checkUserType('cliente'), orderValidations, async (req, res) => {
  try {
    const { fornecedor_id, itens, local_entrega, descricao_entrega } = req.body;
    const cliente = req.profile;

    // Validar fornecedor
    const fornecedor = await Kitchen.findByPk(fornecedor_id);
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    // Calcular total do pedido
    let total = 0;
    const itensPedido = [];

    for (const item of itens) {
      const prato = await Dish.findByPk(item.prato_id);
      if (!prato) {
        return res.status(404).json({ error: `Prato ${item.prato_id} não encontrado` });
      }
      if (!prato.disponivel) {
        return res.status(400).json({ error: `Prato ${prato.nome} não está disponível` });
      }
      const subtotal = prato.preco * item.quantidade;
      total += subtotal;
      itensPedido.push({
        prato_id: prato.id,
        quantidade: item.quantidade,
        subtotal
      });
    }

    // Criar pedido
    const pedido = await Order.create({
      cliente_id: cliente.id,
      fornecedor_id,
      total,
      status: 'pendente',
      local_entrega,
      descricao_entrega
    });

    // Criar itens do pedido
    await OrderItem.bulkCreate(
      itensPedido.map(item => ({
        ...item,
        pedido_id: pedido.id
      }))
    );

    // Buscar pedido completo com relacionamentos
    const pedidoCompleto = await Order.findByPk(pedido.id, {
      include: [
        {
          model: OrderItem,
          as: 'itens',
          include: [{ model: Dish, as: 'prato' }]
        },
        {
          model: Kitchen,
          as: 'fornecedor',
          include: [{
            model: User,
            as: 'usuario',
            attributes: ['nome', 'email']
          }]
        },
        {
          model: Customer,
          as: 'cliente',
          include: [{
            model: User,
            as: 'usuario',
            attributes: ['nome', 'email']
          }]
        }
      ]
    });

    res.status(201).json(pedidoCompleto);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// Rota pública para entregador aceitar uma entrega
router.post('/:orderId/accept-delivery', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { entregadorId } = req.body;

    const order = await Order.findOne({
      where: {
        id: orderId,
        status: 'pronto',
        entregador_id: null
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado ou não disponível para entrega' });
    }

    // Atualiza o pedido com o entregador e muda o status
    await order.update({
      entregador_id: entregadorId,
      status: 'entregando'
    });

    res.json({
      message: 'Entrega aceita com sucesso',
      order
    });

  } catch (error) {
    console.error('Erro ao aceitar entrega:', error);
    res.status(500).json({ error: 'Erro ao aceitar entrega' });
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
        // Mostrar pedidos prontos sem entregador OU pedidos que já são deste entregador
        where = {
          [Op.or]: [
            {
              status: 'pronto',
              entregador_id: null
            },
            {
              entregador_id: profile.id,
              status: {
                [Op.in]: ['entregando', 'entregue']
              }
            }
          ]
        };
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
        {
          model: Kitchen,
          as: 'fornecedor',
          include: [{
            model: User,
            as: 'usuario',
            attributes: ['nome', 'email']
          }]
        },
        {
          model: Customer,
          as: 'cliente',
          include: [{
            model: User,
            as: 'usuario',
            attributes: ['nome', 'email']
          }]
        },
        {
          model: DeliveryPerson,
          as: 'entregador',
          include: [{
            model: User,
            as: 'usuario',
            attributes: ['nome', 'email']
          }]
        }
      ],
      order: [['criado_em', 'DESC']]
    });

    const formattedPedidos = pedidos.map(pedido => {
      const plainPedido = pedido.get({ plain: true });
      return {
        ...plainPedido,
        fornecedor: plainPedido.fornecedor ? {
          ...plainPedido.fornecedor,
          nome: plainPedido.fornecedor.usuario.nome
        } : null,
        cliente: plainPedido.cliente ? {
          ...plainPedido.cliente,
          nome: plainPedido.cliente.usuario.nome
        } : null,
        entregador: plainPedido.entregador ? {
          ...plainPedido.entregador,
          nome: plainPedido.entregador.usuario.nome
        } : null
      };
    });

    res.json(formattedPedidos);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
});

// Listar pedidos por entregador
router.get('/entregador', authMiddleware, checkUserType('entregador'), async (req, res) => {
  try {
    const pedidos = await Order.findAll({
      where: { entregador_id: req.profile.id },
      include: [
        {
          model: OrderItem,
          as: 'itens',
          include: [{ model: Dish, as: 'prato' }]
        },
        { model: Kitchen, as: 'fornecedor' },
        { model: Customer, as: 'cliente' }
      ],
      order: [['criado_em', 'DESC']]
    });
    res.json(pedidos);
  } catch (error) {
    console.error('Erro ao listar pedidos do entregador:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos do entregador' });
  }
});

// Detalhes do pedido
router.get('/:id', authMiddleware, async (req, res) => {
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
router.patch('/:id/status', authMiddleware, async (req, res) => {
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