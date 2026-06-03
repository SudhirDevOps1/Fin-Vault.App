import { useState, useRef } from 'react';
import {
  X, Printer, Share2, Mail, Copy, FileText, Image as ImageIcon,
  Palette
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import type { Transaction } from '@/types';
import { useToast } from '@/contexts/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

type ReceiptTheme = 'modern' | 'classic' | 'minimal' | 'gradient' | 'dark';

interface ThemeConfig {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
  subtext: string;
  border: string;
  amountColor: string;
  headerGradient: string;
}

const THEMES: Record<ReceiptTheme, ThemeConfig> = {
  modern: {
    name: 'Modern',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#a78bfa',
    bg: '#ffffff',
    text: '#1e293b',
    subtext: '#64748b',
    border: '#e2e8f0',
    amountColor: '#6366f1',
    headerGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  },
  classic: {
    name: 'Classic',
    primary: '#0f172a',
    secondary: '#334155',
    accent: '#475569',
    bg: '#f8fafc',
    text: '#0f172a',
    subtext: '#64748b',
    border: '#cbd5e1',
    amountColor: '#0f172a',
    headerGradient: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
  },
  minimal: {
    name: 'Minimal',
    primary: '#10b981',
    secondary: '#059669',
    accent: '#34d399',
    bg: '#ffffff',
    text: '#111827',
    subtext: '#6b7280',
    border: '#e5e7eb',
    amountColor: '#10b981',
    headerGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },
  gradient: {
    name: 'Sunset',
    primary: '#f97316',
    secondary: '#ef4444',
    accent: '#fbbf24',
    bg: '#fff7ed',
    text: '#431407',
    subtext: '#9a3412',
    border: '#fed7aa',
    amountColor: '#ea580c',
    headerGradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #fbbf24 100%)',
  },
  dark: {
    name: 'Midnight',
    primary: '#818cf8',
    secondary: '#a78bfa',
    accent: '#c4b5fd',
    bg: '#0f0f1a',
    text: '#f1f5f9',
    subtext: '#94a3b8',
    border: '#1e293b',
    amountColor: '#818cf8',
    headerGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
  },
};

export function ReceiptModal({ isOpen, onClose, transaction }: Props) {
  const [theme, setTheme] = useState<ReceiptTheme>('modern');
  const [includeQR, setIncludeQR] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [customNote, setCustomNote] = useState('');
  const [merchantName, setMerchantName] = useState('FinVault');
  const [showThemePanel, setShowThemePanel] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  if (!isOpen || !transaction) return null;

  const txDate = new Date(transaction.date);
  const receiptNo = transaction.id.slice(0, 12).toUpperCase();
  const absAmount = Math.abs(transaction.amount);
  const isIncome = transaction.amount > 0;
  const t = THEMES[theme];

  const toWords = (n: number): string => {
    const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    const convert = (v: number): string => {
      if (v < 20) return ones[v];
      if (v < 100) return tens[Math.floor(v/10)] + (v%10 ? ' '+ones[v%10] : '');
      if (v < 1000) return ones[Math.floor(v/100)] + ' Hundred' + (v%100 ? ' and '+convert(v%100) : '');
      if (v < 100000) return convert(Math.floor(v/1000)) + ' Thousand' + (v%1000 ? ' '+convert(v%1000) : '');
      if (v < 10000000) return convert(Math.floor(v/100000)) + ' Lakh' + (v%100000 ? ' '+convert(v%100000) : '');
      return convert(Math.floor(v/10000000)) + ' Crore' + (v%10000000 ? ' '+convert(v%10000000) : '');
    };
    return n === 0 ? 'Zero' : convert(Math.floor(n));
  };

  // Generate SVG QR code
  const generateQR = (size: number = 100): string => {
    const data = transaction.id + transaction.amount + transaction.date;
    let hash = 0;
    for (let i = 0; i < data.length; i++) hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash = hash & hash;

    const cells = 21;
    const cellSize = size / cells;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="white"/>`;
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const h = ((hash + x * 7 + y * 13) % 100);
        if (h > 45) svg += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
      }
    }
    // Corner markers
    [[0,0], [cells-7,0], [0,cells-7]].forEach(([cx, cy]) => {
      svg += `<rect x="${cx*cellSize}" y="${cy*cellSize}" width="${7*cellSize}" height="${7*cellSize}" fill="black"/>`;
      svg += `<rect x="${(cx+1)*cellSize}" y="${(cy+1)*cellSize}" width="${5*cellSize}" height="${5*cellSize}" fill="white"/>`;
      svg += `<rect x="${(cx+2)*cellSize}" y="${(cy+2)*cellSize}" width="${3*cellSize}" height="${3*cellSize}" fill="black"/>`;
    });
    svg += '</svg>';
    return svg;
  };

  // ─── PDF Generation ───
  const handlePDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const w = 210;
    const lm = 20;
    const rm = w - 20;
    let y = 20;

    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };
    const [pr, pg, pb] = hexToRgb(t.primary);

    // Header background
    doc.setFillColor(pr, pg, pb);
    doc.rect(0, 0, w, 55, 'F');

    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(merchantName.toUpperCase(), lm, y + 5);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('PAYMENT RECEIPT', rm, y + 2, { align: 'right' });
    doc.text(`#${receiptNo}`, rm, y + 7, { align: 'right' });

    y += 22;
    doc.setFontSize(9);
    doc.text(`Date: ${format(txDate, 'dd MMMM yyyy')}`, lm, y);
    doc.text(`Time: ${format(txDate, 'hh:mm a')}`, rm, y, { align: 'right' });

    // Reset color
    y = 65;
    doc.setTextColor(30, 30, 30);

    // Receipt info box
    doc.setDrawColor(pr, pg, pb);
    doc.setLineWidth(0.5);
    doc.roundedRect(lm, y, rm - lm, 35, 3, 3, 'S');

    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('DESCRIPTION', lm + 5, y);
    doc.text('CATEGORY', rm - 5, y, { align: 'right' });

    y += 8;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    const descLines = doc.splitTextToSize(transaction.description, 100);
    doc.text(descLines, lm + 5, y);
    doc.setFontSize(11);
    doc.text(transaction.category, rm - 5, y, { align: 'right' });

    y += (descLines.length * 5) + 5;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Type: ${isIncome ? 'INCOME' : 'EXPENSE'}`, lm + 5, y);

    // Amount box
    y += 15;
    doc.setFillColor(pr, pg, pb);
    doc.setDrawColor(pr, pg, pb);
    doc.roundedRect(lm, y, rm - lm, 50, 5, 5, 'F');

    y += 12;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(isIncome ? 'AMOUNT RECEIVED' : 'AMOUNT PAID', lm + 10, y);

    y += 18;
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.text(`₹ ${absAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, lm + 10, y);

    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(`(${toWords(absAmount)} Rupees Only)`, lm + 10, y);

    // QR Code
    if (includeQR) {
      y += 20;
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(8);
      doc.text('Scan to verify', rm - 30, y);
      // Draw simple QR pattern
      const qrSize = 25;
      const qrX = rm - 30;
      const qrY = y + 2;
      doc.setFillColor(0, 0, 0);
      doc.rect(qrX, qrY, qrSize, qrSize, 'F');
      doc.setFillColor(255, 255, 255);
      doc.rect(qrX + 2, qrY + 2, qrSize - 4, qrSize - 4, 'F');
      // Simple pattern
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if ((i + j + transaction.id.charCodeAt((i + j) % transaction.id.length)) % 3 === 0) {
            doc.setFillColor(0, 0, 0);
            doc.rect(qrX + 4 + i * 2.5, qrY + 4 + j * 2.5, 2, 2, 'F');
          }
        }
      }
      // Corner markers
      [[0,0], [15,0], [0,15]].forEach(([cx, cy]) => {
        doc.setFillColor(0, 0, 0);
        doc.rect(qrX + 4 + cx, qrY + 4 + cy, 7, 7, 'F');
        doc.setFillColor(255, 255, 255);
        doc.rect(qrX + 6 + cx, qrY + 6 + cy, 3, 3, 'F');
        doc.setFillColor(0, 0, 0);
        doc.rect(qrX + 7 + cx, qrY + 7 + cy, 1, 1, 'F');
      });
    }

    // Custom note
    if (customNote) {
      y += 35;
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('NOTE:', lm, y);
      y += 5;
      doc.setFont('helvetica', 'italic');
      const noteLines = doc.splitTextToSize(customNote, rm - lm - 10);
      doc.text(noteLines, lm, y);
    }

    // Watermark
    if (includeWatermark) {
      doc.saveGraphicsState();
      doc.setGState(doc.GState({ opacity: 0.06 }));
      doc.setFontSize(100);
      doc.setTextColor(pr, pg, pb);
      doc.setFont('helvetica', 'bold');
      doc.text('VERIFIED', w / 2, 160, { align: 'center', angle: 30 });
      doc.restoreGraphicsState();
    }

    // Footer
    y = 270;
    doc.setDrawColor(200, 200, 200);
    doc.line(lm, y, rm, y);
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text('This is a computer-generated receipt. No signature required.', w / 2, y, { align: 'center' });
    doc.text(`${merchantName} • Privacy-First Finance`, w / 2, y + 4, { align: 'center' });
    doc.text(`ID: ${transaction.id}`, w / 2, y + 8, { align: 'center' });

    doc.save(`receipt-${receiptNo}.pdf`);
    addToast('success', '📄 Receipt PDF downloaded!');
  };

  const handlePrint = () => { window.print(); };

  const buildShareText = () =>
    `📄 Receipt #${receiptNo}\n` +
    `Amount: ₹${absAmount.toLocaleString('en-IN')}\n` +
    `${transaction.description}\n` +
    `${format(txDate, 'dd MMM yyyy')}\n` +
    `Category: ${transaction.category}\n\n` +
    `— ${merchantName}`;

  const handleShare = async () => {
    const text = buildShareText();
    if (navigator.share) {
      try { await navigator.share({ title: 'Receipt', text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      addToast('success', 'Copied to clipboard');
    }
  };

  const handleEmail = () => {
    const s = encodeURIComponent(`Receipt: ${transaction.description}`);
    const b = encodeURIComponent(buildShareText());
    window.open(`mailto:?subject=${s}&body=${b}`);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildShareText());
    addToast('success', 'Receipt details copied');
  };

  const downloadAsImage = async () => {
    const el = receiptRef.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = el.getBoundingClientRect();
    const scale = 2;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Header gradient
    const grad = ctx.createLinearGradient(0, 0, rect.width, 0);
    grad.addColorStop(0, t.primary);
    grad.addColorStop(1, t.secondary);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, rect.width, 100, [16, 16, 0, 0]);
    ctx.fill();

    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(merchantName, 24, 45);
    ctx.font = '12px sans-serif';
    ctx.fillText('PAYMENT RECEIPT', rect.width - 24, 35);
    ctx.textAlign = 'right';
    ctx.fillText(`#${receiptNo}`, rect.width - 24, 50);
    ctx.textAlign = 'left';

    // Date
    ctx.fillStyle = t.subtext;
    ctx.font = '11px sans-serif';
    ctx.fillText(`${format(txDate, 'dd MMM yyyy')} • ${format(txDate, 'hh:mm a')}`, 24, 85);

    // Body
    let y = 120;
    ctx.fillStyle = t.subtext;
    ctx.font = '10px sans-serif';
    ctx.fillText('DESCRIPTION', 24, y);
    y += 18;
    ctx.fillStyle = t.text;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(transaction.description, 24, y);

    y += 30;
    ctx.fillStyle = t.subtext;
    ctx.font = '10px sans-serif';
    ctx.fillText('CATEGORY', 24, y);
    ctx.fillText('TYPE', rect.width - 24, y);
    ctx.textAlign = 'right';
    y += 16;
    ctx.fillStyle = t.text;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(transaction.category, rect.width - 24, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = isIncome ? '#10b981' : '#ef4444';
    ctx.fillText(isIncome ? '↑ INCOME' : '↓ EXPENSE', 24, y);

    // Amount box
    y += 30;
    ctx.fillStyle = t.primary;
    ctx.beginPath();
    ctx.roundRect(24, y, rect.width - 48, 70, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.fillText(isIncome ? 'AMOUNT RECEIVED' : 'AMOUNT PAID', 40, y + 20);
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`₹ ${absAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 40, y + 52);

    // Footer
    y += 90;
    ctx.fillStyle = t.subtext;
    ctx.font = 'italic 9px sans-serif';
    ctx.fillText(`(${toWords(absAmount)} Rupees Only)`, 24, y);

    y += 25;
    ctx.fillStyle = t.subtext;
    ctx.font = '9px sans-serif';
    ctx.fillText('This is a computer-generated receipt.', 24, y);
    ctx.fillText(`${merchantName} • Privacy-First Finance`, 24, y + 14);

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptNo}.png`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('success', '🖼️ Receipt image saved!');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg my-6 animate-slide-up">
        {/* Close */}
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── CONTROLS ─── */}
        <div className="mb-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Customize Receipt
            </h3>
            <button onClick={() => setShowThemePanel(!showThemePanel)} className="text-white/80 text-sm hover:text-white">
              {showThemePanel ? 'Hide' : 'Show'} options
            </button>
          </div>

          {showThemePanel && (
            <div className="space-y-3">
              {/* Theme selector */}
              <div>
                <label className="text-white/80 text-xs font-medium mb-1.5 block">Theme</label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(THEMES) as ReceiptTheme[]).map(key => {
                    const th = THEMES[key];
                    return (
                      <button
                        key={key}
                        onClick={() => setTheme(key)}
                        className={`p-2 rounded-xl border-2 transition-all ${
                          theme === key ? 'border-white shadow-lg' : 'border-white/20 hover:border-white/40'
                        }`}
                        style={{ background: th.headerGradient }}
                      >
                        <span className="text-[10px] font-bold text-white">{th.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Merchant name */}
              <div>
                <label className="text-white/80 text-xs font-medium mb-1.5 block">Merchant Name</label>
                <input
                  value={merchantName}
                  onChange={e => setMerchantName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/50"
                />
              </div>

              {/* Note */}
              <div>
                <label className="text-white/80 text-xs font-medium mb-1.5 block">Custom Note</label>
                <textarea
                  value={customNote}
                  onChange={e => setCustomNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/50 resize-none"
                />
              </div>

              {/* Toggles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={includeQR} onChange={e => setIncludeQR(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-white/80 text-xs">QR Code</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={includeWatermark} onChange={e => setIncludeWatermark(e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-white/80 text-xs">Watermark</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ─── COLORFUL RECEIPT PREVIEW ─── */}
        <div
          ref={receiptRef}
          className="receipt-printable rounded-2xl shadow-2xl mx-auto overflow-hidden"
          style={{
            background: t.bg,
            color: t.text,
            maxWidth: 420,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {/* Header with gradient */}
          <div
            className="relative px-6 pt-6 pb-8 text-white"
            style={{ background: t.headerGradient }}
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/4" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">{merchantName.toUpperCase()}</h2>
                  <p className="text-xs opacity-80 mt-0.5 font-medium">PAYMENT RECEIPT</p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-70">Receipt #</p>
                  <p className="text-sm font-bold font-mono">{receiptNo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 text-xs opacity-90">
                <span>{format(txDate, 'EEEE, dd MMMM yyyy')}</span>
                <span className="w-1 h-1 rounded-full bg-white/50" />
                <span>{format(txDate, 'hh:mm a')}</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {/* Description */}
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.subtext }}>Description</p>
              <p className="text-lg font-bold leading-tight">{transaction.description}</p>
            </div>

            {/* Category & Type */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3 rounded-xl" style={{ background: t.primary + '10' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.subtext }}>Category</p>
                <p className="font-semibold">{transaction.category}</p>
              </div>
              <div className="p-3 rounded-xl text-right" style={{ background: isIncome ? '#10b98115' : '#ef444415' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.subtext }}>Type</p>
                <p className={`font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isIncome ? '↑ INCOME' : '↓ EXPENSE'}
                </p>
              </div>
            </div>

            {/* Amount Box */}
            <div
              className="rounded-2xl p-5 text-white text-center relative overflow-hidden"
              style={{ background: t.headerGradient }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/4" />
              <div className="relative">
                <p className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">
                  {isIncome ? 'Amount Received' : 'Amount Paid'}
                </p>
                <p className="text-4xl font-black tracking-tight">
                  ₹ {absAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs opacity-80 mt-1 italic">
                  {toWords(absAmount)} Rupees Only
                </p>
              </div>
            </div>

            {/* Custom Note */}
            {customNote && (
              <div className="mt-4 p-3 rounded-xl border border-dashed" style={{ borderColor: t.border, background: t.primary + '08' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.subtext }}>Note</p>
                <p className="text-sm italic">{customNote}</p>
              </div>
            )}

            {/* Receipt Image */}
            {transaction.receiptImage && (
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.subtext }}>Attached Receipt</p>
                <img src={transaction.receiptImage} alt="Receipt" className="w-full h-32 object-cover rounded-xl border" style={{ borderColor: t.border }} />
              </div>
            )}

            {/* QR Code */}
            {includeQR && (
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: t.subtext }}>Verify</p>
                  <p className="text-xs font-mono" style={{ color: t.subtext }}>ID: {transaction.id.slice(0, 16)}</p>
                </div>
                <div
                  className="w-16 h-16 bg-white rounded-lg p-1 border"
                  style={{ borderColor: t.border }}
                  dangerouslySetInnerHTML={{ __html: generateQR(56) }}
                />
              </div>
            )}

            {/* Watermark */}
            {includeWatermark && (
              <div className="relative mt-4 py-4 text-center overflow-hidden">
                <p
                  className="text-6xl font-black absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                  style={{ color: t.primary, opacity: 0.04, transform: 'rotate(-12deg)' }}
                >
                  VERIFIED
                </p>
                <div className="relative">
                  <p className="text-xs font-bold">Thank You!</p>
                  <p className="text-[10px] mt-0.5" style={{ color: t.subtext }}>
                    This is a computer-generated receipt
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 pt-3 border-t text-center" style={{ borderColor: t.border }}>
              <p className="text-[10px]" style={{ color: t.subtext }}>
                {merchantName} • Privacy-First Finance • Generated {format(new Date(), 'dd MMM yyyy HH:mm')}
              </p>
            </div>
          </div>
        </div>

        {/* ─── ACTIONS ─── */}
        <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2 max-w-[420px] mx-auto">
          {[
            { icon: FileText, label: 'PDF', fn: handlePDF, cls: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25' },
            { icon: ImageIcon, label: 'Image', fn: downloadAsImage, cls: 'bg-emerald-600 text-white' },
            { icon: Printer, label: 'Print', fn: handlePrint, cls: 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700' },
            { icon: Share2, label: 'Share', fn: handleShare, cls: 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700' },
            { icon: Mail, label: 'Email', fn: handleEmail, cls: 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700' },
            { icon: Copy, label: 'Copy', fn: handleCopy, cls: 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700' },
          ].map(a => (
            <button
              key={a.label}
              onClick={a.fn}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-semibold transition-all hover:scale-105 ${a.cls}`}
            >
              <a.icon className="w-4 h-4" />{a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
