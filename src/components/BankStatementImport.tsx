import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, X, Sparkles } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { db } from '@/lib/db';
import { format, parse } from 'date-fns';

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  balance?: number;
  type: 'income' | 'expense';
  category?: string;
  selected: boolean;
  duplicate: boolean;
  raw: string[];
}

const BANK_FORMATS: Record<string, { dateFormat: string; amountInCol: number; typeCol: number }> = {
  hdfc: { dateFormat: 'dd/MM/yyyy', amountInCol: 5, typeCol: 4 },
  sbi: { dateFormat: 'dd MMM yyyy', amountInCol: 4, typeCol: 3 },
  icici: { dateFormat: 'dd/MM/yyyy', amountInCol: 4, typeCol: 3 },
  axis: { dateFormat: 'dd-MM-yyyy', amountInCol: 4, typeCol: 3 },
  generic: { dateFormat: 'yyyy-MM-dd', amountInCol: 3, typeCol: -1 },
};

export function BankStatementImport({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [, setParsing] = useState(false);
  const [bankFormat, setBankFormat] = useState<keyof typeof BANK_FORMATS>('generic');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    return lines.map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else current += char;
      }
      result.push(current.trim());
      return result;
    });
  };

  const detectCategory = (desc: string): string => {
    const l = desc.toLowerCase();
    if (l.match(/swiggy|zomato|restaurant|hotel|food|cafe|chai|coffee/)) return 'food';
    if (l.match(/uber|ola|petrol|diesel|metro|bus|train|rapido/)) return 'transport';
    if (l.match(/amazon|flipkart|myntra|ajio|shopping/)) return 'shopping';
    if (l.match(/electricity|water|gas|recharge|broadband|jio|airtel/)) return 'bills';
    if (l.match(/apollo|medplus|pharmacy|hospital|doctor|medicine/)) return 'health';
    if (l.match(/rent|landlord|housing/)) return 'rent';
    if (l.match(/salary|payroll|wages|stipend/)) return 'salary';
    if (l.match(/grocery|bigbasket|grofers|reliance fresh/)) return 'groceries';
    if (l.match(/netflix|spotify|hotstar|prime|disney/)) return 'bills';
    return 'other-expense';
  };

  const parseAmount = (str: string): number => {
    return parseFloat(str.replace(/[^0-9.-]/g, '')) || 0;
  };

  const parseDate = (str: string): string | null => {
    try {
      const formats = ['dd/MM/yyyy', 'dd-MM-yyyy', 'dd/MM/yy', 'yyyy-MM-dd', 'dd MMM yyyy', 'MM/dd/yyyy'];
      for (const f of formats) {
        try {
          const d = parse(str, f, new Date());
          if (!isNaN(d.getTime())) return d.toISOString();
        } catch {}
      }
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d.toISOString();
    } catch { return null; }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setParsing(true);

    try {
      const text = await selected.text();
      const rows = parseCSV(text);
      
      // Detect format if first row looks like header
      const startIdx = rows[0]?.some(c => c.match(/date|description|amount/i)) ? 1 : 0;
      const fmt = BANK_FORMATS[bankFormat];

      const parsedRows: ParsedRow[] = [];
      const existing = await db.transactions.toArray();
      const existingHashes = new Set(existing.map(t => `${t.date}-${t.amount}-${t.description.slice(0, 20)}`));

      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 3) continue;
        
        const dateStr = row[0];
        let amount = 0;
        let type: 'income' | 'expense' = 'expense';

        // Try to find amount column
        for (let j = row.length - 1; j >= 0; j--) {
          const num = parseAmount(row[j]);
          if (num !== 0 && Math.abs(num) > 1) {
            amount = num;
            break;
          }
        }

        if (amount < 0) {
          type = 'expense';
          amount = Math.abs(amount);
        } else {
          // Check if type col says "Dr" or "Cr"
          if (row[fmt.typeCol]?.match(/dr|debit/i)) {
            type = 'expense';
          } else if (row[fmt.typeCol]?.match(/cr|credit/i)) {
            type = 'income';
          }
        }

        const date = parseDate(dateStr) || new Date().toISOString();
        const descClean = (type === 'expense' ? row[1] : row[1]) || 'Transaction';
        const hash = `${date}-${amount}-${descClean.slice(0, 20)}`;
        
        parsedRows.push({
          date,
          description: descClean,
          amount: type === 'expense' ? -amount : amount,
          balance: undefined,
          type,
          category: detectCategory(descClean),
          selected: !existingHashes.has(hash),
          duplicate: existingHashes.has(hash),
          raw: row,
        });
      }
      setParsed(parsedRows);
      addToast('success', `Parsed ${parsedRows.length} transactions (${parsedRows.filter(r => r.duplicate).length} duplicates)`);
    } catch (error) {
      addToast('error', 'Failed to parse CSV');
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    const toImport = parsed.filter(r => r.selected && !r.duplicate);
    if (toImport.length === 0) {
      addToast('error', 'No transactions selected');
      return;
    }

    setImporting(true);
    try {
      const now = new Date().toISOString();
      const txns = toImport.map((r, i) => ({
        id: `imp-${Date.now()}-${i}`,
        date: r.date,
        amount: r.amount,
        category: r.category || 'other-expense',
        description: r.description,
        createdAt: now,
        updatedAt: now,
      }));
      await db.transactions.bulkAdd(txns);
      addToast('success', `Imported ${txns.length} transactions!`);
      onSuccess();
      onClose();
    } catch (error) {
      addToast('error', 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const toggleAll = (selected: boolean) => {
    setParsed(prev => prev.map(r => ({ ...r, selected: selected && !r.duplicate })));
  };

  const selectedCount = parsed.filter(r => r.selected && !r.duplicate).length;
  const totalAmount = parsed.filter(r => r.selected && !r.duplicate).reduce((s, r) => s + r.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Bank Statement Import
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {parsed.length === 0 ? (
            <>
              <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-100">Smart CSV Parser</h3>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">Auto-detects columns, formats, duplicates. Supports HDFC, SBI, ICICI, Axis, and generic CSVs.</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Bank Format</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {Object.keys(BANK_FORMATS).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setBankFormat(fmt as any)}
                      className={`py-2 rounded-xl text-xs font-bold uppercase border-2 ${
                        bankFormat === fmt
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700'
                          : 'border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-12 text-center cursor-pointer hover:border-violet-500 transition-colors"
              >
                <Upload className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
                <p className="font-semibold mb-1">Click to upload CSV file</p>
                <p className="text-sm text-zinc-500">Or drag and drop</p>
                <p className="text-xs text-zinc-400 mt-2">Supported: .csv files (max 10MB)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                className="hidden"
              />

              <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <p className="text-xs font-medium mb-2">💡 Tips for best results:</p>
                <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Download CSV from your bank's net banking portal</li>
                  <li>Include the transaction date range header if present</li>
                  <li>First row may be a header (we auto-detect it)</li>
                  <li>Duplicates are auto-detected and skipped</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Preview Header */}
              <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <div>
                  <p className="text-sm font-semibold">{file?.name}</p>
                  <p className="text-xs text-zinc-500">
                    {parsed.length} transactions • {selectedCount} selected • {parsed.filter(r => r.duplicate).length} duplicates
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleAll(true)} className="text-xs px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700">
                    Select All
                  </button>
                  <button onClick={() => toggleAll(false)} className="text-xs px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700">
                    Deselect All
                  </button>
                  <button onClick={() => setParsed([])} className="text-xs px-3 py-1.5 rounded-lg text-red-600">
                    Reset
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 sticky top-0">
                    <tr className="text-xs font-semibold text-zinc-600">
                      <th className="px-3 py-2 text-left">✓</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((row, i) => (
                      <tr
                        key={i}
                        className={`border-t border-zinc-100 dark:border-zinc-800 ${
                          row.duplicate ? 'opacity-50 bg-amber-50 dark:bg-amber-950/20' : ''
                        } ${row.selected ? '' : 'opacity-40'}`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={row.selected && !row.duplicate}
                            disabled={row.duplicate}
                            onChange={e => setParsed(prev => prev.map((r, idx) => idx === i ? { ...r, selected: e.target.checked } : r))}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {row.duplicate && <AlertTriangle className="w-3 h-3 inline text-amber-500 mr-1" />}
                          {format(new Date(row.date), 'dd MMM yyyy')}
                        </td>
                        <td className="px-3 py-2 text-xs max-w-[200px] truncate">{row.description}</td>
                        <td className="px-3 py-2 text-xs">
                          <select
                            value={row.category}
                            onChange={e => setParsed(prev => prev.map((r, idx) => idx === i ? { ...r, category: e.target.value } : r))}
                            className="px-2 py-0.5 rounded text-xs bg-transparent border border-zinc-200 dark:border-zinc-700"
                          >
                            <option value="food">Food</option>
                            <option value="transport">Transport</option>
                            <option value="shopping">Shopping</option>
                            <option value="bills">Bills</option>
                            <option value="health">Health</option>
                            <option value="rent">Rent</option>
                            <option value="salary">Salary</option>
                            <option value="groceries">Groceries</option>
                            <option value="other-expense">Other</option>
                          </select>
                        </td>
                        <td className={`px-3 py-2 text-right font-mono font-bold ${row.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.amount > 0 ? '+' : ''}₹{Math.abs(row.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {parsed.length > 0 && (
          <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{selectedCount} transactions selected</p>
              <p className="text-xs text-zinc-500">
                Net: <span className={totalAmount >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {totalAmount >= 0 ? '+' : ''}₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium">
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={selectedCount === 0 || importing}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {importing ? 'Importing...' : `Import ${selectedCount}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
