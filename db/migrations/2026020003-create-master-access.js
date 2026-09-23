'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('master_accesses', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sequence: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true
      },
      head: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.addIndex('master_accesses', ['name'])
  },

  async down(queryInterface) {
    await queryInterface.dropTable('master_accesses')
    await queryInterface.removeIndex('master_accesses', ['name'])
  }
}
