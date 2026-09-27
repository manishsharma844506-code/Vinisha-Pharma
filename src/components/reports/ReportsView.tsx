import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  FileSpreadsheet
} from 'lucide-react';
import { db } from '../../services/db';
import { Sale, Medicine, Batch } from '../../types';

export const ReportsView: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'tax' | 'profit' | 'inventory'>('sales');

  useEffect(() => {
    const refresh = () => {
      setSales(db.getSales());
      setMedicines(db.getMedicines());
      setBatches(db.getBatches());
    };
    refresh();
    const unsub = db.subscribe(refresh);
    return () => unsub();
  }, []);

  // Aggregates
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalTaxCollected = sales.reduce((sum, s) => sum + s.taxAmount, 0);
  const totalDiscountsGiven = sales.reduce((sum, s) => sum + s.discountAmount, 0);

  // Profit estimation (Selling revenue - Inward cost)
  let estimatedCostOfGoods = 0;
  for (const s of sales) {
    for (const it of s.items) {
      const b = batches.find(bat => bat.id === it.batchId);
      const unitCost = b?.purchasePrice || (it.unitPrice * 0.7);
      estimatedCostOfGoods += unitCost * it.quantity;
    }
  }
  const estimatedGrossProfit = totalSalesRevenue - estimatedCostOfGoods;
  const grossMarginPercent = totalSalesRevenue > 0 ? (estimatedGrossProfit / totalSalesRevenue) * 100 : 0;

  // CSV Export
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeReportTab === 'sales') {
      csvContent += 'Invoice Number,Date,Customer,Payment Mode,Items Count,Subtotal,Discount,Tax,Grand Total\n';
      sales.forEach(s => {
        csvContent += `"${s.billNumber}","${s.createdAt}","${s.customerName}","${s.paymentMethod}",${s.items.length},${s.subtotal},${s.discountAmount},${s.taxAmount},${s.grandTotal}\n`;
      });
    } else if (activeReportTab === 'tax') {
      csvContent += 'Invoice Number,Date,Taxable Amount,CGST (50%),SGST (50%),Total GST\n';
      sales.forEach(s => {
        const halfTax = (s.taxAmount / 2).toFixed(2);
        csvContent += `"${s.billNumber}","${s.createdAt}",${(s.grandTotal - s.taxAmount).toFixed(2)},${halfTax},${halfTax},${s.taxAmount}\n`;
      });
    } else {
      csvContent += 'Medicine,Generic,Strength,Form,Total Stock,Min Alert\n';
      medicines.forEach(m => {
        csvContent += `"${m.name}","${m.genericName}","${m.strength}","${m.dosageForm}",${m.totalStock},${m.minStockAlert}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vinisha_pharma_${activeReportTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-slate-50 overflow-y-auto">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Reports & Tax Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready financial ledgers, GST filings, and gross margin analysis
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Sales Revenue</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
            ₹{totalSalesRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{sales.length} completed invoices</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated Gross Profit</span>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-2">
            ₹{estimatedGrossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-emerald-800 mt-1 font-semibold">
            {grossMarginPercent.toFixed(1)}% margin on sales
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GST Output Tax Liability</span>
          <p className="text-2xl font-bold font-mono text-teal-800 mt-2">
            ₹{totalTaxCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Split 50% CGST + 50% SGST</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Discounts Given</span>
          <p className="text-2xl font-bold font-mono text-slate-700 mt-2">
            ₹{totalDiscountsGiven.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Promotional savings to patients</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveReportTab('sales')}
          className={`px-4 py-2.5 border-b-2 transition-all ${
            activeReportTab === 'sales'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Daily Sales Ledger
        </button>
        <button
          onClick={() => setActiveReportTab('tax')}
          className={`px-4 py-2.5 border-b-2 transition-all ${
            activeReportTab === 'tax'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          GST Tax Report (GSTR-1 Ready)
        </button>
        <button
          onClick={() => setActiveReportTab('profit')}
          className={`px-4 py-2.5 border-b-2 transition-all ${
            activeReportTab === 'profit'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Profitability by Item
        </button>
      </div>

      {/* Report Tables */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        {activeReportTab === 'sales' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Patient / Customer</th>
                <th className="py-3 px-3 text-center">Payment Mode</th>
                <th className="py-3 px-3 text-right">Subtotal (₹)</th>
                <th className="py-3 px-3 text-right">Discount (₹)</th>
                <th className="py-3 px-3 text-right">GST (₹)</th>
                <th className="py-3 px-4 text-right">Grand Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{s.billNumber}</td>
                  <td className="py-3 px-3 text-slate-500 font-sans">
                    {new Date(s.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-800">{s.customerName}</td>
                  <td className="py-3 px-3 text-center font-sans">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-[11px] text-slate-700">
                      {s.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">₹{s.subtotal.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right text-emerald-700">
                    {s.discountAmount > 0 ? `-₹${s.discountAmount.toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">₹{s.taxAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">₹{s.grandTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeReportTab === 'tax' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Taxable Turnover (₹)</th>
                <th className="py-3 px-3 text-right">CGST (₹)</th>
                <th className="py-3 px-3 text-right">SGST (₹)</th>
                <th className="py-3 px-4 text-right">Total Tax (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {sales.map((s) => {
                const taxable = s.grandTotal - s.taxAmount;
                const halfTax = s.taxAmount / 2;

                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.billNumber}</td>
                    <td className="py-3 px-3 text-slate-600 font-sans">
                      {new Date(s.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-800">₹{taxable.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-teal-700">₹{halfTax.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-teal-700">₹{halfTax.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">₹{s.taxAmount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeReportTab === 'profit' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Medicine Item</th>
                <th className="py-3 px-3 text-center">Units Sold</th>
                <th className="py-3 px-3 text-right">Gross Revenue (₹)</th>
                <th className="py-3 px-3 text-right">Est. Cost (₹)</th>
                <th className="py-3 px-4 text-right">Gross Profit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {medicines.map((m) => {
                let units = 0;
                let rev = 0;
                for (const s of sales) {
                  for (const it of s.items) {
                    if (it.medicineId === m.id) {
                      units += it.quantity;
                      rev += it.total;
                    }
                  }
                }
                if (units === 0) return null;
                const estCost = rev * 0.7; // baseline cost
                const profit = rev - estCost;

                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">{m.name}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{units}</td>
                    <td className="py-3 px-3 text-right text-slate-900">₹{rev.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-slate-500">₹{estCost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">₹{profit.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
