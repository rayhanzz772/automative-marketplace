'use strict'

const categoryExample = {
  id: 'cmfcategory01',
  parent_id: null,
  name: 'SUV',
  slug: 'suv',
  icon_url: 'https://cdn.example.com/icons/suv.png',
  is_active: true,
  sort_order: 1
}

const listingExample = [{
  id: 'list_cmuf5a6oo01n0i4uq2c4bcpcf',
  category_id: 'cat_sedan',
  make: 'Toyota',
  model: 'Camry',
  variant: '2.5 V AT',
  year: 2021,
  mileage: 34400,
  condition: 'used',
  transmission: 'automatic',
  fuel_type: 'petrol',
  color: 'Merah Candy',
  engine_cc: 2487,
  seat_count: 5,
  price: '741000000.00',
  is_negotiable: false,
  province: 'DKI Jakarta',
  city: 'Jakarta Barat',
  district: 'Puri Indah',
  latitude: '-6.1876000',
  longitude: '106.7418000',
  title: 'Toyota Camry 2.5 V AT 2021 Merah Candy - Koleksi Pribadi',
  description: 'Toyota Camry 2.5 V AT tahun 2021. Kondisi sangat terawat pemakaian apik. Odometer 34.400 km, transmisi AUTOMATIC, bahan bakar petrol. Dokumen lengkap (STNK, BPKB, Faktur) pajak aktif. Lokasi Jakarta Barat, DKI Jakarta. Nego tipis di tempat.',
  status: 'available',
  views_count: 570,
  search_vector: "'2.5':3A,13A,22C '2021':6A,26C '34.400':33C 'aktif':46C 'apik':31C 'at':5A,15A,24C 'automatic':36C 'bahan':37C 'bakar':38C 'barat':17B,49C 'bpkb':43C 'camry':2A,12A,21C 'candy':8A 'di':54C 'dki':18B,50C 'dokumen':40C 'faktur':44C 'jakarta':16B,19B,48C,51C 'km':34C 'koleksi':9A 'kondisi':27C 'lengkap':41C 'lokasi':47C 'merah':7A 'nego':52C 'odometer':32C 'pajak':45C 'pemakaian':30C 'petrol':39C 'pribadi':10A 'sangat':28C 'stnk':42C 'tahun':25C 'tempat':55C 'terawat':29C 'tipis':53C 'toyota':1A,11A,20C 'transmisi':35C 'v':4A,14A,23C",
  created_at: '2026-09-24 06:22:26.217552+00',
  updated_at: '2026-09-24 06:22:26.217552+00',
  deleted_at: null
}]

const listingItemExample = listingExample[0]

const success = (data, metadata = {}) => ({
  success: true,
  message: 'success',
  metadata,
  data
})

const error = (message = 'Category not found') => ({
  success: false,
  message,
  metadata: {},
  data: null
})

const paginationParameters = [
  {
    name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 },
    example: 1, description: 'Page number for offset pagination.'
  },
  {
    name: 'per_page', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
    example: 10, description: 'Number of records per page.'
  }
]

const listingFilterParameters = [
  { name: 'category_id', in: 'query', schema: { type: 'string' }, example: 'cmfcategory01' },
  { name: 'make', in: 'query', schema: { type: 'string' }, example: 'Toyota' },
  { name: 'model', in: 'query', schema: { type: 'string' }, example: 'Fortuner' },
  { name: 'condition', in: 'query', schema: { type: 'string', enum: ['new', 'used'] }, example: 'used' },
  { name: 'transmission', in: 'query', schema: { type: 'string', enum: ['manual', 'automatic', 'cvt', 'amt', 'dct'] }, example: 'automatic' },
  { name: 'fuel_type', in: 'query', schema: { type: 'string', enum: ['petrol', 'diesel', 'electric', 'hybrid', 'lpg'] }, example: 'diesel' },
  { name: 'city', in: 'query', schema: { type: 'string' }, example: 'Jakarta Selatan' },
  { name: 'province', in: 'query', schema: { type: 'string' }, example: 'DKI Jakarta' },
  { name: 'year_min', in: 'query', schema: { type: 'integer' }, example: 2020 },
  { name: 'year_max', in: 'query', schema: { type: 'integer' }, example: 2025 },
  { name: 'price_min', in: 'query', schema: { type: 'number' }, example: 300000000 },
  { name: 'price_max', in: 'query', schema: { type: 'number' }, example: 700000000 },
  { name: 'mileage_min', in: 'query', schema: { type: 'integer' }, example: 0 },
  { name: 'mileage_max', in: 'query', schema: { type: 'integer' }, example: 50000 },
  { name: 'status', in: 'query', schema: { type: 'string', enum: ['available', 'pending', 'sold'] }, example: 'available' },
  { name: 'sort_by', in: 'query', schema: { type: 'string', enum: ['created_at', 'price', 'year', 'mileage', 'views_count'] }, example: 'price' },
  { name: 'sort_order', in: 'query', schema: { type: 'string', enum: ['ASC', 'DESC'] }, example: 'ASC' },
  { name: 'cursor', in: 'query', schema: { type: 'string' }, example: 'eyJpZCI6ImNtbG...'
  },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 }, example: 20, description: 'Cursor page size. Used by GET /listings.' },
  ...paginationParameters,
  {
    name: 'attr_{attribute_id}', in: 'query',
    schema: { type: 'string' }, example: 'AWD',
    description: 'Dynamic attribute filter. Replace {attribute_id} with an attribute ID.'
  }
]

const listingRequestExample = {
  category_id: 'cmfcategory01',
  make: 'Toyota',
  model: 'Fortuner',
  variant: '2.8 VRZ',
  year: 2023,
  mileage: 18000,
  condition: 'used',
  transmission: 'automatic',
  fuel_type: 'diesel',
  color: 'White',
  engine_cc: 2755,
  seat_count: 7,
  price: 548000000,
  is_negotiable: true,
  province: 'DKI Jakarta',
  city: 'Jakarta Selatan',
  district: 'Cilandak',
  latitude: -6.2615,
  longitude: 106.8106,
  title: 'Toyota Fortuner 2.8 VRZ 2023',
  description: 'One owner, service record lengkap.',
  images: [{
    url: 'https://cdn.example.com/listings/fortuner.jpg',
    sort_order: 0,
    alt_text: 'Toyota Fortuner front view'
  }],
  attributes: [{
    attribute_id: 'cmfattribute01',
    value_enum: '4WD',
    value_min: null,
    value_max: null,
    value_boolean: null
  }]
}

const paginatedResponse = (rows = listingExample, extra = {}) => success(rows, {
  per_page: 10,
  current_page: 1,
  total_row: rows.length,
  total_page: 1,
  ...extra
})

const listingProperties = {
  category_id: { type: 'string' }, make: { type: 'string' }, model: { type: 'string' }, variant: { type: 'string', nullable: true },
  year: { type: 'integer', minimum: 1900, maximum: 2100 }, mileage: { type: 'integer', minimum: 0, default: 0 },
  condition: { type: 'string', enum: ['new', 'used'] }, transmission: { type: 'string', enum: ['manual', 'automatic', 'cvt', 'amt', 'dct'] },
  fuel_type: { type: 'string', enum: ['petrol', 'diesel', 'electric', 'hybrid', 'lpg'] }, color: { type: 'string' },
  engine_cc: { type: 'integer', minimum: 1, nullable: true }, seat_count: { type: 'integer', minimum: 1, nullable: true },
  price: { type: 'number', exclusiveMinimum: 0 }, is_negotiable: { type: 'boolean', default: false },
  province: { type: 'string' }, city: { type: 'string' }, district: { type: 'string', nullable: true },
  latitude: { type: 'number', nullable: true }, longitude: { type: 'number', nullable: true }, title: { type: 'string' },
  description: { type: 'string', nullable: true }, images: { type: 'array', items: { $ref: '#/components/schemas/ListingImage' }, default: [] },
  attributes: { type: 'array', items: { $ref: '#/components/schemas/ListingAttribute' }, default: [] }
}

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Automotive Marketplace API',
    version: '1.0.0',
    description: 'REST API for automotive listings, hierarchical categories, search, dynamic filters, and facets.'
  },
  servers: [
    {
      url: process.env.SWAGGER_SERVER_URL || `http://localhost:${process.env.PORT || 8000}/api/v1`,
      description: 'API server'
    }
  ],
  tags: [
    { name: 'System', description: 'Service health endpoints.' },
    { name: 'Categories', description: 'Category tree and category-scoped listings.' },
    { name: 'Listings', description: 'Vehicle listing lifecycle and browse operations.' },
    { name: 'Search', description: 'Full-text search and autocomplete suggestions.' },
    { name: 'Filters', description: 'Filter definitions and aggregated facet counts.' }
  ],
  paths: {
    '/status': {
      get: {
        tags: ['System'], summary: 'Check API status', operationId: 'getStatus',
        responses: {
          200: { description: 'Service is running.', content: { 'text/plain': { schema: { type: 'string' }, example: 'Running ⚡' } } }
        }
      }
    },
    '/categories': {
      get: {
        tags: ['Categories'], summary: 'Get the complete category tree', operationId: 'getCategoryTree',
        responses: {
          200: { description: 'Nested category tree.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' }, example: success([{ ...categoryExample, children: [] }]) } } }
        }
      },
      post: {
        tags: ['Categories'], summary: 'Create a category', operationId: 'createCategory',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CategoryCreateRequest' }, example: { name: 'SUV', slug: 'suv', parent_id: null, icon_url: 'https://cdn.example.com/icons/suv.png', sort_order: 1 } } } },
        responses: {
          201: { description: 'Category created.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' }, example: success({ ...categoryExample, children: [], breadcrumb: [{ id: 'cmfcategory01', name: 'SUV', slug: 'suv', depth: 0 }] }) } } },
          400: { $ref: '#/components/responses/BadRequest' }
        }
      }
    },
    '/categories/{id}': {
      parameters: [{ $ref: '#/components/parameters/CategoryId' }],
      get: {
        tags: ['Categories'], summary: 'Get category details', operationId: 'getCategory',
        responses: {
          200: { description: 'Category with direct children and breadcrumb.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' }, example: success({ ...categoryExample, children: [], breadcrumb: [{ id: 'cmfroot01', name: 'Cars', slug: 'cars', depth: 1 }, { id: 'cmfcategory01', name: 'SUV', slug: 'suv', depth: 0 }] }) } } },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      patch: {
        tags: ['Categories'], summary: 'Update category metadata', operationId: 'updateCategory',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CategoryUpdateRequest' }, example: { name: 'Sport Utility Vehicle', is_active: true, sort_order: 2 } } } },
        responses: {
          200: { description: 'Category updated.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' }, example: success(categoryExample) } } },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/categories/{id}/listings': {
      parameters: [{ $ref: '#/components/parameters/CategoryId' }],
      get: {
        tags: ['Categories'], summary: 'Browse listings in a category subtree', operationId: 'getCategoryListings',
        parameters: listingFilterParameters.filter((parameter) => !['category_id', 'limit'].includes(parameter.name)),
        responses: {
          200: { description: 'Paginated listings from the category and descendants.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' }, example: paginatedResponse() } } }
        }
      }
    },
    '/listings': {
      get: {
        tags: ['Listings'], summary: 'Browse listings', operationId: 'getListings',
        parameters: listingFilterParameters,
        responses: {
          200: { description: 'Paginated listings.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' }, example: paginatedResponse(listingExample, { next_cursor: null, has_more: false }) } } }
        }
      },
      post: {
        tags: ['Listings'], summary: 'Create a listing', operationId: 'createListing',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ListingCreateRequest' }, example: listingRequestExample } } },
        responses: {
          201: { description: 'Listing created.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' }, example: success(listingItemExample) } } },
          400: { $ref: '#/components/responses/BadRequest' }
        }
      }
    },
    '/listings/{id}': {
      parameters: [{ $ref: '#/components/parameters/ListingId' }],
      get: {
        tags: ['Listings'], summary: 'Get listing details', operationId: 'getListing',
        responses: {
          200: { description: 'Listing with images and dynamic attributes.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' }, example: success({ ...listingItemExample, images: [{ id: 'cmfimage01', url: 'https://cdn.example.com/listings/camry.jpg', sort_order: 0, alt_text: 'Toyota Camry front view' }], attributes: [] }) } } },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      patch: {
        tags: ['Listings'], summary: 'Update a listing', operationId: 'updateListing',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ListingUpdateRequest' }, example: { price: 535000000, description: 'Harga terbaru, service record tersedia.' } } } },
        responses: {
          200: { description: 'Listing updated.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' }, example: success(listingItemExample) } } },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['Listings'], summary: 'Soft-delete a listing', operationId: 'deleteListing',
        responses: {
          200: { description: 'Listing marked as removed.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' }, example: success(null) } } },
          404: { $ref: '#/components/responses/NotFound' }
        }
      }
    },
    '/listings/search': {
      get: {
        tags: ['Search'], summary: 'Search listings with full-text relevance', operationId: 'searchListings',
        parameters: [{ name: 'q', in: 'query', schema: { type: 'string' }, required: true, example: 'camry' }, ...listingFilterParameters.filter((parameter) => !['category_id', 'cursor', 'limit'].includes(parameter.name))],
        responses: {
          200: { description: 'Search results with relevance score when a query is provided.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' }, example: success({ rows: [{ ...listingItemExample, relevance_score: 0.91 }], count: 1, page: 1, per_page: 10, query: 'camry' }, { per_page: 10, current_page: 1, total_row: 1, total_page: 1 }) } } }
        }
      }
    },
    '/listings/search/suggest': {
      get: {
        tags: ['Search'], summary: 'Get autocomplete suggestions', operationId: 'getSearchSuggestions',
        parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 1 }, example: 'toy' }],
        responses: {
          200: { description: 'Up to ten prefix suggestions.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' }, example: success([{ text: 'Toyota', type: 'make' }, { text: 'Toy Story', type: 'model' }]) } } }
        }
      }
    },
    '/filters': {
      get: {
        tags: ['Filters'], summary: 'Get listing facets and statistics', operationId: 'getFacets',
        parameters: [{ name: 'category_id', in: 'query', schema: { type: 'string' }, example: 'cmfcategory01', description: 'Optional category subtree scope.' }],
        responses: {
          200: { description: 'Facet counts and min/max statistics.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' }, example: success({ makes: [{ value: 'Toyota', count: 120 }], fuel_types: [{ value: 'diesel', count: 80 }], transmissions: [{ value: 'automatic', count: 100 }], conditions: [{ value: 'used', count: 115 }], stats: { min_price: 150000000, max_price: 900000000, min_year: 2018, max_year: 2026, min_mileage: 0, max_mileage: 120000 }, dynamic_attributes: {} }) } } }
        }
      }
    },
    '/filters/{categoryId}': {
      parameters: [{ $ref: '#/components/parameters/CategoryId' }],
      get: {
        tags: ['Filters'], summary: 'Get searchable filters for a category', operationId: 'getCategoryFilters',
        responses: {
          200: { description: 'Inherited and local filter definitions.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' }, example: success([{ id: 'cmfattribute01', category_id: 'cmfcategory01', defined_in_category: 'SUV', inheritance_depth: 0, key: 'drive_type', label: 'Drive Type', attr_type: 'enum', unit: null, min_value: null, max_value: null, is_required: false, is_searchable: true, sort_order: 1, options: [{ id: 'cmfoption01', label: '4WD', value: '4WD', sort_order: 1 }] }]) } } }
        }
      }
    }
  },
  components: {
    parameters: {
      CategoryId: { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'cmfcategory01' },
      ListingId: { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'cmflisting01' }
    },
    responses: {
      BadRequest: { description: 'Request validation failed.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' }, example: error('year: Too small: expected number to be >=1900') } } },
      NotFound: { description: 'Resource was not found.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' }, example: error() } } }
    },
    schemas: {
      Envelope: {
        type: 'object', required: ['success', 'message', 'metadata', 'data'],
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'success' },
          metadata: { type: 'object', additionalProperties: true, example: {} },
          data: { nullable: true, description: 'Endpoint-specific response data.' }
        }
      },
      CategoryCreateRequest: {
        type: 'object', required: ['name', 'slug'], properties: {
          name: { type: 'string', example: 'SUV' }, slug: { type: 'string', example: 'suv' },
          parent_id: { type: 'string', nullable: true, example: 'cmfroot01' },
          icon_url: { type: 'string', format: 'uri', nullable: true }, sort_order: { type: 'integer', minimum: 0, default: 0 }
        }
      },
      CategoryUpdateRequest: {
        type: 'object', properties: {
          name: { type: 'string' }, slug: { type: 'string' }, icon_url: { type: 'string', format: 'uri', nullable: true },
          sort_order: { type: 'integer', minimum: 0 }, is_active: { type: 'boolean' }
        }, minProperties: 1
      },
      ListingImage: {
        type: 'object', required: ['url'], properties: {
          id: { type: 'string', readOnly: true }, url: { type: 'string', format: 'uri' },
          sort_order: { type: 'integer', default: 0 }, alt_text: { type: 'string', nullable: true }
        }
      },
      ListingAttribute: {
        type: 'object', required: ['attribute_id'], properties: {
          attribute_id: { type: 'string' }, value_enum: { type: 'string', nullable: true },
          value_min: { type: 'number', nullable: true }, value_max: { type: 'number', nullable: true },
          value_boolean: { type: 'boolean', nullable: true }
        }
      },
      ListingCreateRequest: {
        type: 'object', required: ['category_id', 'make', 'model', 'year', 'condition', 'transmission', 'fuel_type', 'color', 'price', 'province', 'city', 'title'],
        properties: listingProperties
      },
      ListingUpdateRequest: { type: 'object', description: 'All listing fields are optional for PATCH.', properties: listingProperties, minProperties: 1 }
    }
  }
}

module.exports = swaggerDocument