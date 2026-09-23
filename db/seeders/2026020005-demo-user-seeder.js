'use strict'
const cuid = require('cuid')
const bcrypt = require('bcrypt')

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('Password123!', 10)
    await queryInterface.bulkInsert(
      'users',
      [
        {
          id: cuid(),
          role_id: 'role_super_admin_id_001',
          name: 'Super Administrator',
          username: 'superadmin',
          email: 'admin@example.com',
          password: hashedPassword,
          status: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: cuid(),
          role_id: 'role_super_admin_id_001',
          name: 'John Doe',
          username: 'john_doe',
          email: 'john@example.com',
          password: hashedPassword,
          status: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ],
      { ignoreDuplicates: true }
    )
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'users',
      { username: ['superadmin', 'john_doe'] },
      {}
    )
  }
}
