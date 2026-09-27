import React, { useState, useEffect } from 'react';
import { RotateCcw, Search, Check, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { db } from '../../services/db';
import { Sale, SaleReturn } from '../../types';
import { Modal } from '../common/Modal';

export const ReturnsView: React.FC = () => {
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [searchBillQuery, setSearchBillQuery] = useState('');
  const [searchedSale, setSearchedSale] = useState<Sale | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Return items selection
  const [selectedReturnItems, setSelectedReturnItems] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('Prescription Discontinued by Physician');
  const [refundMethod, setRefundMethod] = useState<'Cash' | 'CreditNote' | 'UPI'>('Cash');
  const [restockToBatch, setRestockToBatch] = useState(true);

  useEffect(() => {
    const refresh = () => setReturns(db.getReturns());
    refresh();
    const unsub = db.subscribe(refresh);
    return () => unsub();
  }, []);

  const handleLookupBill = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!searchBillQuery.trim()) return;

    const sale = db.getSaleByBillNumber(searchBillQuery.trim());
    if (!sale) {
      setErrorMessage(`Bill #${searchBillQuery} not found. Please verify the invoice number on the receipt.`);
      return;
    }

    if (sale.status === 'returned') {
      setErrorMessage(`Bill #${sale.billNumber} has already been returned.`);
      return;
    }

    setSearchedSale(sale);
    // Initialize return quantities to 0
    const initialSelection: Record<string, number> = {};
    for (const it of sale.items) {
      initialSelection[it.batchId] = 0;
    }
    setSelectedReturnItems(initialSelection);
    setShowProcessModal(true);
  };

  const handleExecuteReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchedSale) return;

    const itemsToReturn = searchedSale.items
      .filter(it => (selectedReturnItems[it.batchId] || 0) > 0)
      .map(it => {
        const qty = selectedReturnItems[it.batchId];
        const refundAmt = it.unitPrice * qty;
        return {
          medicineId: it.medicineId,
          medicineName: it.medicineName,
          batchId: it.batchId,
          batchNumber: it.batchNumber,
          quantity: qty,
          unitPrice: it.unitPrice,
          refundAmount: Number(refundAmt.toFixed(2)),
          reason: returnReason
        };
      });

    if (itemsToReturn.length === 0) {
      setErrorMessage('Please select at least one item quantity to return.');
      return;
    }

    setErrorMessage(null);
    db.processSaleReturn({
      originalSaleId: searchedSale.id,
      billNumber: searchedSale.billNumber,
      customerName: searchedSale.customerName,
      items: itemsToReturn,
      refundMethod,
      reason: returnReason,
      processedBy: 'Staff Pharmacist',
      restock: restockToBatch
    });

    setShowProcessModal(false);
    setSearchedSale(null);
    setSearchBillQuery('');
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-slate-50 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Sales Returns & Refunds
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Process medicine returns against issued invoices with mandatory stock restock audit
          </p>
        </div>
      </div>

      {/* Non-blocking Error Banner */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-800 text-xs px-2 py-0.5 rounded hover:bg-red-100 font-bold transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bill Lookup Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <form onSubmit={handleLookupBill} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchBillQuery}
              onChange={(e) => setSearchBillQuery(e.target.value)}
              placeholder="Enter Bill / Invoice # to lookup (e.g. VP-2026-1045)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors whitespace-nowrap"
          >
            <span>Lookup Bill</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Past Returns List */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Completed Returns History ({returns.length})
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Return #</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Original Bill</th>
              <th className="py-3 px-3">Customer</th>
              <th className="py-3 px-3">Items Returned</th>
              <th className="py-3 px-3">Reason</th>
              <th className="py-3 px-3 text-center">Restocked</th>
              <th className="py-3 px-4 text-right">Refund Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {returns.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                  No sales returns processed yet.
                </td>
              </tr>
            ) : (
              returns.map((ret) => (
                <tr key={ret.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{ret.returnNumber}</td>
                  <td className="py-3 px-3 text-slate-600 font-sans">
                    {new Date(ret.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-3 font-bold text-teal-800">{ret.billNumber}</td>
                  <td className="py-3 px-3 font-sans text-slate-700">{ret.customerName || 'Walk-in'}</td>
                  <td className="py-3 px-3 font-sans text-slate-600">
                    {ret.items.map(it => `${it.medicineName} (${it.quantity})`).join(', ')}
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-500 max-w-xs truncate">{ret.reason}</td>
                  <td className="py-3 px-3 text-center font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ret.restocked ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ret.restocked ? 'Restocked' : 'Discarded'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-red-700">
                    ₹{ret.totalRefund.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Process Return for Found Bill */}
      {searchedSale && (
        <Modal
          isOpen={showProcessModal}
          onClose={() => setShowProcessModal(false)}
          title={`Process Return for Bill: ${searchedSale.billNumber}`}
          subtitle={`Customer: ${searchedSale.customerName} · Original Grand Total: ₹${searchedSale.grandTotal.toFixed(2)}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleExecuteReturn} className="space-y-4 text-xs">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-semibold border-b">
                  <tr>
                    <th className="p-2.5">Medicine</th>
                    <th className="p-2.5">Batch</th>
                    <th className="p-2.5 text-center">Billed Qty</th>
                    <th className="p-2.5 text-right">Rate</th>
                    <th className="p-2.5 text-center">Return Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {searchedSale.items.map((it) => (
                    <tr key={it.batchId}>
                      <td className="p-2.5 font-sans font-medium text-slate-900">{it.medicineName}</td>
                      <td className="p-2.5 text-slate-600">{it.batchNumber}</td>
                      <td className="p-2.5 text-center font-bold">{it.quantity}</td>
                      <td className="p-2.5 text-right">₹{it.unitPrice.toFixed(2)}</td>
                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max={it.quantity}
                          value={selectedReturnItems[it.batchId] || 0}
                          onChange={(e) => {
                            const val = Math.min(it.quantity, Math.max(0, parseInt(e.target.value, 10) || 0));
                            setSelectedReturnItems({
                              ...selectedReturnItems,
                              [it.batchId]: val
                            });
                          }}
                          className="w-16 px-2 py-1 text-center font-bold text-slate-900 border border-slate-300 rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Reason for Return *
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Prescription Discontinued by Physician">Prescription Discontinued by Physician</option>
                  <option value="Adverse Reaction / Allergy">Adverse Reaction / Allergy</option>
                  <option value="Seal Intact OTC Return">Seal Intact OTC Return</option>
                  <option value="Wrong Formulation Dispensed">Wrong Formulation Dispensed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Refund Method
                </label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Cash">Cash Refund</option>
                  <option value="UPI">UPI Refund</option>
                  <option value="CreditNote">Store Credit Note</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-teal-50 rounded-lg flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-teal-950">
                <input
                  type="checkbox"
                  checked={restockToBatch}
                  onChange={(e) => setRestockToBatch(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Restock returned sealed units back into active batch inventory</span>
              </label>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProcessModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-xs"
              >
                Confirm Return & Issue Refund
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
