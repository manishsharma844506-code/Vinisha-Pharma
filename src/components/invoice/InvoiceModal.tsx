import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  CheckCircle, 
  Share2, 
  Mail, 
  Phone, 
  FileText,
  Send,
  MessageCircle
} from 'lucide-react';
import { Sale, PharmacySettings } from '../../types';
import { VinishaLogo } from '../common/VinishaLogo';
import { SignboardBanner } from '../common/SignboardBanner';

interface InvoiceModalProps {
  sale: Sale | null;
  settings: PharmacySettings;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  sale,
  settings,
  isOpen,
  onClose
}) => {
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('a4');
  const [patientPhone, setPatientPhone] = useState(sale?.customerPhone || '');
  const [patientEmail, setPatientEmail] = useState('');
  const [showShareBar, setShowShareBar] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen || !sale) return null;

  const formattedDate = new Date(sale.createdAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    window.print();
  };

  // Build clean text invoice summary for WhatsApp & Email
  const buildTextMessage = () => {
    const itemsList = sale.items
      .map(
        (it, idx) =>
          `${idx + 1}. *${it.medicineName}* (Qty: ${it.quantity}) — ₹${it.total.toFixed(2)}`
      )
      .join('\n');

    return (
      `🏥 *VINISHA PHARMA — Medical & General Store*\n` +
      `📍 ${settings.address}, ${settings.city}\n` +
      `📞 Contact: ${settings.phone}\n` +
      `📜 DL: ${settings.dlNumber} | GSTIN: ${settings.gstin}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🧾 *RETAIL TAX INVOICE*\n` +
      `Invoice #: *${sale.billNumber}*\n` +
      `Date: ${formattedDate}\n` +
      `Patient: *${sale.customerName || 'Valued Customer'}*\n` +
      (sale.doctorName ? `Prescribed By: Dr. ${sale.doctorName}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `💊 *Medicines Dispensed:*\n` +
      `${itemsList}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 Subtotal: ₹${sale.subtotal.toFixed(2)}\n` +
      (sale.discountAmount > 0
        ? `🎉 Discount Savings: -₹${sale.discountAmount.toFixed(2)}\n`
        : '') +
      `🏛️ GST (Included): ₹${sale.taxAmount.toFixed(2)}\n` +
      `✅ *Net Total Paid: ₹${sale.grandTotal.toFixed(2)}* (${sale.paymentMethod})\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `💚 *${settings.invoiceFooterMessage}*\n` +
      `✨ _Thank you for choosing Vinisha Pharma. Wish you a speedy recovery!_`
    );
  };

  // Send Invoice to WhatsApp
  const handleSendWhatsApp = () => {
    let cleanPhone = (patientPhone || sale.customerPhone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // India country code
    }

    const message = buildTextMessage();
    const encoded = encodeURIComponent(message);
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(waUrl, '_blank');
  };

  // Send Invoice via Email
  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Tax Invoice #${sale.billNumber} - Vinisha Pharma`);
    const body = encodeURIComponent(buildTextMessage());
    const emailTo = patientEmail.trim();
    const mailtoUrl = `mailto:${emailTo}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
  };

  // Copy text invoice to clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(buildTextMessage());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Save as text file download
  const handleSaveTextReceipt = () => {
    const text = buildTextMessage();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${sale.billNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Top Action Toolbar (Hidden when printing) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Layout:
            </span>
            <div className="flex rounded-lg bg-slate-200/80 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  printFormat === 'a4'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                A4 Official Letterhead
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('thermal')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  printFormat === 'thermal'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Thermal (80mm)
              </button>
            </div>
          </div>

          {/* Action Buttons: Print, WhatsApp, Email, Save */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Print Invoice / Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Send to patient's WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setShowShareBar(!showShareBar)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="More sharing options"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Quick Share Bar (WhatsApp Number / Email Input) */}
        {showShareBar && (
          <div className="no-print px-6 py-3 bg-teal-50/70 border-b border-teal-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <span className="font-semibold text-teal-900 whitespace-nowrap">WhatsApp #:</span>
              <input
                type="text"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="+91 Mobile number"
                className="w-full px-2.5 py-1 bg-white border border-teal-300 rounded text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs whitespace-nowrap"
              >
                Send
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <span className="font-semibold text-teal-900 whitespace-nowrap">Email:</span>
              <input
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="patient@email.com"
                className="w-full px-2.5 py-1 bg-white border border-teal-300 rounded text-xs"
              />
              <button
                type="button"
                onClick={handleSendEmail}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs whitespace-nowrap flex items-center gap-1"
              >
                <Mail className="w-3 h-3" />
                <span>Mail</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-medium text-xs whitespace-nowrap"
              >
                {copySuccess ? '✓ Copied' : 'Copy Text'}
              </button>
              <button
                type="button"
                onClick={handleSaveTextReceipt}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-medium text-xs whitespace-nowrap flex items-center gap-1"
              >
                <Download className="w-3 h-3 text-slate-500" />
                <span>Save</span>
              </button>
            </div>
          </div>
        )}

        {/* Printable Invoice Viewport */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans">
          {/* A4 OFFICIAL LETTERHEAD FORMAT */}
          {printFormat === 'a4' ? (
            <div className="border border-slate-300 rounded-xl p-6 sm:p-8 space-y-5 bg-white shadow-2xs">
              {/* 
                OFFICIAL SIGNBOARD BANNER HEADER
                As requested: User's attached signboard acts as official page letterhead
              */}
              <div className="pb-3 border-b-2 border-slate-800">
                <SignboardBanner
                  showDetails={true}
                  address={`${settings.address}, ${settings.city}`}
                  phone={settings.phone}
                  dlNumber={settings.dlNumber}
                  gstin={settings.gstin}
                />
              </div>

              {/* Invoice Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-2 px-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Tax Invoice Number
                  </span>
                  <span className="text-base font-black font-mono text-teal-900">
                    {sale.billNumber}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Invoice Date &amp; Time
                  </span>
                  <span className="text-xs font-semibold text-slate-800 font-mono">
                    {formattedDate}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Payment Status
                  </span>
                  <span className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    PAID ({sale.paymentMethod})
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Cashier / Pharmacist
                  </span>
                  <span className="text-xs font-medium text-slate-700">
                    {sale.cashierName}
                  </span>
                </div>
              </div>

              {/* Patient and Doctor Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-lg bg-slate-50/70 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Patient Details:
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {sale.customerName || 'Walk-in Patient'}
                  </p>
                  {sale.customerPhone && (
                    <p className="text-slate-600 font-mono mt-0.5">
                      Phone: <span className="font-semibold text-slate-800">{sale.customerPhone}</span>
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Prescribing Doctor / Hospital:
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {sale.doctorName || 'Self / OTC Recommendation'}
                  </p>
                  {sale.prescriptionRef && (
                    <p className="text-slate-600 text-xs mt-0.5">
                      Rx Ref: <span className="font-mono">{sale.prescriptionRef}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Medicines Dispensed Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Medicine Formulation &amp; Strength</th>
                      <th className="p-2.5">Batch</th>
                      <th className="p-2.5">Exp Date</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">MRP (₹)</th>
                      <th className="p-2.5 text-right">Rate (₹)</th>
                      <th className="p-2.5 text-right">GST %</th>
                      <th className="p-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-xs">
                    {sale.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-500">{idx + 1}</td>
                        <td className="p-2.5 font-sans font-bold text-slate-900">
                          {item.medicineName}
                        </td>
                        <td className="p-2.5 text-slate-700">{item.batchNumber}</td>
                        <td className="p-2.5 text-slate-600">{item.expiryDate}</td>
                        <td className="p-2.5 text-center font-bold text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="p-2.5 text-right text-slate-500 line-through">
                          ₹{item.mrp.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right font-semibold text-slate-900">
                          ₹{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right text-slate-600">
                          {item.taxRate}%
                        </td>
                        <td className="p-2.5 text-right font-black text-slate-900">
                          ₹{item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals, Taxes & Payment Summary */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                <div className="text-xs text-slate-600 max-w-sm space-y-1.5">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                      Payment Settlement
                    </p>
                    <p>Method: <strong className="text-slate-900">{sale.paymentMethod}</strong></p>
                    <p>Amount Tendered: <strong className="font-mono text-slate-900">₹{sale.amountPaid.toFixed(2)}</strong></p>
                    {sale.changeReturned > 0 && (
                      <p>Change Returned: <strong className="font-mono text-teal-800">₹{sale.changeReturned.toFixed(2)}</strong></p>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1 italic leading-relaxed">
                    {settings.invoiceFooterMessage}
                  </p>
                </div>

                <div className="w-full sm:w-72 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between py-1 text-slate-700">
                    <span className="font-sans">Subtotal (Gross):</span>
                    <span className="font-bold">₹{sale.subtotal.toFixed(2)}</span>
                  </div>

                  {sale.discountAmount > 0 && (
                    <div className="flex justify-between py-1 text-emerald-700 font-bold bg-emerald-50 px-2 rounded">
                      <span className="font-sans">Discount Savings:</span>
                      <span>-₹{sale.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-1 text-slate-600">
                    <span className="font-sans">GST (Included):</span>
                    <span>₹{sale.taxAmount.toFixed(2)}</span>
                  </div>

                  {sale.roundOff !== 0 && (
                    <div className="flex justify-between py-1 text-slate-500">
                      <span className="font-sans">Round Off:</span>
                      <span>{sale.roundOff > 0 ? '+' : ''}₹{sale.roundOff.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-2 border-t-2 border-slate-900 font-black text-base text-slate-900 bg-slate-50 px-2 rounded">
                    <span className="font-sans">Grand Total:</span>
                    <span className="text-teal-900 text-lg">₹{sale.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Wish & Signature */}
              <div className="pt-6 border-t border-dashed border-slate-300 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <VinishaLogo size={28} />
                  <div>
                    <p className="font-bold text-slate-800">Vinisha Pharma — Medical &amp; General Store</p>
                    <p className="text-[10px] text-slate-500">Computer Generated Tax Invoice</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-36 border-b border-slate-400 mb-1" />
                  <p className="text-[10px] text-slate-600 uppercase font-semibold">Authorised Signatory</p>
                </div>
              </div>
            </div>
          ) : (
            /* THERMAL 80MM RECEIPT FORMAT */
            <div className="thermal-receipt max-w-[340px] mx-auto text-xs font-mono space-y-2 border border-slate-300 p-4 rounded-lg bg-white shadow-xs">
              {/* Signboard Header in Thermal Format */}
              <div className="text-center pb-2 border-b-2 border-slate-800 flex flex-col items-center">
                <div className="w-full mb-1">
                  <SignboardBanner />
                </div>
                <p className="text-[10px] text-slate-600 mt-1">{settings.address}</p>
                <p className="text-[10px] text-slate-600 font-bold">Ph: {settings.phone}</p>
                <p className="text-[10px] text-slate-700 font-semibold">
                  DL: {settings.dlNumber} | GST: {settings.gstin}
                </p>
              </div>

              <div className="py-1 text-[11px] space-y-0.5 border-b border-dashed border-slate-300">
                <div className="flex justify-between font-bold">
                  <span>Bill No: {sale.billNumber}</span>
                  <span>{formattedDate}</span>
                </div>
                {sale.customerName && (
                  <div>Patient: <strong>{sale.customerName}</strong> {sale.customerPhone ? `(${sale.customerPhone})` : ''}</div>
                )}
                {sale.doctorName && (
                  <div>Dr: {sale.doctorName}</div>
                )}
                <div>Cashier: {sale.cashierName}</div>
              </div>

              {/* Items Table */}
              <div className="py-1">
                <div className="grid grid-cols-12 font-bold text-[10px] pb-1 border-b border-slate-300">
                  <span className="col-span-6">ITEM (BATCH/EXP)</span>
                  <span className="col-span-2 text-center">QTY</span>
                  <span className="col-span-2 text-right">RATE</span>
                  <span className="col-span-2 text-right">AMT</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {sale.items.map((item, i) => (
                    <div key={i} className="py-1 text-[10px]">
                      <div className="font-bold text-slate-900">{item.medicineName}</div>
                      <div className="grid grid-cols-12 text-slate-500">
                        <span className="col-span-6">B:{item.batchNumber} E:{item.expiryDate}</span>
                        <span className="col-span-2 text-center font-bold text-slate-900">{item.quantity}</span>
                        <span className="col-span-2 text-right">₹{item.unitPrice.toFixed(2)}</span>
                        <span className="col-span-2 text-right font-black text-slate-900">₹{item.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="pt-2 border-t border-dashed border-slate-300 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Gross Subtotal:</span>
                  <span>₹{sale.subtotal.toFixed(2)}</span>
                </div>
                {sale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount Savings:</span>
                    <span>-₹{sale.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>GST (Included):</span>
                  <span>₹{sale.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t-2 border-slate-800">
                  <span>NET PAYABLE:</span>
                  <span>₹{sale.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] pt-1">
                  <span>Paid ({sale.paymentMethod}): ₹{sale.amountPaid.toFixed(2)}</span>
                  {sale.changeReturned > 0 && <span>Change: ₹{sale.changeReturned.toFixed(2)}</span>}
                </div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[9px] text-slate-500 space-y-1">
                <p>{settings.invoiceFooterMessage}</p>
                <p className="font-bold text-slate-800 text-[10px]">Wish You a Speedy Recovery!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
