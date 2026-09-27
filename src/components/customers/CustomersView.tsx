import React, { useState, useEffect } from 'react';
import { Users, Plus, Phone, Award, Clock, ShoppingCart, Search } from 'lucide-react';
import { db } from '../../services/db';
import { Customer, Sale } from '../../types';
import { Modal } from '../common/Modal';

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    const refresh = () => {
      setCustomers(db.getCustomers());
      setSales(db.getSales());
    };
    refresh();
    const unsub = db.subscribe(refresh);
    return () => unsub();
  }, []);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim() || !form.phone.trim()) {
      setFormError('Patient name and contact phone number are required.');
      return;
    }

    db.addCustomer(form);
    setShowAddModal(false);
    setForm({ name: '', phone: '', email: '', address: '', notes: '' });
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const customerPastBills = selectedCustomer 
    ? sales.filter(s => s.customerId === selectedCustomer.id || s.customerPhone === selectedCustomer.phone)
    : [];

  return (
    <div className="flex-1 p-6 space-y-6 bg-slate-50 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Patients & Retail Customers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain customer records, medication purchase history, and loyalty credits
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Patient Record</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name or phone number..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Patient Name</th>
              <th className="py-3 px-3">Phone</th>
              <th className="py-3 px-3">Address</th>
              <th className="py-3 px-3 text-center">Visits</th>
              <th className="py-3 px-3 text-right">Total Spent (₹)</th>
              <th className="py-3 px-3 text-center">Loyalty Points</th>
              <th className="py-3 px-3">Last Visit</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                  No patient records found.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-sans font-bold text-slate-900">{c.name}</td>
                  <td className="py-3 px-3 text-slate-700">{c.phone}</td>
                  <td className="py-3 px-3 font-sans text-slate-600 truncate max-w-xs">{c.address || '—'}</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800">{c.totalPurchases}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">₹{c.totalSpent.toFixed(2)}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                      {c.loyaltyPoints} pts
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-sans">
                    {new Date(c.lastVisit).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium"
                    >
                      History
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Customer */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Patient / Customer"
        subtitle="Collect primary contact details for billing and prescription records"
        maxWidth="lg"
      >
        <form onSubmit={handleAddCustomer} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ramesh Chandra"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 Mobile number"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="patient@gmail.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Residential Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="House #, Street, Locality"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-xs"
            >
              Save Patient Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Patient Purchase History */}
      {selectedCustomer && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCustomer(null)}
          title={`Purchase History: ${selectedCustomer.name}`}
          subtitle={`Phone: ${selectedCustomer.phone} · Loyalty Points: ${selectedCustomer.loyaltyPoints}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {customerPastBills.length === 0 ? (
              <p className="py-6 text-center text-slate-400">
                No past bill records found for this patient.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {customerPastBills.map((s) => (
                  <div key={s.id} className="p-3 hover:bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{s.billNumber}</span>
                      <p className="text-[11px] text-slate-500">
                        {new Date(s.createdAt).toLocaleString('en-IN')} · Mode: {s.paymentMethod}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {s.items.map(it => `${it.medicineName} (${it.quantity})`).join(', ')}
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-sm font-bold text-teal-800">₹{s.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
