'use strict'
const { Model } = require('sequelize')
const cuid = require('cuid')

module.exports = (sequelize, DataTypes) => {
  class MasterAccess extends Model {
    static associate(models) {
      MasterAccess.hasMany(models.RoleAccess, {
        foreignKey: 'master_id',
        as: 'role_accesses'
      })
    }
  }

  MasterAccess.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => cuid()
      },
      name: DataTypes.STRING(100),
      code: DataTypes.STRING(100),
      slug: DataTypes.STRING(100),
      sequence: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      icon: DataTypes.STRING,
      head: DataTypes.STRING(100),
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      type_allowed: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'both'
      }
    },
    {
      sequelize,
      modelName: 'MasterAccess',
      tableName: 'master_accesses',
      underscored: true,
      timestamps: false
    }
  )

  return MasterAccess
}
