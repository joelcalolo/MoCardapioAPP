const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authMiddleware, checkUserType } = require('../middleware/auth.middleware');
const { Order, OrderItem, Dish, Kitchen, Customer, DeliveryPerson, User } = require('../models');

// Criar pedido (Cliente)
router.post('/', authMiddleware, checkUserType('cliente'), async (req, res) => {
  try {
    const { fornecedor_id, itens, local_entrega, descricao_entrega } = req.body;
    const cliente = req.profile;

    // Validar fornecedor
    const fornecedor = await Kitchen.findByPk(fornecedor_id);
    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    // Calcular total do pedido
    let total = 1000;
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

// Rota protegida para entregador atualizar status do pedido
router.patch('/:orderId/status', authMiddleware, checkUserType('entregador'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const entregador = req.profile;

    const order = await Order.findOne({
      where: {
        id: orderId,
        entregador_id: entregador.id
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado ou não pertence a este entregador' });
    }

    const statusPermitidos = ['entregando', 'entregue'];
    if (!statusPermitidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido para entregador' });
    }

    await order.update({ status });

    res.json({
      message: 'Status atualizado com sucesso',
      order
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Listar pedidos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { user, profile } = req;
    let where = {};

    switch (user.tipo) {
      case 'cliente':
        where.cliente_id = profile.id;
        break;
      case 'fornecedor':
        where.fornecedor_id = profile.id;
        break;
      case 'entregador':
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

    // Formatar os dados antes de enviar
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

module.exports = router;