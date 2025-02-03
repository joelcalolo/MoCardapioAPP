const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Customer, { foreignKey: 'usuario_id', as: 'cliente' });
      User.hasOne(models.Kitchen, { foreignKey: 'usuario_id', as: 'fornecedor' });
      User.hasOne(models.DeliveryPerson, { foreignKey: 'usuario_id', as: 'entregador' });
      User.hasMany(models.Message, { foreignKey: 'remetente_id', as: 'mensagensEnviadas' });
      User.hasMany(models.Message, { foreignKey: 'destinatario_id', as: 'mensagensRecebidas' });
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    senha: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tipo: {
      type: DataTypes.ENUM('cliente', 'fornecedor', 'entregador', 'admin', 'atendimento'),
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
    modelName: 'User',
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
    hooks: {
      beforeCreate: async (user) => {
        const crypto = require('crypto');
        user.senha = crypto.createHash('sha256').update(user.senha).digest('hex');
      },
      beforeUpdate: async (user) => {
        if (user.changed('senha')) {
          const crypto = require('crypto');
          user.senha = crypto.createHash('sha256').update(user.senha).digest('hex');
        }
      }
    }
  });

  User.prototype.comparePassword = function(password) {
    const crypto = require('crypto');
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    return hashedPassword === this.senha;
  };

  return User;
};