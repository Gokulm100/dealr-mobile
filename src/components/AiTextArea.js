// src/components/AiTextArea.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { apiFetch } from '../utils/api';
import Icon from './Icon';

const FIELD_MAP = {
  Electronics: {
    DEFAULT: ['brand', 'model', 'condition', 'warranty', 'accessories', 'bill', 'age', 'price'],
    Mobiles: ['brand', 'model', 'storage', 'battery', 'condition', 'warranty', 'accessories', 'color', 'sim', 'bill'],
    Mobile: ['brand', 'model', 'storage', 'battery', 'condition', 'warranty', 'accessories', 'color', 'sim', 'bill'],
    Tv: ['brand', 'size', 'type', 'screen', 'condition', 'warranty', 'accessories', 'age'],
    'Washing Machine': ['brand', 'type', 'capacity', 'condition', 'warranty', 'accessories', 'age'],
    Laptop: ['brand', 'model', 'processor', 'ram', 'storage', 'battery', 'screen', 'condition', 'warranty', 'accessories'],
    Laptops: ['brand', 'model', 'processor', 'ram', 'storage', 'battery', 'screen', 'condition', 'warranty', 'accessories'],
    Refrigerator: ['brand', 'capacity', 'type', 'condition', 'warranty', 'age'],
    'Air Conditioner': ['brand', 'capacity', 'type', 'condition', 'warranty', 'age'],
    Camera: ['brand', 'model', 'condition', 'accessories', 'warranty', 'age'],
    Tablet: ['brand', 'model', 'storage', 'battery', 'condition', 'warranty', 'accessories'],
    Headphones: ['brand', 'type', 'condition', 'warranty', 'accessories', 'color'],
  },
  'Real Estate': {
    DEFAULT: ['location', 'bedrooms', 'bathrooms', 'area', 'furnishing', 'floor', 'parking', 'amenities', 'price', 'availability'],
    'House For Rent': ['location', 'bedrooms', 'bathrooms', 'area', 'furnishing', 'floor', 'parking', 'amenities', 'rent', 'deposit', 'availability'],
    'House For Sale': ['location', 'bedrooms', 'bathrooms', 'area', 'furnishing', 'floor', 'parking', 'amenities', 'price', 'owner', 'availability'],
    'Plot For Rent': ['location', 'area', 'amenities', 'rent', 'deposit', 'availability'],
    'Plot For Sale': ['location', 'area', 'amenities', 'price', 'owner'],
    Apartment: ['location', 'bedrooms', 'bathrooms', 'area', 'furnishing', 'floor', 'parking', 'amenities', 'price', 'availability'],
    Villa: ['location', 'bedrooms', 'bathrooms', 'area', 'furnishing', 'parking', 'amenities', 'price', 'availability'],
    'Commercial Space': ['location', 'area', 'type', 'furnishing', 'parking', 'rent', 'price', 'availability'],
  },
  Vehicles: {
    DEFAULT: ['brand', 'model', 'year', 'mileage', 'fuel', 'condition', 'insurance', 'owner', 'price'],
    Cars: ['brand', 'model', 'year', 'mileage', 'fuel', 'transmission', 'owner', 'insurance', 'condition', 'color'],
    Bikes: ['brand', 'model', 'year', 'mileage', 'fuel', 'owner', 'insurance', 'condition', 'color'],
    Scooters: ['brand', 'model', 'year', 'mileage', 'fuel', 'owner', 'condition', 'color'],
    'Other Vehicles': ['type', 'brand', 'model', 'year', 'mileage', 'condition', 'price'],
    'Other Vechicles': ['type', 'brand', 'model', 'year', 'mileage', 'condition', 'price'],
  },
  Games: {
    DEFAULT: ['title', 'platform', 'edition', 'condition', 'accessories', 'price'],
    'Playstation Games': ['title', 'platform', 'edition', 'region', 'condition', 'accessories', 'price'],
    'Xbox Games': ['title', 'platform', 'edition', 'region', 'condition', 'accessories', 'price'],
    Controllers: ['type', 'brand', 'condition', 'accessories', 'color', 'warranty'],
    Controlers: ['type', 'brand', 'condition', 'accessories', 'color', 'warranty'],
    'Gaming Rig': ['cpu', 'gpu', 'ram', 'storage', 'condition', 'warranty', 'accessories'],
    Console: ['brand', 'model', 'storage', 'condition', 'accessories', 'warranty'],
  },
  Furniture: {
    DEFAULT: ['type', 'material', 'dimensions', 'condition', 'color', 'age', 'delivery', 'price'],
    Sofa: ['type', 'material', 'dimensions', 'condition', 'color', 'age', 'delivery', 'price'],
    Bed: ['type', 'material', 'dimensions', 'condition', 'age', 'delivery', 'price'],
    Table: ['type', 'material', 'dimensions', 'condition', 'age', 'delivery', 'price'],
    Chair: ['type', 'material', 'dimensions', 'condition', 'age', 'delivery', 'price'],
    Wardrobe: ['type', 'material', 'dimensions', 'condition', 'age', 'delivery', 'price'],
  },
  Fashion: {
    DEFAULT: ['brand', 'size', 'color', 'material', 'condition', 'fit', 'original', 'age', 'price'],
    Men: ['brand', 'size', 'color', 'material', 'condition', 'fit', 'original', 'age', 'price'],
    Women: ['brand', 'size', 'color', 'material', 'condition', 'fit', 'original', 'age', 'price'],
    Kids: ['brand', 'size', 'color', 'material', 'condition', 'fit', 'original', 'age', 'price'],
    Footwear: ['brand', 'size', 'color', 'material', 'condition', 'original', 'age', 'price'],
    Accessories: ['brand', 'type', 'color', 'material', 'condition', 'original', 'age', 'price'],
  },
  Jobs: {
    DEFAULT: ['title', 'location', 'salary', 'experience', 'jobType', 'education', 'skills', 'availability'],
  },
  Other: {
    DEFAULT: ['type', 'condition', 'price', 'location', 'age', 'delivery', 'availability'],
    Jobs: ['title', 'location', 'salary', 'experience', 'jobType', 'education', 'skills', 'availability'],
    Services: ['type', 'location', 'experience', 'skills', 'serviceArea', 'price', 'timing', 'availability'],
    'House Maids': ['experience', 'type', 'languages', 'duties', 'salary', 'timing', 'availability', 'location', 'references'],
    'Home Nurses': ['qualification', 'experience', 'shift', 'patientCare', 'location', 'salary', 'timing', 'availability', 'references'],
    Other: ['type', 'condition', 'price', 'location', 'age', 'delivery', 'availability'],
  },
};

const FIELD_DEFS = {
  brand: { label: 'Brand', color: '#2563eb' },
  model: { label: 'Model', color: '#059669' },
  storage: { label: 'Storage', color: '#64748b' },
  battery: { label: 'Battery', color: '#16a34a' },
  condition: { label: 'Condition', color: '#a21caf' },
  warranty: { label: 'Warranty', color: '#0ea5e9' },
  accessories: { label: 'Accessories', color: '#f59e42' },
  color: { label: 'Color', color: '#f43f5e' },
  size: { label: 'Size', color: '#0f766e' },
  type: { label: 'Type', color: '#2563eb' },
  capacity: { label: 'Capacity', color: '#7c3aed' },
  screen: { label: 'Screen', color: '#1d4ed8' },
  processor: { label: 'Processor', color: '#334155' },
  location: { label: 'Location', color: '#2563eb' },
  bedrooms: { label: 'Bedrooms', color: '#059669' },
  bathrooms: { label: 'Bathrooms', color: '#64748b' },
  area: { label: 'Area', color: '#a21caf' },
  furnishing: { label: 'Furnishing', color: '#0ea5e9' },
  rent: { label: 'Rent', color: '#f59e42' },
  price: { label: 'Price', color: '#1d4ed8' },
  year: { label: 'Year', color: '#64748b' },
  mileage: { label: 'Mileage', color: '#a21caf' },
  fuel: { label: 'Fuel Type', color: '#0ea5e9' },
  transmission: { label: 'Transmission', color: '#f59e42' },
  owner: { label: 'Ownership', color: '#7c2d12' },
  insurance: { label: 'Insurance', color: '#0369a1' },
  title: { label: 'Title', color: '#2563eb' },
  platform: { label: 'Platform', color: '#059669' },
  cpu: { label: 'CPU', color: '#2563eb' },
  gpu: { label: 'GPU', color: '#059669' },
  ram: { label: 'RAM', color: '#64748b' },
  material: { label: 'Material', color: '#78350f' },
  dimensions: { label: 'Dimensions', color: '#166534' },
  age: { label: 'Age', color: '#6b7280' },
  salary: { label: 'Salary', color: '#15803d' },
  experience: { label: 'Experience', color: '#6d28d9' },
  availability: { label: 'Availability', color: '#ea580c' },
  qualification: { label: 'Qualification', color: '#0d9488' },
  shift: { label: 'Shift', color: '#c2410c' },
  languages: { label: 'Languages', color: '#4338ca' },
  bill: { label: 'Bill', color: '#475569' },
  sim: { label: 'SIM Status', color: '#0891b2' },
  floor: { label: 'Floor', color: '#4f46e5' },
  parking: { label: 'Parking', color: '#0284c7' },
  amenities: { label: 'Amenities', color: '#059669' },
  deposit: { label: 'Deposit', color: '#b45309' },
  jobType: { label: 'Job Type', color: '#7c3aed' },
  education: { label: 'Education', color: '#2563eb' },
  skills: { label: 'Skills', color: '#db2777' },
  serviceArea: { label: 'Service Area', color: '#0d9488' },
  duties: { label: 'Duties', color: '#ca8a04' },
  patientCare: { label: 'Patient Care', color: '#e11d48' },
  fit: { label: 'Fit', color: '#6366f1' },
  original: { label: 'Authenticity', color: '#14b8a6' },
  edition: { label: 'Edition', color: '#8b5cf6' },
  region: { label: 'Region', color: '#f97316' },
  delivery: { label: 'Delivery', color: '#64748b' },
  timing: { label: 'Timing', color: '#c2410c' },
  references: { label: 'References', color: '#78716c' },
};

function getRequiredFieldDefs(category, subcategory) {
  const c = FIELD_MAP[category] ? category : 'Electronics';
  const catFields = FIELD_MAP[c] || {};
  const key = subcategory || 'DEFAULT';
  const fieldKeys = catFields[key] || catFields.DEFAULT || FIELD_MAP.Electronics.DEFAULT;
  return fieldKeys
    .filter((k) => FIELD_DEFS[k])
    .map((k) => ({ key: k, ...FIELD_DEFS[k] }));
}

// Brand keywords grouped by domain. Add new brands to the relevant group;
// they are all merged into a single matcher used by the `brand` field checker.
const BRAND_KEYWORDS = {
  mobiles: [
    'samsung', 'apple', 'iphone', 'xiaomi', 'redmi', 'poco', 'mi', 'oneplus', 'one plus',
    'vivo', 'oppo', 'realme', 'nokia', 'motorola', 'moto', 'google', 'pixel', 'sony',
    'asus', 'infinix', 'tecno', 'lava', 'micromax', 'honor', 'nothing', 'iqoo', 'lenovo',
    'htc', 'blackberry', 'gionee', 'coolpad', 'alcatel', 'huawei', 'zte', 'leeco', 'itel',
  ],
  computers: [
    'dell', 'hp', 'lenovo', 'asus', 'acer', 'apple', 'macbook', 'msi', 'microsoft',
    'surface', 'samsung', 'lg', 'gigabyte', 'razer', 'alienware', 'hcl', 'toshiba',
    'fujitsu', 'vaio', 'intel', 'amd', 'nvidia',
  ],
  tv: [
    'samsung', 'lg', 'sony', 'panasonic', 'tcl', 'mi', 'xiaomi', 'oneplus', 'vu', 'onida',
    'videocon', 'philips', 'hisense', 'toshiba', 'sansui', 'blaupunkt', 'kodak', 'thomson',
    'akai', 'intex', 'bpl', 'sanyo', 'lloyd', 'realme', 'motorola', 'nokia', 'acer',
  ],
  appliances: [
    'lg', 'samsung', 'whirlpool', 'ifb', 'bosch', 'haier', 'godrej', 'voltas', 'blue star',
    'daikin', 'hitachi', 'panasonic', 'sanyo', 'lloyd', 'carrier', 'mitsubishi', 'o general',
    'electrolux', 'kelvinator', 'videocon', 'onida', 'siemens', 'kenstar', 'crompton',
    'bajaj', 'havells', 'usha', 'orient', 'symphony', 'morphy richards', 'prestige', 'pigeon',
  ],
  camera: [
    'canon', 'nikon', 'sony', 'fujifilm', 'panasonic', 'olympus', 'gopro', 'dji', 'leica',
    'pentax', 'sigma', 'kodak', 'lumix', 'insta360',
  ],
  audio: [
    'sony', 'bose', 'jbl', 'boat', 'sennheiser', 'skullcandy', 'beats', 'marshall', 'noise',
    'boult', 'realme', 'oneplus', 'samsung', 'apple', 'airpods', 'jabra', 'soundcore',
    'philips', 'zebronics', 'portronics', 'ambrane',
  ],
  cars: [
    'maruti', 'suzuki', 'hyundai', 'tata', 'mahindra', 'toyota', 'honda', 'kia', 'ford',
    'renault', 'nissan', 'volkswagen', 'vw', 'skoda', 'mg', 'jeep', 'bmw', 'mercedes',
    'benz', 'audi', 'volvo', 'jaguar', 'datsun', 'fiat', 'chevrolet', 'isuzu', 'citroen',
    'lexus', 'land rover', 'porsche', 'mini', 'ssangyong', 'force', 'premier', 'ambassador',
    'mitsubishi', 'opel', 'tesla', 'byd',
  ],
  bikes: [
    'hero', 'honda', 'bajaj', 'tvs', 'yamaha', 'royal enfield', 'enfield', 'ktm', 'suzuki',
    'kawasaki', 'jawa', 'harley', 'harley davidson', 'triumph', 'ducati', 'aprilia', 'vespa',
    'ather', 'ola', 'revolt', 'benelli', 'hero electric', 'bgauss', 'okinawa', 'ampere',
    'tork', 'yezdi', 'husqvarna', 'kymco', 'mahindra', 'bmw', 'cfmoto',
  ],
  fashion: [
    'nike', 'adidas', 'puma', 'reebok', 'levis', "levi's", 'zara', 'h&m', 'gucci', 'prada',
    'woodland', 'bata', 'allen solly', 'peter england', 'van heusen', 'louis philippe',
    'raymond', 'fastrack', 'titan', 'fossil', 'tommy hilfiger', 'jack & jones', 'us polo',
    'wrangler', 'lee', 'biba', 'fabindia', 'max', 'lifestyle', 'gap', 'uniqlo',
    'calvin klein', 'armani', 'versace', 'ray-ban', 'rayban', 'crocs', 'sketchers', 'skechers',
  ],
  gaming: [
    'sony', 'playstation', 'microsoft', 'xbox', 'nintendo', 'steam', 'valve', 'logitech',
    'razer', 'rog', 'msi', 'dualshock', 'dualsense', 'redgear', 'cosmic byte',
  ],
};

const BRAND_REGEX = new RegExp(
  '\\b(' +
    [...new Set(Object.values(BRAND_KEYWORDS).flat())].join('|') +
    '|brand)\\b',
);

const FIELD_CHECKERS = {
  // Brands across phones, computers, TVs, appliances, cameras, audio, cars, bikes, fashion and gaming
  brand: t => BRAND_REGEX.test(t),
  // Known phone/car/bike model names, the word "model", or an alphanumeric model code (e.g. i20, xuv700)
  model: t => /\b(model|iphone|galaxy|pixel|note|pro|plus|ultra|edge|series|swift|baleno|dzire|wagonr|alto|celerio|brezza|ertiga|ciaz|creta|venue|verna|santro|aura|nexon|harrier|safari|tiago|tigor|punch|altroz|scorpio|thar|bolero|city|amaze|jazz|civic|wrv|seltos|sonet|carens|fortuner|innova|glanza|fronx|polo|vento|virtus|taigun|kushaq|slavia|rapid|kwid|triber|kiger|duster|magnite|splendor|passion|glamour|pulsar|platina|avenger|apache|jupiter|ntorq|raider|fascino|classic|bullet|hunter|meteor|himalayan|duke|access|activa|dio|shine|unicorn)\b|[a-z]{2,}\s?\d{2,}/.test(t),
  storage: t => /\b(\d+\s?(gb|tb)|storage|rom|internal memory)\b/.test(t),
  condition: t => /\b(brand new|like new|gently used|barely used|new|used|condition|mint|excellent|good|fair|scratch)\b/.test(t),
  warranty: t => /\b(warranty|guarantee|warrant)\b/.test(t),
  accessories: t => /\b(accessories|charger|adapter|box|earphones|headphones|case|cover|cable|original box|bill)\b/.test(t),
  size: t => /\b(\d+\s?(inch|inches|"|cm)|size)\b/.test(t),
  type: t => /\b(type|led|lcd|oled|qled|smart tv|front load|top load|semi automatic|fully automatic|controller|gaming rig|plumbing|plumber|electrician|cleaning|carpenter|painter|tutor|driver|cook|chef|repair|maintenance|live.?in|live.?out|part.?time|full.?time|maid|nurse|caregiver|babysitter|service)\b/.test(t),
  capacity: t => /\b(\d+\s?(kg|kgs|litre|liter|l)|capacity)\b/.test(t),
  location: t => /\b(location|city|area|address|near|locality|sector|colony|nagar|road|pincode|landmark)\b/.test(t),
  bedrooms: t => /\b(\d+\s?(bhk|bedroom|bedrooms|rk)|bedroom|bhk|room)\b/.test(t),
  bathrooms: t => /\b(bathroom|bathrooms|toilet|washroom|attached bath)\b/.test(t),
  area: t => /\b(\d+\s?(sqft|sq ft|square feet|sqyd|sq yards|acre|cent)|area|carpet|built up|plot)\b/.test(t),
  furnishing: t => /\b(furnishing|furnished|unfurnished|semi.?furnished|fully furnished)\b/.test(t),
  rent: t => /\b(rent|monthly|per month|deposit|advance)\b/.test(t),
  price: t => /\b(price|rs|inr|₹|rupees|lakh|lakhs|crore|cr|negotiable|fixed|amount|cost)\b|\d{4,}/.test(t),
  year: t => /\b((19|20)\d{2}|year|registration year)\b/.test(t),
  mileage: t => /\b(\d+\s?(km|kms|kilometers|kmpl|mileage)|odometer|driven)\b/.test(t),
  fuel: t => /\b(fuel|petrol|diesel|cng|lpg|electric|ev|hybrid)\b/.test(t),
  transmission: t => /\b(transmission|manual|automatic|amt|cvt|dct|gear)\b/.test(t),
  title: t => /\b(title|game|playstation|ps4|ps5|xbox|edition|job|role|position|vacancy|hiring|developer|manager|assistant|executive|staff|worker)\b/.test(t),
  platform: t => /\b(platform|console|ps4|ps5|xbox|pc|nintendo|switch)\b/.test(t),
  cpu: t => /\b(cpu|processor|i3|i5|i7|i9|ryzen|core|intel|amd)\b/.test(t),
  gpu: t => /\b(gpu|graphics|nvidia|amd|rtx|gtx|radeon|geforce)\b/.test(t),
  ram: t => /\b(\d+\s?gb\s?ram|ram|memory|ddr)\b/.test(t),
  color: t => /\b(colou?r|red|blue|green|black|white|yellow|pink|purple|orange|grey|gray|silver|gold|midnight|brown|maroon)\b/.test(t),
  battery: t => /\b(battery|mah|battery health|backup|hours)\b/.test(t),
  screen: t => /\b(screen|display|resolution|4k|hd|uhd|amoled|lcd|inch)\b/.test(t),
  processor: t => /\b(processor|chip|snapdragon|mediatek|dimensity|exynos|bionic|intel|amd|i3|i5|i7|i9|ryzen|m1|m2|m3)\b/.test(t),
  owner: t => /\b(owner|first owner|1st owner|second owner|2nd owner|single owner|third owner)\b/.test(t),
  insurance: t => /\b(insurance|comprehensive|third party|valid till|valid upto|expired)\b/.test(t),
  material: t => /\b(material|wood|wooden|metal|steel|plastic|leather|fabric|glass|marble)\b/.test(t),
  dimensions: t => /\b(dimension|dimensions|length|width|height|inch|cm|ft|feet)\b/.test(t),
  age: t => /\b(age|year old|years old|month old|months old|used for|bought)\b/.test(t),
  salary: t => /\b(salary|ctc|lpa|per annum|per month|package|stipend)\b/.test(t),
  experience: t => /\b(experience|fresher|years|yrs|yr)\b/.test(t),
  availability: t => /\b(available|immediate|possession|move in|vacant|ready to move|live.?in|live.?out|part.?time|full.?time|weekdays|weekends|flexible|joining|start date)\b/.test(t),
  qualification: t => /\b(qualification|qualified|certified|certificate|gnm|anm|bsc|diploma|degree|nursing|registered nurse|rn|caregiver|trained|licensed)\b/.test(t),
  shift: t => /\b(shift|day shift|night shift|morning|evening|24.?7|24x7|hourly|weekly|rotational|night duty|day duty)\b/.test(t),
  languages: t => /\b(language|languages|malayalam|hindi|english|tamil|kannada|telugu|bengali|marathi|speaks|fluent|bilingual)\b/.test(t),
  bill: t => /\b(bill|invoice|receipt|original bill|purchase bill|gst)\b/.test(t),
  sim: t => /\b(sim|dual sim|single sim|locked|unlocked|carrier|network)\b/.test(t),
  floor: t => /\b(floor|ground floor|top floor|basement|storey|story)\b/.test(t),
  parking: t => /\b(parking|car park|garage|covered parking|open parking|two wheeler)\b/.test(t),
  amenities: t => /\b(amenities|lift|elevator|gym|pool|swimming|security|power backup|water supply|club|garden|play area)\b/.test(t),
  deposit: t => /\b(deposit|security deposit|advance|refundable)\b/.test(t),
  jobType: t => /\b(full.?time|part.?time|contract|remote|work from home|wfh|hybrid|onsite|freelance|internship|permanent|temporary)\b/.test(t),
  education: t => /\b(education|degree|graduate|postgraduate|btech|mba|bca|mca|diploma|10th|12th|plus two|sslc)\b/.test(t),
  skills: t => /\b(skills|skill|proficient|expertise|knowledge|typing|computer|driving license|licence)\b/.test(t),
  serviceArea: t => /\b(service area|coverage|covers|within|radius|all over|nearby areas|home service|doorstep)\b/.test(t),
  duties: t => /\b(duties|responsibilities|cooking|cleaning|laundry|ironing|child care|baby care|elder care|housekeeping)\b/.test(t),
  patientCare: t => /\b(patient|elderly|bedridden|post.?surgery|dementia|diabetes|mobility|medication|injection|wound care)\b/.test(t),
  fit: t => /\b(fit|slim fit|regular fit|loose|oversized|relaxed)\b/.test(t),
  original: t => /\b(original|authentic|genuine|first copy|duplicate|tag attached|with tags)\b/.test(t),
  edition: t => /\b(edition|standard|deluxe|ultimate|collector|goty|game of the year|digital|physical)\b/.test(t),
  region: t => /\b(region|region.?free|pal|ntsc|indian version|us version|uk version)\b/.test(t),
  delivery: t => /\b(delivery|pickup|pick up|self pickup|courier|shipping|home delivery|free delivery)\b/.test(t),
  timing: t => /\b(timing|hours|working hours|morning|evening|daily|weekly schedule|8.?hours|per day)\b/.test(t),
  references: t => /\b(references|reference|verified|background check|previous employer|recommendation)\b/.test(t),
};

const FIELD_TEMPLATES = {
  brand: 'Brand: ',
  model: 'Model: ',
  storage: 'Storage: ',
  condition: 'Condition: ',
  warranty: 'Warranty: ',
  accessories: 'Accessories included: ',
  size: 'Size: ',
  type: 'Type: ',
  capacity: 'Capacity: ',
  location: 'Location: ',
  bedrooms: 'Bedrooms: ',
  bathrooms: 'Bathrooms: ',
  area: 'Area: ',
  furnishing: 'Furnishing: ',
  rent: 'Rent: ',
  price: 'Price: ',
  year: 'Year: ',
  mileage: 'Mileage: ',
  fuel: 'Fuel type: ',
  transmission: 'Transmission: ',
  title: 'Title: ',
  platform: 'Platform: ',
  cpu: 'CPU: ',
  gpu: 'GPU: ',
  ram: 'RAM: ',
  color: 'Color: ',
  battery: 'Battery health: ',
  screen: 'Screen details: ',
  processor: 'Processor: ',
  owner: 'Ownership: ',
  insurance: 'Insurance status: ',
  material: 'Material: ',
  dimensions: 'Dimensions: ',
  age: 'Age: ',
  salary: 'Salary: ',
  experience: 'Experience required: ',
  availability: 'Availability: ',
  qualification: 'Qualification: ',
  shift: 'Shift: ',
  languages: 'Languages: ',
  bill: 'Bill: ',
  sim: 'SIM status: ',
  floor: 'Floor: ',
  parking: 'Parking: ',
  amenities: 'Amenities: ',
  deposit: 'Deposit: ',
  jobType: 'Job type: ',
  education: 'Education: ',
  skills: 'Skills: ',
  serviceArea: 'Service area: ',
  duties: 'Duties: ',
  patientCare: 'Patient care: ',
  fit: 'Fit: ',
  original: 'Authenticity: ',
  edition: 'Edition: ',
  region: 'Region: ',
  delivery: 'Delivery: ',
  timing: 'Timing: ',
  references: 'References: ',
};

const FIELD_EXAMPLES = {
  brand: 'e.g. Samsung, Apple',
  model: 'e.g. iPhone 13, Galaxy S21',
  condition: 'e.g. Like new, no scratches',
  warranty: 'e.g. 6 months remaining',
  accessories: 'e.g. Box + charger included',
  storage: 'e.g. 128GB',
  size: 'e.g. 55 inches',
  year: 'e.g. 2021',
  mileage: 'e.g. 42,000 km',
  fuel: 'e.g. Petrol',
  transmission: 'e.g. Automatic',
  rent: 'e.g. Rs 15,000/month',
  price: 'e.g. Rs 45,000',
  battery: 'e.g. 88% battery health',
  screen: 'e.g. 6.5-inch AMOLED',
  processor: 'e.g. i5 12th Gen',
  owner: 'e.g. First owner',
  insurance: 'e.g. Valid till Jan 2027',
  material: 'e.g. Solid wood',
  dimensions: 'e.g. 6ft x 4ft',
  age: 'e.g. 1 year old',
  salary: 'e.g. 4.5 LPA',
  experience: 'e.g. 2+ years',
  availability: 'e.g. Immediate',
  qualification: 'e.g. GNM certified',
  shift: 'e.g. Day shift, 8am–6pm',
  languages: 'e.g. Malayalam, Hindi, English',
  bill: 'e.g. Original bill available',
  sim: 'e.g. Dual SIM, unlocked',
  floor: 'e.g. 3rd floor with lift',
  parking: 'e.g. Covered parking for 1 car',
  amenities: 'e.g. Lift, 24hr water, security',
  deposit: 'e.g. 2 months deposit',
  jobType: 'e.g. Full-time, on-site',
  education: 'e.g. Graduate, B.Com',
  skills: 'e.g. MS Office, driving',
  serviceArea: 'e.g. All of Kochi city',
  duties: 'e.g. Cooking, cleaning, laundry',
  patientCare: 'e.g. Elderly bedridden care',
  fit: 'e.g. Slim fit, size M',
  original: 'e.g. Original with tags',
  edition: 'e.g. Standard edition, physical copy',
  region: 'e.g. Region free / Indian version',
  delivery: 'e.g. Self pickup only',
  timing: 'e.g. 9am–6pm, weekdays',
  references: 'e.g. 2 verified references',
};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasLabelWithValue(text, fieldKey) {
  const template = FIELD_TEMPLATES[fieldKey];
  if (!template) return false;
  const label = template.trim().replace(/:$/, '');
  const re = new RegExp(`${escapeRegex(label)}\\s*:\\s*\\S`, 'i');
  return re.test(text);
}

function isFormFieldSatisfied(fieldKey, { price, location, adTitle }) {
  if (fieldKey === 'price') {
    const p = String(price || '').trim();
    return p.length > 0 && /\d/.test(p);
  }
  if (fieldKey === 'location') {
    return String(location || '').trim().length >= 2;
  }
  if (fieldKey === 'title') {
    return String(adTitle || '').trim().length >= 2;
  }
  return false;
}

function isFieldPresent(text, field, formContext = {}) {
  if (isFormFieldSatisfied(field.key, formContext)) return true;
  const lower = (text || '').toLowerCase();
  if (hasLabelWithValue(lower, field.key)) return true;
  return FIELD_CHECKERS[field.key]?.(lower) ?? false;
}

export default function AiTextArea({
  value,
  onChange,
  category,
  subcategory,
  onFocus,
  title,
  price,
  location,
  onInsightsChange,
}) {
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTypingTip, setShowTypingTip] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const typingIntervalRef = useRef(null);
  const tipDebounceRef = useRef(null);

  const requiredFields = getRequiredFieldDefs(category, subcategory);
  // Detect against the title + description together, since users often put
  // the brand/model/etc. in the title.
  const detectionText = [title, price, location, value].filter(Boolean).join(' ');
  const formContext = { price, location, adTitle: title };
  const completed = requiredFields.filter(f => isFieldPresent(detectionText, f, formContext));
  const missing = requiredFields.filter(f => !isFieldPresent(detectionText, f, formContext));
  const progress = requiredFields.length
    ? Math.round((completed.length / requiredFields.length) * 100)
    : 0;
  const nextMissing = missing[0];
  const activeTipField = missing[Math.min(tipIndex, Math.max(missing.length - 1, 0))];

  useEffect(() => () => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    if (tipDebounceRef.current) clearTimeout(tipDebounceRef.current);
  }, []);

  useEffect(() => {
    onInsightsChange?.({
      total: requiredFields.length,
      completed: completed.length,
      missing: missing.length,
      progress,
      nextMissingLabel: nextMissing?.label || '',
    });
  }, [requiredFields.length, completed.length, missing.length, progress, nextMissing?.label]);

  useEffect(() => {
    setTipIndex(0);
  }, [category, subcategory]);

  useEffect(() => {
    if (tipDebounceRef.current) clearTimeout(tipDebounceRef.current);
    if (!touched || missing.length === 0) {
      setShowTypingTip(false);
      return undefined;
    }
    setShowTypingTip(false);
    tipDebounceRef.current = setTimeout(() => setShowTypingTip(true), 650);
    return () => {
      if (tipDebounceRef.current) clearTimeout(tipDebounceRef.current);
    };
  }, [detectionText, touched, missing.length]);

  useEffect(() => {
    if (!showTypingTip || missing.length <= 1) return undefined;
    const rotate = setInterval(() => {
      setTipIndex(prev => (prev + 1) % missing.length);
    }, 3500);
    return () => clearInterval(rotate);
  }, [showTypingTip, missing.length]);

  const addTemplate = (field) => {
    const template = FIELD_TEMPLATES[field.key] || `${field.label}: `;
    const text = value || '';
    if (text.toLowerCase().includes(template.toLowerCase())) return;
    const next = text.trim() ? `${text.trim()}\n${template}` : template;
    setTouched(true);
    setShowTypingTip(false);
    onChange?.({ target: { value: next } });
  };

  const allComplete = requiredFields.length > 0 && missing.length === 0;

  const aiButtonLabel = (() => {
    if (loading) return '...';
    if (allComplete) return 'Refine with AI';
    return 'AI Write';
  })();

  const handleAiWrite = async () => {
    if (!title) {
      Alert.alert('Title Required', 'Please enter a title first so AI can generate a better description.');
      return;
    }

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/ads/generateDescriptionUsingAI', {
        method: 'POST',
        body: JSON.stringify({
          title,
          price: price || '',
          category: category || 'General',
          subCategory: subcategory || 'General',
          description: value || '',
          location: location || '',
        }),
      });

      if (res.success === true && res.data) {
        const fullText = res.data;
        let index = 0;
        typingIntervalRef.current = setInterval(() => {
          index++;
          onChange?.({ target: { value: fullText.slice(0, index) } });
          if (index >= fullText.length && typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
        }, 15);
      } else if (typeof res === 'string') {
        onChange?.({ target: { value: res } });
      } else if (res.data) {
        onChange?.({ target: { value: res.data } });
      }
    } catch {
      Alert.alert('AI Error', 'Failed to generate description. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Detail checklist</Text>
        <Text style={styles.headerCount}>{completed.length}/{requiredFields.length} added</Text>
      </View>

      {showTypingTip && activeTipField && (
        <View style={styles.suggestionCard}>
          <View style={styles.suggestionHead}>
            <Text style={styles.suggestionIcon}>💡</Text>
            <Text style={styles.suggestionLabel}>Suggestion</Text>
          </View>
          <Text style={styles.suggestionText}>
            Add <Text style={styles.suggestionStrong}>{activeTipField.label}</Text>
            {' '}{FIELD_EXAMPLES[activeTipField.key] || 'to improve listing quality'}.
          </Text>
        </View>
      )}

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, touched && missing.length > 0 && styles.inputWarn]}
          value={value}
          onChangeText={v => {
            setTouched(true);
            onChange?.({ target: { value: v } });
          }}
          onFocus={onFocus}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          placeholder={`Describe your ${subcategory || category || 'item'} in detail...`}
          placeholderTextColor={COLORS.textMuted}
        />

        <TouchableOpacity
          style={[styles.aiBtn, allComplete && !loading && styles.aiBtnRefine]}
          onPress={handleAiWrite}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={allComplete ? '#15803d' : COLORS.primary} />
          ) : (
            <>
              <Icon name="AI" size={14} color={allComplete ? '#15803d' : COLORS.primary} />
              <Text
                style={[styles.aiBtnText, allComplete && styles.aiBtnTextRefine]}
                numberOfLines={1}
              >
                {aiButtonLabel}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {touched && missing.length > 0 && (
        <View style={styles.hintRow}>
          <Text style={styles.hintIcon}>💡</Text>
          <Text style={styles.hintText}>
            Consider adding: {missing.map(f => f.label).join(', ')}
          </Text>
        </View>
      )}

      {!touched && nextMissing && (
        <Text style={styles.startTip}>
          Tip: Start with <Text style={styles.startTipStrong}>{nextMissing.label}</Text> for better visibility.
        </Text>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {requiredFields.map(f => {
          const done = isFieldPresent(detectionText, f, formContext);
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => addTemplate(f)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                done
                  ? { backgroundColor: f.color, borderColor: f.color }
                  : { backgroundColor: '#f3f4f6', borderColor: f.color },
              ]}
            >
              <Text style={[styles.chipText, done && { color: COLORS.white }]}>
                {f.label}{done ? ' ✓' : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress}%`,
              backgroundColor: progress === 100 ? COLORS.success : COLORS.accent,
            },
          ]}
        />
      </View>
      <Text style={styles.progressLabel}>
        {completed.length}/{requiredFields.length} fields mentioned
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    ...SHADOW.small,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  headerCount: { fontSize: 12, color: COLORS.textMuted },
  suggestionCard: {
    backgroundColor: '#fffef7',
    borderWidth: 1,
    borderColor: '#f8e7a3',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 8,
  },
  suggestionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  suggestionIcon: { fontSize: 13 },
  suggestionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c5a10',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  suggestionText: { fontSize: 12, color: '#3f3a22', lineHeight: 18 },
  suggestionStrong: { fontWeight: '700', color: '#3f3a22' },
  inputWrapper: { position: 'relative', marginBottom: 8 },
  aiBtn: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    zIndex: 10,
    maxWidth: '72%',
  },
  aiBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.primary, flexShrink: 1 },
  aiBtnRefine: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  aiBtnTextRefine: { color: '#15803d' },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 44,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 120,
    lineHeight: 22,
  },
  inputWarn: { borderColor: '#e11d48' },
  hintRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 8 },
  hintIcon: { fontSize: 14 },
  hintText: { fontSize: 12, color: '#4c64ef', fontWeight: '500', flex: 1, flexWrap: 'wrap' },
  startTip: { fontSize: 12, color: '#334155', marginBottom: 8, fontWeight: '500' },
  startTipStrong: { fontWeight: '700' },
  chipsRow: { gap: 6, paddingVertical: 6, paddingBottom: 10 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginRight: 4,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  progressBg: {
    height: 5,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right' },
});
