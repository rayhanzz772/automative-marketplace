'use strict'
const cuid = require('cuid')

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'role_accesses',
      [
        {
          role_id: 'role_super_admin_id_001',
          master_id: 'access_dashboard_id_001',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          role_id: 'role_super_admin_id_001',
          master_id: 'access_users_id_001',
          created_at: new Date(),
          updated_at: new Date()
        }
      ],
      { ignoreDuplicates: true }
    )
  },
  async down(queryInterface, Sequelize) {
    // Delete by role_id to clean up relationships
    await queryInterface.bulkDelete(
      'role_accesses',
      { role_id: 'role_super_admin_id_001' },
      {}
    )
  }
}
