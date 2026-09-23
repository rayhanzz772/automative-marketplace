'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('role_accesses', {
      role_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        }
      },
      master_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'master_accesses',
          key: 'id'
        }
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    })

    await queryInterface.addIndex('role_accesses', ['role_id', 'master_id'])
    await queryInterface.addIndex('role_accesses', ['role_id'])
    await queryInterface.addIndex('role_accesses', ['master_id'])
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('role_accesses', ['role_id', 'master_id'])
    await queryInterface.removeIndex('role_accesses', ['role_id'])
    await queryInterface.removeIndex('role_accesses', ['master_id'])
    await queryInterface.dropTable('role_accesses')
  }
}
