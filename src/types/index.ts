export type DosageForm = 
  | 'Tablet' 
  | 'Capsule' 
  | 'Syrup' 
  | 'Suspension' 
  | 'Injection' 
  | 'Ointment' 
  | 'Gel' 
  | 'Drops' 
  | 'Inhaler' 
  | 'Powder';

export type MedicineCategory = 
  | 'Analgesic & Antipyretic'
  | 'Antibiotic & Anti-infective'
  | 'Gastrointestinal & Antacid'
  | 'Cardiovascular & Antihypertensive'
  | 'Antidiabetic'
  | 'Respiratory & Antiallergic'
  | 'Vitamins, Minerals & Supplements'
  | 'Dermatological'
  | 'First Aid & Surgical'
  | 'OTC & Wellness';

export interface Batch {
  id: string;
  medicineId: string;
  batchNumber: string;
  manufacturingDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  quantity: number;
  purchasePrice: number; // Inward cost ₹
  mrp: number; // Maximum Retail Price ₹
  sellingPrice: number; // Retail offer price ₹
  supplierId: string;
  supplierName?: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  category: MedicineCategory;
  manufacturer: string;
  strength: string;
  dosageForm: DosageForm;
  packSize: string;
  barcode: string;
  sku: string;
  hsnCode: string;
  taxRate: number; // GST % (e.g. 5, 12, 18)
  minStockAlert: number;
  reorderLevel: number;
  requiresPrescription: boolean;
  status?: 'active' | 'inactive';
  rackLocation?: string;
  sideEffectsWarning?: string;
  totalStock: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  paymentTerms: string;
  outstandingBalance: number;
  createdAt: string;
}

export interface CartItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  dosageForm: DosageForm;
  strength: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  availableStock: number;
  purchasePrice: number; // Internal only
  mrp: number;
  unitPrice: number; // Selling price
  discountPercent: number;
  taxRate: number; // GST %
  requiresPrescription: boolean;
  total: number;
  savings: number;
}

export interface SaleItem {
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
  discountPercent: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Split';

export interface Sale {
  id: string;
  billNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  doctorName?: string;
  prescriptionRef?: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  roundOff: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentBreakdown?: {
    cashAmount?: number;
    upiAmount?: number;
    cardAmount?: number;
  };
  amountPaid: number;
  changeReturned: number;
  status: 'completed' | 'returned' | 'partial_return';
  cashierName: string;
  createdAt: string;
  notes?: string;
}

export interface PurchaseItem {
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
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  amountPaid: number;
  receivedBy: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastVisit: string;
  createdAt: string;
  notes?: string;
}

export interface ReturnItem {
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  reason: string;
}

export interface SaleReturn {
  id: string;
  returnNumber: string;
  originalSaleId: string;
  billNumber: string;
  customerName?: string;
  items: ReturnItem[];
  totalRefund: number;
  refundMethod: 'Cash' | 'CreditNote' | 'UPI';
  reason: string;
  processedBy: string;
  date: string;
  restocked: boolean;
}

export interface PatientCartItem {
  id: string;
  medicineName: string;
  dosageForm: string;
  strength: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
  total: number;
  savings: number;
}

export type PatientDisplayState = 'idle' | 'billing' | 'payment' | 'success';

export interface DisplaySession {
  state: PatientDisplayState;
  billNumber: string;
  items: PatientCartItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  totalSavings: number;
  paymentMethod?: PaymentMethod;
  amountPaid?: number;
  changeReturned?: number;
  upiDetails?: {
    vpa: string;
    payeeName: string;
    amount: number;
    transactionNote: string;
  };
  lastUpdated: number;
}

export type UserRole = 'Owner/Admin' | 'Pharmacist' | 'Cashier' | 'Patient Display';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  category: 'INVENTORY' | 'SALE' | 'PURCHASE' | 'RETURN' | 'SECURITY';
  performedBy: string;
  details: string;
}

export interface PharmacySettings {
  pharmacyName: string;
  tagline: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  gstin: string;
  dlNumber: string; // Drug License Number
  fssaiNumber: string;
  upiId: string;
  upiPayeeName: string;
  currencySymbol: string;
  invoiceFooterMessage: string;
  lowStockThreshold: number;
  expiryWarningDays: number;
  allowNegativeStock: boolean;
  aiFeaturesEnabled: boolean; // Master Manual On/Off mode for all AI features
  aiSearchGroundingEnabled: boolean; // Manual On/Off for Google Search Grounding
  aiImageToolsEnabled: boolean; // Manual On/Off for AI Image Creator & Editor
  customLogoUrl?: string; // Base64 transparent PNG / SVG data URL
  customSignboardUrl?: string; // Optional custom signboard banner URL
}
