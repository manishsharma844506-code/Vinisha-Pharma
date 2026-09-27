import React, { useState, useEffect } from 'react';
import { 
  ClockAlert, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  Trash2,
  Calendar,
  Filter
} from 'lucide-react';
import { db } from '../../services/db';
import { Medicine, Batch } from '../../types';

export const ExpiryManagerView: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'expired' | '30' | '60' | '90' | 'all'>('60');

  useEffect(() => {
    const refresh = () => {
      setMedicines(db.getMedicines());
      setBatches(db.getBatches());
    };
    refresh();
    const unsub = db.subscribe(refresh);
    return () => unsub();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const getDateAfterDays = (days: number) => {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  };

  const day30 = getDateAfterDays(30);
  const day60 = getDateAfterDays(60);
  const day90 = getDateAfterDays(90);

  // Filter batches
  const expiredBatches = batches.filter(b => b.expiryDate < today && b.quantity > 0);
  const expiring30 = batches.filter(b => b.expiryDate >= today && b.expiryDate <= day30 && b.quantity > 0);
  const expiring60 = batches.filter(b => b.expiryDate >= today && b.expiryDate <= day60 && b.quantity > 0);
  const expiring90 = batches.filter(b => b.expiryDate >= today && b.expiryDate <= day90 && b.quantity > 0);

  let displayedBatches = batches;
  if (selectedFilter === 'expired') {
    displayedBatches = expiredBatches;
  } else if (selectedFilter === '30') {
    displayedBatches = expiring30;
  } else if (selectedFilter === '60') {
    displayedBatches = expiring60;
  } else if (selectedFilter === '90') {
    displayedBatches = expiring90;
  }

  // Calculate capital at risk
  const capitalAtRisk = displayedBatches.reduce((sum, b) => sum + (b.quantity * b.purchasePrice), 0);

  const [confirmBatchId, setConfirmBatchId] = useState<string | null>(null);

  const handleSegregateExpired = (batchId: string) => {
    const b = batches.find(bat => bat.id === batchId);
    if (b) {
      db.adjustBatchStock(batchId, -b.quantity, 'Expired Stock Segregation for Safe Destruction / Return');
    }
    setConfirmBatchId(null);
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Batch Expiry Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify expiring stock, mitigate financial loss, and ensure Schedule H / Drug Act compliance
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-500">Capital at Risk:</span>
          <span className="font-bold text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
            ₹{capitalAtRisk.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Filter Tabs & KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setSelectedFilter('expired')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedFilter === 'expired'
              ? 'bg-red-50/80 border-red-300 ring-2 ring-red-100 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-900 uppercase tracking-wide">Expired Batches</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-red-700 mt-2">{expiredBatches.length}</p>
          <p className="text-[11px] text-red-600/90 mt-1">Must be disposed immediately</p>
        </button>

        <button
          onClick={() => setSelectedFilter('30')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedFilter === '30'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-100 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">Expiring in 30 Days</span>
            <ClockAlert className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-800 mt-2">{expiring30.length}</p>
          <p className="text-[11px] text-amber-700/90 mt-1">Priority liquidation / return</p>
        </button>

        <button
          onClick={() => setSelectedFilter('60')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedFilter === '60'
              ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-100 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900 uppercase tracking-wide">Expiring in 60 Days</span>
            <AlertTriangle className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-teal-800 mt-2">{expiring60.length}</p>
          <p className="text-[11px] text-teal-700 mt-1">Flag for distributor return</p>
        </button>

        <button
          onClick={() => setSelectedFilter('90')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedFilter === '90'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-200 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Expiring in 90 Days</span>
            <Calendar className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">{expiring90.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Review reorder quantities</p>
        </button>
      </div>

      {/* Batches Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Flagged Batches ({displayedBatches.length})
          </span>
          <span className="text-xs text-slate-500">
            Sort: FEFO (Ascending Expiry Date)
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Medicine Description</th>
              <th className="py-3 px-3">Batch #</th>
              <th className="py-3 px-3">Supplier Name</th>
              <th className="py-3 px-3">Expiry Date</th>
              <th className="py-3 px-3 text-center">Remaining Units</th>
              <th className="py-3 px-3 text-right">Unit Cost (₹)</th>
              <th className="py-3 px-3 text-right">Cost at Risk (₹)</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {displayedBatches.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                  No batches found in this expiry range.
                </td>
              </tr>
            ) : (
              displayedBatches.map((b) => {
                const med = medicines.find(m => m.id === b.medicineId);
                const isExpired = b.expiryDate < today;
                const costRisk = b.quantity * b.purchasePrice;

                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-sans">
                      <div className="font-bold text-slate-900">{med?.name || 'Unknown'}</div>
                      <div className="text-[11px] text-slate-500">{med?.dosageForm} · {med?.strength}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">{b.batchNumber}</td>
                    <td className="py-3 px-3 font-sans text-slate-600">{b.supplierName || 'Primary Supplier'}</td>
                    <td className="py-3 px-3 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        isExpired 
                          ? 'bg-red-100 text-red-800 font-bold' 
                          : 'bg-amber-100 text-amber-800 font-semibold'
                      }`}>
                        {b.expiryDate} {isExpired ? '(EXPIRED)' : ''}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">{b.quantity}</td>
                    <td className="py-3 px-3 text-right text-slate-600">₹{b.purchasePrice.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-bold text-red-700">₹{costRisk.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center font-sans">
                      {confirmBatchId === b.id ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleSegregateExpired(b.id)}
                            className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmBatchId(null)}
                            className="px-1.5 py-0.5 rounded border border-slate-300 hover:bg-slate-100 text-slate-600 text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmBatchId(b.id)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Segregate / Return
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
