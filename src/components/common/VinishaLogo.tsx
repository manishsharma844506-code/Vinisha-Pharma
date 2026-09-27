import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';

interface VinishaLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  showWordmark?: boolean;
  tagline?: string;
  variant?: 'dark' | 'light';
  className?: string;
  src?: string; // Optional direct image override
}

export const VinishaLogo: React.FC<VinishaLogoProps> = ({
  size = 'md',
  showWordmark = false,
  tagline,
  variant = 'dark',
  className = '',
  src
}) => {
  const [logoSrc, setLogoSrc] = useState<string>(
    src || db.getSettings().customLogoUrl || '/logo.png'
  );
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (src) {
      setLogoSrc(src);
      setImgError(false);
      return;
    }
    const updateLogo = () => {
      const custom = db.getSettings().customLogoUrl;
      setLogoSrc(custom || '/logo.png');
      setImgError(false);
    };
    const unsub = db.subscribe(updateLogo);
    return () => unsub();
  }, [src]);

  const sizeMap: Record<string, number> = {
    xs: 24,
    sm: 34,
    md: 44,
    lg: 56,
    xl: 72,
    '2xl': 100
  };

  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 44;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* 
        Renders the official 3D Vinisha Pharma Logo (100% Transparent PNG / SVG)
      */}
      {!imgError ? (
        <img
          src={logoSrc}
          alt="Vinisha Pharma 3D Logo"
          width={pixelSize}
          height={pixelSize}
          style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
          className="shrink-0 object-contain transition-transform duration-200 hover:scale-105 drop-shadow-sm"
          onError={() => setImgError(true)}
        />
      ) : (
        /* Fallback high-fidelity 3D vector emblem if image fails */
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 1000 1000"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 transition-transform duration-200 hover:scale-105"
        >
          <defs>
            <linearGradient id="vprLeft" x1="100" y1="40" x2="520" y2="930" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0D5BE1" />
              <stop offset="25%" stopColor="#00A2E8" />
              <stop offset="65%" stopColor="#00C853" />
              <stop offset="100%" stopColor="#28C745" />
            </linearGradient>
            <linearGradient id="vprRight" x1="720" y1="60" x2="520" y2="930" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0099FF" />
              <stop offset="35%" stopColor="#00C49F" />
              <stop offset="75%" stopColor="#05C46B" />
              <stop offset="100%" stopColor="#22C55E" />
            </linearGradient>
            <linearGradient id="vprExtrude" x1="200" y1="50" x2="520" y2="920" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#013A63" />
              <stop offset="50%" stopColor="#025E73" />
              <stop offset="100%" stopColor="#024D36" />
            </linearGradient>
          </defs>

          {/* 3D Extrusion Back Wall */}
          <path
            d="M 52 46 C 140 68 280 162 388 340 C 450 442 498 578 522 748 C 538 852 534 892 532 940 L 512 958 C 498 906 480 812 458 720 C 426 592 374 466 312 360 C 220 200 112 110 38 68 Z"
            fill="url(#vprExtrude)"
          />
          <path
            d="M 686 98 L 712 68 L 712 198 L 572 198 L 552 232 L 686 232 L 686 372 L 562 870 L 512 958 L 532 940 L 656 470 L 686 422 L 686 372 Z"
            fill="url(#vprExtrude)"
          />

          {/* Left Wing */}
          <path
            d="M 38 42 C 126 62 254 144 354 300 C 420 404 468 538 496 690 C 520 818 526 894 528 942 C 520 904 496 798 470 708 C 432 576 372 444 300 328 C 208 180 110 98 38 42 Z"
            fill="url(#vprLeft)"
          />

          {/* Cross & Right Wing */}
          <path
            d="M 528 942 C 552 866 592 748 644 612 C 690 492 730 388 748 312 L 602 310 C 586 310 574 298 574 282 L 574 196 C 574 180 586 168 602 168 L 748 168 L 748 64 C 748 48 760 36 776 36 L 866 36 C 882 36 894 48 894 64 L 894 168 L 964 168 C 980 168 992 180 992 196 L 992 282 C 992 298 980 310 964 310 L 894 310 L 894 378 C 872 506 792 682 696 824 C 638 908 584 964 544 982 Z"
            fill="url(#vprRight)"
          />

          {/* Cutout Cross Window */}
          <path
            d="M 814 132 L 856 132 L 856 204 L 914 204 L 914 242 L 856 242 L 856 326 L 814 326 L 814 242 L 756 242 L 756 204 L 814 204 Z"
            fill="#FFFFFF"
          />
        </svg>
      )}

      {/* Optional Wordmark */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-lg font-black tracking-tight ${
                variant === 'light' ? 'text-white' : 'text-slate-900'
              }`}
            >
              VINISHA
            </span>
            <span className="text-lg font-extrabold tracking-tight text-teal-600">
              PHARMA
            </span>
          </div>
          {tagline && (
            <span
              className={`text-[10px] tracking-wide uppercase font-semibold ${
                variant === 'light' ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
