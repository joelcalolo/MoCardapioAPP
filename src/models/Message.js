const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.User, { foreignKey: 'remetente_id', as: 'remetente' });
      Message.belongsTo(models.User, { foreignKey: 'destinatario_id', as: 'destinatario' });
    }
  }

  Message.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    remetente_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    destinatario_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    conteudo: {
      type: DataTypes.TEXT,
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
    modelName: 'Message',
    tableName: 'mensagens',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em'
  });

  return Message;
};