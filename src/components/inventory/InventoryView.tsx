import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Pill, 
  Filter, 
  AlertTriangle, 
  AlertCircle,
  Layers, 
  ShieldAlert, 
  Edit2, 
  Check, 
  X,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { Medicine, Batch, DosageForm, MedicineCategory, Supplier } from '../../types';
import { db } from '../../services/db';
import { Modal } from '../common/Modal';

export const InventoryView: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'LowStock' | 'RxOnly' | 'InStock'>('All');
  const [expandedMedId, setExpandedMedId] = useState<string | null>(null);

  // Modals
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [activeMedicineForBatch, setActiveMedicineForBatch] = useState<Medicine | null>(null);
  const [activeBatchForAdjust, setActiveBatchForAdjust] = useState<Batch | null>(null);

  // Forms
  const [newMedForm, setNewMedForm] = useState({
    name: '',
    genericName: '',
    brand: '',
    category: 'Analgesic & Antipyretic' as MedicineCategory,
    manufacturer: '',
    strength: '',
    dosageForm: 'Tablet' as DosageForm,
    packSize: '10 Tablets / Strip',
    barcode: '',
    sku: '',
    hsnCode: '300490',
    taxRate: 12,
    minStockAlert: 20,
    reorderLevel: 50,
    requiresPrescription: false,
    status: 'active' as const,
    rackLocation: 'A-01-01'
  });

  const [newBatchForm, setNewBatchForm] = useState({
    batchNumber: '',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    quantity: 50,
    purchasePrice: 20,
    mrp: 35,
    sellingPrice: 32,
    supplierId: ''
  });

  const [adjustQtyDelta, setAdjustQtyDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Physical Stock Audit Count');
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setMedicines(db.getMedicines());
      setBatches(db.getBatches());
      setSuppliers(db.getSuppliers());
    };
    refresh();
    const unsub = db.subscribe(refresh);
    return () => unsub();
  }, []);

  // Filtered medicines
  const filteredMedicines = medicines.filter(m => {
    const matchSearch = 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName.toLowerCase().includes(search.toLowerCase()) ||
      m.brand.toLowerCase().includes(search.toLowerCase()) ||
      m.barcode.includes(search) ||
      m.sku.toLowerCase().includes(search.toLowerCase());

    const matchCategory = categoryFilter === 'All' || m.category === categoryFilter;

    let matchStatus = true;
    if (statusFilter === 'LowStock') {
      matchStatus = m.totalStock <= m.minStockAlert;
    } else if (statusFilter === 'RxOnly') {
      matchStatus = m.requiresPrescription;
    } else if (statusFilter === 'InStock') {
      matchStatus = m.totalStock > 0;
    }

    return matchSearch && matchCategory && matchStatus;
  });

  // Handle Add Medicine submit
  const handleAddMedicineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInventoryError(null);
    if (!newMedForm.name.trim()) {
      setInventoryError('Medicine name is required.');
      return;
    }

    const created = db.addMedicine({
      ...newMedForm,
      barcode: newMedForm.barcode || '890' + Math.floor(1000000000 + Math.random() * 9000000000),
      sku: newMedForm.sku || 'MED-' + newMedForm.name.substring(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900)
    });

    setShowAddMedicineModal(false);
    // Prompt to add first batch
    setActiveMedicineForBatch(created);
    setShowAddBatchModal(true);
  };

  // Handle Add Batch submit
  const handleAddBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInventoryError(null);
    if (!activeMedicineForBatch || !newBatchForm.batchNumber || !newBatchForm.expiryDate) {
      setInventoryError('Please fill all required batch fields (Batch #, Expiry Date, Quantity).');
      return;
    }

    const sup = suppliers.find(s => s.id === newBatchForm.supplierId);

    db.addBatch({
      medicineId: activeMedicineForBatch.id,
      batchNumber: newBatchForm.batchNumber.toUpperCase().trim(),
      manufacturingDate: newBatchForm.manufacturingDate,
      expiryDate: newBatchForm.expiryDate,
      quantity: Number(newBatchForm.quantity),
      purchasePrice: Number(newBatchForm.purchasePrice),
      mrp: Number(newBatchForm.mrp),
      sellingPrice: Number(newBatchForm.sellingPrice),
      supplierId: newBatchForm.supplierId || (suppliers[0]?.id || 'sup-1'),
      supplierName: sup?.name || 'Primary Distributor'
    });

    setShowAddBatchModal(false);
    setActiveMedicineForBatch(null);
  };

  // Handle stock adjustment submit
  const handleStockAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInventoryError(null);
    if (!activeBatchForAdjust) return;

    if (adjustQtyDelta === 0) {
      setInventoryError('Adjustment delta cannot be 0.');
      return;
    }

    const success = db.adjustBatchStock(activeBatchForAdjust.id, adjustQtyDelta, adjustReason);
    if (!success) {
      setInventoryError('Failed to adjust stock. Check negative stock policy.');
      return;
    }

    setShowStockAdjustModal(false);
    setActiveBatchForAdjust(null);
    setAdjustQtyDelta(0);
  };

  const categories: MedicineCategory[] = [
    'Analgesic & Antipyretic',
    'Antibiotic & Anti-infective',
    'Gastrointestinal & Antacid',
    'Cardiovascular & Antihypertensive',
    'Antidiabetic',
    'Respiratory & Antiallergic',
    'Vitamins, Minerals & Supplements',
    'Dermatological',
    'First Aid & Surgical',
    'OTC & Wellness'
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex-1 p-6 space-y-6 bg-slate-50 overflow-y-auto">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Medicine Catalog & Stock Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage formulations, pricing, HSN codes, and FEFO-sorted batches
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddMedicineModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Medicine</span>
          </button>
        </div>
      </div>

      {/* Non-blocking Inventory Error Banner */}
      {inventoryError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{inventoryError}</span>
          </div>
          <button
            type="button"
            onClick={() => setInventoryError(null)}
            className="text-red-500 hover:text-red-800 text-xs px-2 py-0.5 rounded hover:bg-red-100 font-bold transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, generic, barcode, SKU..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto text-xs">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'All' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Items ({medicines.length})
            </button>
            <button
              onClick={() => setStatusFilter('LowStock')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'LowStock' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStatusFilter('RxOnly')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'RxOnly' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Prescription (Rx)
            </button>
            <button
              onClick={() => setStatusFilter('InStock')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'InStock' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              In Stock Only
            </button>
          </div>
        </div>

        {/* Category horizontal pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pr-2">
            Category:
          </span>
          <button
            onClick={() => setCategoryFilter('All')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              categoryFilter === 'All' ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === c ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 w-8"></th>
              <th className="py-3 px-3">Medicine Formulation</th>
              <th className="py-3 px-3">Generic / Salt</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Rack</th>
              <th className="py-3 px-3 text-center">Rx</th>
              <th className="py-3 px-3 text-center">GST %</th>
              <th className="py-3 px-4 text-right">Available Stock</th>
              <th className="py-3 px-4 text-center">Batches</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMedicines.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  No medicines match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredMedicines.map((med) => {
                const medBatches = batches.filter(b => b.medicineId === med.id);
                const isExpanded = expandedMedId === med.id;
                const isLowStock = med.totalStock <= med.minStockAlert;

                return (
                  <React.Fragment key={med.id}>
                    <tr 
                      className={`hover:bg-slate-50/70 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-slate-50/90 font-medium' : ''
                      }`}
                      onClick={() => setExpandedMedId(isExpanded ? null : med.id)}
                    >
                      <td className="py-3 px-4 text-slate-400">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-teal-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{med.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {med.strength} · {med.dosageForm} · {med.manufacturer}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{med.genericName}</td>
                      <td className="py-3 px-3 text-slate-600">{med.category}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{med.rackLocation || 'General'}</td>
                      <td className="py-3 px-3 text-center">
                        {med.requiresPrescription ? (
                          <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                            Rx
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">OTC</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        {med.taxRate}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <span className={`font-bold text-sm ${
                          isLowStock ? 'text-red-600' : 'text-slate-900'
                        }`}>
                          {med.totalStock}
                        </span>
                        {isLowStock && (
                          <span className="block text-[10px] text-red-500 font-sans font-medium">
                            Low (Alert: {med.minStockAlert})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                          {medBatches.length} {medBatches.length === 1 ? 'batch' : 'batches'}
                        </span>
                      </td>
                    </tr>

                    {/* Expandable Batches Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80 border-y border-slate-200">
                        <td colSpan={9} className="p-4 pl-12">
                          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-teal-600" />
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                  Batches for {med.name} (Sorted by FEFO - First Expiry)
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setActiveMedicineForBatch(med);
                                  setShowAddBatchModal(true);
                                }}
                                className="px-3 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add New Batch</span>
                              </button>
                            </div>

                            {medBatches.length === 0 ? (
                              <p className="py-4 text-center text-xs text-slate-400">
                                No active batches found for this formulation.
                              </p>
                            ) : (
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold">
                                  <tr>
                                    <th className="py-2 px-3">Batch #</th>
                                    <th className="py-2 px-3">Mfg Date</th>
                                    <th className="py-2 px-3">Expiry Date</th>
                                    <th className="py-2 px-3 text-right">Purchase (₹)</th>
                                    <th className="py-2 px-3 text-right">MRP (₹)</th>
                                    <th className="py-2 px-3 text-right">Selling (₹)</th>
                                    <th className="py-2 px-3 text-center">Available Qty</th>
                                    <th className="py-2 px-3 text-center">Status</th>
                                    <th className="py-2 px-3 text-center">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono">
                                  {medBatches.map((b, bIdx) => {
                                    const isExpired = b.expiryDate < todayStr;

                                    return (
                                      <tr key={b.id} className="hover:bg-slate-50">
                                        <td className="py-2 px-3 font-bold text-slate-900">
                                          {bIdx === 0 && !isExpired && (
                                            <span className="mr-1 text-[10px] font-sans px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                              FEFO
                                            </span>
                                          )}
                                          {b.batchNumber}
                                        </td>
                                        <td className="py-2 px-3 text-slate-500">{b.manufacturingDate}</td>
                                        <td className="py-2 px-3 text-slate-800 font-semibold">{b.expiryDate}</td>
                                        <td className="py-2 px-3 text-right text-slate-600">₹{b.purchasePrice.toFixed(2)}</td>
                                        <td className="py-2 px-3 text-right text-slate-500 line-through">₹{b.mrp.toFixed(2)}</td>
                                        <td className="py-2 px-3 text-right font-bold text-teal-800">₹{b.sellingPrice.toFixed(2)}</td>
                                        <td className="py-2 px-3 text-center font-bold text-slate-900">{b.quantity}</td>
                                        <td className="py-2 px-3 text-center font-sans">
                                          {isExpired ? (
                                            <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                                              EXPIRED
                                            </span>
                                          ) : b.quantity === 0 ? (
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                              Out of Stock
                                            </span>
                                          ) : (
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                              Active
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-center font-sans">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveBatchForAdjust(b);
                                              setAdjustQtyDelta(0);
                                              setShowStockAdjustModal(true);
                                            }}
                                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium"
                                          >
                                            Adjust Stock
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add New Medicine */}
      <Modal
        isOpen={showAddMedicineModal}
        onClose={() => setShowAddMedicineModal(false)}
        title="Add New Medicine Formulation"
        subtitle="Create master product catalog entry with regulatory and pricing fields"
        maxWidth="2xl"
      >
        <form onSubmit={handleAddMedicineSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Medicine Name *
              </label>
              <input
                type="text"
                required
                value={newMedForm.name}
                onChange={(e) => setNewMedForm({ ...newMedForm, name: e.target.value })}
                placeholder="e.g. Paracetamol 650mg"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Generic Name (Active Ingredient) *
              </label>
              <input
                type="text"
                required
                value={newMedForm.genericName}
                onChange={(e) => setNewMedForm({ ...newMedForm, genericName: e.target.value })}
                placeholder="e.g. Paracetamol"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Brand Name
              </label>
              <input
                type="text"
                value={newMedForm.brand}
                onChange={(e) => setNewMedForm({ ...newMedForm, brand: e.target.value })}
                placeholder="e.g. Dolo 650"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Strength
              </label>
              <input
                type="text"
                value={newMedForm.strength}
                onChange={(e) => setNewMedForm({ ...newMedForm, strength: e.target.value })}
                placeholder="e.g. 650mg"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Dosage Form
              </label>
              <select
                value={newMedForm.dosageForm}
                onChange={(e) => setNewMedForm({ ...newMedForm, dosageForm: e.target.value as DosageForm })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Suspension">Suspension</option>
                <option value="Injection">Injection</option>
                <option value="Ointment">Ointment</option>
                <option value="Gel">Gel</option>
                <option value="Drops">Drops</option>
                <option value="Powder">Powder</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={newMedForm.category}
                onChange={(e) => setNewMedForm({ ...newMedForm, category: e.target.value as MedicineCategory })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                value={newMedForm.manufacturer}
                onChange={(e) => setNewMedForm({ ...newMedForm, manufacturer: e.target.value })}
                placeholder="e.g. Micro Labs"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Pack Size
              </label>
              <input
                type="text"
                value={newMedForm.packSize}
                onChange={(e) => setNewMedForm({ ...newMedForm, packSize: e.target.value })}
                placeholder="e.g. 15 Tablets / Strip"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                GST Rate (%)
              </label>
              <select
                value={newMedForm.taxRate}
                onChange={(e) => setNewMedForm({ ...newMedForm, taxRate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              >
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST</option>
                <option value={0}>0% (Exempt)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Min Stock Alert
              </label>
              <input
                type="number"
                value={newMedForm.minStockAlert}
                onChange={(e) => setNewMedForm({ ...newMedForm, minStockAlert: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Rack Location
              </label>
              <input
                type="text"
                value={newMedForm.rackLocation}
                onChange={(e) => setNewMedForm({ ...newMedForm, rackLocation: e.target.value })}
                placeholder="e.g. A-02-04"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="prescriptionReq"
              checked={newMedForm.requiresPrescription}
              onChange={(e) => setNewMedForm({ ...newMedForm, requiresPrescription: e.target.checked })}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="prescriptionReq" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Schedule H / H1 Drug (Prescription Required)
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddMedicineModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-xs"
            >
              Save & Proceed to Batch Entry
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add New Batch */}
      <Modal
        isOpen={showAddBatchModal}
        onClose={() => setShowAddBatchModal(false)}
        title={`Add Batch: ${activeMedicineForBatch?.name}`}
        subtitle="Record new batch number, manufacturer dates, cost, and selling rates"
        maxWidth="lg"
      >
        <form onSubmit={handleAddBatchSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Batch Number *
              </label>
              <input
                type="text"
                required
                value={newBatchForm.batchNumber}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, batchNumber: e.target.value })}
                placeholder="e.g. DL26K90"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Quantity (Units) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={newBatchForm.quantity}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Manufacturing Date
              </label>
              <input
                type="date"
                required
                value={newBatchForm.manufacturingDate}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, manufacturingDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Expiry Date * (FEFO)
              </label>
              <input
                type="date"
                required
                value={newBatchForm.expiryDate}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, expiryDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Purchase Cost (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={newBatchForm.purchasePrice}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, purchasePrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                MRP (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={newBatchForm.mrp}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, mrp: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Selling Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={newBatchForm.sellingPrice}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, sellingPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono font-bold"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddBatchModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-xs"
            >
              Save Batch
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Adjust Batch Stock */}
      <Modal
        isOpen={showStockAdjustModal}
        onClose={() => setShowStockAdjustModal(false)}
        title="Stock Level Adjustment"
        subtitle={`Batch ${activeBatchForAdjust?.batchNumber} · Current: ${activeBatchForAdjust?.quantity} units`}
        maxWidth="md"
      >
        <form onSubmit={handleStockAdjustSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Quantity Delta (+ to increase, - to decrease)
            </label>
            <input
              type="number"
              required
              value={adjustQtyDelta}
              onChange={(e) => setAdjustQtyDelta(Number(e.target.value))}
              placeholder="e.g. -5 or +10"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono font-bold text-slate-900"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              New quantity will be: <strong className="font-mono text-slate-900">{(activeBatchForAdjust?.quantity || 0) + adjustQtyDelta}</strong> units.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Reason for Adjustment (Recorded in Audit Trail) *
            </label>
            <select
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="Physical Stock Audit Count">Physical Stock Audit Count</option>
              <option value="Damaged / Broken Ampoule / Strip">Damaged / Broken Ampoule / Strip</option>
              <option value="Expired Stock Segregation">Expired Stock Segregation</option>
              <option value="Correction of Inward Discrepancy">Correction of Inward Discrepancy</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowStockAdjustModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-xs"
            >
              Confirm Stock Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
