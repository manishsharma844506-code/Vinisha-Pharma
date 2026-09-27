import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Pill, 
  ClockAlert, 
  Truck, 
  Building2, 
  Users, 
  RotateCcw, 
  BarChart3, 
  Sparkles, 
  Settings, 
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { UserRole } from '../../types';
import { VinishaLogo } from '../common/VinishaLogo';
import { db } from '../../services/db';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  highlight?: boolean;
  accent?: boolean;
  badge?: number;
  badgeVariant?: 'warning' | 'danger';
  textBadge?: string;
  textBadgeVariant?: 'success' | 'neutral';
  visible: boolean;
}

interface MenuSection {
  group: string;
  items: MenuItem[];
}

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userRole: UserRole;
  lowStockCount: number;
  expiringCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  userRole,
  lowStockCount,
  expiringCount
}) => {
  const [aiEnabled, setAiEnabled] = React.useState(db.isAIFeaturesEnabled());

  React.useEffect(() => {
    const update = () => {
      setAiEnabled(db.isAIFeaturesEnabled());
    };
    const unsub = db.subscribe(update);
    return () => unsub();
  }, []);

  const isCashier = userRole === 'Cashier';

  const menuSections: MenuSection[] = [
    {
      group: 'Core Operations',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          visible: true
        },
        {
          id: 'pos',
          label: 'POS Billing',
          icon: ShoppingCart,
          shortcut: 'F2',
          highlight: true,
          visible: true
        },
        {
          id: 'sales-history',
          label: 'Sales Invoices',
          icon: Receipt,
          visible: true
        }
      ]
    },
    {
      group: 'Stock & Batches',
      items: [
        {
          id: 'inventory',
          label: 'Medicines & Stock',
          icon: Pill,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeVariant: 'warning',
          visible: !isCashier
        },
        {
          id: 'expiry',
          label: 'Expiry Management',
          icon: ClockAlert,
          badge: expiringCount > 0 ? expiringCount : undefined,
          badgeVariant: 'danger',
          visible: !isCashier
        },
        {
          id: 'purchases',
          label: 'Inward Purchases',
          icon: Truck,
          visible: !isCashier
        },
        {
          id: 'suppliers',
          label: 'Suppliers Directory',
          icon: Building2,
          visible: !isCashier
        }
      ]
    },
    {
      group: 'Patients & Returns',
      items: [
        {
          id: 'customers',
          label: 'Patients / Customers',
          icon: Users,
          visible: true
        },
        {
          id: 'returns',
          label: 'Sales Returns',
          icon: RotateCcw,
          visible: true
        }
      ]
    },
    {
      group: 'Analytics & Tools',
      items: [
        {
          id: 'reports',
          label: 'Reports & GST',
          icon: BarChart3,
          visible: !isCashier
        },
        {
          id: 'ai-assistant',
          label: 'AI Operations Assistant',
          icon: Sparkles,
          accent: true,
          textBadge: aiEnabled ? 'ON' : 'OFF',
          textBadgeVariant: aiEnabled ? 'success' : 'neutral',
          visible: true
        },
        {
          id: 'settings',
          label: 'Pharmacy Settings',
          icon: Settings,
          visible: userRole === 'Owner/Admin'
        }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-61px)] select-none">
      <div className="p-4 flex-1 space-y-6 overflow-y-auto">
        {menuSections.map((section, idx) => {
          const visibleItems = section.items.filter(i => i.visible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.group}
              </p>
              <div className="space-y-0.5 pt-1">
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? item.highlight
                            ? 'bg-teal-600 text-white shadow-xs font-semibold'
                            : 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${
                          isActive && !item.highlight ? 'text-teal-400' : ''
                        } ${item.accent ? 'text-indigo-400' : ''}`} />
                        <span>{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.shortcut && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {item.shortcut}
                          </span>
                        )}
                        {item.badge !== undefined && (
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                            item.badgeVariant === 'danger'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {item.textBadge && (
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                            item.textBadgeVariant === 'success'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {item.textBadge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Role & status footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VinishaLogo size="xs" variant="light" />
            <span className="text-slate-200 font-semibold">{userRole}</span>
          </div>
          <span className="text-[10px] text-teal-400 font-mono font-bold bg-teal-950/80 border border-teal-800/60 px-1.5 py-0.5 rounded">
            OPERATIONAL
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Scheduled Drug Compliant</span>
        </div>
      </div>
    </aside>
  );
};
