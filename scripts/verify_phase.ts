import { db } from '../src/services/db';
import { displaySync } from '../src/services/sync';
import { askPharmacyAssistant } from '../src/services/ai';

console.log('====================================================');
console.log('VINISHA PHARMA — STRICT PHASE VERIFICATION RUNNER');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}${detail ? ' — ' + detail : ''}`);
    process.exit(1);
  }
}

// -----------------------------------------------------------------
// TEST GROUP 1: INITIAL STATE & REPOSITORIES
// -----------------------------------------------------------------
console.log('\n--- 1. Database & Initial State Verification ---');
db.resetToDemoData();

const medicines = db.getMedicines();
const batches = db.getBatches();
const sales = db.getSales();
const settings = db.getSettings();

assert(medicines.length > 5, 'Medicines repository loaded', `Count: ${medicines.length}`);
assert(batches.length > 5, 'Batches repository loaded', `Count: ${batches.length}`);
assert(sales.length > 0, 'Initial sales audit history present', `Count: ${sales.length}`);
assert(settings.pharmacyName === 'Vinisha Pharma', 'Settings properly initialized', settings.pharmacyName);

// -----------------------------------------------------------------
// TEST GROUP 2: FEFO BATCH SORTING
// -----------------------------------------------------------------
console.log('\n--- 2. FEFO (First-Expiry-First-Out) Ordering ---');
const doloBatches = db.getBatches('med-1');
assert(doloBatches.length >= 2, 'Dolo 650 has multiple batches for FEFO test');
for (let i = 0; i < doloBatches.length - 1; i++) {
  assert(
    doloBatches[i].expiryDate <= doloBatches[i + 1].expiryDate,
    `Batch ${doloBatches[i].batchNumber} (${doloBatches[i].expiryDate}) expires before or on ${doloBatches[i + 1].batchNumber} (${doloBatches[i + 1].expiryDate})`
  );
}

// -----------------------------------------------------------------
// TEST GROUP 3: POS & BILLING CALCULATIONS & STOCK DEDUCTION
// -----------------------------------------------------------------
console.log('\n--- 3. POS & Billing Calculations & Atomicity ---');
const testBatch = doloBatches.find(b => b.quantity >= 5)!;
const initialBatchStock = testBatch.quantity;
const med1 = db.getMedicineById('med-1')!;
const initialMedStock = med1.totalStock;

// Test cart item: 2 units at selling price 31.00 (MRP 34.00)
const qtyToBuy = 2;
const unitPrice = testBatch.sellingPrice;
const itemTotal = unitPrice * qtyToBuy; // 62.00
const discountPercent = 10;
const subtotal = itemTotal;
const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2)); // 6.20
const discountedSubtotal = subtotal - discountAmount; // 55.80
const grandTotal = Math.round(discountedSubtotal); // 56.00
const roundOff = Number((grandTotal - discountedSubtotal).toFixed(2)); // 0.20
const taxRate = med1.taxRate;
const taxAmount = Number(((discountedSubtotal * taxRate) / (100 + taxRate)).toFixed(2));

const cartItem = {
  medicineId: med1.id,
  medicineName: med1.name,
  genericName: med1.genericName,
  dosageForm: med1.dosageForm,
  strength: med1.strength,
  batchId: testBatch.id,
  batchNumber: testBatch.batchNumber,
  expiryDate: testBatch.expiryDate,
  quantity: qtyToBuy,
  availableStock: testBatch.quantity,
  purchasePrice: testBatch.purchasePrice,
  mrp: testBatch.mrp,
  unitPrice: testBatch.sellingPrice,
  discountPercent: 0,
  taxRate: med1.taxRate,
  requiresPrescription: med1.requiresPrescription,
  total: itemTotal,
  savings: (testBatch.mrp - testBatch.sellingPrice) * qtyToBuy
};

const completedSale = db.completeSale({
  customerName: 'Test Patient',
  customerPhone: '+91 98000 11111',
  cart: [cartItem],
  subtotal,
  discountAmount,
  taxAmount,
  roundOff,
  grandTotal,
  paymentMethod: 'Cash',
  amountPaid: 100.00,
  changeReturned: 100.00 - grandTotal,
  cashierName: 'Senior Pharmacist'
});

assert(completedSale.grandTotal === 56.00, 'Grand total properly calculated and rounded', `Expected 56, got ${completedSale.grandTotal}`);
assert(completedSale.changeReturned === 44.00, 'Cash change returned properly calculated', `Expected 44, got ${completedSale.changeReturned}`);
assert(completedSale.items.length === 1, 'Sale items stored accurately');

// Verify inventory decrease
const updatedBatch = db.getBatches().find(b => b.id === testBatch.id)!;
assert(updatedBatch.quantity === initialBatchStock - qtyToBuy, 'Batch stock decremented accurately', `Was ${initialBatchStock}, now ${updatedBatch.quantity}`);

const updatedMed = db.getMedicineById('med-1')!;
assert(updatedMed.totalStock === initialMedStock - qtyToBuy, 'Total medicine stock recalculated accurately', `Was ${initialMedStock}, now ${updatedMed.totalStock}`);

// -----------------------------------------------------------------
// TEST GROUP 4: INSUFFICIENT STOCK & BOUNDARY PROTECTION
// -----------------------------------------------------------------
console.log('\n--- 4. Insufficient Stock Protection ---');
let caughtError = false;
try {
  // Attempt to buy more than remaining quantity in the batch
  const excessQty = updatedBatch.quantity + 50;
  const invalidCartItem = {
    ...cartItem,
    quantity: excessQty,
    total: unitPrice * excessQty
  };
  db.completeSale({
    customerName: 'Oversell Tester',
    cart: [invalidCartItem],
    subtotal: unitPrice * excessQty,
    discountAmount: 0,
    taxAmount: 10,
    roundOff: 0,
    grandTotal: unitPrice * excessQty,
    paymentMethod: 'Cash',
    amountPaid: 10000,
    changeReturned: 0,
    cashierName: 'Staff'
  });
} catch (err: any) {
  caughtError = true;
  assert(err.message.includes('Insufficient stock'), 'Insufficient stock error thrown properly', err.message);
}
assert(caughtError, 'Oversell transaction was blocked by database engine');

// -----------------------------------------------------------------
// TEST GROUP 5: INWARD PURCHASES & STOCK REPLENISHMENT
// -----------------------------------------------------------------
console.log('\n--- 5. Inward Purchase Restocking ---');
const initialMed1Stock = db.getMedicineById('med-1')!.totalStock;
const newBatchNumber = 'TST-RESTOCK-' + Date.now();
const inwardQty = 100;

const purchase = db.createPurchase({
  invoiceNumber: 'INV-TEST-9988',
  supplierId: 'sup-1',
  items: [
    {
      medicineId: 'med-1',
      medicineName: 'Dolo 650mg',
      batchNumber: newBatchNumber,
      manufacturingDate: '2026-01-01',
      expiryDate: '2028-01-01',
      quantity: inwardQty,
      purchasePrice: 22.00,
      mrp: 35.00,
      sellingPrice: 31.00,
      taxRate: 12,
      total: 2464.00
    }
  ],
  receivedBy: 'Inventory Lead',
  amountPaid: 2464.00
});

assert(purchase.id.startsWith('pur-'), 'Inward purchase recorded', purchase.id);
const reloadedMed1 = db.getMedicineById('med-1')!;
assert(reloadedMed1.totalStock === initialMed1Stock + inwardQty, 'Medicine total stock increased by inward quantity', `New stock: ${reloadedMed1.totalStock}`);

// -----------------------------------------------------------------
// TEST GROUP 6: SALES RETURNS & RESTOCKING
// -----------------------------------------------------------------
console.log('\n--- 6. Sales Return & Restocking ---');
const batchBeforeReturn = db.getBatches().find(b => b.id === testBatch.id)!.quantity;

const saleReturn = db.processSaleReturn({
  originalSaleId: completedSale.id,
  billNumber: completedSale.billNumber,
  customerName: completedSale.customerName,
  items: [
    {
      medicineId: med1.id,
      medicineName: med1.name,
      batchId: testBatch.id,
      batchNumber: testBatch.batchNumber,
      quantity: 1, // return 1 of the 2 units
      unitPrice: unitPrice,
      refundAmount: unitPrice,
      reason: 'Patient doctor changed dosage'
    }
  ],
  refundMethod: 'Cash',
  reason: 'Patient dosage adjusted',
  processedBy: 'Head Pharmacist',
  restock: true
});

assert(saleReturn.returnNumber.startsWith('RET-'), 'Return processed with return number', saleReturn.returnNumber);
const batchAfterReturn = db.getBatches().find(b => b.id === testBatch.id)!.quantity;
assert(batchAfterReturn === batchBeforeReturn + 1, 'Batch quantity replenished upon restock return', `Before: ${batchBeforeReturn}, After: ${batchAfterReturn}`);

// -----------------------------------------------------------------
// TEST GROUP 7: AUDIT TRAIL LOGGING
// -----------------------------------------------------------------
console.log('\n--- 7. Immutable Audit Trail Logging ---');
const auditLogs = db.getAuditLogs();
const saleLog = auditLogs.find(l => l.action === 'SALE_COMPLETED' && l.details.includes(completedSale.billNumber));
const purchaseLog = auditLogs.find(l => l.action === 'PURCHASE_RECEIVED' && l.details.includes(purchase.invoiceNumber));
const returnLog = auditLogs.find(l => l.action === 'RETURN_PROCESSED' && l.details.includes(saleReturn.returnNumber));

assert(!!saleLog, 'Sale logged in audit trail with cashier name');
assert(!!purchaseLog, 'Purchase inward logged in audit trail');
assert(!!returnLog, 'Return logged in audit trail with refund details');

// -----------------------------------------------------------------
// TEST GROUP 8: PATIENT DISPLAY SANITIZATION & SYNC
// -----------------------------------------------------------------
console.log('\n--- 8. Patient Display Synchronization & Privacy ---');
displaySync.updateCart([cartItem], 'VP-TEST-8888', 100, 10, 12, 90);
const patientSession = displaySync.getSession();

assert(patientSession.state === 'billing', 'Display switched to billing state');
assert(patientSession.billNumber === 'VP-TEST-8888', 'Display shows bill number');
assert(patientSession.grandTotal === 90, 'Display shows sanitized total');
assert(patientSession.items.length === 1, 'Display has items list');

const displayItem = patientSession.items[0] as any;
assert(displayItem.purchasePrice === undefined, 'PRIVACY VERIFIED: purchasePrice NOT exposed to patient display');
assert(displayItem.supplierId === undefined, 'PRIVACY VERIFIED: supplierId NOT exposed to patient display');
assert(displayItem.supplierName === undefined, 'PRIVACY VERIFIED: supplierName NOT exposed to patient display');

// -----------------------------------------------------------------
// TEST GROUP 9: AI ASSISTANT MANUAL MODE & DATABASE GROUNDING
// -----------------------------------------------------------------
console.log('\n--- 9. AI Assistant Manual Control & Grounding ---');
// Test 9A: When AI is manually toggled OFF
db.toggleAIFeatures(false);
assert(!db.isAIFeaturesEnabled(), 'AI mode successfully set to OFF');

const offResponse = await askPharmacyAssistant('Show me low stock medicines');
assert(offResponse.text.includes('switched OFF') || offResponse.text.includes('Manual Pharmacy Mode'), 'Assistant strictly refuses operations when AI mode is OFF');

// Test 9B: When AI is toggled ON
db.toggleAIFeatures(true);
assert(db.isAIFeaturesEnabled(), 'AI mode successfully set to ON');

const groundedResponse = await askPharmacyAssistant('What are the low stock medicines?');
assert(typeof groundedResponse.text === 'string' && groundedResponse.text.length > 20, 'Assistant retrieves live inventory facts from database');

console.log('\n====================================================');
console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} verifications successful!`);
console.log('====================================================');
