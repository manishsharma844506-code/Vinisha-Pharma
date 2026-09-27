import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  ShoppingCart, 
  Sparkles, 
  UserCheck
} from 'lucide-react';
import { UserRole } from '../../types';
import { VinishaLogo } from '../common/VinishaLogo';
import { db } from '../../services/db';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  dualScreenOpen: boolean;
  onToggleDualScreen: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  userRole,
  onRoleChange,
  dualScreenOpen,
  onToggleDualScreen
}) => {
  const [settings, setSettings] = useState(db.getSettings());
  const [customLogoUrl, setCustomLogoUrl] = useState<string | undefined>(
    db.getSettings().customLogoUrl
  );

  useEffect(() => {
    const handleSettingsChange = () => {
      const s = db.getSettings();
      setSettings(s);
      setCustomLogoUrl(s.customLogoUrl);
    };
    const unsub = db.subscribe(handleSettingsChange);
    return () => unsub();
  }, []);

  const aiEnabled = settings.aiFeaturesEnabled;

  const handleToggleAIMode = () => {
    db.toggleAIFeatures();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
      <div className="flex items-center justify-between px-6 py-3 max-w-full">
        {/* Zone 1: Brand Zone - Dynamically renders custom uploaded logo or default branding */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => onTabChange('dashboard')} 
            className="flex items-center gap-2.5 text-left group"
          >
            {customLogoUrl ? (
              <div className="flex items-center gap-2">
                <img
                  src={customLogoUrl}
                  alt="Vinisha Pharma"
                  className="h-10 max-w-[210px] object-contain transition-transform duration-200 group-hover:scale-105"
                />
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 font-mono font-bold border border-teal-200/60 hidden sm:inline">
                  RETAIL
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <VinishaLogo size="sm" />
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                    VINISHA
                  </span>
                  <span className="text-base font-extrabold tracking-tight text-teal-600">
                    PHARMA
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 font-mono font-bold border border-teal-200/60 ml-1">
                    RETAIL
                  </span>
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Zone 2: Core Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'dashboard' 
                ? 'bg-slate-100 text-teal-700 font-semibold' 
                : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onTabChange('pos')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentTab === 'pos' 
                ? 'bg-teal-600 text-white font-semibold shadow-xs' 
                : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>POS Billing (F2)</span>
          </button>
          <button
            onClick={() => onTabChange('inventory')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'inventory' 
                ? 'bg-slate-100 text-teal-700 font-semibold' 
                : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Medicines & Batches
          </button>
          <button
            onClick={() => onTabChange('expiry')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'expiry' 
                ? 'bg-slate-100 text-teal-700 font-semibold' 
                : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Expiry Alerts
          </button>
          <button
            onClick={() => onTabChange('reports')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'reports' 
                ? 'bg-slate-100 text-teal-700 font-semibold' 
                : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => onTabChange('ai-assistant')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentTab === 'ai-assistant' 
                ? 'bg-slate-100 text-teal-700 font-semibold' 
                : aiEnabled 
                  ? 'hover:text-slate-900 hover:bg-slate-50 text-indigo-700 font-medium'
                  : 'hover:text-slate-900 hover:bg-slate-50 text-slate-500 font-normal'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiEnabled ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>AI Operations</span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
              aiEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {aiEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </nav>

        {/* Zone 3: Actions & Dual Display Controls */}
        <div className="flex items-center gap-2">
          {/* Manual AI Mode Toggle Switch */}
          <button
            onClick={handleToggleAIMode}
            className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              aiEnabled
                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900 shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
            title={aiEnabled ? 'AI Features are ACTIVE: Click to switch to Manual Offline Mode' : 'AI Features are OFF: Click to turn ON AI Assistant & Tools'}
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiEnabled ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">AI Mode:</span>
            <span className={`font-mono ${aiEnabled ? 'text-emerald-700' : 'text-slate-600'}`}>
              {aiEnabled ? 'ON' : 'OFF'}
            </span>
            <span className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          </button>

          {/* Dual Screen Toggle */}
          <button
            onClick={onToggleDualScreen}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
              dualScreenOpen
                ? 'bg-teal-50 border-teal-300 text-teal-800 ring-2 ring-teal-100'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle customer-facing display split preview"
          >
            <Monitor className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Patient Display</span>
            <span className={`w-2 h-2 rounded-full ${dualScreenOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          </button>

          {/* Role selector dropdown */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={userRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="text-xs font-medium text-slate-700 bg-transparent border-0 focus:ring-0 cursor-pointer pr-4 py-1"
            >
              <option value="Pharmacist">Pharmacist</option>
              <option value="Owner/Admin">Owner/Admin</option>
              <option value="Cashier">Cashier</option>
              <option value="Patient Display">Patient Display Only</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
