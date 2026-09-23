'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id          VARCHAR(36)   NOT NULL,
        parent_id   VARCHAR(36)   DEFAULT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        name        VARCHAR(150)  NOT NULL,
        slug        VARCHAR(150)  NOT NULL,
        icon_url    VARCHAR(500)  DEFAULT NULL,
        is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
        sort_order  SMALLINT      NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        deleted_at  TIMESTAMPTZ   DEFAULT NULL,
        CONSTRAINT pk_categories PRIMARY KEY (id)
      );
    `)

    // Unique slug (scoped to non-deleted rows)
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX uniq_categories_slug
        ON categories(slug)
        WHERE deleted_at IS NULL;
    `)

    // Fast parent lookup (tree navigation)
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_categories_parent_id
        ON categories(parent_id)
        WHERE deleted_at IS NULL;
    `)

    // Active categories filter
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_categories_is_active
        ON categories(is_active)
        WHERE is_active = TRUE AND deleted_at IS NULL;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS categories CASCADE;`)
  }
}
