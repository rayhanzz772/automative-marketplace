'use strict'
const cuid = require('cuid')

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'master_accesses',
      [
        {
          id: 'access_dashboard_id_001',
          name: 'Dashboard',
          code: 'DASHBOARD',
          slug: '/dashboard',
          sequence: 1,
          icon: 'dashboard',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'access_users_id_001',
          name: 'User Management',
          code: 'USER_MANAGEMENT',
          slug: '/users',
          sequence: 2,
          icon: 'users',
          created_at: new Date(),
          updated_at: new Date()
        }
      ],
      { ignoreDuplicates: true }
    )
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('master_accesses', null, {})
  }
}
