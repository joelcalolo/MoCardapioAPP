const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Dish extends Model {
    static associate(models) {
      Dish.belongsTo(models.Kitchen, { foreignKey: 'fornecedor_id', as: 'fornecedor' });
      Dish.hasMany(models.OrderItem, { foreignKey: 'prato_id', as: 'itensPedido' });
    }
  }

  Dish.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    fornecedor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fornecedores',
        key: 'id'
      }
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    preco: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    disponivel: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
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
    modelName: 'Dish',
    tableName: 'pratos',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em'
  });

  return Dish;
};