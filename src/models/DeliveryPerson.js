const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class DeliveryPerson extends Model {
    static associate(models) {
      DeliveryPerson.belongsTo(models.User, { foreignKey: 'usuario_id', as: 'usuario' });
      DeliveryPerson.hasMany(models.Order, { foreignKey: 'entregador_id', as: 'entregas' });
    }
  }

  DeliveryPerson.init({
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
    veiculo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    telefone: {
      type: DataTypes.STRING,
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
    modelName: 'DeliveryPerson',
    tableName: 'entregadores',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em'
  });

  return DeliveryPerson;
};