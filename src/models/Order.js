const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.Customer, { foreignKey: 'cliente_id', as: 'cliente' });
      Order.belongsTo(models.Kitchen, { foreignKey: 'fornecedor_id', as: 'fornecedor' });
      Order.belongsTo(models.DeliveryPerson, { foreignKey: 'entregador_id', as: 'entregador' });
      Order.hasMany(models.OrderItem, { foreignKey: 'pedido_id', as: 'itens' });
    }
  }

  Order.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    cliente_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id'
      }
    },
    fornecedor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fornecedores',
        key: 'id'
      }
    },
    entregador_id: {
      type: DataTypes.UUID,
      references: {
        model: 'entregadores',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pendente', 'aceito', 'preparando', 'pronto', 'entregando', 'entregue', 'cancelado'),
      defaultValue: 'pendente'
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    atualizado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'pedidos',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em'
  });

  return Order;
};