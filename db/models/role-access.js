'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class RoleAccess extends Model {
    static associate(models) {
      RoleAccess.belongsTo(models.Role, {
        foreignKey: 'role_id',
        as: 'role'
      })
      RoleAccess.belongsTo(models.MasterAccess, {
        foreignKey: 'master_id',
        as: 'master_access'
      })
    }
  }

  RoleAccess.init(
    {
      role_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
      master_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: 'RoleAccess',
      tableName: 'role_accesses',
      underscored: true,
      timestamps: true
    }
  )

  return RoleAccess
}
