'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_listings_make_lower
        ON listings (LOWER(make))
        WHERE deleted_at IS NULL;

      CREATE INDEX IF NOT EXISTS idx_listings_city_lower
        ON listings (LOWER(city))
        WHERE deleted_at IS NULL;

      CREATE INDEX IF NOT EXISTS idx_listings_province_lower
        ON listings (LOWER(province))
        WHERE deleted_at IS NULL;
    `)

    await queryInterface.sequelize.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;

      CREATE INDEX IF NOT EXISTS idx_listings_model_lower_trgm
        ON listings USING GIN (LOWER(model) gin_trgm_ops)
        WHERE deleted_at IS NULL;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_listings_make_lower;
      DROP INDEX IF EXISTS idx_listings_city_lower;
      DROP INDEX IF EXISTS idx_listings_province_lower;
      DROP INDEX IF EXISTS idx_listings_model_lower_trgm;
    `)
  }
}
