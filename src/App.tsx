/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { POSView } from './components/pos/POSView';
import { InventoryView } from './components/inventory/InventoryView';
import { ExpiryManagerView } from './components/expiry/ExpiryManagerView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { CustomersView } from './components/customers/CustomersView';
import { ReturnsView } from './components/returns/ReturnsView';
import { ReportsView } from './components/reports/ReportsView';
import { AIAssistantView } from './components/ai/AIAssistantView';
import { SettingsView } from './components/settings/SettingsView';
import { SalesHistoryView } from './components/sales/SalesHistoryView';
import { PatientDisplay } from './components/patient/PatientDisplay';
import { UserRole, Medicine, Batch } from './types';
import { db } from './services/db';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('Pharmacist');
  const [dualScreenSplit, setDualScreenSplit] = useState<boolean>(true); // Default enabled so users can see the dual-screen innovation immediately!
  const [medicines, setMedicines] = useState<Medicine[]>(db.getMedicines());
  const [batches, setBatches] = useState<Batch[]>(db.getBatches());

  // Check URL path or param for dedicated standalone patient display mode
  const [isStandalonePatientMode, setIsStandalonePatientMode] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const search = window.location.search;
      if (path.includes('patient-display') || search.includes('mode=patient')) {
        setIsStandalonePatientMode(true);
      }
    }
  }, []);

  useEffect(() => {
    const handleDbUpdate = () => {
      setMedicines(db.getMedicines());
      setBatches(db.getBatches());
    };
    const unsub = db.subscribe(handleDbUpdate);
    return () => unsub();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setCurrentTab('pos');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // If user switched role to 'Patient Display' or standalone URL
  if (userRole === 'Patient Display' || isStandalonePatientMode) {
    return (
      <div className="h-screen w-screen bg-slate-900 overflow-hidden flex flex-col">
        <PatientDisplay 
          onCloseSplitView={() => {
            setUserRole('Pharmacist');
            setIsStandalonePatientMode(false);
          }}
        />
      </div>
    );
  }

  // Count low stock items & near expiry batches for sidebar badge indicators
  const today = new Date().toISOString().split('T')[0];
  const lowStockCount = medicines.filter(m => m.totalStock <= m.minStockAlert).length;
  const future60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const expiringCount = batches.filter(b => b.expiryDate <= future60 && b.quantity > 0).length;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Primary Top Bar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        userRole={userRole}
        onRoleChange={setUserRole}
        dualScreenOpen={dualScreenSplit}
        onToggleDualScreen={() => setDualScreenSplit(!dualScreenSplit)}
      />

      {/* Main Workstation Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Workstation View */}
        <div className={`flex-1 flex overflow-hidden transition-all duration-300 ${
          dualScreenSplit ? 'max-w-[65%]' : 'w-full'
        }`}>
          {/* Workstation Sidebar */}
          <Sidebar
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            userRole={userRole}
            lowStockCount={lowStockCount}
            expiringCount={expiringCount}
          />

          {/* Active Workstation Tab Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {currentTab === 'dashboard' && <DashboardView onNavigate={setCurrentTab} />}
            {currentTab === 'pos' && <POSView />}
            {currentTab === 'sales-history' && <SalesHistoryView />}
            {currentTab === 'inventory' && <InventoryView />}
            {currentTab === 'expiry' && <ExpiryManagerView />}
            {currentTab === 'purchases' && <PurchasesView />}
            {currentTab === 'suppliers' && <SuppliersView />}
            {currentTab === 'customers' && <CustomersView />}
            {currentTab === 'returns' && <ReturnsView />}
            {currentTab === 'reports' && <ReportsView />}
            {currentTab === 'ai-assistant' && <AIAssistantView />}
            {currentTab === 'settings' && <SettingsView />}
          </div>
        </div>

        {/* Right Side-by-Side Live Patient Facing Screen (Dual-Screen Architecture) */}
        {dualScreenSplit && (
          <div className="w-[35%] min-w-[380px] h-full flex flex-col border-l border-slate-700 bg-slate-900 animate-in slide-in-from-right duration-200">
            <PatientDisplay
              isSplitView={true}
              onCloseSplitView={() => setDualScreenSplit(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
