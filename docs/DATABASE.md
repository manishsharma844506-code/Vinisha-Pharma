# Vinisha Pharma — Database Schema & Data Models

## 1. Entities & Relationships

### `Medicines`
- `id`: string (UUID)
- `name`: string (e.g. "Paracetamol 650mg")
- `genericName`: string (e.g. "Paracetamol")
- `brand`: string (e.g. "Dolo 650", "Calpol")
- `category`: string (e.g. "Analgesic & Antipyretic", "Antibiotic", "Gastrointestinal", "Vitamins & Supplements")
- `manufacturer`: string (e.g. "Micro Labs", "GlaxoSmithKline", "Cipla")
- `strength`: string (e.g. "650mg", "500mg", "10mg")
- `dosageForm`: "Tablet" | "Capsule" | "Syrup" | "Injection" | "Ointment" | "Drops" | "Powder"
- `packSize`: string (e.g. "15 Tablets / Strip", "100ml Bottle")
- `barcode`: string (e.g. "8901234567890")
- `sku`: string (e.g. "MED-DOLO-650")
- `hsnCode`: string (e.g. "300490")
- `taxRate`: number (GST % e.g. 5, 12, 18)
- `minStockAlert`: number (e.g. 50)
- `reorderLevel`: number (e.g. 100)
- `requiresPrescription`: boolean
- `status`: "active" | "inactive"
- `totalStock`: number (sum of active batch quantities)

### `Batches`
- `id`: string (UUID)
- `medicineId`: string (FK -> Medicines.id)
- `batchNumber`: string (e.g. "DL24K09")
- `manufacturingDate`: string (YYYY-MM-DD)
- `expiryDate`: string (YYYY-MM-DD)
- `quantity`: number (available units)
- `purchasePrice`: number (cost per unit)
- `mrp`: number (Maximum Retail Price)
- `sellingPrice`: number (retail selling price)
- `supplierId`: string (FK -> Suppliers.id)

### `Suppliers`
- `id`: string (UUID)
- `name`: string (e.g. "Astra Med Distributors")
- `contactPerson`: string
- `phone`: string
- `email`: string
- `address`: string
- `gstin`: string
- `paymentTerms`: string (e.g. "Net 30")
- `balance`: number (current outstanding)

### `Purchases` & `PurchaseItems`
- `id`: string (UUID)
- `invoiceNumber`: string (e.g. "INV-PUR-8921")
- `supplierId`: string (FK -> Suppliers.id)
- `date`: string (ISO)
- `totalAmount`: number
- `taxAmount`: number
- `status`: "received" | "draft"
- `items`: Array<{ medicineId, batchNumber, mfgDate, expiryDate, quantity, purchasePrice, mrp, sellingPrice, taxRate, total }>

### `Sales` & `SaleItems`
- `id`: string (UUID)
- `billNumber`: string (e.g. "VP-2026-1049")
- `customerId`?: string (FK -> Customers.id)
- `customerName`?: string
- `customerPhone`?: string
- `doctorName`?: string
- `prescriptionRef`?: string
- `items`: Array<{ medicineId, medicineName, batchId, batchNumber, expiryDate, quantity, unitPrice, mrp, discountPercent, taxRate, total }>
- `subtotal`: number
- `discountAmount`: number
- `taxAmount`: number
- `roundOff`: number
- `grandTotal`: number
- `paymentMethod`: "Cash" | "UPI" | "Card" | "Split"
- `amountPaid`: number
- `changeReturned`: number
- `status`: "completed" | "returned" | "partial_return"
- `cashierName`: string
- `createdAt`: string (ISO)

### `Customers`
- `id`: string (UUID)
- `name`: string
- `phone`: string
- `email`?: string
- `address`?: string
- `totalPurchases`: number
- `loyaltyPoints`: number
- `createdAt`: string (ISO)

### `Returns` & `ReturnItems`
- `id`: string (UUID)
- `returnNumber`: string (e.g. "RET-2026-081")
- `originalSaleId`: string (FK -> Sales.id)
- `billNumber`: string
- `customerName`?: string
- `date`: string (ISO)
- `items`: Array<{ medicineId, medicineName, batchId, batchNumber, quantity, refundAmount, reason }>
- `totalRefund`: number
- `reason`: string
- `restocked`: boolean

### `DisplaySession` (Real-Time Customer Screen State)
- `state`: "idle" | "billing" | "payment" | "success"
- `billNumber`: string
- `items`: Array<{ id, medicineName, strength, dosageForm, quantity, unitPrice, total, savings }>
- `subtotal`: number
- `taxAmount`: number
- `discountAmount`: number
- `grandTotal`: number
- `totalSavings`: number
- `paymentMethod`?: string
- `upiPayload`?: { upiId: string, amount: number, payeeName: string, qrData: string }
- `lastUpdated`: number
