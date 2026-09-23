'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS attribute_options (
        id           VARCHAR(36)  NOT NULL,
        attribute_id VARCHAR(36)  NOT NULL REFERENCES filter_attributes(id) ON DELETE CASCADE,
        value        VARCHAR(200) NOT NULL,
        label        VARCHAR(200) NOT NULL,
        sort_order   SMALLINT     NOT NULL DEFAULT 0,
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT pk_attribute_options PRIMARY KEY (id),
        CONSTRAINT uniq_attribute_options_value UNIQUE (attribute_id, value)
      );
    `)

    /* Fetch all options for a dropdown, ordered */
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_attribute_options_attr_sort
        ON attribute_options(attribute_id, sort_order);
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS attribute_options CASCADE;`)
  }
}
