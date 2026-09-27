import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    value: string;
    positive: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'neutral',
  trend,
  onClick
}) => {
  const variantStyles = {
    neutral: 'bg-white border-slate-200/90 text-slate-900',
    success: 'bg-white border-emerald-200/80 text-emerald-950',
    warning: 'bg-white border-amber-200/80 text-amber-950',
    danger: 'bg-white border-red-200/80 text-red-950',
    info: 'bg-white border-blue-200/80 text-blue-950'
  };

  const iconColors = {
    neutral: 'text-slate-600 bg-slate-100',
    success: 'text-emerald-700 bg-emerald-50',
    warning: 'text-amber-700 bg-amber-50',
    danger: 'text-red-700 bg-red-50',
    info: 'text-blue-700 bg-blue-50'
  };

  return (
    <div
      onClick={onClick}
      className={`border rounded-xl p-5 shadow-xs transition-all ${variantStyles[variant]} ${
        onClick ? 'cursor-pointer hover:border-teal-400 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-700 tracking-wide uppercase">{title}</p>
          <p className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900">{value}</p>
          {subtext && (
            <p className="mt-1 text-xs text-slate-700 flex items-center gap-1.5">
              {trend && (
                <span className={`font-semibold ${trend.positive ? 'text-emerald-800' : 'text-red-800'}`}>
                  {trend.positive ? '↑' : '↓'} {trend.value}
                </span>
              )}
              <span>{subtext}</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconColors[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
