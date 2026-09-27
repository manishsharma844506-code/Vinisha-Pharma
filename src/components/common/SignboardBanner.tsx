import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';

interface SignboardBannerProps {
  className?: string;
  showDetails?: boolean;
  address?: string;
  phone?: string;
  dlNumber?: string;
  gstin?: string;
  isPrintMode?: boolean;
}

export const SignboardBanner: React.FC<SignboardBannerProps> = ({
  className = '',
  showDetails = false,
  address,
  phone,
  dlNumber,
  gstin,
  isPrintMode = false
}) => {
  const [customSignboard, setCustomSignboard] = useState<string | undefined>(
    () => db.getSettings().customSignboardUrl
  );

  useEffect(() => {
    const updateSignboard = () => {
      setCustomSignboard(db.getSettings().customSignboardUrl);
    };
    const unsub = db.subscribe(updateSignboard);
    return () => unsub();
  }, []);

  const signboardSrc = customSignboard || '/signboard.svg';

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {/* 
        Official Signboard Facia
        Faithfully replicating user's "Signe Bord.pdf" with 3D logo emblem, metallic frame & 3D relief typography
      */}
      <div className="relative w-full rounded-md overflow-hidden bg-slate-900 shadow-md border border-slate-300">
        <img
          src={signboardSrc}
          alt="Vinisha Pharma Official Signboard"
          className="w-full h-auto object-cover block select-none"
          onError={(e) => {
            // Fallback to high-res PNG if SVG has issues in specific print engines
            const target = e.currentTarget;
            if (!target.src.endsWith('/signboard.png')) {
              target.src = '/signboard.png';
            }
          }}
          loading="eager"
        />
      </div>

      {/* Optional Official Letterhead Details Band for Invoices */}
      {showDetails && (
        <div className="mt-2 px-3 py-2 bg-slate-50 border-b border-slate-200 text-slate-700 text-xs flex flex-wrap items-center justify-between gap-2 font-sans rounded-md">
          <div className="space-y-0.5">
            {address && (
              <p className="text-[11px] text-slate-600 font-medium">{address}</p>
            )}
            {phone && (
              <p className="text-[11px] text-slate-600 font-medium">
                Ph: <span className="font-mono font-bold text-slate-900">{phone}</span>
              </p>
            )}
          </div>
          <div className="text-right space-y-0.5">
            {dlNumber && (
              <p className="text-[11px] font-semibold text-slate-800">
                Drug License: <span className="font-mono text-teal-800 font-bold">{dlNumber}</span>
              </p>
            )}
            {gstin && (
              <p className="text-[11px] font-semibold text-slate-800">
                GSTIN: <span className="font-mono text-teal-800 font-bold">{gstin}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
