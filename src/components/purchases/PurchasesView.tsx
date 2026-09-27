import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  FileText, 
  Trash2, 
  Check, 
  Building2, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { db } from '../../services/db';
import { Purchase, Supplier, Medicine, PurchaseItem } from '../../types';
import { Modal } from '../common/Modal';

export const PurchasesView: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Items to inward
  const [inwardItems, setInwardItems] = useState<Array<{
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
  }>>([]);

  // Draft item entry
  const [selectedMedId, setSelectedMedId] = useState('');
  const [draftBatchNo, setDraftBatchNo] = useState('');
  const [draftMfgDate, setDraftMfgDate] = useState(new Date().toISOString().split('T')[0]);
  const [draftExpDate, setDraftExpDate] = useState('');
  const [draftQty, setDraftQty] = useState(50);
  const [draftPurchasePrice, setDraftPurchasePrice] = useState(20);
  const [draftMrp, setDraftMrp] = useState(35);
  const [draftSellingPrice, setDraftSellingPrice] = useState(32);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setPurchases(db.getPurchases());
      setSuppliers(db.getSuppliers());
      setMedicines(db.getMedicines());
    };
    refresh();
    const unsub = db.subscribe(refresh);
    return () => unsub();
  }, []);

  const handleAddInwardItem = () => {
    setPurchaseError(null);
    const med = medicines.find(m => m.id === selectedMedId);
    if (!med || !draftBatchNo || !draftExpDate) {
      setPurchaseError('Please select a medicine and specify batch number and expiry date.');
      return;
    }

    const itemSubtotal = draftPurchasePrice * draftQty;
    const itemTotal = itemSubtotal + ((itemSubtotal * med.taxRate) / 100);

    const newItem = {
      medicineId: med.id,
      medicineName: med.name,
      batchNumber: draftBatchNo.toUpperCase().trim(),
      manufacturingDate: draftMfgDate,
      expiryDate: draftExpDate,
      quantity: draftQty,
      purchasePrice: draftPurchasePrice,
      mrp: draftMrp,
      sellingPrice: draftSellingPrice,
      taxRate: med.taxRate,
      total: Number(itemTotal.toFixed(2))
    };

    setInwardItems([...inwardItems, newItem]);

    // Reset draft fields
    setSelectedMedId('');
    setDraftBatchNo('');
    setDraftExpDate('');
  };

  const handleRemoveInwardItem = (index: number) => {
    setInwardItems(inwardItems.filter((_, idx) => idx !== index));
  };

  const grandTotal = inwardItems.reduce((sum, item) => sum + item.total, 0);

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseError(null);
    if (!invoiceNumber || !supplierId || inwardItems.length === 0) {
      setPurchaseError('Invoice number, supplier, and at least one inward item are required.');
      return;
    }

    db.createPurchase({
      invoiceNumber: invoiceNumber.trim(),
      supplierId,
      items: inwardItems,
      receivedBy: 'Store Pharmacist',
      amountPaid
    });

    setShowNewPurchaseModal(false);
    setInvoiceNumber('');
    setSupplierId('');
    setInwardItems([]);
    setAmountPaid(0);
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Inward Stock & Purchase Orders
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log distributor purchase invoices and automatically replenish batch inventory
          </p>
        </div>

        <button
          onClick={() => {
            setSupplierId(suppliers[0]?.id || '');
            setShowNewPurchaseModal(true);
          }}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Inward Purchase</span>
        </button>
      </div>

      {/* Purchases List */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Inward Purchase Invoices ({purchases.length})
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Supplier Name</th>
              <th className="py-3 px-3 text-center">Items</th>
              <th className="py-3 px-3 text-right">Subtotal (₹)</th>
              <th className="py-3 px-3 text-right">GST (₹)</th>
              <th className="py-3 px-4 text-right">Grand Total (₹)</th>
              <th className="py-3 px-3 text-center">Payment</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                  No inward purchases recorded yet.
                </td>
              </tr>
            ) : (
              purchases.map((pur) => (
                <tr key={pur.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{pur.invoiceNumber}</td>
                  <td className="py-3 px-3 text-slate-600 font-sans">
                    {new Date(pur.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-3 font-sans font-medium text-slate-800">{pur.supplierName}</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-700">{pur.items.length}</td>
                  <td className="py-3 px-3 text-right text-slate-600">₹{pur.subtotal.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right text-slate-500">₹{pur.taxAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">₹{pur.grandTotal.toFixed(2)}</td>
                  <td className="py-3 px-3 text-center font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pur.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {pur.paymentStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-sans">
                    <button
                      onClick={() => setSelectedPurchase(pur)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium"
                    >
                      View Items
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: New Purchase Invoice */}
      <Modal
        isOpen={showNewPurchaseModal}
        onClose={() => setShowNewPurchaseModal(false)}
        title="Record Inward Purchase Invoice"
        subtitle="Inward received pharmaceutical stocks and create fresh batches"
        maxWidth="3xl"
      >
        <form onSubmit={handleSavePurchase} className="space-y-4 text-xs">
          {purchaseError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
              {purchaseError}
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Purchase Invoice Number *
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. APX-2026-9901"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Distributor / Supplier *
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Amount Paid (₹)
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          {/* Add Item Subsection */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Add Medicine Batch to Inward List
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Medicine Formulation</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="">-- Choose Medicine --</option>
                  {medicines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.strength})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Batch Number</label>
                <input
                  type="text"
                  value={draftBatchNo}
                  onChange={(e) => setDraftBatchNo(e.target.value)}
                  placeholder="e.g. B26-10"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Expiry Date (FEFO)</label>
                <input
                  type="date"
                  value={draftExpDate}
                  onChange={(e) => setDraftExpDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Inward Qty</label>
                <input
                  type="number"
                  min="1"
                  value={draftQty}
                  onChange={(e) => setDraftQty(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Cost Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={draftPurchasePrice}
                  onChange={(e) => setDraftPurchasePrice(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Selling Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={draftSellingPrice}
                  onChange={(e) => setDraftSellingPrice(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddInwardItem}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold"
              >
                + Add Item
              </button>
            </div>
          </div>

          {/* Table of added inward items */}
          {inwardItems.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2">Batch</th>
                    <th className="p-2">Exp</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Cost</th>
                    <th className="p-2 text-right">Selling</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {inwardItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-sans font-medium">{item.medicineName}</td>
                      <td className="p-2 font-bold">{item.batchNumber}</td>
                      <td className="p-2">{item.expiryDate}</td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-right">₹{item.purchasePrice}</td>
                      <td className="p-2 text-right">₹{item.sellingPrice}</td>
                      <td className="p-2 text-right font-bold text-slate-900">₹{item.total}</td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveInwardItem(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-3 bg-slate-50 flex justify-between font-bold text-xs">
                <span>Total Inward Value (Inc GST):</span>
                <span className="font-mono text-slate-900 text-sm">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowNewPurchaseModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inwardItems.length === 0}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs"
            >
              Confirm Inward & Update Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Purchase Items */}
      {selectedPurchase && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPurchase(null)}
          title={`Purchase Invoice: ${selectedPurchase.invoiceNumber}`}
          subtitle={`Supplier: ${selectedPurchase.supplierName} · Date: ${new Date(selectedPurchase.date).toLocaleDateString('en-IN')}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs font-mono">
            <table className="w-full text-left border border-slate-200">
              <thead className="bg-slate-50 uppercase text-[10px] text-slate-500">
                <tr>
                  <th className="p-2 border-b">Medicine</th>
                  <th className="p-2 border-b">Batch</th>
                  <th className="p-2 border-b">Exp</th>
                  <th className="p-2 border-b text-center">Qty</th>
                  <th className="p-2 border-b text-right">Cost (₹)</th>
                  <th className="p-2 border-b text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedPurchase.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-sans font-medium text-slate-900">{it.medicineName}</td>
                    <td className="p-2 font-bold">{it.batchNumber}</td>
                    <td className="p-2 text-slate-600">{it.expiryDate}</td>
                    <td className="p-2 text-center font-bold">{it.quantity}</td>
                    <td className="p-2 text-right">₹{it.purchasePrice.toFixed(2)}</td>
                    <td className="p-2 text-right font-bold text-slate-900">₹{it.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-3 bg-slate-50 rounded-lg flex justify-between font-bold text-xs">
              <span className="font-sans">Invoice Total:</span>
              <span className="text-teal-800 text-sm">₹{selectedPurchase.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
