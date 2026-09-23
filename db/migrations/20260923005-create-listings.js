'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    /* PostgreSQL ENUM types for typed columns */
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE listing_status AS ENUM ('available', 'pending', 'sold');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE vehicle_condition AS ENUM ('new', 'used');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE transmission_type AS ENUM ('manual', 'automatic', 'cvt', 'amt', 'dct');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      DO $$ BEGIN
        CREATE TYPE fuel_type AS ENUM ('petrol', 'diesel', 'electric', 'hybrid', 'lpg');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS listings (
        id            VARCHAR(36)       NOT NULL,
        category_id   VARCHAR(36)       NOT NULL REFERENCES categories(id),

        -- Vehicle Identity
        make          VARCHAR(100)      NOT NULL,
        model         VARCHAR(150)      NOT NULL,
        variant       VARCHAR(150)      DEFAULT NULL,
        year          SMALLINT          NOT NULL CHECK (year BETWEEN 1900 AND 2100),

        -- Vehicle Specs
        mileage       INTEGER           NOT NULL DEFAULT 0 CHECK (mileage >= 0),
        condition     vehicle_condition NOT NULL,
        transmission  transmission_type NOT NULL,
        fuel_type     fuel_type         NOT NULL,
        color         VARCHAR(100)      NOT NULL,
        engine_cc     SMALLINT          DEFAULT NULL,
        seat_count    SMALLINT          DEFAULT NULL,

        -- Pricing
        price         DECIMAL(15,2)     NOT NULL CHECK (price > 0),
        is_negotiable BOOLEAN           NOT NULL DEFAULT FALSE,

        -- Location
        province      VARCHAR(100)      NOT NULL,
        city          VARCHAR(100)      NOT NULL,
        district      VARCHAR(100)      DEFAULT NULL,
        latitude      DECIMAL(10,7)     DEFAULT NULL,
        longitude     DECIMAL(10,7)     DEFAULT NULL,

        -- Listing Meta
        title         VARCHAR(300)      NOT NULL,
        description   TEXT              DEFAULT NULL,
        status        listing_status    NOT NULL DEFAULT 'available',
        views_count   INTEGER           NOT NULL DEFAULT 0,

        -- Full-text search vector (auto-maintained by trigger below)
        search_vector TSVECTOR,

        created_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
        deleted_at    TIMESTAMPTZ       DEFAULT NULL,

        CONSTRAINT pk_listings PRIMARY KEY (id)
      );
    `)

    /* ── Indexes ──────────── */

    /* Individual columns */
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_listings_category_id  ON listings(category_id);
      CREATE INDEX idx_listings_make         ON listings(make);
      CREATE INDEX idx_listings_year         ON listings(year);
      CREATE INDEX idx_listings_price        ON listings(price);
      CREATE INDEX idx_listings_mileage      ON listings(mileage);
      CREATE INDEX idx_listings_fuel_type    ON listings(fuel_type);
      CREATE INDEX idx_listings_transmission ON listings(transmission);
      CREATE INDEX idx_listings_city         ON listings(city);
    `)

    /* Partial index */
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_listings_status_active
        ON listings(status)
        WHERE status = 'available' AND deleted_at IS NULL;
    `)

    /* Composite index */
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_listings_composite
        ON listings(status, category_id, price, year)
        WHERE deleted_at IS NULL;
    `)

    /* GIN index */
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_listings_search_vector
        ON listings USING GIN(search_vector);
    `)

    /* ── Full-Text Search Trigger ── */
    /* Auto-rebuilds search_vector on every INSERT or UPDATE */
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION fn_update_listing_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('simple', COALESCE(NEW.title,       '')), 'A') ||
          setweight(to_tsvector('simple', COALESCE(NEW.make,        '')), 'A') ||
          setweight(to_tsvector('simple', COALESCE(NEW.model,       '')), 'A') ||
          setweight(to_tsvector('simple', COALESCE(NEW.variant,     '')), 'A') ||
          setweight(to_tsvector('simple', COALESCE(NEW.city,        '')), 'B') ||
          setweight(to_tsvector('simple', COALESCE(NEW.province,    '')), 'B') ||
          setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'C');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    await queryInterface.sequelize.query(`
      CREATE TRIGGER trig_listing_search_vector
      BEFORE INSERT OR UPDATE ON listings
      FOR EACH ROW EXECUTE FUNCTION fn_update_listing_search_vector();
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trig_listing_search_vector ON listings;
      DROP FUNCTION IF EXISTS fn_update_listing_search_vector;
      DROP TABLE IF EXISTS listings CASCADE;
      DROP TYPE IF EXISTS listing_status;
      DROP TYPE IF EXISTS vehicle_condition;
      DROP TYPE IF EXISTS transmission_type;
      DROP TYPE IF EXISTS fuel_type;
    `)
  }
}
