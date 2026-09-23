'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS listing_attribute_values (
        id           VARCHAR(36)   NOT NULL,
        listing_id   VARCHAR(36)   NOT NULL REFERENCES listings(id)          ON DELETE CASCADE,
        attribute_id VARCHAR(36)   NOT NULL REFERENCES filter_attributes(id) ON DELETE CASCADE,

        -- Typed columns: only one is populated, determined by filter_attributes.attr_type
        value_enum    VARCHAR(200)  DEFAULT NULL,  -- for attr_type = 'enum'
        value_min     DECIMAL(15,2) DEFAULT NULL,  -- for attr_type = 'range' lower bound
        value_max     DECIMAL(15,2) DEFAULT NULL,  -- for attr_type = 'range' upper bound
        value_boolean BOOLEAN       DEFAULT NULL,  -- for attr_type = 'boolean'

        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

        CONSTRAINT pk_listing_attribute_values PRIMARY KEY (id),
        CONSTRAINT uniq_lav_listing_attr UNIQUE (listing_id, attribute_id)
      );
    `)

    /* Fetch all dynamic attribute values for a given listing */
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_lav_listing_id
        ON listing_attribute_values(listing_id);
    `)

    /* Filter: "show listings where fuel_type = 'petrol'" */
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_lav_attr_enum
        ON listing_attribute_values(attribute_id, value_enum)
        WHERE value_enum IS NOT NULL;
    `)

    /* Filter: "show listings where mileage BETWEEN 0 AND 50000" */
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_lav_attr_range
        ON listing_attribute_values(attribute_id, value_min, value_max)
        WHERE value_min IS NOT NULL;
    `)

    /* Filter: "show listings where has_sunroof = true" */
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_lav_attr_boolean
        ON listing_attribute_values(attribute_id, value_boolean)
        WHERE value_boolean IS NOT NULL;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS listing_attribute_values CASCADE;`)
  }
}
