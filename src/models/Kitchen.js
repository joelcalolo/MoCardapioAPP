const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Kitchen extends Model {
    static associate(models) {
      Kitchen.belongsTo(models.User, { foreignKey: 'usuario_id', as: 'usuario' });
      Kitchen.hasMany(models.Dish, { foreignKey: 'fornecedor_id', as: 'pratos' });
      Kitchen.hasMany(models.Order, { foreignKey: 'fornecedor_id', as: 'pedidos' });
    }
  }

  Kitchen.init({
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
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    localizacao: {
      type: DataTypes.STRING,
      allowNull: false
    },
    especialidade: {
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
    modelName: 'Kitchen',
    tableName: 'fornecedores',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em'
  });

  return Kitchen;
};