'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    /* ENUM type for attribute kind */
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE attr_type AS ENUM ('enum', 'range', 'boolean');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `)

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS filter_attributes (
        id            VARCHAR(36)   NOT NULL,
        category_id   VARCHAR(36)   NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        key           VARCHAR(100)  NOT NULL,
        label         VARCHAR(200)  NOT NULL,
        attr_type     attr_type     NOT NULL,
        unit          VARCHAR(50)   DEFAULT NULL,
        min_value     DECIMAL(15,2) DEFAULT NULL,
        max_value     DECIMAL(15,2) DEFAULT NULL,
        is_required   BOOLEAN       NOT NULL DEFAULT FALSE,
        is_searchable BOOLEAN       NOT NULL DEFAULT TRUE,
        sort_order    SMALLINT      NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        deleted_at    TIMESTAMPTZ   DEFAULT NULL,
        CONSTRAINT pk_filter_attributes PRIMARY KEY (id),
        CONSTRAINT uniq_filter_attr_category_key UNIQUE (category_id, key)
      );
    `)

    /* Lookup: all active attributes for a given category */
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_filter_attributes_category_id
        ON filter_attributes(category_id)
        WHERE deleted_at IS NULL;
    `)

    /* Lookup: only searchable attributes */
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_filter_attributes_searchable
        ON filter_attributes(category_id, is_searchable)
        WHERE is_searchable = TRUE AND deleted_at IS NULL;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS filter_attributes CASCADE;`)
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS attr_type;`)
  }
}
