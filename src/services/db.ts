import { 
  Medicine, 
  Batch, 
  Supplier, 
  Sale, 
  Purchase, 
  Customer, 
  SaleReturn, 
  AuditLog, 
  PharmacySettings,
  CartItem
} from '../types';

const STORAGE_KEYS = {
  MEDICINES: 'vinisha_medicines_v1',
  BATCHES: 'vinisha_batches_v1',
  SUPPLIERS: 'vinisha_suppliers_v1',
  SALES: 'vinisha_sales_v1',
  PURCHASES: 'vinisha_purchases_v1',
  CUSTOMERS: 'vinisha_customers_v1',
  RETURNS: 'vinisha_returns_v1',
  AUDIT_LOGS: 'vinisha_audit_v1',
  SETTINGS: 'vinisha_settings_v1'
};

const DEFAULT_SETTINGS: PharmacySettings = {
  pharmacyName: 'Vinisha Pharma',
  tagline: 'Retail Chemist & Druggist',
  address: 'Shop No. 4 & 5, Health Point Complex, MG Road',
  city: 'Bengaluru, Karnataka 560001',
  phone: '+91 98450 12345 / 080-25567890',
  email: 'care@vinishapharma.com',
  gstin: '29ABCDE1234F1Z5',
  dlNumber: 'KA-B1-204918 / KA-B2-204919',
  fssaiNumber: '11223344556677',
  upiId: 'vinishapharma@upi',
  upiPayeeName: 'Vinisha Pharma Retail',
  currencySymbol: '₹',
  invoiceFooterMessage: 'Medicines once sold can only be returned within 7 days in original seal with invoice.',
  lowStockThreshold: 20,
  expiryWarningDays: 60,
  allowNegativeStock: false,
  aiFeaturesEnabled: true, // Manual toggle for all AI features
  aiSearchGroundingEnabled: true, // Manual toggle for Google Search Grounding
  aiImageToolsEnabled: true // Manual toggle for AI Image Studio
};

// Seed dataset
const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Apex Pharma Distributors',
    contactPerson: 'Rajesh K. Mehta',
    phone: '+91 98201 54321',
    email: 'orders@apexpharma.in',
    address: 'Plot 12, Industrial Area, Peenya, Bengaluru',
    gstin: '29AAACA1234A1Z1',
    paymentTerms: 'Net 30 Days',
    outstandingBalance: 14500,
    createdAt: '2026-01-10T10:00:00Z'
  },
  {
    id: 'sup-2',
    name: 'MediLife Healthcare Logistics',
    contactPerson: 'Anita Deshmukh',
    phone: '+91 98440 88765',
    email: 'supply@medilife.org',
    address: '4th Cross, Wilson Garden, Bengaluru',
    gstin: '29BBBCB5678B2Z2',
    paymentTerms: 'Immediate / 15 Days',
    outstandingBalance: 0,
    createdAt: '2026-02-01T09:30:00Z'
  },
  {
    id: 'sup-3',
    name: 'Sun & Cipla Allied Agency',
    contactPerson: 'Suresh Varma',
    phone: '+91 98860 33211',
    email: 'billing@sunciplaagency.com',
    address: 'Kalyan Nagar, Outer Ring Road, Bengaluru',
    gstin: '29CCCC8901C3Z3',
    paymentTerms: 'Net 45 Days',
    outstandingBalance: 32000,
    createdAt: '2026-01-15T11:00:00Z'
  }
];

const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-1',
    name: 'Dolo 650mg',
    genericName: 'Paracetamol',
    brand: 'Dolo',
    category: 'Analgesic & Antipyretic',
    manufacturer: 'Micro Labs Ltd',
    strength: '650mg',
    dosageForm: 'Tablet',
    packSize: '15 Tablets / Strip',
    barcode: '8901148201015',
    sku: 'MED-DOLO-650',
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    reorderLevel: 80,
    requiresPrescription: false,
    status: 'active',
    rackLocation: 'A-01-04',
    sideEffectsWarning: 'Do not exceed 4g daily to avoid liver toxicity.',
    totalStock: 95
  },
  {
    id: 'med-2',
    name: 'Azithral 500mg',
    genericName: 'Azithromycin',
    brand: 'Azithral',
    category: 'Antibiotic & Anti-infective',
    manufacturer: 'Alembic Pharmaceuticals',
    strength: '500mg',
    dosageForm: 'Tablet',
    packSize: '5 Tablets / Strip',
    barcode: '8901035221004',
    sku: 'MED-AZI-500',
    hsnCode: '300420',
    taxRate: 12,
    minStockAlert: 20,
    reorderLevel: 50,
    requiresPrescription: true,
    rackLocation: 'B-02-12',
    sideEffectsWarning: 'Schedule H1 Drug. Take on empty stomach or as advised.',
    totalStock: 42
  },
  {
    id: 'med-3',
    name: 'Pan 40mg',
    genericName: 'Pantoprazole Gastro-Resistant',
    brand: 'Pan',
    category: 'Gastrointestinal & Antacid',
    manufacturer: 'Alkem Laboratories',
    strength: '40mg',
    dosageForm: 'Tablet',
    packSize: '15 Tablets / Strip',
    barcode: '8901452093012',
    sku: 'MED-PAN-40',
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    reorderLevel: 60,
    requiresPrescription: false,
    rackLocation: 'C-01-08',
    totalStock: 68
  },
  {
    id: 'med-4',
    name: 'Augmentin 625 Duo',
    genericName: 'Amoxicillin & Potassium Clavulanate',
    brand: 'Augmentin',
    category: 'Antibiotic & Anti-infective',
    manufacturer: 'GlaxoSmithKline',
    strength: '625mg',
    dosageForm: 'Tablet',
    packSize: '10 Tablets / Strip',
    barcode: '8901086001099',
    sku: 'MED-AUG-625',
    hsnCode: '300410',
    taxRate: 12,
    minStockAlert: 15,
    reorderLevel: 40,
    requiresPrescription: true,
    rackLocation: 'B-03-01',
    sideEffectsWarning: 'Schedule H1 Drug. Complete full course.',
    totalStock: 18 // Low stock alert!
  },
  {
    id: 'med-5',
    name: 'Cetzine 10mg',
    genericName: 'Cetirizine Hydrochloride',
    brand: 'Cetzine',
    category: 'Respiratory & Antiallergic',
    manufacturer: 'Dr. Reddy Laboratories',
    strength: '10mg',
    dosageForm: 'Tablet',
    packSize: '10 Tablets / Strip',
    barcode: '8901175112028',
    sku: 'MED-CET-10',
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    reorderLevel: 50,
    requiresPrescription: false,
    rackLocation: 'A-02-09',
    totalStock: 80
  },
  {
    id: 'med-6',
    name: 'Telma 40mg',
    genericName: 'Telmisartan',
    brand: 'Telma',
    category: 'Cardiovascular & Antihypertensive',
    manufacturer: 'Glenmark Pharmaceuticals',
    strength: '40mg',
    dosageForm: 'Tablet',
    packSize: '30 Tablets / Box',
    barcode: '8901235009112',
    sku: 'MED-TEL-40',
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    reorderLevel: 45,
    requiresPrescription: true,
    rackLocation: 'D-01-03',
    totalStock: 52
  },
  {
    id: 'med-7',
    name: 'Glycomet 500mg SR',
    genericName: 'Metformin Hydrochloride Prolonged Release',
    brand: 'Glycomet',
    category: 'Antidiabetic',
    manufacturer: 'USV Pvt Ltd',
    strength: '500mg',
    dosageForm: 'Tablet',
    packSize: '20 Tablets / Strip',
    barcode: '8901302008819',
    sku: 'MED-GLY-500',
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 25,
    reorderLevel: 70,
    requiresPrescription: true,
    rackLocation: 'D-02-07',
    totalStock: 110
  },
  {
    id: 'med-8',
    name: 'Electral Powder 21.8g',
    genericName: 'Oral Rehydration Salts (WHO Formula)',
    brand: 'Electral',
    category: 'OTC & Wellness',
    manufacturer: 'FDC Limited',
    strength: '21.8g',
    dosageForm: 'Powder',
    packSize: 'Sachet 21.8g',
    barcode: '8901043003011',
    sku: 'MED-ELE-21G',
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 30,
    reorderLevel: 100,
    requiresPrescription: false,
    rackLocation: 'E-01-01',
    totalStock: 140
  },
  {
    id: 'med-9',
    name: 'Benadryl Cough Syrup 100ml',
    genericName: 'Diphenhydramine HCl & Ammonium Chloride',
    brand: 'Benadryl',
    category: 'Respiratory & Antiallergic',
    manufacturer: 'Johnson & Johnson',
    strength: '100ml',
    dosageForm: 'Syrup',
    packSize: '100ml Bottle',
    barcode: '8901012110901',
    sku: 'MED-BEN-100',
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 15,
    reorderLevel: 40,
    requiresPrescription: false,
    rackLocation: 'C-03-04',
    totalStock: 24
  },
  {
    id: 'med-10',
    name: 'Calcirol 60K Granules',
    genericName: 'Cholecalciferol (Vitamin D3)',
    brand: 'Calcirol',
    category: 'Vitamins, Minerals & Supplements',
    manufacturer: 'Cadila Pharmaceuticals',
    strength: '60000 IU',
    dosageForm: 'Powder',
    packSize: '1g Sachet',
    barcode: '8901077002014',
    sku: 'MED-CAL-60K',
    hsnCode: '300450',
    taxRate: 12,
    minStockAlert: 20,
    reorderLevel: 50,
    requiresPrescription: false,
    rackLocation: 'E-02-05',
    totalStock: 12 // Low stock!
  },
  {
    id: 'med-11',
    name: 'Betadine Ointment 20g',
    genericName: 'Povidone-Iodine 5% w/w',
    brand: 'Betadine',
    category: 'First Aid & Surgical',
    manufacturer: 'Win-Medicare Pvt Ltd',
    strength: '5% w/w',
    dosageForm: 'Ointment',
    packSize: '20g Tube',
    barcode: '8901290001011',
    sku: 'MED-BET-20G',
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 10,
    reorderLevel: 30,
    requiresPrescription: false,
    rackLocation: 'F-01-02',
    totalStock: 16
  }
];

const INITIAL_BATCHES: Batch[] = [
  // Dolo 650 batches (FEFO demonstration: Batch 1 expires earlier)
  {
    id: 'bat-1',
    medicineId: 'med-1',
    batchNumber: 'DL26A12',
    manufacturingDate: '2025-01-10',
    expiryDate: '2026-10-31', // Expiring in ~1 month (Near expiry alert!)
    quantity: 25,
    purchasePrice: 22.50,
    mrp: 34.00,
    sellingPrice: 31.00,
    supplierId: 'sup-1',
    supplierName: 'Apex Pharma Distributors'
  },
  {
    id: 'bat-2',
    medicineId: 'med-1',
    batchNumber: 'DL26F18',
    manufacturingDate: '2025-06-01',
    expiryDate: '2027-05-31',
    quantity: 70,
    purchasePrice: 23.00,
    mrp: 34.00,
    sellingPrice: 31.00,
    supplierId: 'sup-1',
    supplierName: 'Apex Pharma Distributors'
  },
  // Azithral batches
  {
    id: 'bat-3',
    medicineId: 'med-2',
    batchNumber: 'AZT901',
    manufacturingDate: '2025-03-15',
    expiryDate: '2026-11-15', // Expiring in <60 days
    quantity: 12,
    purchasePrice: 85.00,
    mrp: 128.50,
    sellingPrice: 119.00,
    supplierId: 'sup-3',
    supplierName: 'Sun & Cipla Allied Agency'
  },
  {
    id: 'bat-4',
    medicineId: 'med-2',
    batchNumber: 'AZT992',
    manufacturingDate: '2025-08-01',
    expiryDate: '2027-07-31',
    quantity: 30,
    purchasePrice: 86.50,
    mrp: 128.50,
    sellingPrice: 119.00,
    supplierId: 'sup-3',
    supplierName: 'Sun & Cipla Allied Agency'
  },
  // Pan 40 batches
  {
    id: 'bat-5',
    medicineId: 'med-3',
    batchNumber: 'PN40-88',
    manufacturingDate: '2025-04-10',
    expiryDate: '2027-03-31',
    quantity: 68,
    purchasePrice: 98.00,
    mrp: 155.00,
    sellingPrice: 142.00,
    supplierId: 'sup-2',
    supplierName: 'MediLife Healthcare Logistics'
  },
  // Augmentin batches (critically low)
  {
    id: 'bat-6',
    medicineId: 'med-4',
    batchNumber: 'AUG-710',
    manufacturingDate: '2025-07-10',
    expiryDate: '2026-12-31',
    quantity: 18,
    purchasePrice: 140.00,
    mrp: 215.00,
    sellingPrice: 198.00,
    supplierId: 'sup-1',
    supplierName: 'Apex Pharma Distributors'
  },
  // Cetzine
  {
    id: 'bat-7',
    medicineId: 'med-5',
    batchNumber: 'CTZ-334',
    manufacturingDate: '2025-02-12',
    expiryDate: '2027-01-31',
    quantity: 80,
    purchasePrice: 14.00,
    mrp: 23.50,
    sellingPrice: 21.00,
    supplierId: 'sup-2',
    supplierName: 'MediLife Healthcare Logistics'
  },
  // Telma 40
  {
    id: 'bat-8',
    medicineId: 'med-6',
    batchNumber: 'TLM-201',
    manufacturingDate: '2025-05-20',
    expiryDate: '2027-04-30',
    quantity: 52,
    purchasePrice: 165.00,
    mrp: 245.00,
    sellingPrice: 228.00,
    supplierId: 'sup-3',
    supplierName: 'Sun & Cipla Allied Agency'
  },
  // Glycomet 500
  {
    id: 'bat-9',
    medicineId: 'med-7',
    batchNumber: 'GLY-902',
    manufacturingDate: '2025-06-15',
    expiryDate: '2027-05-31',
    quantity: 110,
    purchasePrice: 38.00,
    mrp: 62.00,
    sellingPrice: 56.00,
    supplierId: 'sup-2',
    supplierName: 'MediLife Healthcare Logistics'
  },
  // Electral
  {
    id: 'bat-10',
    medicineId: 'med-8',
    batchNumber: 'ELC-104',
    manufacturingDate: '2025-09-01',
    expiryDate: '2027-08-31',
    quantity: 140,
    purchasePrice: 16.00,
    mrp: 24.50,
    sellingPrice: 23.00,
    supplierId: 'sup-1',
    supplierName: 'Apex Pharma Distributors'
  },
  // Benadryl
  {
    id: 'bat-11',
    medicineId: 'med-9',
    batchNumber: 'BND-441',
    manufacturingDate: '2025-03-01',
    expiryDate: '2026-10-15', // Expiring in ~20 days!
    quantity: 24,
    purchasePrice: 82.00,
    mrp: 125.00,
    sellingPrice: 115.00,
    supplierId: 'sup-3',
    supplierName: 'Sun & Cipla Allied Agency'
  },
  // Calcirol (low quantity)
  {
    id: 'bat-12',
    medicineId: 'med-10',
    batchNumber: 'CAL-099',
    manufacturingDate: '2025-08-11',
    expiryDate: '2027-07-31',
    quantity: 12,
    purchasePrice: 35.00,
    mrp: 58.00,
    sellingPrice: 52.00,
    supplierId: 'sup-2',
    supplierName: 'MediLife Healthcare Logistics'
  },
  // Betadine
  {
    id: 'bat-13',
    medicineId: 'med-11',
    batchNumber: 'BET-804',
    manufacturingDate: '2025-04-01',
    expiryDate: '2027-03-31',
    quantity: 16,
    purchasePrice: 78.00,
    mrp: 120.00,
    sellingPrice: 110.00,
    supplierId: 'sup-1',
    supplierName: 'Apex Pharma Distributors'
  },
  // Demo expired batch for filter testing
  {
    id: 'bat-14',
    medicineId: 'med-1',
    batchNumber: 'DL24Z99',
    manufacturingDate: '2023-08-01',
    expiryDate: '2026-08-15', // Expired
    quantity: 3,
    purchasePrice: 20.00,
    mrp: 32.00,
    sellingPrice: 30.00,
    supplierId: 'sup-1',
    supplierName: 'Apex Pharma Distributors'
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Venkatesh Murthy',
    phone: '+91 98451 90214',
    email: 'v.murthy@gmail.com',
    address: 'Flat 302, Green Acres, Jayanagar 4th Block',
    totalPurchases: 4,
    totalSpent: 2840,
    loyaltyPoints: 140,
    lastVisit: '2026-09-24T14:20:00Z',
    createdAt: '2026-03-12T09:00:00Z'
  },
  {
    id: 'cust-2',
    name: 'Priyanka Sen',
    phone: '+91 97405 61120',
    email: 'priyanka.sen@outlook.com',
    address: '12th Main Road, Indiranagar',
    totalPurchases: 7,
    totalSpent: 6450,
    loyaltyPoints: 320,
    lastVisit: '2026-09-26T18:10:00Z',
    createdAt: '2026-02-18T11:15:00Z'
  },
  {
    id: 'cust-3',
    name: 'Mohammed Rafi',
    phone: '+91 99002 44319',
    email: '',
    address: 'Near Bilal Mosque, Frazer Town',
    totalPurchases: 2,
    totalSpent: 980,
    loyaltyPoints: 45,
    lastVisit: '2026-09-25T11:45:00Z',
    createdAt: '2026-05-04T16:00:00Z'
  }
];

const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-101',
    billNumber: 'VP-2026-1045',
    customerId: 'cust-1',
    customerName: 'Venkatesh Murthy',
    customerPhone: '+91 98451 90214',
    items: [
      {
        medicineId: 'med-6',
        medicineName: 'Telma 40mg',
        batchId: 'bat-8',
        batchNumber: 'TLM-201',
        expiryDate: '2027-04-30',
        quantity: 1,
        unitPrice: 228.00,
        mrp: 245.00,
        discountPercent: 5,
        taxRate: 12,
        taxAmount: 23.21,
        total: 216.60
      },
      {
        medicineId: 'med-1',
        medicineName: 'Dolo 650mg',
        batchId: 'bat-1',
        batchNumber: 'DL26A12',
        expiryDate: '2026-10-31',
        quantity: 2,
        unitPrice: 31.00,
        mrp: 34.00,
        discountPercent: 0,
        taxRate: 12,
        taxAmount: 6.64,
        total: 62.00
      }
    ],
    subtotal: 290.00,
    discountAmount: 11.40,
    taxAmount: 29.85,
    roundOff: -0.20,
    grandTotal: 278.00,
    paymentMethod: 'UPI',
    amountPaid: 278.00,
    changeReturned: 0,
    status: 'completed',
    cashierName: 'Kavitha R. (Pharmacist)',
    createdAt: '2026-09-26T10:15:00Z'
  },
  {
    id: 'sale-102',
    billNumber: 'VP-2026-1046',
    customerName: 'Walk-in Patient',
    items: [
      {
        medicineId: 'med-2',
        medicineName: 'Azithral 500mg',
        batchId: 'bat-3',
        batchNumber: 'AZT901',
        expiryDate: '2026-11-15',
        quantity: 1,
        unitPrice: 119.00,
        mrp: 128.50,
        discountPercent: 0,
        taxRate: 12,
        taxAmount: 12.75,
        total: 119.00
      },
      {
        medicineId: 'med-3',
        medicineName: 'Pan 40mg',
        batchId: 'bat-5',
        batchNumber: 'PN40-88',
        expiryDate: '2027-03-31',
        quantity: 1,
        unitPrice: 142.00,
        mrp: 155.00,
        discountPercent: 5,
        taxRate: 12,
        taxAmount: 14.45,
        total: 134.90
      }
    ],
    subtotal: 261.00,
    discountAmount: 7.10,
    taxAmount: 27.20,
    roundOff: 0.20,
    grandTotal: 254.00,
    paymentMethod: 'Cash',
    amountPaid: 500.00,
    changeReturned: 246.00,
    status: 'completed',
    cashierName: 'Kavitha R. (Pharmacist)',
    createdAt: '2026-09-26T14:40:00Z'
  },
  {
    id: 'sale-103',
    billNumber: 'VP-2026-1047',
    customerId: 'cust-2',
    customerName: 'Priyanka Sen',
    customerPhone: '+91 97405 61120',
    doctorName: 'Dr. Sandeep Rao (MD)',
    items: [
      {
        medicineId: 'med-7',
        medicineName: 'Glycomet 500mg SR',
        batchId: 'bat-9',
        batchNumber: 'GLY-902',
        expiryDate: '2027-05-31',
        quantity: 2,
        unitPrice: 56.00,
        mrp: 62.00,
        discountPercent: 10,
        taxRate: 12,
        taxAmount: 10.80,
        total: 100.80
      },
      {
        medicineId: 'med-8',
        medicineName: 'Electral Powder 21.8g',
        batchId: 'bat-10',
        batchNumber: 'ELC-104',
        expiryDate: '2027-08-31',
        quantity: 3,
        unitPrice: 23.00,
        mrp: 24.50,
        discountPercent: 0,
        taxRate: 12,
        taxAmount: 7.39,
        total: 69.00
      }
    ],
    subtotal: 181.00,
    discountAmount: 11.20,
    taxAmount: 18.19,
    roundOff: 0.20,
    grandTotal: 170.00,
    paymentMethod: 'Card',
    amountPaid: 170.00,
    changeReturned: 0,
    status: 'completed',
    cashierName: 'Anil Kumar (Cashier)',
    createdAt: '2026-09-27T02:10:00Z'
  }
];

const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 'pur-1',
    invoiceNumber: 'APX-2026-8910',
    supplierId: 'sup-1',
    supplierName: 'Apex Pharma Distributors',
    date: '2026-09-18T11:00:00Z',
    items: [
      {
        medicineId: 'med-1',
        medicineName: 'Dolo 650mg',
        batchNumber: 'DL26F18',
        manufacturingDate: '2025-06-01',
        expiryDate: '2027-05-31',
        quantity: 100,
        purchasePrice: 23.00,
        mrp: 34.00,
        sellingPrice: 31.00,
        taxRate: 12,
        total: 2576.00
      }
    ],
    subtotal: 2300.00,
    taxAmount: 276.00,
    grandTotal: 2576.00,
    paymentStatus: 'paid',
    amountPaid: 2576.00,
    receivedBy: 'Store Admin',
    createdAt: '2026-09-18T11:30:00Z'
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    timestamp: '2026-09-26T10:15:00Z',
    action: 'SALE_COMPLETED',
    category: 'SALE',
    performedBy: 'Kavitha R.',
    details: 'Invoice VP-2026-1045 generated for ₹278.00'
  },
  {
    id: 'aud-2',
    timestamp: '2026-09-26T14:40:00Z',
    action: 'SALE_COMPLETED',
    category: 'SALE',
    performedBy: 'Kavitha R.',
    details: 'Invoice VP-2026-1046 generated for ₹254.00'
  },
  {
    id: 'aud-3',
    timestamp: '2026-09-27T02:10:00Z',
    action: 'SALE_COMPLETED',
    category: 'SALE',
    performedBy: 'Anil Kumar',
    details: 'Invoice VP-2026-1047 generated for ₹170.00'
  }
];

// Helper to safely read from localStorage
function readFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

// Helper to safely write to localStorage
function writeToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to write to localStorage for key: ${key}`, err);
  }
}

// Database Engine Class
class DatabaseService {
  private medicines: Medicine[] = [];
  private batches: Batch[] = [];
  private suppliers: Supplier[] = [];
  private sales: Sale[] = [];
  private purchases: Purchase[] = [];
  private customers: Customer[] = [];
  private returns: SaleReturn[] = [];
  private auditLogs: AuditLog[] = [];
  private settings: PharmacySettings = DEFAULT_SETTINGS;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    this.medicines = readFromStorage(STORAGE_KEYS.MEDICINES, INITIAL_MEDICINES);
    this.batches = readFromStorage(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    this.suppliers = readFromStorage(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    this.sales = readFromStorage(STORAGE_KEYS.SALES, INITIAL_SALES);
    this.purchases = readFromStorage(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
    this.customers = readFromStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    this.returns = readFromStorage(STORAGE_KEYS.RETURNS, []);
    this.auditLogs = readFromStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    const loadedSettings = readFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    this.settings = { ...DEFAULT_SETTINGS, ...loadedSettings };

    this.recalculateAllStock();
  }

  // Subscribe to changes
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  // Recalculates totalStock on each medicine from its active batches
  private recalculateAllStock() {
    const stockMap: Record<string, number> = {};
    const today = new Date().toISOString().split('T')[0];

    // Batches count towards stock if not expired
    for (const batch of this.batches) {
      if (batch.expiryDate >= today) {
        stockMap[batch.medicineId] = (stockMap[batch.medicineId] || 0) + batch.quantity;
      }
    }

    this.medicines = this.medicines.map(med => ({
      ...med,
      totalStock: stockMap[med.id] || 0
    }));

    writeToStorage(STORAGE_KEYS.MEDICINES, this.medicines);
  }

  // Medicines
  public getMedicines(): Medicine[] {
    return [...this.medicines];
  }

  public getMedicineById(id: string): Medicine | undefined {
    return this.medicines.find(m => m.id === id);
  }

  public addMedicine(medicine: Omit<Medicine, 'id' | 'totalStock'>): Medicine {
    const newMed: Medicine = {
      ...medicine,
      id: 'med-' + Date.now(),
      totalStock: 0
    };
    this.medicines.unshift(newMed);
    writeToStorage(STORAGE_KEYS.MEDICINES, this.medicines);
    this.logAudit('MEDICINE_CREATED', 'INVENTORY', 'Admin', `Added medicine ${newMed.name}`);
    this.notify();
    return newMed;
  }

  public updateMedicine(id: string, updates: Partial<Medicine>): Medicine {
    this.medicines = this.medicines.map(m => m.id === id ? { ...m, ...updates } : m);
    this.recalculateAllStock();
    this.notify();
    const updated = this.medicines.find(m => m.id === id)!;
    this.logAudit('MEDICINE_UPDATED', 'INVENTORY', 'Admin', `Updated medicine ${updated.name}`);
    return updated;
  }

  // Batches (FEFO sorted)
  public getBatches(medicineId?: string): Batch[] {
    let list = [...this.batches];
    if (medicineId) {
      list = list.filter(b => b.medicineId === medicineId);
    }
    // FEFO: Sort by expiryDate ascending
    return list.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  }

  public addBatch(batch: Omit<Batch, 'id'>): Batch {
    const newBatch: Batch = {
      ...batch,
      id: 'bat-' + Date.now()
    };
    this.batches.push(newBatch);
    writeToStorage(STORAGE_KEYS.BATCHES, this.batches);
    this.recalculateAllStock();
    this.logAudit('BATCH_ADDED', 'INVENTORY', 'Admin', `Added batch ${newBatch.batchNumber} (Qty: ${newBatch.quantity})`);
    this.notify();
    return newBatch;
  }

  public updateBatch(id: string, updates: Partial<Batch>): Batch {
    this.batches = this.batches.map(b => b.id === id ? { ...b, ...updates } : b);
    writeToStorage(STORAGE_KEYS.BATCHES, this.batches);
    this.recalculateAllStock();
    this.notify();
    return this.batches.find(b => b.id === id)!;
  }

  public adjustBatchStock(batchId: string, deltaQuantity: number, reason: string): boolean {
    const batch = this.batches.find(b => b.id === batchId);
    if (!batch) return false;

    const newQty = batch.quantity + deltaQuantity;
    if (newQty < 0 && !this.settings.allowNegativeStock) {
      return false;
    }

    batch.quantity = newQty;
    writeToStorage(STORAGE_KEYS.BATCHES, this.batches);
    this.recalculateAllStock();
    this.logAudit('STOCK_ADJUSTMENT', 'INVENTORY', 'Staff', `Adjusted batch ${batch.batchNumber} by ${deltaQuantity > 0 ? '+' : ''}${deltaQuantity}. Reason: ${reason}`);
    this.notify();
    return true;
  }

  // Sales & POS Execution
  public getSales(): Sale[] {
    return [...this.sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public getSaleById(id: string): Sale | undefined {
    return this.sales.find(s => s.id === id);
  }

  public getSaleByBillNumber(billNumber: string): Sale | undefined {
    return this.sales.find(s => s.billNumber.toLowerCase() === billNumber.toLowerCase().trim());
  }

  public completeSale(saleData: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    doctorName?: string;
    prescriptionRef?: string;
    cart: CartItem[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    roundOff: number;
    grandTotal: number;
    paymentMethod: Sale['paymentMethod'];
    amountPaid: number;
    changeReturned: number;
    cashierName: string;
    notes?: string;
  }): Sale {
    if (!saleData.cart || saleData.cart.length === 0) {
      throw new Error('Cannot complete sale: Cart is empty.');
    }

    // Strict stock verification before committing any state changes
    if (!this.settings.allowNegativeStock) {
      for (const item of saleData.cart) {
        const batch = this.batches.find(b => b.id === item.batchId);
        if (!batch) {
          throw new Error(`Batch ${item.batchNumber} for medicine "${item.medicineName}" no longer exists in inventory.`);
        }
        if (batch.quantity < item.quantity) {
          throw new Error(`Insufficient stock for "${item.medicineName}" (Batch: ${item.batchNumber}). Requested: ${item.quantity}, Available: ${batch.quantity}.`);
        }
      }
    }

    // 1. Generate unique bill number
    const billNum = `VP-${new Date().getFullYear()}-${1000 + this.sales.length + 1}`;

    // 2. Build Sale Items and deduct stock atomically
    const saleItems = saleData.cart.map(item => {
      // Find batch and deduct
      const batch = this.batches.find(b => b.id === item.batchId);
      if (batch) {
        batch.quantity = Math.max(0, batch.quantity - item.quantity);
      }

      const itemTaxAmount = ((item.total * item.taxRate) / (100 + item.taxRate));

      return {
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        batchId: item.batchId,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        mrp: item.mrp,
        discountPercent: item.discountPercent,
        taxRate: item.taxRate,
        taxAmount: Number(itemTaxAmount.toFixed(2)),
        total: item.total
      };
    });

    const newSale: Sale = {
      id: 'sale-' + Date.now(),
      billNumber: billNum,
      customerId: saleData.customerId,
      customerName: saleData.customerName || 'Walk-in Customer',
      customerPhone: saleData.customerPhone,
      doctorName: saleData.doctorName,
      prescriptionRef: saleData.prescriptionRef,
      items: saleItems,
      subtotal: saleData.subtotal,
      discountAmount: saleData.discountAmount,
      taxAmount: saleData.taxAmount,
      roundOff: saleData.roundOff,
      grandTotal: saleData.grandTotal,
      paymentMethod: saleData.paymentMethod,
      amountPaid: saleData.amountPaid,
      changeReturned: saleData.changeReturned,
      status: 'completed',
      cashierName: saleData.cashierName,
      createdAt: new Date().toISOString(),
      notes: saleData.notes
    };

    this.sales.unshift(newSale);
    writeToStorage(STORAGE_KEYS.SALES, this.sales);
    writeToStorage(STORAGE_KEYS.BATCHES, this.batches);

    // Update customer stats if customer is linked
    if (saleData.customerId) {
      const cust = this.customers.find(c => c.id === saleData.customerId);
      if (cust) {
        cust.totalPurchases += 1;
        cust.totalSpent += newSale.grandTotal;
        cust.loyaltyPoints += Math.floor(newSale.grandTotal / 20); // 1 point per ₹20
        cust.lastVisit = newSale.createdAt;
        writeToStorage(STORAGE_KEYS.CUSTOMERS, this.customers);
      }
    }

    this.recalculateAllStock();
    this.logAudit('SALE_COMPLETED', 'SALE', saleData.cashierName, `Bill ${billNum} completed for ₹${newSale.grandTotal} (${saleData.paymentMethod})`);
    this.notify();
    return newSale;
  }

  // Returns
  public getReturns(): SaleReturn[] {
    return [...this.returns].sort((a, b) => b.date.localeCompare(a.date));
  }

  public processSaleReturn(returnData: {
    originalSaleId: string;
    billNumber: string;
    customerName?: string;
    items: Array<{
      medicineId: string;
      medicineName: string;
      batchId: string;
      batchNumber: string;
      quantity: number;
      unitPrice: number;
      refundAmount: number;
      reason: string;
    }>;
    refundMethod: 'Cash' | 'CreditNote' | 'UPI';
    reason: string;
    processedBy: string;
    restock: boolean;
  }): SaleReturn {
    const returnNumber = `RET-${new Date().getFullYear()}-${100 + this.returns.length + 1}`;
    const totalRefund = returnData.items.reduce((sum, item) => sum + item.refundAmount, 0);

    // Restock batches if requested
    if (returnData.restock) {
      for (const item of returnData.items) {
        const batch = this.batches.find(b => b.id === item.batchId);
        if (batch) {
          batch.quantity += item.quantity;
        }
      }
      writeToStorage(STORAGE_KEYS.BATCHES, this.batches);
      this.recalculateAllStock();
    }

    // Mark original sale
    const sale = this.sales.find(s => s.id === returnData.originalSaleId);
    if (sale) {
      sale.status = 'returned';
      writeToStorage(STORAGE_KEYS.SALES, this.sales);
    }

    const newReturn: SaleReturn = {
      id: 'ret-' + Date.now(),
      returnNumber,
      originalSaleId: returnData.originalSaleId,
      billNumber: returnData.billNumber,
      customerName: returnData.customerName,
      items: returnData.items,
      totalRefund,
      refundMethod: returnData.refundMethod,
      reason: returnData.reason,
      processedBy: returnData.processedBy,
      date: new Date().toISOString(),
      restocked: returnData.restock
    };

    this.returns.unshift(newReturn);
    writeToStorage(STORAGE_KEYS.RETURNS, this.returns);
    this.logAudit('RETURN_PROCESSED', 'RETURN', returnData.processedBy, `Return ${returnNumber} processed for Bill ${returnData.billNumber} (Refund: ₹${totalRefund})`);
    this.notify();
    return newReturn;
  }

  // Purchases & Suppliers
  public getSuppliers(): Supplier[] {
    return [...this.suppliers];
  }

  public addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
    const newSup: Supplier = {
      ...supplier,
      id: 'sup-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    this.suppliers.push(newSup);
    writeToStorage(STORAGE_KEYS.SUPPLIERS, this.suppliers);
    this.notify();
    return newSup;
  }

  public getPurchases(): Purchase[] {
    return [...this.purchases].sort((a, b) => b.date.localeCompare(a.date));
  }

  public createPurchase(purchaseData: {
    invoiceNumber: string;
    supplierId: string;
    items: Array<{
      medicineId: string;
      medicineName: string;
      batchNumber: string;
      manufacturingDate: string;
      expiryDate: string;
      quantity: number;
      purchasePrice: number;
      mrp: number;
      sellingPrice: number;
      taxRate: number;
      total: number;
    }>;
    receivedBy: string;
    amountPaid: number;
  }): Purchase {
    const supplier = this.suppliers.find(s => s.id === purchaseData.supplierId);
    const subtotal = purchaseData.items.reduce((s, it) => s + (it.purchasePrice * it.quantity), 0);
    const taxAmount = purchaseData.items.reduce((s, it) => s + ((it.purchasePrice * it.quantity * it.taxRate) / 100), 0);
    const grandTotal = subtotal + taxAmount;

    // Create batches or update existing
    for (const item of purchaseData.items) {
      let existingBatch = this.batches.find(b => b.medicineId === item.medicineId && b.batchNumber === item.batchNumber);
      if (existingBatch) {
        existingBatch.quantity += item.quantity;
        existingBatch.purchasePrice = item.purchasePrice;
        existingBatch.mrp = item.mrp;
        existingBatch.sellingPrice = item.sellingPrice;
        existingBatch.expiryDate = item.expiryDate;
      } else {
        this.batches.push({
          id: 'bat-' + Date.now() + Math.random().toString(36).substring(2, 6),
          medicineId: item.medicineId,
          batchNumber: item.batchNumber,
          manufacturingDate: item.manufacturingDate,
          expiryDate: item.expiryDate,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          mrp: item.mrp,
          sellingPrice: item.sellingPrice,
          supplierId: purchaseData.supplierId,
          supplierName: supplier?.name
        });
      }
    }

    const newPurchase: Purchase = {
      id: 'pur-' + Date.now(),
      invoiceNumber: purchaseData.invoiceNumber,
      supplierId: purchaseData.supplierId,
      supplierName: supplier?.name || 'Unknown Supplier',
      date: new Date().toISOString(),
      items: purchaseData.items,
      subtotal,
      taxAmount,
      grandTotal,
      paymentStatus: purchaseData.amountPaid >= grandTotal ? 'paid' : (purchaseData.amountPaid > 0 ? 'partial' : 'pending'),
      amountPaid: purchaseData.amountPaid,
      receivedBy: purchaseData.receivedBy,
      createdAt: new Date().toISOString()
    };

    this.purchases.unshift(newPurchase);
    writeToStorage(STORAGE_KEYS.PURCHASES, this.purchases);
    writeToStorage(STORAGE_KEYS.BATCHES, this.batches);

    // Update supplier balance if balance remains
    if (supplier && purchaseData.amountPaid < grandTotal) {
      supplier.outstandingBalance += (grandTotal - purchaseData.amountPaid);
      writeToStorage(STORAGE_KEYS.SUPPLIERS, this.suppliers);
    }

    this.recalculateAllStock();
    this.logAudit('PURCHASE_RECEIVED', 'PURCHASE', purchaseData.receivedBy, `Inward purchase ${purchaseData.invoiceNumber} recorded for ₹${grandTotal}`);
    this.notify();
    return newPurchase;
  }

  // Customers
  public getCustomers(): Customer[] {
    return [...this.customers].sort((a, b) => b.totalSpent - a.totalSpent);
  }

  public addCustomer(cust: Omit<Customer, 'id' | 'totalPurchases' | 'totalSpent' | 'loyaltyPoints' | 'lastVisit' | 'createdAt'>): Customer {
    const newCust: Customer = {
      ...cust,
      id: 'cust-' + Date.now(),
      totalPurchases: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      lastVisit: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    this.customers.push(newCust);
    writeToStorage(STORAGE_KEYS.CUSTOMERS, this.customers);
    this.notify();
    return newCust;
  }

  // Settings
  public getSettings(): PharmacySettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<PharmacySettings>): PharmacySettings {
    this.settings = { ...this.settings, ...updates };
    writeToStorage(STORAGE_KEYS.SETTINGS, this.settings);
    this.logAudit('SETTINGS_UPDATED', 'SECURITY', 'Admin', 'Updated pharmacy configuration settings');
    this.notify();
    return this.settings;
  }

  // AI Feature Mode Manual Controls
  public isAIFeaturesEnabled(): boolean {
    return !!this.settings.aiFeaturesEnabled;
  }

  public toggleAIFeatures(forceState?: boolean): boolean {
    const newState = forceState !== undefined ? forceState : !this.settings.aiFeaturesEnabled;
    this.updateSettings({ aiFeaturesEnabled: newState });
    this.logAudit(
      'AI_MODE_TOGGLED',
      'SECURITY',
      'Pharmacist',
      `AI features manually toggled ${newState ? 'ON (Active)' : 'OFF (Manual Pharmacy Mode)'}`
    );
    return newState;
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  public logAudit(action: string, category: AuditLog['category'], performedBy: string, details: string) {
    const log: AuditLog = {
      id: 'aud-' + Date.now(),
      timestamp: new Date().toISOString(),
      action,
      category,
      performedBy,
      details
    };
    this.auditLogs.unshift(log);
    // Keep max 500 audit logs
    if (this.auditLogs.length > 500) {
      this.auditLogs = this.auditLogs.slice(0, 500);
    }
    writeToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
  }

  // Reset to initial demo data
  public resetToDemoData() {
    this.medicines = INITIAL_MEDICINES;
    this.batches = INITIAL_BATCHES;
    this.suppliers = INITIAL_SUPPLIERS;
    this.sales = INITIAL_SALES;
    this.purchases = INITIAL_PURCHASES;
    this.customers = INITIAL_CUSTOMERS;
    this.returns = [];
    this.auditLogs = INITIAL_AUDIT_LOGS;
    this.settings = DEFAULT_SETTINGS;

    writeToStorage(STORAGE_KEYS.MEDICINES, this.medicines);
    writeToStorage(STORAGE_KEYS.BATCHES, this.batches);
    writeToStorage(STORAGE_KEYS.SUPPLIERS, this.suppliers);
    writeToStorage(STORAGE_KEYS.SALES, this.sales);
    writeToStorage(STORAGE_KEYS.PURCHASES, this.purchases);
    writeToStorage(STORAGE_KEYS.CUSTOMERS, this.customers);
    writeToStorage(STORAGE_KEYS.RETURNS, this.returns);
    writeToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    writeToStorage(STORAGE_KEYS.SETTINGS, this.settings);

    this.recalculateAllStock();
    this.notify();
  }
}

export const db = new DatabaseService();
