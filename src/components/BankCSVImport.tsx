import { useState } from 'react';
import {
  Upload, FileSpreadsheet, AlertTriangle, CheckCircle,
  ArrowRight, Eye, Download, Loader2, Settings, Columns
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { db } from '@/lib/db';
import { format, parse, isValid } from 'date-fns';

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  balance?: number;
  type: 'income' | 'expense';
  isDuplicate: boolean;
  selected: boolean;
  raw: string[];
}

interface ColumnMapping {
  date: number;
  description: number;
  debit: number;
  credit: number;
  balance: number;
}

const BANK_PRESETS: Record<string, { name: string; mapping: ColumnMapping; dateFormat: string; skipRows: number }> = {
  hdfc: { name: 'HDFC Bank', mapping: { date: 0, description: 1, debit: 3, credit: 4, balance: 6 }, dateFormat: 'dd/MM/yy', skipRows: 1 },
  sbi: { name: 'SBI', mapping: { date: 0, description: 2, debit: 3, credit: 4, balance: 5 }, dateFormat: 'dd MMM yyyy', skipRows: 1 },
  icici: { name: 'ICICI Bank', mapping: { date: 0, description: 1, debit: 3, credit: 4, balance: 5 }, dateFormat: 'dd/MM/yyyy', skipRows: 1 },
  axis: { name: 'Axis Bank', mapping: { date: 0, description: 1, debit: 2, credit: 3, balance: 4 }, dateFormat: 'dd-MM-yyyy', skipRows: 1 },
  kotak: { name: 'Kotak', mapping: { date: 0, description: 2, debit: 3, credit: 4, balance: 5 }, dateFormat: 'dd/MM/yyyy', skipRows: 1 },
  custom: { name: 'Custom', mapping: { date: 0, description: 1, debit: 2, credit: 3, balance: 4 }, dateFormat: 'dd/MM/yyyy', skipRows: 1 },
};

export function BankCSVImport() {
  const [step, setStep] = useState<'upload' | 'configure' | 'preview' | 'done'>('upload');
  const [rawData, setRawData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preset, setPreset] = useState<string>('custom');
  const [mapping, setMapping] = useState<ColumnMapping>(BANK_PRESETS.custom.mapping);
  const [dateFormat, setDateFormat] = useState('dd/MM/yyyy');
  const [skipRows, setSkipRows] = useState(1);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const { addToast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      addToast('error', 'Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      const rows = lines.map(line => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const ch of line) {
          if (ch === '"') { inQuotes = !inQuotes; continue; }
          if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
          current += ch;
        }
        result.push(current.trim());
        return result;
      });
      if (rows.length < 2) { addToast('error', 'File too small'); return; }
      setHeaders(rows[0]);
      setRawData(rows);
      autoDetectBank(rows);
      setStep('configure');
    };
    reader.readAsText(file);
  };

  const autoDetectBank = (rows: string[][]) => {
    const header = rows[0].join(' ').toLowerCase();
    if (header.includes('hdfc')) { applyPreset('hdfc'); return; }
    if (header.includes('sbi') || header.includes('state bank')) { applyPreset('sbi'); return; }
    if (header.includes('icici')) { applyPreset('icici'); return; }
    if (header.includes('axis')) { applyPreset('axis'); return; }
    if (header.includes('kotak')) { applyPreset('kotak'); return; }
    applyPreset('custom');
  };

  const applyPreset = (key: string) => {
    const p = BANK_PRESETS[key];
    setPreset(key);
    setMapping(p.mapping);
    setDateFormat(p.dateFormat);
    setSkipRows(p.skipRows);
  };

  const parseAmount = (val: string): number => {
    if (!val) return 0;
    return parseFloat(val.replace(/[^0-9.\-]/g, '')) || 0;
  };

  const parseDate = (val: string): Date | null => {
    if (!val) return null;
    const clean = val.trim().replace(/\s+/g, ' ');
    const formats = [dateFormat, 'dd/MM/yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy', 'dd MMM yyyy', 'dd/MM/yy'];
    for (const fmt of formats) {
      try {
        const d = parse(clean, fmt, new Date());
        if (isValid(d) && d.getFullYear() > 2000 && d.getFullYear() < 2030) return d;
      } catch { /* try next */ }
    }
    const d = new Date(clean);
    return isValid(d) ? d : null;
  };

  const handleParse = async () => {
    const dataRows = rawData.slice(skipRows);
    const existingTxns = await db.transactions.toArray();

    const parsed: ParsedRow[] = [];
    for (const row of dataRows) {
      if (row.length < 3) continue;
      const dateStr = row[mapping.date] || '';
      const desc = row[mapping.description] || '';
      const debitStr = row[mapping.debit] || '';
      const creditStr = row[mapping.credit] || '';

      const dateObj = parseDate(dateStr);
      if (!dateObj) continue;

      const debit = parseAmount(debitStr);
      const credit = parseAmount(creditStr);
      const amount = credit > 0 ? credit : debit > 0 ? -debit : 0;
      if (amount === 0) continue;

      const balStr = row[mapping.balance] || '';
      const balance = parseAmount(balStr) || undefined;

      const isDuplicate = existingTxns.some(t => {
        const tDate = format(new Date(t.date), 'yyyy-MM-dd');
        const pDate = format(dateObj, 'yyyy-MM-dd');
        return tDate === pDate && Math.abs(t.amount) === Math.abs(amount) && t.description.includes(desc.slice(0, 20));
      });

      parsed.push({
        date: dateObj.toISOString(),
        description: desc.slice(0, 100),
        amount,
        balance,
        type: amount > 0 ? 'income' : 'expense',
        isDuplicate,
        selected: !isDuplicate,
        raw: row,
      });
    }

    setParsedRows(parsed);
    setStep('preview');
    addToast('success', `Parsed ${parsed.length} transactions (${parsed.filter(r => r.isDuplicate).length} possible duplicates)`);
  };

  const handleImport = async () => {
    setImporting(true);
    const toImport = parsedRows.filter(r => r.selected);
    let count = 0;
    for (const row of toImport) {
      await db.transactions.add({
        id: `csv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: row.date,
        amount: row.amount,
        category: row.type === 'income' ? 'other-income' : 'other-expense',
        description: row.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      count++;
    }
    setImportedCount(count);
    setImporting(false);
    setStep('done');
    addToast('success', `✅ Imported ${count} transactions!`);
  };

  const toggleRow = (idx: number) => {
    setParsedRows(prev => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r));
  };

  const toggleAll = (selected: boolean) => {
    setParsedRows(prev => prev.map(r => ({ ...r, selected })));
  };

  const selectedCount = parsedRows.filter(r => r.selected).length;

  return (
    <div className="space-y-4">
      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Bank Statement CSV Import</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Upload CSV from any Indian bank</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(BANK_PRESETS).filter(([k]) => k !== 'custom').map(([key, val]) => (
                <span key={key} className="text-xs px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-medium">
                  🏦 {val.name}
                </span>
              ))}
            </div>
          </div>

          <label className="block">
            <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-10 text-center hover:border-blue-500 transition-colors cursor-pointer bg-white dark:bg-zinc-900">
              <Upload className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
              <p className="font-bold text-lg">Drop CSV file here</p>
              <p className="text-sm text-zinc-500 mt-1">or click to browse</p>
              <p className="text-xs text-zinc-400 mt-2">Supports HDFC, SBI, ICICI, Axis, Kotak & custom CSV</p>
            </div>
            <input type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
          </label>
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 'configure' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configure Columns
            </h3>
            <button onClick={() => setStep('upload')} className="text-sm text-violet-600 dark:text-violet-400">← Back</button>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <label className="block text-sm font-medium mb-2">Bank Preset</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {Object.entries(BANK_PRESETS).map(([key, val]) => (
                <button key={key} onClick={() => applyPreset(key)} className={`py-2 px-3 rounded-xl text-xs font-medium border-2 ${preset === key ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-zinc-200 dark:border-zinc-700'}`}>
                  {val.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">
              <Columns className="w-4 h-4" />
              Column Mapping (0-indexed)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Date', key: 'date' as const },
                { label: 'Description', key: 'description' as const },
                { label: 'Debit', key: 'debit' as const },
                { label: 'Credit', key: 'credit' as const },
                { label: 'Balance', key: 'balance' as const },
              ].map(col => (
                <div key={col.key}>
                  <label className="text-xs text-zinc-500">{col.label}</label>
                  <input
                    type="number"
                    min="0"
                    value={mapping[col.key]}
                    onChange={e => setMapping({ ...mapping, [col.key]: parseInt(e.target.value) })}
                    className="w-full mt-1 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500">Date Format</label>
                <input
                  value={dateFormat}
                  onChange={e => setDateFormat(e.target.value)}
                  placeholder="dd/MM/yyyy"
                  className="w-full mt-1 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Skip Header Rows</label>
                <input
                  type="number"
                  min="0"
                  value={skipRows}
                  onChange={e => setSkipRows(parseInt(e.target.value))}
                  className="w-full mt-1 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Raw Preview */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <p className="text-sm font-bold mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Raw Data Preview (first 5 rows)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-2 py-1.5 text-left text-zinc-500">#</th>
                    {headers.map((h, i) => (
                      <th key={i} className="px-2 py-1.5 text-left text-zinc-500 whitespace-nowrap">
                        Col {i}: {h.slice(0, 15)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawData.slice(0, 6).map((row, ri) => (
                    <tr key={ri} className={`border-b border-zinc-100 dark:border-zinc-800 ${ri < skipRows ? 'opacity-40' : ''}`}>
                      <td className="px-2 py-1">{ri}</td>
                      {row.map((cell, ci) => (
                        <td key={ci} className={`px-2 py-1 whitespace-nowrap max-w-[120px] truncate ${
                          ci === mapping.date ? 'text-blue-600 font-bold' :
                          ci === mapping.description ? 'text-violet-600 font-bold' :
                          ci === mapping.debit ? 'text-red-600 font-bold' :
                          ci === mapping.credit ? 'text-emerald-600 font-bold' :
                          ci === mapping.balance ? 'text-amber-600' : ''
                        }`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={handleParse}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold shadow-lg shadow-blue-500/25 hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            Parse & Preview Transactions
          </button>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Review Transactions</h3>
            <button onClick={() => setStep('configure')} className="text-sm text-violet-600 dark:text-violet-400">← Back</button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-center">
              <p className="text-xs text-emerald-700 dark:text-emerald-400">Selected</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{selectedCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-center">
              <p className="text-xs text-amber-700 dark:text-amber-400">Duplicates</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{parsedRows.filter(r => r.isDuplicate).length}</p>
            </div>
            <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 text-center">
              <p className="text-xs text-violet-700 dark:text-violet-400">Total</p>
              <p className="text-lg font-bold text-violet-700 dark:text-violet-400">{parsedRows.length}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => toggleAll(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700">Select All</button>
            <button onClick={() => toggleAll(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-950/50 text-red-700">Deselect All</button>
          </div>

          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {parsedRows.map((row, idx) => (
              <div
                key={idx}
                onClick={() => toggleRow(idx)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  row.selected
                    ? 'border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-60'
                } ${row.isDuplicate ? 'ring-1 ring-amber-400' : ''}`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                  row.selected ? 'bg-violet-600 border-violet-600' : 'border-zinc-300 dark:border-zinc-600'
                }`}>
                  {row.selected && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{row.description}</p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                    <span>{format(new Date(row.date), 'dd MMM yyyy')}</span>
                    {row.isDuplicate && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        Duplicate?
                      </span>
                    )}
                  </div>
                </div>
                <p className={`font-bold flex-shrink-0 ${row.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {row.amount > 0 ? '+' : '-'}₹{Math.abs(row.amount).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={handleImport}
            disabled={importing || selectedCount === 0}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Import {selectedCount} Transactions
          </button>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && (
        <div className="text-center py-10 space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold">Import Complete!</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            Successfully imported <strong>{importedCount}</strong> transactions
          </p>
          <button onClick={() => { setStep('upload'); setRawData([]); setParsedRows([]); }} className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700">
            Import Another
          </button>
        </div>
      )}
    </div>
  );
}
