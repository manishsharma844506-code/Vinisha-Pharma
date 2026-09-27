import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  Database, 
  FileText, 
  Check, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { db } from '../../services/db';
import { PharmacySettings, AuditLog } from '../../types';
import { VinishaLogo } from '../common/VinishaLogo';
import { SignboardBanner } from '../common/SignboardBanner';
import { LogoUploadCard } from '../common/LogoUploadCard';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<PharmacySettings>(db.getSettings());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(db.getAuditLogs());
  const [isSaved, setIsSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      setSettings(db.getSettings());
      setAuditLogs(db.getAuditLogs());
    };
    const unsub = db.subscribe(update);
    return () => unsub();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleExecuteReset = () => {
    db.resetToDemoData();
    setShowResetConfirm(false);
    setResetSuccessMessage('Database successfully reset to initial demo state.');
    setTimeout(() => setResetSuccessMessage(null), 4000);
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-slate-50 overflow-y-auto max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Pharmacy Configuration & Audit Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage pharmacy statutory credentials, UPI payment details, and review system audit history
          </p>
        </div>

        {isSaved && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>Settings Saved Successfully</span>
          </span>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Store Identity & Brand Assets
          </h3>
          <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-bold">
            {settings.customLogoUrl ? 'Custom Transparent PNG Active' : 'Official Vector Emblem Active'}
          </span>
        </div>

        {/* Dedicated Transparent PNG File Upload Component */}
        <LogoUploadCard
          settings={settings}
          onSettingsUpdate={(updated) => setSettings(updated)}
        />

        {/* Signboard Banner Preview & Download */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Official Store Signboard Letterhead
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically rendered as letterhead in WhatsApp/Email invoices and printouts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/signboard.png"
                download="vinisha_signboard.png"
                className="text-xs px-2.5 py-1 rounded bg-teal-50 border border-teal-200 text-teal-800 font-bold hover:bg-teal-100 transition-colors"
                title="Download high-resolution 3D signboard PNG"
              >
                Download Signboard PNG
              </a>
              <a
                href="/signboard.svg"
                download="vinisha_signboard.svg"
                className="text-xs text-teal-700 font-bold hover:underline"
                title="Download vector 3D signboard SVG"
              >
                Download SVG
              </a>
            </div>
          </div>
          <div className="w-full">
            <SignboardBanner />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Pharmacy Store Name *
            </label>
            <input
              type="text"
              required
              value={settings.pharmacyName}
              onChange={(e) => setSettings({ ...settings, pharmacyName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Store Tagline
            </label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Drug License (DL) Number *
            </label>
            <input
              type="text"
              required
              value={settings.dlNumber}
              onChange={(e) => setSettings({ ...settings, dlNumber: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              GSTIN Registration Number *
            </label>
            <input
              type="text"
              required
              value={settings.gstin}
              onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Store Phone Number
            </label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Official Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              City / State
            </label>
            <input
              type="text"
              value={settings.city}
              onChange={(e) => setSettings({ ...settings, city: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pt-3 pb-2 border-b border-slate-100">
          Customer-Facing Screen & UPI Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              UPI VPA / ID (Generates Dynamic Patient QR) *
            </label>
            <input
              type="text"
              required
              value={settings.upiId}
              onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
              placeholder="e.g. pharmacy@upi"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Payee Merchant Name (Displayed to Customer)
            </label>
            <input
              type="text"
              value={settings.upiPayeeName}
              onChange={(e) => setSettings({ ...settings, upiPayeeName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Default Low Stock Alert Threshold (Units)
            </label>
            <input
              type="number"
              value={settings.lowStockThreshold}
              onChange={(e) => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Expiry Warning Horizon (Days)
            </label>
            <input
              type="number"
              value={settings.expiryWarningDays}
              onChange={(e) => setSettings({ ...settings, expiryWarningDays: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
            />
          </div>
        </div>

        {/* AI Features Manual ON/OFF Mode Controls */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>AI Features Manual Mode Control</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Switch AI assistance, Google search grounding, and image creation on or off as needed.
              </p>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-black tracking-wider ${
              settings.aiFeaturesEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {settings.aiFeaturesEnabled ? 'AI SUITE: ON' : 'AI SUITE: OFF'}
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Master AI Intelligence Mode
                </span>
                <span className="text-[11px] text-slate-500">
                  Enables Gemini operations assistant, batch audits, and inventory suggestions
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.aiFeaturesEnabled}
                onChange={(e) => setSettings({ ...settings, aiFeaturesEnabled: e.target.checked })}
                className="w-4 h-4 accent-teal-600 cursor-pointer"
              />
            </label>

            <label className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
              settings.aiFeaturesEnabled ? 'bg-white border-slate-200 cursor-pointer hover:bg-slate-50' : 'bg-slate-100 border-slate-200/60 opacity-60 cursor-not-allowed'
            }`}>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Live Google Search Grounding
                </span>
                <span className="text-[11px] text-slate-500">
                  Grounds assistant queries with live CDSCO, NPPA, and regulatory web data
                </span>
              </div>
              <input
                type="checkbox"
                disabled={!settings.aiFeaturesEnabled}
                checked={settings.aiSearchGroundingEnabled}
                onChange={(e) => setSettings({ ...settings, aiSearchGroundingEnabled: e.target.checked })}
                className="w-4 h-4 accent-teal-600 cursor-pointer disabled:cursor-not-allowed"
              />
            </label>

            <label className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
              settings.aiFeaturesEnabled ? 'bg-white border-slate-200 cursor-pointer hover:bg-slate-50' : 'bg-slate-100 border-slate-200/60 opacity-60 cursor-not-allowed'
            }`}>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  AI Graphic &amp; Banner Studio
                </span>
                <span className="text-[11px] text-slate-500">
                  Allows generating promotional pharmacy posters, signage, and health awareness graphics
                </span>
              </div>
              <input
                type="checkbox"
                disabled={!settings.aiFeaturesEnabled}
                checked={settings.aiImageToolsEnabled}
                onChange={(e) => setSettings({ ...settings, aiImageToolsEnabled: e.target.checked })}
                className="w-4 h-4 accent-teal-600 cursor-pointer disabled:cursor-not-allowed"
              />
            </label>
          </div>
        </div>

        {resetSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resetSuccessMessage}</span>
          </div>
        )}

        <div className="pt-4 flex flex-wrap justify-between items-center gap-3 border-t border-slate-100">
          {showResetConfirm ? (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs">
              <span className="text-red-800 font-medium">Reset all demo data?</span>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition-colors"
              >
                Yes, Reset
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-2.5 py-1 border border-slate-300 hover:bg-white text-slate-700 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          )}

          <button
            type="submit"
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>

      {/* Security Audit Trail */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Audit Trail & Operational Log ({auditLogs.length} events)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Immutable Log</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900">{log.action}</span>
                <p className="text-[11px] text-slate-500">{log.details}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-slate-500 text-[10px] block">
                  {new Date(log.timestamp).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-semibold text-slate-700">By: {log.performedBy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
