import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Barcode, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Check, 
  AlertCircle, 
  User, 
  ShieldAlert, 
  Sparkles, 
  FileText,
  Clock,
  Printer
} from 'lucide-react';
import { Medicine, Batch, CartItem, PaymentMethod, Customer, Sale, PharmacySettings } from '../../types';
import { db } from '../../services/db';
import { displaySync } from '../../services/sync';
import { InvoiceModal } from '../invoice/InvoiceModal';
import { VinishaLogo } from '../common/VinishaLogo';

export const POSView: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<PharmacySettings>(db.getSettings());

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [availableBatches, setAvailableBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [quantityInput, setQuantityInput] = useState<number>(1);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billNumber, setBillNumber] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [doctorNameInput, setDoctorNameInput] = useState('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const [posError, setPosError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load initial data and subscribe to DB
  useEffect(() => {
    const refreshData = () => {
      setMedicines(db.getMedicines());
      setBatches(db.getBatches());
      setCustomers(db.getCustomers());
      setSettings(db.getSettings());
    };
    refreshData();
    const unsub = db.subscribe(refreshData);

    // Initial draft bill number
    const salesCount = db.getSales().length;
    setBillNumber(`VP-${new Date().getFullYear()}-${1000 + salesCount + 1}`);

    return () => unsub();
  }, []);

  // Keyboard shortcut listener (F2 focuses search, F4 clears)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Barcode scanner listener (USB scanners emit rapid keyboard events followed by Enter)
  useEffect(() => {
    let lastKeyTime = Date.now();
    let currentBuffer = '';

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is actively typing in a normal text input (unless Enter is pressed)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Scanners type very quickly (<50ms between keys)
      if (diff < 50 && e.key.length === 1) {
        currentBuffer += e.key;
      } else if (diff > 200) {
        currentBuffer = e.key.length === 1 ? e.key : '';
      }

      if (e.key === 'Enter' && currentBuffer.length >= 8) {
        // Barcode detected!
        e.preventDefault();
        const found = medicines.find(m => m.barcode === currentBuffer || m.sku === currentBuffer);
        if (found) {
          handleSelectMedicine(found);
          currentBuffer = '';
        }
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [medicines]);

  // Debounced medicine search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const matched = medicines.filter(m => 
      m.name.toLowerCase().includes(q) ||
      m.genericName.toLowerCase().includes(q) ||
      m.brand.toLowerCase().includes(q) ||
      m.barcode.includes(q) ||
      m.sku.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );

    setSearchResults(matched.slice(0, 8));
  }, [searchQuery, medicines]);

  // When medicine is selected, populate available batches sorted by FEFO
  const handleSelectMedicine = (med: Medicine) => {
    setSelectedMedicine(med);
    const medBatches = batches
      .filter(b => b.medicineId === med.id && b.quantity > 0)
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)); // FEFO

    setAvailableBatches(medBatches);
    setSelectedBatch(medBatches.length > 0 ? medBatches[0] : null);
    setQuantityInput(1);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Add selected item to cart
  const handleAddToCart = () => {
    if (!selectedMedicine || !selectedBatch) return;

    if (quantityInput <= 0) {
      setPosError('Please enter a quantity greater than zero.');
      return;
    }

    // Check existing cart quantity
    const existingInCart = cart.find(item => item.batchId === selectedBatch.id);
    const totalRequested = (existingInCart?.quantity || 0) + quantityInput;

    if (totalRequested > selectedBatch.quantity && !settings.allowNegativeStock) {
      setPosError(`Cannot add ${quantityInput} units. Only ${selectedBatch.quantity} available in batch ${selectedBatch.batchNumber}.`);
      return;
    }

    setPosError(null);

    const unitPrice = selectedBatch.sellingPrice;
    const mrp = selectedBatch.mrp;
    const itemTotal = unitPrice * quantityInput;
    const itemSavings = Math.max(0, (mrp - unitPrice) * quantityInput);

    if (existingInCart) {
      // Update quantity
      setCart(cart.map(item => {
        if (item.batchId === selectedBatch.id) {
          const newQty = item.quantity + quantityInput;
          const newTotal = item.unitPrice * newQty;
          const newSavings = Math.max(0, (item.mrp - item.unitPrice) * newQty);
          return {
            ...item,
            quantity: newQty,
            total: Number(newTotal.toFixed(2)),
            savings: Number(newSavings.toFixed(2))
          };
        }
        return item;
      }));
    } else {
      // Add new item
      const newItem: CartItem = {
        medicineId: selectedMedicine.id,
        medicineName: selectedMedicine.name,
        genericName: selectedMedicine.genericName,
        dosageForm: selectedMedicine.dosageForm,
        strength: selectedMedicine.strength,
        batchId: selectedBatch.id,
        batchNumber: selectedBatch.batchNumber,
        expiryDate: selectedBatch.expiryDate,
        quantity: quantityInput,
        availableStock: selectedBatch.quantity,
        purchasePrice: selectedBatch.purchasePrice,
        mrp: selectedBatch.mrp,
        unitPrice: selectedBatch.sellingPrice,
        discountPercent: 0,
        taxRate: selectedMedicine.taxRate,
        requiresPrescription: selectedMedicine.requiresPrescription,
        total: Number(itemTotal.toFixed(2)),
        savings: Number(itemSavings.toFixed(2))
      };
      setCart([...cart, newItem]);
    }

    // Reset selection
    setSelectedMedicine(null);
    setSelectedBatch(null);
    setQuantityInput(1);
    searchInputRef.current?.focus();
  };

  // Modify cart item quantity
  const handleUpdateCartQuantity = (batchId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(batchId);
      return;
    }

    const item = cart.find(i => i.batchId === batchId);
    if (!item) return;

    if (newQty > item.availableStock && !settings.allowNegativeStock) {
      setPosError(`Only ${item.availableStock} units available for batch ${item.batchNumber}.`);
      return;
    }
    setPosError(null);

    setCart(cart.map(i => {
      if (i.batchId === batchId) {
        const itemTotal = i.unitPrice * newQty;
        const itemSavings = Math.max(0, (i.mrp - i.unitPrice) * newQty);
        return {
          ...i,
          quantity: newQty,
          total: Number(itemTotal.toFixed(2)),
          savings: Number(itemSavings.toFixed(2))
        };
      }
      return i;
    }));
  };

  // Remove cart item
  const handleRemoveCartItem = (batchId: string) => {
    setCart(cart.filter(item => item.batchId !== batchId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
  const discountedSubtotal = subtotal - discountAmount;
  
  // Tax calculation (inclusive)
  const taxAmount = Number(
    cart.reduce((sum, item) => {
      const lineTotal = item.total * (1 - discountPercent / 100);
      return sum + ((lineTotal * item.taxRate) / (100 + item.taxRate));
    }, 0).toFixed(2)
  );

  const rawGrandTotal = discountedSubtotal;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));
  const changeReturned = Math.max(0, cashReceived - grandTotal);

  // Sync with Patient Facing Display automatically whenever cart, discount, or bill changes!
  useEffect(() => {
    if (cart.length === 0) {
      displaySync.setIdle();
    } else {
      displaySync.updateCart(
        cart,
        billNumber,
        subtotal,
        discountAmount,
        taxAmount,
        grandTotal
      );
    }
  }, [cart, billNumber, subtotal, discountAmount, taxAmount, grandTotal]);

  // When payment method changes to UPI, prompt customer display with QR code
  useEffect(() => {
    if (cart.length > 0 && paymentMethod === 'UPI') {
      displaySync.setPaymentPrompt(
        billNumber,
        grandTotal,
        'UPI',
        settings.upiId,
        settings.upiPayeeName
      );
    }
  }, [paymentMethod, cart.length, billNumber, grandTotal, settings]);

  // Customer search & select
  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCustomerNameInput(cust.name);
    setCustomerPhoneInput(cust.phone);
  };

  // Complete Sale
  const handleCompleteSale = () => {
    if (isProcessing) return; // Guard against rapid duplicate clicks

    if (cart.length === 0) {
      setPosError('Cart is empty. Please add medicines to bill before completing sale.');
      return;
    }

    if (paymentMethod === 'Cash' && cashReceived < grandTotal) {
      setPosError(`Received cash (₹${cashReceived.toFixed(2)}) is less than grand total (₹${grandTotal.toFixed(2)}).`);
      return;
    }

    setPosError(null);
    setIsProcessing(true);

    try {
      const sale = db.completeSale({
        customerId: selectedCustomer?.id,
        customerName: customerNameInput || selectedCustomer?.name || 'Walk-in Customer',
        customerPhone: customerPhoneInput || selectedCustomer?.phone,
        doctorName: doctorNameInput || undefined,
        cart,
        subtotal,
        discountAmount,
        taxAmount,
        roundOff,
        grandTotal,
        paymentMethod,
        amountPaid: paymentMethod === 'Cash' ? cashReceived : grandTotal,
        changeReturned: paymentMethod === 'Cash' ? changeReturned : 0,
        cashierName: 'Staff Pharmacist'
      });

      // Update patient display to SUCCESS state
      displaySync.setPaymentSuccess(
        sale.billNumber,
        sale.grandTotal,
        sale.paymentMethod,
        sale.amountPaid,
        sale.changeReturned
      );

      setCompletedSale(sale);
      setShowInvoiceModal(true);

      // Reset POS cart for next sale
      setCart([]);
      setSelectedCustomer(null);
      setCustomerNameInput('');
      setCustomerPhoneInput('');
      setDoctorNameInput('');
      setDiscountPercent(0);
      setCashReceived(0);

      // Generate next bill number
      const nextSalesCount = db.getSales().length;
      setBillNumber(`VP-${new Date().getFullYear()}-${1000 + nextSalesCount + 1}`);
    } catch (err: any) {
      setPosError('Error completing sale: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 p-6 bg-slate-50 flex flex-col gap-6 overflow-hidden">
      {/* Top Header & Fast Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <VinishaLogo size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">POS Billing Counter</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                {billNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              FEFO batch auto-prioritized · Press <span className="font-mono font-semibold text-slate-700">F2</span> to search
            </p>
          </div>
        </div>

        {/* Rapid Search Input */}
        <div className="relative w-full md:w-96">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medicine, generic, barcode (F2)..."
              className="w-full pl-10 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
            />
            <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-72 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map((med) => (
                <div
                  key={med.id}
                  onClick={() => handleSelectMedicine(med)}
                  className="p-3 hover:bg-teal-50/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{med.name}</span>
                      {med.requiresPrescription && (
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                          Rx
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {med.genericName} · {med.dosageForm} · Rack: {med.rackLocation || 'General'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900">
                      Stock: {med.totalStock}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Tax: {med.taxRate}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Non-blocking POS Alert Banner */}
      {posError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-1 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{posError}</span>
          </div>
          <button
            type="button"
            onClick={() => setPosError(null)}
            className="text-red-500 hover:text-red-800 text-xs px-2 py-0.5 rounded hover:bg-red-100 font-bold transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Item Selection Drawer / Bar if a medicine is picked */}
      {selectedMedicine && (
        <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-600 text-white">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                <span>{selectedMedicine.name}</span>
                <span className="text-xs font-normal text-teal-700">({selectedMedicine.strength} {selectedMedicine.dosageForm})</span>
              </h3>
              <p className="text-xs text-teal-800">
                Generic: {selectedMedicine.genericName} · Pack: {selectedMedicine.packSize}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Batch Selector */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-teal-900 tracking-wider mb-1">
                Select Batch (FEFO First)
              </label>
              <select
                value={selectedBatch?.id || ''}
                onChange={(e) => {
                  const b = availableBatches.find(bat => bat.id === e.target.value);
                  setSelectedBatch(b || null);
                }}
                className="text-xs font-mono bg-white border border-teal-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {availableBatches.map((b, idx) => (
                  <option key={b.id} value={b.id}>
                    {idx === 0 ? '⭐ FEFO: ' : ''}{b.batchNumber} (Exp: {b.expiryDate} | Stock: {b.quantity} | MRP: ₹{b.mrp})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity Input */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-teal-900 tracking-wider mb-1">
                Quantity
              </label>
              <div className="flex items-center border border-teal-300 rounded-lg bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantityInput(Math.max(1, quantityInput - 1))}
                  className="px-2.5 py-1.5 text-teal-700 hover:bg-teal-50"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={selectedBatch?.quantity || 999}
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(parseInt(e.target.value, 10) || 1)}
                  className="w-14 text-center text-xs font-mono font-bold text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantityInput(quantityInput + 1)}
                  className="px-2.5 py-1.5 text-teal-700 hover:bg-teal-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Add Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedBatch || selectedBatch.quantity <= 0}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Add to Cart (Enter)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left Cart / Right Bill Totals & Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* Left Cart Table (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Cart Items ({cart.length})
              </span>
              <span className="text-xs text-slate-500">
                · Auto-synced to Patient Facing Screen
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cart</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            {cart.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Barcode className="w-12 h-12 mb-3 text-slate-300 stroke-1" />
                <p className="text-sm font-semibold text-slate-600">Cart is empty</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
                  Search medicines above or scan product barcode using scanner to build the bill.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Item</th>
                    <th className="py-2.5 px-3">Batch & Exp</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">MRP</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">GST</th>
                    <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {cart.map((item) => (
                    <tr key={item.batchId} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-slate-900">{item.medicineName}</div>
                        <div className="text-[11px] text-slate-500">{item.dosageForm} · {item.strength}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="font-bold text-slate-800">{item.batchNumber}</span>
                        <div className="text-[11px] text-slate-500">Exp: {item.expiryDate}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center border border-slate-200 rounded-md bg-white">
                          <button
                            onClick={() => handleUpdateCartQuantity(item.batchId, item.quantity - 1)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-bold text-slate-900 text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateCartQuantity(item.batchId, item.quantity + 1)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500 line-through">
                        ₹{item.mrp.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-900">
                        ₹{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        {item.taxRate}%
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{item.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-center font-sans">
                        <button
                          onClick={() => handleRemoveCartItem(item.batchId)}
                          className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Customer / Doctor Info Footer Bar */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Patient / Customer Name
              </label>
              <input
                type="text"
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                placeholder="Walk-in Patient"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={customerPhoneInput}
                onChange={(e) => setCustomerPhoneInput(e.target.value)}
                placeholder="+91 Mobile number"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Prescribing Doctor (Optional)
              </label>
              <input
                type="text"
                value={doctorNameInput}
                onChange={(e) => setDoctorNameInput(e.target.value)}
                placeholder="Dr. Name / Hospital"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Right Financial Calculation & Payment Panel (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-xl shadow-xs p-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
            Payment & Settlement
          </h3>

          {/* Subtotal, Discount & Tax Breakdowns */}
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span className="font-sans">Subtotal ({cart.length} items):</span>
              <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
            </div>

            {/* Discount selector */}
            <div className="flex items-center justify-between text-slate-600 font-sans">
              <span>Overall Discount:</span>
              <div className="flex items-center gap-1 font-mono">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-12 px-1.5 py-0.5 text-right border border-slate-200 rounded text-xs"
                />
                <span className="text-slate-500">%</span>
              </div>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span className="font-sans">Discount Savings:</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-500">
              <span className="font-sans">Estimated GST (Included):</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>

            {roundOff !== 0 && (
              <div className="flex justify-between text-slate-500">
                <span className="font-sans">Round Off:</span>
                <span>{roundOff > 0 ? '+' : ''}₹{roundOff.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline font-bold">
              <span className="text-sm font-sans text-slate-900">Grand Total:</span>
              <span className="text-2xl text-teal-800">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === 'Cash'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === 'UPI'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>UPI QR</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('Card')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === 'Card'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>
            </div>
          </div>

          {/* Cash Change Calculator */}
          {paymentMethod === 'Cash' && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Cash Tendered:</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">₹</span>
                  <input
                    type="number"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    placeholder={String(grandTotal)}
                    className="w-28 pl-6 pr-2 py-1 text-right font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-600">Return Change:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  ₹{changeReturned.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* UPI Live Status */}
          {paymentMethod === 'UPI' && (
            <div className="p-3 bg-teal-50 rounded-lg border border-teal-200 text-xs space-y-1">
              <p className="font-semibold text-teal-900 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-teal-600" />
                <span>UPI QR Active on Patient Display</span>
              </p>
              <p className="text-[11px] text-teal-700">
                Customer screen is currently displaying QR for ₹{grandTotal.toFixed(2)}. Verify payment confirmation before completing sale.
              </p>
            </div>
          )}

          {/* Complete Sale Action */}
          <button
            type="button"
            onClick={handleCompleteSale}
            disabled={cart.length === 0 || isProcessing}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
          >
            <Check className="w-4 h-4" />
            <span>Complete Sale & Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Invoice Print & Preview Modal */}
      {completedSale && (
        <InvoiceModal
          sale={completedSale}
          settings={settings}
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </div>
  );
};
