import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Trash2, 
  Sparkles, 
  Check, 
  AlertCircle,
  Image as ImageIcon, 
  RotateCcw,
  Sliders,
  Eye
} from 'lucide-react';
import { db } from '../../services/db';
import { PharmacySettings } from '../../types';
import { fileToDataUrl, removeWhiteBackground, optimizeImage } from '../../utils/imageUtils';
import { VinishaLogo } from './VinishaLogo';

interface LogoUploadCardProps {
  settings: PharmacySettings;
  onSettingsUpdate?: (updated: PharmacySettings) => void;
}

export const LogoUploadCard: React.FC<LogoUploadCardProps> = ({
  settings,
  onSettingsUpdate
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tolerance, setTolerance] = useState<number>(28);
  const [showToleranceSlider, setShowToleranceSlider] = useState<boolean>(false);
  const [rawUploadedSrc, setRawUploadedSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setStatusMessage(null);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showError('Please upload a valid image file (PNG, SVG, or JPG).');
      return;
    }

    setIsProcessing(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const optimized = await optimizeImage(dataUrl, 800, 800);
      setRawUploadedSrc(optimized);

      // Save directly to db settings
      const updated = db.updateSettings({ customLogoUrl: optimized });
      if (onSettingsUpdate) onSettingsUpdate(updated);
      showStatus('Logo successfully uploaded and applied across app!');
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      showError('Failed to process image file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveBackground = async () => {
    const srcToProcess = rawUploadedSrc || settings.customLogoUrl;
    if (!srcToProcess) return;

    setIsProcessing(true);
    try {
      const transparentDataUrl = await removeWhiteBackground(srcToProcess, tolerance);
      const updated = db.updateSettings({ customLogoUrl: transparentDataUrl });
      if (onSettingsUpdate) onSettingsUpdate(updated);
      showStatus('White background removed! Transparent PNG applied.');
    } catch (err: any) {
      console.error('Error removing background:', err);
      showError('Failed to remove background.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetToDefault = () => {
    const updated = db.updateSettings({ customLogoUrl: undefined });
    setRawUploadedSrc(null);
    if (onSettingsUpdate) onSettingsUpdate(updated);
    showStatus('Reset to official 3D emblem.');
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-teal-600" />
            <span>Store Logo &amp; Emblem (Transparent PNG)</span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload your custom transparent PNG logo to render in the Navbar, Invoices, and Customer Display
          </p>
        </div>

        {statusMessage && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>{statusMessage}</span>
          </span>
        )}

        {errorMessage && (
          <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMessage}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Upload Zone (7 cols) */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-teal-500 bg-teal-50/60 scale-[1.01]'
                : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 shadow-2xs">
              <Upload className="w-6 h-6" />
            </div>

            <p className="text-xs font-bold text-slate-800">
              Click to select or drag &amp; drop PNG logo here
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports transparent PNG, SVG, or high-res images (up to 5MB)
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleRemoveBackground}
              disabled={isProcessing || !settings.customLogoUrl}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 disabled:opacity-50 text-teal-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-teal-200"
              title="Automatically turns white background into transparent PNG"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Auto-Remove White Background</span>
            </button>

            <button
              type="button"
              onClick={() => setShowToleranceSlider(!showToleranceSlider)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Adjust background removal sensitivity"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <a
              href="/logo.png"
              download="vinisha_3d_logo.png"
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Download official 3D transparent PNG logo"
            >
              <span>Download 3D PNG</span>
            </a>

            {settings.customLogoUrl && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Restore official 3D emblem"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to 3D Logo</span>
              </button>
            )}
          </div>

          {/* Optional Tolerance Slider */}
          {showToleranceSlider && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 animate-in fade-in duration-150 text-xs">
              <div className="flex justify-between font-medium text-slate-700">
                <span>Background Removal Sensitivity:</span>
                <span className="font-mono font-bold text-teal-800">{tolerance}</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
              <p className="text-[10px] text-slate-500">
                Increase if faint white halo remains; decrease if logo colors are faded.
              </p>
            </div>
          )}
        </div>

        {/* Live Preview Panes (5 cols) */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Live Preview (Navbar &amp; Invoices)
          </span>

          {/* Checkered Transparency Box */}
          <div
            className="p-4 rounded-xl border border-slate-300 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(45deg, #f1f5f9 25%, transparent 25%), 
                                linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), 
                                linear-gradient(45deg, transparent 75%, #f1f5f9 75%), 
                                linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)`,
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
            }}
          >
            <div className="p-2 transition-transform duration-200 hover:scale-105">
              <VinishaLogo size={72} />
            </div>

            <span className="absolute bottom-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 backdrop-blur-xs text-slate-600 font-semibold border border-slate-200">
              {settings.customLogoUrl ? 'Custom PNG Active' : 'Default Emblem'}
            </span>
          </div>

          {/* Dual-Background Checker (Navbar dark vs Invoice light) */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-center">
            <div className="p-2 rounded-lg bg-slate-900 text-slate-300 flex flex-col items-center justify-center gap-1 border border-slate-800">
              <span>Dark Theme Preview</span>
              <VinishaLogo size={32} variant="light" />
            </div>
            <div className="p-2 rounded-lg bg-white text-slate-700 flex flex-col items-center justify-center gap-1 border border-slate-200">
              <span>Invoice Light Preview</span>
              <VinishaLogo size={32} variant="dark" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
