const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {}

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
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
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('kitchen', 'customer', 'delivery', 'admin', 'customer_service'),
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeCreate: async (user) => {
        const crypto = require('crypto');
        user.password = crypto.createHash('sha256').update(user.password).digest('hex');
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const crypto = require('crypto');
          user.password = crypto.createHash('sha256').update(user.password).digest('hex');
        }
      }
    }
  });

  User.prototype.comparePassword = function(password) {
    const crypto = require('crypto');
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    return hashedPassword === this.password;
  };

  return User;
};