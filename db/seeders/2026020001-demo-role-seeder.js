'use strict'
const cuid = require('cuid')

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'roles',
      [
        {
          id: 'role_super_admin_id_001',
          code: 'SUPER_ADMIN',
          name: 'Super Admin',
          status: true,
          is_global_access: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ],
      { ignoreDuplicates: true }
    )
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', { code: 'SUPER_ADMIN' }, {})
  }
}
