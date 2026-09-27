import React, { useState, useEffect } from 'react';
import { Search, Printer, FileText, Calendar, Filter, MessageCircle } from 'lucide-react';
import { db } from '../../services/db';
import { Sale, PharmacySettings } from '../../types';
import { InvoiceModal } from '../invoice/InvoiceModal';

export const SalesHistoryView: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<PharmacySettings>(db.getSettings());
  const [search, setSearch] = useState('');
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<Sale | null>(null);

  useEffect(() => {
    const refresh = () => {
      setSales(db.getSales());
      setSettings(db.getSettings());
    };
    refresh();
    const unsub = db.subscribe(refresh);
    return () => unsub();
  }, []);

  const filteredSales = sales.filter(s =>
    s.billNumber.toLowerCase().includes(search.toLowerCase()) ||
    (s.customerName && s.customerName.toLowerCase().includes(search.toLowerCase())) ||
    (s.customerPhone && s.customerPhone.includes(search)) ||
    s.paymentMethod.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 space-y-6 bg-slate-50 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Sales Invoices & Cashier Records
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Search historical retail receipts, reprint customer tax invoices, and track payment settlements
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Bill #, Customer Name, Phone, or Payment..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Bill Number</th>
              <th className="py-3 px-3">Date & Time</th>
              <th className="py-3 px-3">Patient / Customer</th>
              <th className="py-3 px-3 text-center">Items</th>
              <th className="py-3 px-3 text-center">Payment Mode</th>
              <th className="py-3 px-3 text-right">Subtotal (₹)</th>
              <th className="py-3 px-3 text-right">Tax (₹)</th>
              <th className="py-3 px-4 text-right">Grand Total (₹)</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-4 text-center">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400 font-sans">
                  No sales invoices found matching query.
                </td>
              </tr>
            ) : (
              filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{s.billNumber}</td>
                  <td className="py-3 px-3 text-slate-500 font-sans">
                    {new Date(s.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-3 px-3 font-sans font-medium text-slate-800">
                    {s.customerName || 'Walk-in'}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-700">
                    {s.items.length}
                  </td>
                  <td className="py-3 px-3 text-center font-sans">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-[11px] text-slate-700">
                      {s.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">₹{s.subtotal.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right text-slate-500">₹{s.taxAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    ₹{s.grandTotal.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-center font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {s.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedSaleForPrint(s)}
                        className="px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold flex items-center gap-1 transition-colors"
                        title="View & Print Official Invoice with Signboard"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Invoice</span>
                      </button>
                      <button
                        onClick={() => {
                          let cleanPhone = (s.customerPhone || '').replace(/\D/g, '');
                          if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
                          const text = encodeURIComponent(
                            `🏥 *VINISHA PHARMA — Medical & General Store*\n` +
                            `🧾 *Tax Invoice:* #${s.billNumber}\n` +
                            `👤 Patient: *${s.customerName || 'Valued Customer'}*\n` +
                            `💰 *Total Paid: ₹${s.grandTotal.toFixed(2)}* (${s.paymentMethod})\n` +
                            `💚 Wish you a speedy recovery!\n📞 ${settings.phone}`
                          );
                          const waUrl = cleanPhone 
                            ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`
                            : `https://api.whatsapp.com/send?text=${text}`;
                          window.open(waUrl, '_blank');
                        }}
                        className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                        title="Send invoice summary on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedSaleForPrint && (
        <InvoiceModal
          sale={selectedSaleForPrint}
          settings={settings}
          isOpen={true}
          onClose={() => setSelectedSaleForPrint(null)}
        />
      )}
    </div>
  );
};
