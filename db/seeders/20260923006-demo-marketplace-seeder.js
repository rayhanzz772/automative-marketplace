'use strict'

const cuid = require('cuid')

module.exports = {
  async up(queryInterface) {
    // 1. Get or create seller user
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM users LIMIT 1`
    )
    let sellerId
    if (users && users.length > 0) {
      sellerId = users[0].id
    } else {
      sellerId = 'user_seller_demo_001'
      await queryInterface.sequelize.query(`
        INSERT INTO users (id, name, username, email, password, status, created_at, updated_at)
        VALUES ('${sellerId}', 'Auto Dealership Indo', 'autodealer', 'dealer@automarket.id', 'dummy_hash', true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `)
    }

    // 2. Insert Categories
    // Tree hierarchy:
    // - Cars (cat_cars)
    //   - SUV (cat_suv)
    //     - 7-Seater SUV (cat_7seater_suv)
    //     - Compact SUV (cat_compact_suv)
    //   - Sedan (cat_sedan)
    //   - EV / Hybrid (cat_ev_hybrid)
    // - Motorcycles (cat_motorcycles)
    //   - Scooter (cat_scooter)
    //   - Sport Bike (cat_sport_bike)
    // - Commercial Vehicles (cat_commercial)
    //   - Pickup Truck (cat_pickup)

    const categories = [
      { id: 'cat_cars', parent_id: null, name: 'Cars', slug: 'cars', sort_order: 1 },
      { id: 'cat_suv', parent_id: 'cat_cars', name: 'SUV', slug: 'suv', sort_order: 1 },
      { id: 'cat_7seater_suv', parent_id: 'cat_suv', name: '7-Seater SUV', slug: '7-seater-suv', sort_order: 1 },
      { id: 'cat_compact_suv', parent_id: 'cat_suv', name: 'Compact SUV', slug: 'compact-suv', sort_order: 2 },
      { id: 'cat_sedan', parent_id: 'cat_cars', name: 'Sedan', slug: 'sedan', sort_order: 2 },
      { id: 'cat_ev_hybrid', parent_id: 'cat_cars', name: 'EV / Hybrid', slug: 'ev-hybrid', sort_order: 3 },
      { id: 'cat_motorcycles', parent_id: null, name: 'Motorcycles', slug: 'motorcycles', sort_order: 2 },
      { id: 'cat_scooter', parent_id: 'cat_motorcycles', name: 'Scooter', slug: 'scooter', sort_order: 1 },
      { id: 'cat_sport_bike', parent_id: 'cat_motorcycles', name: 'Sport Bike', slug: 'sport-bike', sort_order: 2 },
      { id: 'cat_commercial', parent_id: null, name: 'Commercial Vehicles', slug: 'commercial-vehicles', sort_order: 3 },
      { id: 'cat_pickup', parent_id: 'cat_commercial', name: 'Pickup Truck', slug: 'pickup-truck', sort_order: 1 }
    ]

    for (const cat of categories) {
      await queryInterface.sequelize.query(`
        INSERT INTO categories (id, parent_id, name, slug, sort_order, created_at, updated_at)
        VALUES ('${cat.id}', ${cat.parent_id ? `'${cat.parent_id}'` : 'NULL'}, '${cat.name}', '${cat.slug}', ${cat.sort_order}, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id;
      `)
    }

    // 3. Populate Category Closures
    // Self references (depth 0)
    for (const cat of categories) {
      await queryInterface.sequelize.query(`
        INSERT INTO category_closures (ancestor_id, descendant_id, depth)
        VALUES ('${cat.id}', '${cat.id}', 0)
        ON CONFLICT DO NOTHING;
      `)
    }

    // Hierarchical closure edges
    const closureEdges = [
      // Cars -> children
      { ancestor: 'cat_cars', descendant: 'cat_suv', depth: 1 },
      { ancestor: 'cat_cars', descendant: 'cat_7seater_suv', depth: 2 },
      { ancestor: 'cat_cars', descendant: 'cat_compact_suv', depth: 2 },
      { ancestor: 'cat_cars', descendant: 'cat_sedan', depth: 1 },
      { ancestor: 'cat_cars', descendant: 'cat_ev_hybrid', depth: 1 },
      // SUV -> children
      { ancestor: 'cat_suv', descendant: 'cat_7seater_suv', depth: 1 },
      { ancestor: 'cat_suv', descendant: 'cat_compact_suv', depth: 1 },
      // Motorcycles -> children
      { ancestor: 'cat_motorcycles', descendant: 'cat_scooter', depth: 1 },
      { ancestor: 'cat_motorcycles', descendant: 'cat_sport_bike', depth: 1 },
      // Commercial -> children
      { ancestor: 'cat_commercial', descendant: 'cat_pickup', depth: 1 }
    ]

    for (const edge of closureEdges) {
      await queryInterface.sequelize.query(`
        INSERT INTO category_closures (ancestor_id, descendant_id, depth)
        VALUES ('${edge.ancestor}', '${edge.descendant}', ${edge.depth})
        ON CONFLICT DO NOTHING;
      `)
    }

    // 4. Insert Filter Attributes
    const filterAttributes = [
      // Defined in Cars (cat_cars) -> Inherited by all SUVs, Sedans, EV/Hybrids
      { id: 'attr_seat_capacity', category_id: 'cat_cars', key: 'seat_capacity', label: 'Seat Capacity', attr_type: 'range', unit: 'Seats', min_value: 2, max_value: 10, is_searchable: true, sort_order: 1 },
      { id: 'attr_has_sunroof', category_id: 'cat_cars', key: 'has_sunroof', label: 'Panoramic Sunroof', attr_type: 'boolean', unit: null, min_value: null, max_value: null, is_searchable: true, sort_order: 2 },
      { id: 'attr_has_leather_seats', category_id: 'cat_cars', key: 'has_leather_seats', label: 'Leather Interior', attr_type: 'boolean', unit: null, min_value: null, max_value: null, is_searchable: true, sort_order: 3 },
      
      // Defined in SUV (cat_suv) -> Inherited by 7-Seater and Compact SUV
      { id: 'attr_drive_type', category_id: 'cat_suv', key: 'drive_type', label: 'Drive Type', attr_type: 'enum', unit: null, min_value: null, max_value: null, is_searchable: true, sort_order: 1 },
      { id: 'attr_ground_clearance', category_id: 'cat_suv', key: 'ground_clearance', label: 'Ground Clearance', attr_type: 'range', unit: 'mm', min_value: 150, max_value: 300, is_searchable: true, sort_order: 2 },

      // Defined in EV / Hybrid (cat_ev_hybrid)
      { id: 'attr_battery_capacity', category_id: 'cat_ev_hybrid', key: 'battery_capacity', label: 'Battery Capacity', attr_type: 'range', unit: 'kWh', min_value: 10, max_value: 200, is_searchable: true, sort_order: 1 },
      { id: 'attr_electric_range', category_id: 'cat_ev_hybrid', key: 'electric_range', label: 'Pure Electric Range', attr_type: 'range', unit: 'km', min_value: 30, max_value: 1000, is_searchable: true, sort_order: 2 },

      // Defined in Motorcycles (cat_motorcycles)
      { id: 'attr_cooling_system', category_id: 'cat_motorcycles', key: 'cooling_system', label: 'Cooling System', attr_type: 'enum', unit: null, min_value: null, max_value: null, is_searchable: true, sort_order: 1 }
    ]

    for (const attr of filterAttributes) {
      await queryInterface.sequelize.query(`
        INSERT INTO filter_attributes (id, category_id, key, label, attr_type, unit, min_value, max_value, is_searchable, sort_order, created_at, updated_at)
        VALUES ('${attr.id}', '${attr.category_id}', '${attr.key}', '${attr.label}', '${attr.attr_type}', ${attr.unit ? `'${attr.unit}'` : 'NULL'}, ${attr.min_value ?? 'NULL'}, ${attr.max_value ?? 'NULL'}, ${attr.is_searchable}, ${attr.sort_order}, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `)
    }

    // 5. Insert Attribute Options for Enum attributes
    const attributeOptions = [
      // Drive Type options (for SUV)
      { id: 'opt_fwd', attribute_id: 'attr_drive_type', label: 'Front-Wheel Drive (FWD)', value: 'FWD', sort_order: 1 },
      { id: 'opt_rwd', attribute_id: 'attr_drive_type', label: 'Rear-Wheel Drive (RWD)', value: 'RWD', sort_order: 2 },
      { id: 'opt_awd', attribute_id: 'attr_drive_type', label: 'All-Wheel Drive (AWD)', value: 'AWD', sort_order: 3 },
      { id: 'opt_4wd', attribute_id: 'attr_drive_type', label: 'Four-Wheel Drive (4WD / 4x4)', value: '4WD', sort_order: 4 },

      // Cooling System options (for Motorcycles)
      { id: 'opt_air_cooled', attribute_id: 'attr_cooling_system', label: 'Air Cooled', value: 'Air', sort_order: 1 },
      { id: 'opt_liquid_cooled', attribute_id: 'attr_cooling_system', label: 'Liquid Cooled', value: 'Liquid', sort_order: 2 }
    ]

    for (const opt of attributeOptions) {
      await queryInterface.sequelize.query(`
        INSERT INTO attribute_options (id, attribute_id, label, value, sort_order, created_at, updated_at)
        VALUES ('${opt.id}', '${opt.attribute_id}', '${opt.label}', '${opt.value}', ${opt.sort_order}, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `)
    }

    // 6. Insert Demo Listings
    const listings = [
      {
        id: 'list_fortuner_2023',
        seller_id: sellerId,
        category_id: 'cat_7seater_suv',
        make: 'Toyota',
        model: 'Fortuner',
        variant: '2.8 GR Sport 4x4',
        year: 2023,
        mileage: 18500,
        condition: 'used',
        transmission: 'automatic',
        fuel_type: 'diesel',
        color: 'Super White',
        engine_cc: 2755,
        seat_count: 7,
        price: 685000000,
        is_negotiable: true,
        province: 'DKI Jakarta',
        city: 'Jakarta Selatan',
        district: 'Kebayoran Baru',
        title: 'Toyota Fortuner 2.8 GR Sport 4x4 AT 2023 Full Spec Low KM',
        description: 'Kondisi istimewa tangan pertama dari baru. Service record bengkel resmi Toyota. Pajak panjang hingga November 2024. Bodi mulus bebas tabrakan dan banjir.'
      },
      {
        id: 'list_crv_hybrid_2024',
        seller_id: sellerId,
        category_id: 'cat_suv',
        make: 'Honda',
        model: 'CR-V',
        variant: '2.0 RS e:HEV Hybrid',
        year: 2024,
        mileage: 4200,
        condition: 'used',
        transmission: 'cvt',
        fuel_type: 'hybrid',
        color: 'Ignite Red Metallic',
        engine_cc: 1993,
        seat_count: 5,
        price: 795000000,
        is_negotiable: false,
        province: 'DKI Jakarta',
        city: 'Jakarta Pusat',
        district: 'Menteng',
        title: 'Honda CR-V 2.0 RS e:HEV Hybrid 2024 Like New Panoramic Sunroof',
        description: 'All New Honda CRV Hybrid RS Panoramic Sunroof Honda Sensing lengkap. Sangat irit BBM 1:20 km/liter.'
      },
      {
        id: 'list_ioniq5_2023',
        seller_id: sellerId,
        category_id: 'cat_ev_hybrid',
        make: 'Hyundai',
        model: 'Ioniq 5',
        variant: 'Signature Long Range',
        year: 2023,
        mileage: 12000,
        condition: 'used',
        transmission: 'automatic',
        fuel_type: 'electric',
        color: 'Gravity Gold Matte',
        engine_cc: null,
        seat_count: 5,
        price: 660000000,
        is_negotiable: true,
        province: 'Jawa Barat',
        city: 'Bandung',
        district: 'Dago',
        title: 'Hyundai Ioniq 5 Signature Long Range 2023 Battery 72.6 kWh',
        description: 'V2L function ready, fast charging supported, battery health 99%, garansi baterai resmi Hyundai sampai 2031.'
      },
      {
        id: 'list_bmw_330i_2022',
        seller_id: sellerId,
        category_id: 'cat_sedan',
        make: 'BMW',
        model: '330i',
        variant: 'M Sport Pro',
        year: 2022,
        mileage: 23000,
        condition: 'used',
        transmission: 'automatic',
        fuel_type: 'petrol',
        color: 'Portimao Blue',
        engine_cc: 1998,
        seat_count: 5,
        price: 920000000,
        is_negotiable: true,
        province: 'Banten',
        city: 'Tangerang Selatan',
        district: 'BSD City',
        title: 'BMW 330i M Sport Pro G20 LCI 2022 Harman Kardon',
        description: 'Unit rawatan pribadi, full coating ceramic 3 layers, BSI & warranty active. Ban Michelin Pilot Sport 4 baru ganti.'
      },
      {
        id: 'list_hrv_2023',
        seller_id: sellerId,
        category_id: 'cat_compact_suv',
        make: 'Honda',
        model: 'HR-V',
        variant: '1.5 SE CVT',
        year: 2023,
        mileage: 15000,
        condition: 'used',
        transmission: 'cvt',
        fuel_type: 'petrol',
        color: 'Platinum White Pearl',
        engine_cc: 1498,
        seat_count: 5,
        price: 385000000,
        is_negotiable: true,
        province: 'Jawa Timur',
        city: 'Surabaya',
        district: 'Gubeng',
        title: 'Honda HR-V 1.5 SE CVT 2023 Panoramic Roof Tangan Pertama',
        description: 'Honda HR-V generasi terbaru type SE panoramic sunroof, sensor parkir lengkap, interior rapi wangi seperti baru.'
      },
      {
        id: 'list_nmax_2024',
        seller_id: sellerId,
        category_id: 'cat_scooter',
        make: 'Yamaha',
        model: 'NMAX 155',
        variant: 'Connected ABS',
        year: 2024,
        mileage: 1200,
        condition: 'used',
        transmission: 'automatic',
        fuel_type: 'petrol',
        color: 'Matte Green',
        engine_cc: 155,
        seat_count: 2,
        price: 34500000,
        is_negotiable: true,
        province: 'DKI Jakarta',
        city: 'Jakarta Timur',
        district: 'Cakung',
        title: 'Yamaha All New NMAX 155 Connected ABS 2024 Gress',
        description: 'Kondisi 99% seperti turun dari dealer. Y-Connect aktif, keyless smart key 2 pcs lengkap.'
      },
      {
        id: 'list_zx25r_2023',
        seller_id: sellerId,
        category_id: 'cat_sport_bike',
        make: 'Kawasaki',
        model: 'Ninja ZX-25R',
        variant: 'ABS SE 4 Silinder',
        year: 2023,
        mileage: 5600,
        condition: 'used',
        transmission: 'manual',
        fuel_type: 'petrol',
        color: 'Lime Green KRT',
        engine_cc: 249,
        seat_count: 2,
        price: 118000000,
        is_negotiable: true,
        province: 'DKI Jakarta',
        city: 'Jakarta Barat',
        district: 'Kebon Jeruk',
        title: 'Kawasaki Ninja ZX-25R ABS SE 2023 4 Silinder KQS Quickshifter',
        description: 'Suara 4 silinder merdu, sudah pasang knalpot full system Austin Racing (knalpot standar tersimpan rapi), quickshifter up/down normal.'
      },
      {
        id: 'list_hilux_2022',
        seller_id: sellerId,
        category_id: 'cat_pickup',
        make: 'Toyota',
        model: 'Hilux',
        variant: 'Double Cabin 2.4 V 4x4',
        year: 2022,
        mileage: 45000,
        condition: 'used',
        transmission: 'automatic',
        fuel_type: 'diesel',
        color: 'Attitude Black',
        engine_cc: 2393,
        seat_count: 5,
        price: 460000000,
        is_negotiable: true,
        province: 'Sumatera Utara',
        city: 'Medan',
        district: 'Medan Sunggal',
        title: 'Toyota Hilux 2.4 D-Cab V 4x4 AT 2022 Siap Kerja',
        description: 'Mesin 2GD bertenaga dan bandel, sistem 4x4 berfungsi sempurna, bak belakang sudah pasang bedliner.'
      }
    ]

    for (const l of listings) {
      await queryInterface.sequelize.query(`
        INSERT INTO listings (
          id, seller_id, category_id, make, model, variant, year,
          mileage, condition, transmission, fuel_type, color, engine_cc,
          seat_count, price, is_negotiable, province, city, district,
          title, description, status, views_count, created_at, updated_at
        ) VALUES (
          '${l.id}', '${l.seller_id}', '${l.category_id}', '${l.make}', '${l.model}', '${l.variant}', ${l.year},
          ${l.mileage}, '${l.condition}', '${l.transmission}', '${l.fuel_type}', '${l.color}', ${l.engine_cc ?? 'NULL'},
          ${l.seat_count ?? 'NULL'}, ${l.price}, ${l.is_negotiable}, '${l.province}', '${l.city}', '${l.district}',
          '${l.title.replace(/'/g, "''")}', '${l.description.replace(/'/g, "''")}', 'available', 15, NOW(), NOW()
        )
        ON CONFLICT (id) DO NOTHING;
      `)
    }

    // 7. Insert Listing Images
    const images = [
      { id: cuid(), listing_id: 'list_fortuner_2023', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80', sort_order: 0, alt_text: 'Toyota Fortuner Front' },
      { id: cuid(), listing_id: 'list_crv_hybrid_2024', url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80', sort_order: 0, alt_text: 'Honda CR-V Front' },
      { id: cuid(), listing_id: 'list_ioniq5_2023', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80', sort_order: 0, alt_text: 'Hyundai Ioniq 5 Front' },
      { id: cuid(), listing_id: 'list_bmw_330i_2022', url: 'https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&w=1200&q=80', sort_order: 0, alt_text: 'BMW 330i M Sport Front' },
      { id: cuid(), listing_id: 'list_hrv_2023', url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80', sort_order: 0, alt_text: 'Honda HR-V Front' },
      { id: cuid(), listing_id: 'list_nmax_2024', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80', sort_order: 0, alt_text: 'Yamaha NMAX Front' },
      { id: cuid(), listing_id: 'list_zx25r_2023', url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80', sort_order: 0, alt_text: 'Kawasaki Ninja ZX-25R Front' },
      { id: cuid(), listing_id: 'list_hilux_2022', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80', sort_order: 0, alt_text: 'Toyota Hilux Front' }
    ]

    for (const img of images) {
      await queryInterface.sequelize.query(`
        INSERT INTO listing_images (id, listing_id, url, sort_order, alt_text, created_at, updated_at)
        VALUES ('${img.id}', '${img.listing_id}', '${img.url}', ${img.sort_order}, '${img.alt_text}', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `)
    }

    // 8. Insert Dynamic Attribute Values
    const dynamicValues = [
      // Fortuner (7-Seater SUV -> inherits drive_type from SUV, has_sunroof from Cars, seat_capacity from Cars)
      { id: cuid(), listing_id: 'list_fortuner_2023', attribute_id: 'attr_drive_type', value_enum: '4WD', value_min: null, value_max: null, value_boolean: null },
      { id: cuid(), listing_id: 'list_fortuner_2023', attribute_id: 'attr_has_sunroof', value_enum: null, value_min: null, value_max: null, value_boolean: false },
      { id: cuid(), listing_id: 'list_fortuner_2023', attribute_id: 'attr_has_leather_seats', value_enum: null, value_min: null, value_max: null, value_boolean: true },
      { id: cuid(), listing_id: 'list_fortuner_2023', attribute_id: 'attr_ground_clearance', value_enum: null, value_min: 225, value_max: 225, value_boolean: null },

      // CR-V (SUV -> inherits drive_type from SUV, has_sunroof from Cars)
      { id: cuid(), listing_id: 'list_crv_hybrid_2024', attribute_id: 'attr_drive_type', value_enum: 'FWD', value_min: null, value_max: null, value_boolean: null },
      { id: cuid(), listing_id: 'list_crv_hybrid_2024', attribute_id: 'attr_has_sunroof', value_enum: null, value_min: null, value_max: null, value_boolean: true },
      { id: cuid(), listing_id: 'list_crv_hybrid_2024', attribute_id: 'attr_has_leather_seats', value_enum: null, value_min: null, value_max: null, value_boolean: true },

      // Ioniq 5 (EV / Hybrid -> inherits battery_capacity, electric_range from EV/Hybrid, has_sunroof from Cars)
      { id: cuid(), listing_id: 'list_ioniq5_2023', attribute_id: 'attr_battery_capacity', value_enum: null, value_min: 72.6, value_max: 72.6, value_boolean: null },
      { id: cuid(), listing_id: 'list_ioniq5_2023', attribute_id: 'attr_electric_range', value_enum: null, value_min: 451, value_max: 451, value_boolean: null },
      { id: cuid(), listing_id: 'list_ioniq5_2023', attribute_id: 'attr_has_sunroof', value_enum: null, value_min: null, value_max: null, value_boolean: true },

      // BMW 330i (Sedan -> inherits has_sunroof, has_leather_seats from Cars)
      { id: cuid(), listing_id: 'list_bmw_330i_2022', attribute_id: 'attr_has_sunroof', value_enum: null, value_min: null, value_max: null, value_boolean: true },
      { id: cuid(), listing_id: 'list_bmw_330i_2022', attribute_id: 'attr_has_leather_seats', value_enum: null, value_min: null, value_max: null, value_boolean: true },

      // NMAX (Motorcycles -> cooling_system)
      { id: cuid(), listing_id: 'list_nmax_2024', attribute_id: 'attr_cooling_system', value_enum: 'Liquid', value_min: null, value_max: null, value_boolean: null },

      // Ninja ZX-25R (Motorcycles -> cooling_system)
      { id: cuid(), listing_id: 'list_zx25r_2023', attribute_id: 'attr_cooling_system', value_enum: 'Liquid', value_min: null, value_max: null, value_boolean: null }
    ]

    for (const dv of dynamicValues) {
      await queryInterface.sequelize.query(`
        INSERT INTO listing_attribute_values (id, listing_id, attribute_id, value_enum, value_min, value_max, value_boolean, created_at, updated_at)
        VALUES ('${dv.id}', '${dv.listing_id}', '${dv.attribute_id}', ${dv.value_enum ? `'${dv.value_enum}'` : 'NULL'}, ${dv.value_min ?? 'NULL'}, ${dv.value_max ?? 'NULL'}, ${dv.value_boolean ?? 'NULL'}, NOW(), NOW())
        ON CONFLICT (listing_id, attribute_id) DO NOTHING;
      `)
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM listing_attribute_values;
      DELETE FROM listing_images;
      DELETE FROM listings;
      DELETE FROM attribute_options;
      DELETE FROM filter_attributes;
      DELETE FROM category_closures;
      DELETE FROM categories;
    `)
  }
}
