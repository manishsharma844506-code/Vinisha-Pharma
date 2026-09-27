import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  QrCode, 
  Heart, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Maximize2, 
  Minimize2,
  Phone,
  Pill,
  CreditCard,
  Banknote
} from 'lucide-react';
import { DisplaySession, PharmacySettings } from '../../types';
import { displaySync } from '../../services/sync';
import { db } from '../../services/db';
import { VinishaLogo } from '../common/VinishaLogo';
import { SignboardBanner } from '../common/SignboardBanner';

interface PatientDisplayProps {
  isSplitView?: boolean;
  onCloseSplitView?: () => void;
}

export const PatientDisplay: React.FC<PatientDisplayProps> = ({ 
  isSplitView = false,
  onCloseSplitView 
}) => {
  const [session, setSession] = useState<DisplaySession>(displaySync.getSession());
  const [settings, setSettings] = useState<PharmacySettings>(db.getSettings());
  const [syncStatus, setSyncStatus] = useState<'connected' | 'reconnecting' | 'offline'>('connected');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const unsubSync = displaySync.subscribe((newSession) => {
      setSession(newSession);
    });
    const unsubStatus = displaySync.subscribeStatus((status) => {
      setSyncStatus(status);
    });
    const unsubDb = db.subscribe(() => {
      setSettings(db.getSettings());
    });
    return () => {
      unsubSync();
      unsubStatus();
      unsubDb();
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const healthTips = [
    {
      title: 'Antibiotic Discipline',
      tip: 'Always complete the full prescribed antibiotic course, even if symptoms subside earlier.'
    },
    {
      title: 'Medication Storage',
      tip: 'Keep eye drops, ointments, and syrups away from direct sunlight in cool, dry storage.'
    },
    {
      title: 'Hydration & Health',
      tip: 'Drink at least 2.5 liters of clean water daily when taking antipyretics and rehydration salts.'
    }
  ];

  const currentTip = healthTips[Math.floor(Date.now() / 15000) % healthTips.length];

  return (
    <div className={`h-full flex flex-col bg-slate-900 text-slate-100 select-none overflow-hidden ${
      isSplitView ? 'border-l border-slate-700 shadow-2xl' : ''
    }`}>
      {/* Top Banner with Pharmacy Branding */}
      <header className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <VinishaLogo size="md" variant="light" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
              <span>{settings.pharmacyName}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Patient Display
              </span>
              {syncStatus === 'connected' ? (
                <span className="text-[10px] font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Sync</span>
                </span>
              ) : syncStatus === 'reconnecting' ? (
                <span className="text-[10px] font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Reconnecting</span>
                </span>
              ) : (
                <span className="text-[10px] font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/30">
                  <span>Local Mode</span>
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400">
              DL: <span className="font-mono text-slate-300">{settings.dlNumber}</span> · GSTIN: <span className="font-mono text-slate-300">{settings.gstin}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>8:00 AM – 11:00 PM</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {isSplitView && onCloseSplitView && (
            <button
              onClick={onCloseSplitView}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              Close
            </button>
          )}
        </div>
      </header>

      {/* Main Dynamic Screen Area */}
      <main className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
        {/* STATE 1: IDLE WELCOME */}
        {session.state === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto py-6">
            {/* Store Signboard Banner */}
            <div className="w-full mb-6">
              <SignboardBanner />
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-xl flex items-center justify-center">
                <VinishaLogo size={68} variant="light" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Welcome to {settings.pharmacyName}
                </h2>
                <p className="text-xs text-teal-400 font-semibold tracking-wide uppercase">
                  {settings.tagline}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Professional Healthcare &amp; Genuine Quality Medicines
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 w-full text-left">
              <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80">
                <div className="flex items-center gap-2 text-teal-400 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">100% Genuine</span>
                </div>
                <p className="text-xs text-slate-300">
                  All batches sourced directly from certified pharmaceutical distributors.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80">
                <div className="flex items-center gap-2 text-teal-400 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">Smart Savings</span>
                </div>
                <p className="text-xs text-slate-300">
                  Transparent retail discounts applied automatically at billing.
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-teal-950/40 border border-teal-800/60 w-full text-left flex items-start gap-3">
              <Heart className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-teal-300 uppercase tracking-wide">
                  Health Awareness: {currentTip.title}
                </p>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {currentTip.tip}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STATE 2: LIVE BILLING CART */}
        {session.state === 'billing' && (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-teal-400" />
                  <span className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Current Bill
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300">
                    {session.billNumber || 'In Progress'}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {session.items.length} {session.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items List */}
              <div className="mt-4 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {session.items.map((item, idx) => (
                  <div 
                    key={item.id + idx}
                    className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-slate-700 text-slate-300 text-xs font-mono flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {item.medicineName}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {item.dosageForm} · {item.strength}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-3 justify-end">
                        <span className="text-xs font-mono text-slate-300 bg-slate-700/60 px-2 py-0.5 rounded">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-base font-bold font-mono text-white">
                          ₹{item.total.toFixed(2)}
                        </span>
                      </div>
                      {item.savings > 0 && (
                        <p className="text-[11px] text-emerald-400 font-medium">
                          Saved ₹{item.savings.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Summary Box */}
            <div className="mt-6 p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl">
              <div className="grid grid-cols-3 gap-4 text-xs text-slate-400 pb-3 border-b border-slate-800/80">
                <div>
                  <span className="block text-slate-400 uppercase text-[10px] font-semibold">Subtotal</span>
                  <span className="text-sm font-mono text-slate-200">₹{session.subtotal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-slate-400 uppercase text-[10px] font-semibold">GST Included</span>
                  <span className="text-sm font-mono text-slate-200">₹{session.taxAmount.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="block text-slate-400 uppercase text-[10px] font-semibold">Total Savings</span>
                  <span className="text-sm font-mono text-emerald-400 font-bold">
                    ₹{session.totalSavings.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-teal-400 font-semibold uppercase tracking-wider">
                    Total Amount Due
                  </span>
                  <p className="text-[11px] text-slate-400">Inclusive of all applicable taxes</p>
                </div>
                <div className="text-3xl font-extrabold font-mono text-white">
                  ₹{session.grandTotal.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATE 3: PAYMENT PROMPT & DYNAMIC UPI QR */}
        {session.state === 'payment' && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto py-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6" />
            </div>

            <h3 className="text-2xl font-bold text-white tracking-tight">
              Please Complete Payment
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Bill Number: <span className="font-mono text-slate-300 font-semibold">{session.billNumber}</span>
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-white text-slate-900 shadow-2xl flex flex-col items-center">
              {/* Dynamic QR Code representation */}
              <div className="relative p-3 bg-white rounded-xl border border-slate-200 flex flex-col items-center">
                <svg className="w-48 h-48" viewBox="0 0 200 200" fill="none">
                  {/* Outer Frame */}
                  <rect width="200" height="200" fill="white" />
                  {/* Top-left corner finder */}
                  <rect x="15" y="15" width="45" height="45" fill="black" rx="6" />
                  <rect x="22" y="22" width="31" height="31" fill="white" rx="4" />
                  <rect x="28" y="28" width="19" height="19" fill="black" rx="2" />
                  {/* Top-right corner finder */}
                  <rect x="140" y="15" width="45" height="45" fill="black" rx="6" />
                  <rect x="147" y="22" width="31" height="31" fill="white" rx="4" />
                  <rect x="153" y="28" width="19" height="19" fill="black" rx="2" />
                  {/* Bottom-left corner finder */}
                  <rect x="15" y="140" width="45" height="45" fill="black" rx="6" />
                  <rect x="22" y="147" width="31" height="31" fill="white" rx="4" />
                  <rect x="28" y="153" width="19" height="19" fill="black" rx="2" />
                  {/* QR Data Pattern Simulation */}
                  <g fill="#0F172A">
                    <rect x="70" y="20" width="10" height="10" />
                    <rect x="90" y="20" width="10" height="10" />
                    <rect x="110" y="20" width="10" height="10" />
                    <rect x="70" y="40" width="10" height="10" />
                    <rect x="100" y="40" width="20" height="10" />
                    <rect x="20" y="70" width="10" height="10" />
                    <rect x="40" y="70" width="20" height="10" />
                    <rect x="80" y="70" width="40" height="10" />
                    <rect x="140" y="70" width="20" height="10" />
                    <rect x="170" y="70" width="10" height="10" />
                    <rect x="30" y="90" width="20" height="10" />
                    <rect x="70" y="90" width="20" height="10" />
                    <rect x="110" y="90" width="20" height="10" />
                    <rect x="150" y="90" width="30" height="10" />
                    <rect x="20" y="110" width="30" height="10" />
                    <rect x="70" y="110" width="10" height="10" />
                    <rect x="100" y="110" width="30" height="10" />
                    <rect x="150" y="110" width="20" height="10" />
                    <rect x="70" y="130" width="20" height="10" />
                    <rect x="110" y="130" width="10" height="10" />
                    <rect x="140" y="130" width="20" height="10" />
                    <rect x="70" y="150" width="10" height="10" />
                    <rect x="90" y="150" width="30" height="10" />
                    <rect x="140" y="150" width="10" height="10" />
                    <rect x="170" y="150" width="10" height="10" />
                    <rect x="80" y="170" width="20" height="10" />
                    <rect x="120" y="170" width="20" height="10" />
                    <rect x="160" y="170" width="20" height="10" />
                  </g>
                  {/* Center Badge */}
                  <circle cx="100" cy="100" r="16" fill="white" />
                  <circle cx="100" cy="100" r="13" fill="#0D9488" />
                  <path d="M96 100 L99 103 L105 97" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                <div className="mt-2 text-center">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Scan with any UPI App
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono">
                    GPay · PhonePe · Paytm · BHIM
                  </p>
                </div>
              </div>

              <div className="mt-3 text-center">
                <span className="text-xs text-slate-500 uppercase font-semibold">Payable Amount</span>
                <p className="text-2xl font-black font-mono text-teal-800">
                  ₹{session.grandTotal.toFixed(2)}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  UPI ID: {settings.upiId}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-teal-400" />
                <span>Cash accepted</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-teal-400" />
                <span>Cards accepted</span>
              </span>
            </div>
          </div>
        )}

        {/* STATE 4: SUCCESS CONFIRMATION */}
        {session.state === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto py-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-6 shadow-xl shadow-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Payment Successful!
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Thank you for trusting <span className="font-semibold text-white">{settings.pharmacyName}</span>
            </p>

            <div className="mt-6 w-full p-5 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Invoice / Bill #</span>
                <span className="font-mono text-slate-200 font-semibold">{session.billNumber}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Payment Mode</span>
                <span className="text-slate-200 font-semibold">{session.paymentMethod || 'UPI'}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Amount Paid</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  ₹{session.grandTotal.toFixed(2)}
                </span>
              </div>

              {session.changeReturned !== undefined && session.changeReturned > 0 && (
                <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>Cash Change Returned</span>
                  <span className="font-mono text-teal-300 font-bold text-sm">
                    ₹{session.changeReturned.toFixed(2)}
                  </span>
                </div>
              )}

              {session.totalSavings > 0 && (
                <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-center">
                  <p className="text-xs text-emerald-300 font-semibold">
                    🎉 You saved ₹{session.totalSavings.toFixed(2)} on this order!
                  </p>
                </div>
              )}
            </div>

            <p className="mt-6 text-xs text-slate-400">
              Please collect your invoice receipt and medicines from the counter.
            </p>
          </div>
        )}

        {/* Persistent Bottom Contact Bar */}
        <footer className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-teal-400" />
            <span>Customer Care: <span className="font-mono text-slate-300">{settings.phone}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-slate-400">Live Dual-Screen Active</span>
          </div>
        </footer>
      </main>
    </div>
  );
};
