'use strict'

require('dotenv').config()
const { Pool } = require('pg')
const cuid = require('cuid')

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
})

const TARGET_COUNT = parseInt(process.argv[2]) || 1000
const BATCH_SIZE = 500

// Master data for vehicle generation
const VEHICLE_CATALOG = [
  // 7-Seater SUV
  {
    category_id: 'cat_7seater_suv',
    make: 'Toyota',
    model: 'Fortuner',
    variants: ['2.4 G MT', '2.4 VRZ AT', '2.8 VRZ GR Sport', '2.8 GR Sport 4x4'],
    fuel_type: 'diesel',
    transmission: ['manual', 'automatic'],
    engine_cc: [2393, 2755],
    seat_count: 7,
    price_range: [450000000, 750000000],
    drive_type: ['4x2', '4x4'],
    ground_clearance: [220, 225],
    sunroof_prob: 0.6,
    leather_prob: 0.9,
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2'
    ]
  },
  {
    category_id: 'cat_7seater_suv',
    make: 'Mitsubishi',
    model: 'Pajero Sport',
    variants: ['GLX 4x4 MT', 'Exceed AT', 'Dakar 4x2 AT', 'Dakar Ultimate 4x4'],
    fuel_type: 'diesel',
    transmission: ['manual', 'automatic'],
    engine_cc: [2442, 2477],
    seat_count: 7,
    price_range: [420000000, 740000000],
    drive_type: ['4x2', '4x4'],
    ground_clearance: [218, 220],
    sunroof_prob: 0.7,
    leather_prob: 0.85,
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70'
    ]
  },
  {
    category_id: 'cat_7seater_suv',
    make: 'Hyundai',
    model: 'Santa Fe',
    variants: ['Prime Gas 2.5', 'Signature Gas 2.5', 'Signature CRDi 2.2 Turbo Diesel', 'Calligraphy Hybrid'],
    fuel_type: 'diesel',
    transmission: ['automatic', 'dct'],
    engine_cc: [2151, 2497],
    seat_count: 7,
    price_range: [500000000, 850000000],
    drive_type: ['4x2', 'AWD'],
    ground_clearance: [185, 205],
    sunroof_prob: 0.9,
    leather_prob: 0.95,
    images: [
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d'
    ]
  },
  {
    category_id: 'cat_7seater_suv',
    make: 'Toyota',
    model: 'Rush',
    variants: ['1.5 G MT', '1.5 G AT', '1.5 S GR Sport MT', '1.5 S GR Sport AT'],
    fuel_type: 'petrol',
    transmission: ['manual', 'automatic'],
    engine_cc: [1496],
    seat_count: 7,
    price_range: [200000000, 310000000],
    drive_type: ['RWD'],
    ground_clearance: [220],
    sunroof_prob: 0.1,
    leather_prob: 0.3,
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935',
      'https://images.unsplash.com/photo-1542362567-b07e54358753'
    ]
  },
  {
    category_id: 'cat_7seater_suv',
    make: 'Honda',
    model: 'CR-V 7-Seater',
    variants: ['1.5L Turbo', '1.5L Turbo Prestige', '2.0L RS e:HEV'],
    fuel_type: 'petrol',
    transmission: ['cvt'],
    engine_cc: [1498, 1993],
    seat_count: 7,
    price_range: [480000000, 800000000],
    drive_type: ['FWD', 'AWD'],
    ground_clearance: [198, 208],
    sunroof_prob: 0.85,
    leather_prob: 0.95,
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2'
    ]
  },

  // Compact SUV
  {
    category_id: 'cat_compact_suv',
    make: 'Honda',
    model: 'HR-V',
    variants: ['1.5 S CVT', '1.5 E CVT', '1.5 SE CVT', '1.5 RS Turbo CVT'],
    fuel_type: 'petrol',
    transmission: ['cvt'],
    engine_cc: [1498],
    seat_count: 5,
    price_range: [310000000, 540000000],
    drive_type: ['FWD'],
    ground_clearance: [185, 196],
    sunroof_prob: 0.75,
    leather_prob: 0.7,
    images: [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738',
      'https://images.unsplash.com/photo-1553440569-bcc63803a83d'
    ]
  },
  {
    category_id: 'cat_compact_suv',
    make: 'Hyundai',
    model: 'Creta',
    variants: ['Active MT', 'Trend MT', 'Trend IVT', 'Style IVT', 'Prime IVT', 'Alpha Edition'],
    fuel_type: 'petrol',
    transmission: ['manual', 'cvt'],
    engine_cc: [1497],
    seat_count: 5,
    price_range: [260000000, 420000000],
    drive_type: ['FWD'],
    ground_clearance: [200],
    sunroof_prob: 0.65,
    leather_prob: 0.8,
    images: [
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888',
      'https://images.unsplash.com/photo-1508974239320-0a029497e820'
    ]
  },
  {
    category_id: 'cat_compact_suv',
    make: 'Toyota',
    model: 'Yaris Cross',
    variants: ['1.5 G MT', '1.5 G CVT', '1.5 S CVT TSS', '1.5 S HV CVT GR Sport'],
    fuel_type: 'petrol',
    transmission: ['manual', 'cvt'],
    engine_cc: [1496],
    seat_count: 5,
    price_range: [280000000, 450000000],
    drive_type: ['FWD'],
    ground_clearance: [210],
    sunroof_prob: 0.7,
    leather_prob: 0.75,
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d'
    ]
  },
  {
    category_id: 'cat_compact_suv',
    make: 'Mazda',
    model: 'CX-3',
    variants: ['1.5L Sport', '2.0L Pro'],
    fuel_type: 'petrol',
    transmission: ['automatic'],
    engine_cc: [1496, 1998],
    seat_count: 5,
    price_range: [320000000, 490000000],
    drive_type: ['FWD'],
    ground_clearance: [160, 165],
    sunroof_prob: 0.6,
    leather_prob: 0.9,
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70'
    ]
  },

  // Sedan
  {
    category_id: 'cat_sedan',
    make: 'Honda',
    model: 'Civic',
    variants: ['1.5L Turbo', '1.5L RS Turbo', 'Type R 2.0 MT'],
    fuel_type: 'petrol',
    transmission: ['cvt', 'manual'],
    engine_cc: [1498, 1996],
    seat_count: 5,
    price_range: [420000000, 750000000],
    sunroof_prob: 0.8,
    leather_prob: 0.95,
    images: [
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf'
    ]
  },
  {
    category_id: 'cat_sedan',
    make: 'Toyota',
    model: 'Camry',
    variants: ['2.5 V AT', '2.5 G AT', '2.5 Hybrid AT'],
    fuel_type: 'petrol',
    transmission: ['automatic', 'cvt'],
    engine_cc: [2487, 2494],
    seat_count: 5,
    price_range: [550000000, 930000000],
    sunroof_prob: 0.95,
    leather_prob: 1.0,
    images: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341'
    ]
  },
  {
    category_id: 'cat_sedan',
    make: 'BMW',
    model: '320i',
    variants: ['Sport', 'M Sport', 'Dynamic Edition'],
    fuel_type: 'petrol',
    transmission: ['automatic'],
    engine_cc: [1998],
    seat_count: 5,
    price_range: [600000000, 1150000000],
    sunroof_prob: 0.9,
    leather_prob: 1.0,
    images: [
      'https://images.unsplash.com/photo-1555353540-64580b51c258',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537'
    ]
  },
  {
    category_id: 'cat_sedan',
    make: 'Mercedes-Benz',
    model: 'C200',
    variants: ['Avantgarde Line', 'AMG Line', 'Exclusive'],
    fuel_type: 'petrol',
    transmission: ['automatic'],
    engine_cc: [1496, 1991],
    seat_count: 5,
    price_range: [700000000, 1300000000],
    sunroof_prob: 1.0,
    leather_prob: 1.0,
    images: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8',
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738'
    ]
  },

  // EV / Hybrid
  {
    category_id: 'cat_ev_hybrid',
    make: 'Hyundai',
    model: 'Ioniq 5',
    variants: ['Prime Standard Range', 'Prime Long Range', 'Signature Standard Range', 'Signature Long Range', 'Batik Edition'],
    fuel_type: 'electric',
    transmission: ['automatic'],
    engine_cc: null,
    seat_count: 5,
    price_range: [620000000, 890000000],
    battery_capacity: [58, 72.6, 77.4],
    electric_range: [384, 481, 517],
    sunroof_prob: 0.85,
    leather_prob: 0.95,
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888'
    ]
  },
  {
    category_id: 'cat_ev_hybrid',
    make: 'BYD',
    model: 'Seal',
    variants: ['Dynamic RWD', 'Premium Extended RWD', 'Performance AWD'],
    fuel_type: 'electric',
    transmission: ['automatic'],
    engine_cc: null,
    seat_count: 5,
    price_range: [580000000, 750000000],
    battery_capacity: [61.4, 82.5],
    electric_range: [510, 580, 650],
    sunroof_prob: 1.0,
    leather_prob: 1.0,
    images: [
      'https://images.unsplash.com/photo-1508974239320-0a029497e820',
      'https://images.unsplash.com/photo-1542362567-b07e54358753'
    ]
  },
  {
    category_id: 'cat_ev_hybrid',
    make: 'Wuling',
    model: 'Air EV',
    variants: ['Lite 200km', 'Standard Range 200km', 'Long Range 300km'],
    fuel_type: 'electric',
    transmission: ['automatic'],
    engine_cc: null,
    seat_count: 4,
    price_range: [160000000, 275000000],
    battery_capacity: [17.3, 26.7],
    electric_range: [200, 300],
    sunroof_prob: 0.0,
    leather_prob: 0.3,
    images: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70'
    ]
  },
  {
    category_id: 'cat_ev_hybrid',
    make: 'Toyota',
    model: 'Kijang Innova Zenix Hybrid',
    variants: ['2.0 G HV CVT', '2.0 V HV CVT', '2.0 Q HV CVT TSS Modellista'],
    fuel_type: 'hybrid',
    transmission: ['cvt'],
    engine_cc: [1987],
    seat_count: 7,
    price_range: [430000000, 640000000],
    battery_capacity: [1.3],
    electric_range: [30],
    sunroof_prob: 0.7,
    leather_prob: 0.8,
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341'
    ]
  },

  // Scooter Motorcycles
  {
    category_id: 'cat_scooter',
    make: 'Honda',
    model: 'Vario 160',
    variants: ['CBS', 'ABS', 'Repsol Edition'],
    fuel_type: 'petrol',
    transmission: ['cvt', 'automatic'],
    engine_cc: [157],
    seat_count: 2,
    price_range: [22000000, 31000000],
    cooling_system: 'liquid',
    images: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87'
    ]
  },
  {
    category_id: 'cat_scooter',
    make: 'Yamaha',
    model: 'NMAX 155',
    variants: ['Standard', 'Connected', 'Connected/ABS', 'Turbo Tech Max'],
    fuel_type: 'petrol',
    transmission: ['cvt', 'automatic'],
    engine_cc: [155],
    seat_count: 2,
    price_range: [25000000, 44000000],
    cooling_system: 'liquid',
    images: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87'
    ]
  },
  {
    category_id: 'cat_scooter',
    make: 'Vespa',
    model: 'Primavera 150',
    variants: ['i-Get ABS', 'S i-Get ABS', 'Color Vibe Edition', 'Pic Nic Edition'],
    fuel_type: 'petrol',
    transmission: ['cvt', 'automatic'],
    engine_cc: [155],
    seat_count: 2,
    price_range: [42000000, 62000000],
    cooling_system: 'air',
    images: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87'
    ]
  },

  // Sport Bike Motorcycles
  {
    category_id: 'cat_sport_bike',
    make: 'Kawasaki',
    model: 'Ninja 250',
    variants: ['Standard', 'ABS SE', 'KRT Edition'],
    fuel_type: 'petrol',
    transmission: ['manual'],
    engine_cc: [249],
    seat_count: 2,
    price_range: [50000000, 82000000],
    cooling_system: 'liquid',
    images: [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc'
    ]
  },
  {
    category_id: 'cat_sport_bike',
    make: 'Honda',
    model: 'CBR250RR',
    variants: ['STD', 'SP Quick Shifter', 'SP QS Garuda X Samurai'],
    fuel_type: 'petrol',
    transmission: ['manual'],
    engine_cc: [250],
    seat_count: 2,
    price_range: [55000000, 85000000],
    cooling_system: 'liquid',
    images: [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc'
    ]
  },

  // Pickup Truck Commercial
  {
    category_id: 'cat_pickup',
    make: 'Toyota',
    model: 'Hilux',
    variants: ['Single Cabin 2.0 MT', 'Single Cabin 2.4 DSL 4x4 MT', 'Double Cabin 2.4 V AT 4x4', 'GR Sport 4x4 AT'],
    fuel_type: 'diesel',
    transmission: ['manual', 'automatic'],
    engine_cc: [2393, 2755],
    seat_count: 5,
    price_range: [260000000, 780000000],
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341'
    ]
  },
  {
    category_id: 'cat_pickup',
    make: 'Mitsubishi',
    model: 'Triton',
    variants: ['GLX Single Cabin 4x2 MT', 'HDX Double Cabin 4x4 MT', 'Exceed 4x4 MT', 'Ultimate 4x4 AT'],
    fuel_type: 'diesel',
    transmission: ['manual', 'automatic'],
    engine_cc: [2442, 2477],
    seat_count: 5,
    price_range: [250000000, 720000000],
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341'
    ]
  }
]

const LOCATIONS = [
  { province: 'DKI Jakarta', city: 'Jakarta Selatan', district: 'Kebayoran Baru', lat: -6.2443, lng: 106.8005 },
  { province: 'DKI Jakarta', city: 'Jakarta Selatan', district: 'Cilandak', lat: -6.2921, lng: 106.7972 },
  { province: 'DKI Jakarta', city: 'Jakarta Barat', district: 'Kebon Jeruk', lat: -6.1895, lng: 106.7699 },
  { province: 'DKI Jakarta', city: 'Jakarta Barat', district: 'Puri Indah', lat: -6.1873, lng: 106.7381 },
  { province: 'DKI Jakarta', city: 'Jakarta Pusat', district: 'Menteng', lat: -6.1952, lng: 106.8329 },
  { province: 'DKI Jakarta', city: 'Jakarta Utara', district: 'Kelapa Gading', lat: -6.1585, lng: 106.9098 },
  { province: 'DKI Jakarta', city: 'Jakarta Timur', district: 'Rawamangun', lat: -6.1947, lng: 106.8839 },
  { province: 'Jawa Barat', city: 'Bandung', district: 'Coblong', lat: -6.8893, lng: 107.6186 },
  { province: 'Jawa Barat', city: 'Bandung', district: 'Buahbatu', lat: -6.9534, lng: 107.6433 },
  { province: 'Jawa Barat', city: 'Bekasi', district: 'Bekasi Barat', lat: -6.2415, lng: 106.9924 },
  { province: 'Jawa Barat', city: 'Bogor', district: 'Bogor Selatan', lat: -6.6212, lng: 106.8118 },
  { province: 'Jawa Barat', city: 'Depok', district: 'Margonda', lat: -6.3728, lng: 106.8317 },
  { province: 'Banten', city: 'Tangerang Selatan', district: 'Serpong BSD', lat: -6.3015, lng: 106.6527 },
  { province: 'Banten', city: 'Tangerang', district: 'Karawaci', lat: -6.2163, lng: 106.6179 },
  { province: 'Jawa Timur', city: 'Surabaya', district: 'Gubeng', lat: -7.2754, lng: 112.7565 },
  { province: 'Jawa Timur', city: 'Surabaya', district: 'Wiyung', lat: -7.3112, lng: 112.6934 },
  { province: 'Jawa Timur', city: 'Malang', district: 'Klojen', lat: -7.9785, lng: 112.6318 },
  { province: 'Jawa Tengah', city: 'Semarang', district: 'Semarang Barat', lat: -6.9839, lng: 110.3842 },
  { province: 'DI Yogyakarta', city: 'Yogyakarta', district: 'Depok Sleman', lat: -7.7692, lng: 110.4079 },
  { province: 'Bali', city: 'Denpasar', district: 'Denpasar Selatan', lat: -8.6948, lng: 115.2281 },
  { province: 'Sumatera Utara', city: 'Medan', district: 'Medan Petisah', lat: 3.5852, lng: 98.6653 }
]

const COLORS = [
  'Hitam', 'Hitam Metalik', 'Putih', 'Putih Mutiara', 'Abu-Abu Metalik',
  'Silver', 'Merah Candy', 'Biru Tua Metalik', 'Coklat Metalik', 'Kuning Mustard'
]

const TITLES_PREFIX = [
  'Kondisi Sangat Istimewa', 'Tangan Pertama Dari Baru', 'Low KM Pajak Panjang',
  'Siap Pakai Full Original', 'Service Record Resmi Rutin', 'Unit Mulus Terawat',
  'Garansi Bebas Banjir & Tabrak', 'Like New Pajak Hidup', 'Koleksi Pribadi'
]

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomNumber(min, max, decimals = 1) {
  const val = Math.random() * (max - min) + min
  return parseFloat(val.toFixed(decimals))
}

function buildListing(index) {
  const template = getRandomItem(VEHICLE_CATALOG)
  const loc = getRandomItem(LOCATIONS)
  const variant = getRandomItem(template.variants)
  const year = getRandomInt(2016, 2025)
  const isNew = year === 2025 && Math.random() < 0.25
  const condition = isNew ? 'new' : 'used'
  const mileage = isNew ? getRandomInt(10, 200) : (2025 - year) * getRandomInt(8000, 18000)
  const color = getRandomItem(COLORS)
  const transmission = Array.isArray(template.transmission) ? getRandomItem(template.transmission) : template.transmission
  const fuelType = template.fuel_type
  const engineCc = template.engine_cc ? getRandomItem(template.engine_cc) : null
  const seatCount = template.seat_count || null
  
  // Price calculation based on year depreciation
  const basePrice = getRandomInt(template.price_range[0], template.price_range[1])
  const ageFactor = 1 - (2025 - year) * 0.05
  const rawPrice = Math.round(basePrice * Math.max(0.45, ageFactor) / 1000000) * 1000000
  const price = Math.max(15000000, rawPrice)
  const isNegotiable = Math.random() < 0.75

  const prefix = getRandomItem(TITLES_PREFIX)
  const title = `${template.make} ${template.model} ${variant} ${year} ${color} - ${prefix}`
  const description = `${template.make} ${template.model} ${variant} tahun ${year}. Kondisi ${condition === 'new' ? 'Gress Baru 100%' : 'sangat terawat pemakaian apik'}. Odometer ${mileage.toLocaleString('id-ID')} km, transmisi ${transmission.toUpperCase()}, bahan bakar ${fuelType}. Dokumen lengkap (STNK, BPKB, Faktur) pajak aktif. Lokasi ${loc.city}, ${loc.province}. Nego tipis di tempat.`

  const listingId = `list_${cuid()}`
  const viewsCount = getRandomInt(10, 3500)

  // Listing record
  const listingRecord = {
    id: listingId,
    category_id: template.category_id,
    make: template.make,
    model: template.model,
    variant: variant,
    year: year,
    mileage: mileage,
    condition: condition,
    transmission: transmission,
    fuel_type: fuelType,
    color: color,
    engine_cc: engineCc,
    seat_count: seatCount,
    price: price,
    is_negotiable: isNegotiable,
    province: loc.province,
    city: loc.city,
    district: loc.district,
    latitude: loc.lat + getRandomNumber(-0.02, 0.02, 4),
    longitude: loc.lng + getRandomNumber(-0.02, 0.02, 4),
    title: title,
    description: description,
    status: 'available',
    views_count: viewsCount
  }

  // Image records
  const imageRecords = template.images.map((imgUrl, idx) => ({
    id: `img_${cuid()}`,
    listing_id: listingId,
    url: imgUrl,
    sort_order: idx,
    alt_text: `${template.make} ${template.model} ${idx === 0 ? 'Front View' : 'Side View'}`
  }))

  // Dynamic attribute records
  const attributeRecords = []

  // 1. Seat Capacity (for cars)
  if (seatCount && template.category_id.startsWith('cat_')) {
    attributeRecords.push({
      id: `lav_${cuid()}`,
      listing_id: listingId,
      attribute_id: 'attr_seat_capacity',
      value_min: seatCount,
      value_max: seatCount
    })
  }

  // 2. Sunroof
  if (template.sunroof_prob !== undefined) {
    attributeRecords.push({
      id: `lav_${cuid()}`,
      listing_id: listingId,
      attribute_id: 'attr_has_sunroof',
      value_boolean: Math.random() < template.sunroof_prob
    })
  }

  // 3. Leather Seats
  if (template.leather_prob !== undefined) {
    attributeRecords.push({
      id: `lav_${cuid()}`,
      listing_id: listingId,
      attribute_id: 'attr_has_leather_seats',
      value_boolean: Math.random() < template.leather_prob
    })
  }

  // 4. Drive Type & Ground Clearance (for SUVs)
  if (template.drive_type) {
    attributeRecords.push({
      id: `lav_${cuid()}`,
      listing_id: listingId,
      attribute_id: 'attr_drive_type',
      value_enum: getRandomItem(template.drive_type)
    })
  }
  if (template.ground_clearance) {
    const gc = getRandomItem(template.ground_clearance)
    attributeRecords.push({
      id: `lav_${cuid()}`,
      listing_id: listingId,
      attribute_id: 'attr_ground_clearance',
      value_min: gc,
      value_max: gc
    })
  }

  // 5. Battery Capacity & Range (for EV / Hybrid)
  if (template.battery_capacity) {
    const cap = getRandomItem(template.battery_capacity)
    attributeRecords.push({
      id: `lav_${cuid()}`,
      listing_id: listingId,
      attribute_id: 'attr_battery_capacity',
      value_min: cap,
      value_max: cap
    })
  }
  if (template.electric_range) {
    const rng = getRandomItem(template.electric_range)
    attributeRecords.push({
      id: `lav_${cuid()}`,
      listing_id: listingId,
      attribute_id: 'attr_electric_range',
      value_min: rng,
      value_max: rng
    })
  }

  // 6. Cooling system (for Motorcycles)
  if (template.cooling_system) {
    attributeRecords.push({
      id: `lav_${cuid()}`,
      listing_id: listingId,
      attribute_id: 'attr_cooling_system',
      value_enum: template.cooling_system
    })
  }

  return { listingRecord, imageRecords, attributeRecords }
}

async function runSeed() {
  const startTime = Date.now()
  console.log(`=======================================================`)
  console.log(`🚀 AUTOMOTIVE MARKETPLACE — BULK LISTING SEEDER`)
  console.log(`🎯 Target: Generating ${TARGET_COUNT.toLocaleString()} listings...`)
  console.log(`=======================================================`)

  const client = await pool.connect()

  try {
    // 1. Ensure Categories exist
    const catCheck = await client.query('SELECT COUNT(*)::INT as count FROM categories')
    if (catCheck.rows[0].count === 0) {
      console.log('⚠️ No categories found. Please run migrations/seeders first: npm run seed')
    }

    let insertedListings = 0
    let insertedImages = 0
    let insertedAttributes = 0

    // Process in batches
    const totalBatches = Math.ceil(TARGET_COUNT / BATCH_SIZE)

    for (let b = 0; b < totalBatches; b++) {
      const currentBatchSize = Math.min(BATCH_SIZE, TARGET_COUNT - insertedListings)
      const listingsBatch = []
      const imagesBatch = []
      const attrsBatch = []

      for (let i = 0; i < currentBatchSize; i++) {
        const { listingRecord, imageRecords, attributeRecords } = buildListing(insertedListings + i + 1)
        listingsBatch.push(listingRecord)
        imagesBatch.push(...imageRecords)
        attrsBatch.push(...attributeRecords)
      }

      await client.query('BEGIN')

      // Bulk insert listings
      if (listingsBatch.length > 0) {
        const listingValues = []
        const valuePlaceholders = []
        let paramIdx = 1

        for (const l of listingsBatch) {
          valuePlaceholders.push(`(
            $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++},
            $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++},
            $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++},
            $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++},
            $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, NOW(), NOW()
          )`)

          listingValues.push(
            l.id, l.category_id, l.make, l.model, l.variant,
            l.year, l.mileage, l.condition, l.transmission, l.fuel_type,
            l.color, l.engine_cc, l.seat_count, l.price, l.is_negotiable,
            l.province, l.city, l.district, l.latitude, l.longitude,
            l.title, l.description, l.status, l.views_count
          )
        }

        const insertListingSql = `
          INSERT INTO listings (
            id, category_id, make, model, variant,
            year, mileage, condition, transmission, fuel_type,
            color, engine_cc, seat_count, price, is_negotiable,
            province, city, district, latitude, longitude,
            title, description, status, views_count, created_at, updated_at
          ) VALUES ${valuePlaceholders.join(', ')}
        `
        await client.query(insertListingSql, listingValues)
      }

      // Bulk insert images
      if (imagesBatch.length > 0) {
        const imgValues = []
        const imgPlaceholders = []
        let imgParamIdx = 1

        for (const img of imagesBatch) {
          imgPlaceholders.push(`($${imgParamIdx++}, $${imgParamIdx++}, $${imgParamIdx++}, $${imgParamIdx++}, $${imgParamIdx++}, NOW(), NOW())`)
          imgValues.push(img.id, img.listing_id, img.url, img.sort_order, img.alt_text)
        }

        const insertImagesSql = `
          INSERT INTO listing_images (
            id, listing_id, url, sort_order, alt_text, created_at, updated_at
          ) VALUES ${imgPlaceholders.join(', ')}
        `
        await client.query(insertImagesSql, imgValues)
      }

      // Bulk insert attributes
      if (attrsBatch.length > 0) {
        const attrValues = []
        const attrPlaceholders = []
        let attrParamIdx = 1

        for (const attr of attrsBatch) {
          attrPlaceholders.push(`(
            $${attrParamIdx++}, $${attrParamIdx++}, $${attrParamIdx++},
            $${attrParamIdx++}, $${attrParamIdx++}, $${attrParamIdx++}, $${attrParamIdx++},
            NOW(), NOW()
          )`)
          attrValues.push(
            attr.id, attr.listing_id, attr.attribute_id,
            attr.value_enum || null,
            attr.value_min !== undefined ? attr.value_min : null,
            attr.value_max !== undefined ? attr.value_max : null,
            attr.value_boolean !== undefined ? attr.value_boolean : null
          )
        }

        const insertAttrsSql = `
          INSERT INTO listing_attribute_values (
            id, listing_id, attribute_id,
            value_enum, value_min, value_max, value_boolean,
            created_at, updated_at
          ) VALUES ${attrPlaceholders.join(', ')}
          ON CONFLICT (listing_id, attribute_id) DO NOTHING
        `
        await client.query(insertAttrsSql, attrValues)
      }

      await client.query('COMMIT')

      insertedListings += currentBatchSize
      insertedImages += imagesBatch.length
      insertedAttributes += attrsBatch.length

      const percent = Math.round((insertedListings / TARGET_COUNT) * 100)
      console.log(`⏳ [${percent}%] Seeded ${insertedListings.toLocaleString()}/${TARGET_COUNT.toLocaleString()} listings... (Batch ${b + 1}/${totalBatches})`)
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\n=======================================================`)
    console.log(`✅ SEEDING COMPLETE in ${elapsed}s!`)
    console.log(`📊 Summary:`)
    console.log(`   - Listings Created:         ${insertedListings.toLocaleString()}`)
    console.log(`   - Images Created:           ${insertedImages.toLocaleString()}`)
    console.log(`   - Attribute Values Created: ${insertedAttributes.toLocaleString()}`)
    console.log(`=======================================================`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Seeding failed:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runSeed()
