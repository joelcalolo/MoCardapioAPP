const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, { foreignKey: 'pedido_id', as: 'pedido' });
      OrderItem.belongsTo(models.Dish, { foreignKey: 'prato_id', as: 'prato' });
    }
  }

  OrderItem.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    pedido_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'pedidos',
        key: 'id'
      }
    },
    prato_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'pratos',
        key: 'id'
      }
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    subtotal: {
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
    modelName: 'OrderItem',
    tableName: 'itens_pedido',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em'
  });

  return OrderItem;
};