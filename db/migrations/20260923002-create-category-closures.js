'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS category_closures (
        ancestor_id   VARCHAR(36) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        descendant_id VARCHAR(36) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        depth         SMALLINT    NOT NULL DEFAULT 0,
        CONSTRAINT pk_category_closures PRIMARY KEY (ancestor_id, descendant_id)
      );
    `)

    /* Find all descendants of an ancestor — used for "filter listings under Cars" */
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_closure_ancestor_depth
        ON category_closures(ancestor_id, depth);
    `)

    /* Find all ancestors of a descendant — used for breadcrumb trail */
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_closure_descendant_depth
        ON category_closures(descendant_id, depth);
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS category_closures CASCADE;`)
  }
}
