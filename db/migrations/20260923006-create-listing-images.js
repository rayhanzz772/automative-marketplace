'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS listing_images (
        id          VARCHAR(36)  NOT NULL,
        listing_id  VARCHAR(36)  NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        url         VARCHAR(500) NOT NULL,
        sort_order  SMALLINT     NOT NULL DEFAULT 0,
        alt_text    VARCHAR(300) DEFAULT NULL,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT pk_listing_images PRIMARY KEY (id)
      );
    `)

    /* Fetch all images for a listing ordered by sort_order — sort_order 0 = cover */
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_listing_images_listing_sort
        ON listing_images(listing_id, sort_order);
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS listing_images CASCADE;`)
  }
}
