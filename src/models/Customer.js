const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Customer extends Model {
    static associate(models) {
      Customer.belongsTo(models.User, { foreignKey: 'usuario_id', as: 'usuario' });
      Customer.hasMany(models.Order, { foreignKey: 'cliente_id', as: 'pedidos' });
    }
  }

  Customer.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    usuario_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    endereco: {
      type: DataTypes.STRING,
      allowNull: false
    },
    telefone: {
      type: DataTypes.STRING,
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
    modelName: 'Customer',
    tableName: 'clientes',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em'
  });

  return Customer;
};