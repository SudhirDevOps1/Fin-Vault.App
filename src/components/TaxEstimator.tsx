import { useState, useMemo } from 'react';
import { Calculator, IndianRupee, Scale, ChevronDown, ChevronUp, Info, CheckCircle } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const OLD_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 5 },
  { min: 500000, max: 1000000, rate: 20 },
  { min: 1000000, max: Infinity, rate: 30 },
];

const NEW_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 5 },
  { min: 700000, max: 1000000, rate: 10 },
  { min: 1000000, max: 1200000, rate: 15 },
  { min: 1200000, max: 1500000, rate: 20 },
  { min: 1500000, max: Infinity, rate: 30 },
];

const DEDUCTIONS = [
  { id: '80c', label: '80C (PPF, ELSS, LIC, etc.)', max: 150000, desc: 'Investments + Insurance' },
  { id: '80d_self', label: '80D Self (Health Insurance)', max: 25000, desc: 'Health insurance premium' },
  { id: '80d_parents', label: '80D Parents', max: 50000, desc: 'Senior citizen parents' },
  { id: 'hra', label: 'HRA Exemption', max: Infinity, desc: 'House rent allowance' },
  { id: '80e', label: '80E (Education Loan Interest)', max: Infinity, desc: 'Interest on education loan' },
  { id: '80g', label: '80G (Donations)', max: Infinity, desc: 'Charitable contributions' },
  { id: '80tta', label: '80TTA (Savings Interest)', max: 10000, desc: 'Savings account interest' },
  { id: 'nps', label: '80CCD(1B) NPS', max: 50000, desc: 'NPS additional' },
  { id: 'std', label: 'Standard Deduction', max: 50000, desc: 'Auto for salaried' },
];

export function TaxEstimator() {
  const [grossIncome, setGrossIncome] = useState('');
  const [deductions, setDeductions] = useState<Record<string, string>>({});
  const [showDetails, setShowDetails] = useState(false);
  const { transactions } = useTransactions();

  // Auto-calculate income from transactions
  const autoIncome = useMemo(() => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 3, 1); // April 1
    const yearEnd = new Date(now.getFullYear() + 1, 2, 31); // March 31
    return transactions
      .filter(t => t.amount > 0 && new Date(t.date) >= yearStart && new Date(t.date) <= yearEnd)
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  const income = parseFloat(grossIncome) || autoIncome || 0;

  const totalDeductions = useMemo(() => {
    return Object.entries(deductions).reduce((total, [key, val]) => {
      const def = DEDUCTIONS.find(d => d.id === key);
      const amount = parseFloat(val) || 0;
      return total + Math.min(amount, def?.max || 0);
    }, 0);
  }, [deductions]);

  const calcTax = (taxableIncome: number, slabs: typeof OLD_SLABS): number => {
    let tax = 0;
    for (const slab of slabs) {
      if (taxableIncome <= slab.min) break;
      const amt = Math.min(taxableIncome, slab.max) - slab.min;
      tax += amt * (slab.rate / 100);
    }
    return tax;
  };

  const oldTaxable = Math.max(0, income - totalDeductions);
  const newTaxable = Math.max(0, income - 75000); // New regime standard deduction only
  const oldTax = calcTax(oldTaxable, OLD_SLABS);
  const newTax = calcTax(newTaxable, NEW_SLABS);
  const oldCess = oldTax * 0.04;
  const newCess = newTax * 0.04;
  const oldTotal = oldTax + oldCess;
  const newTotal = newTax + newCess;
  const savings = Math.abs(oldTotal - newTotal);
  const betterRegime = oldTotal <= newTotal ? 'old' : 'new';

  const chartData = [
    { name: 'Old Regime', tax: Math.round(oldTotal), fill: '#6366f1' },
    { name: 'New Regime', tax: Math.round(newTotal), fill: '#10b981' },
  ];

  const effectiveRateOld = income > 0 ? ((oldTotal / income) * 100).toFixed(2) : '0';
  const effectiveRateNew = income > 0 ? ((newTotal / income) * 100).toFixed(2) : '0';

  const monthlyTDS = Math.round(Math.min(oldTotal, newTotal) / 12);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-200 dark:border-orange-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center shadow-lg">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Indian Tax Estimator</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">FY 2025-26 • Old vs New Regime</p>
          </div>
        </div>
      </div>

      {/* Income Input */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <label className="block text-sm font-bold mb-2">Gross Annual Income (₹)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
          <input
            type="number"
            value={grossIncome}
            onChange={e => setGrossIncome(e.target.value)}
            placeholder={autoIncome > 0 ? `Auto-detected: ₹${autoIncome.toLocaleString('en-IN')}` : 'Enter annual income'}
            className="w-full pl-8 pr-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-orange-500 outline-none text-lg font-bold"
          />
        </div>
        {autoIncome > 0 && !grossIncome && (
          <button onClick={() => setGrossIncome(autoIncome.toString())} className="mt-2 text-xs text-orange-600 font-medium hover:underline">
            Use auto-detected income: ₹{autoIncome.toLocaleString('en-IN')}
          </button>
        )}
      </div>

      {/* Comparison Result */}
      {income > 0 && (
        <>
          <div className={`p-4 rounded-2xl border-2 ${betterRegime === 'old' ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20' : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'}`}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5" />
              <p className="font-bold">
                {betterRegime === 'old' ? 'Old Regime' : 'New Regime'} is better for you!
              </p>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You save <strong>₹{savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> compared to the other regime
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 rounded-2xl border-2 ${betterRegime === 'old' ? 'border-violet-500' : 'border-zinc-200 dark:border-zinc-800'} bg-white dark:bg-zinc-900`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold">Old Regime</p>
                {betterRegime === 'old' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-600 text-white font-bold">BETTER</span>}
              </div>
              <p className="text-2xl font-black text-violet-600">₹{oldTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-zinc-500 mt-1">Effective rate: {effectiveRateOld}%</p>
              <p className="text-xs text-zinc-500">Deductions: ₹{totalDeductions.toLocaleString('en-IN')}</p>
            </div>
            <div className={`p-4 rounded-2xl border-2 ${betterRegime === 'new' ? 'border-emerald-500' : 'border-zinc-200 dark:border-zinc-800'} bg-white dark:bg-zinc-900`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold">New Regime</p>
                {betterRegime === 'new' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">BETTER</span>}
              </div>
              <p className="text-2xl font-black text-emerald-600">₹{newTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-zinc-500 mt-1">Effective rate: {effectiveRateNew}%</p>
              <p className="text-xs text-zinc-500">Std deduction: ₹75,000</p>
            </div>
          </div>

          {/* Monthly TDS */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Estimated Monthly TDS</p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">₹{monthlyTDS.toLocaleString('en-IN')}/mo</p>
            </div>
            <IndianRupee className="w-8 h-8 text-amber-500/30" />
          </div>

          {/* Chart */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h4 className="text-sm font-bold mb-3">Tax Comparison</h4>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                  <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Tax']} />
                  <Bar dataKey="tax" radius={[0, 8, 8, 0]}>
                    {chartData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Deductions */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-violet-600" />
            <span className="font-bold">Deductions (Old Regime)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 font-bold">
              ₹{totalDeductions.toLocaleString('en-IN')}
            </span>
          </div>
          {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {showDetails && (
          <div className="px-4 pb-4 space-y-3">
            {DEDUCTIONS.map(d => (
              <div key={d.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{d.label}</p>
                  <p className="text-xs text-zinc-500">{d.desc} {d.max < Infinity && `• Max ₹${d.max.toLocaleString('en-IN')}`}</p>
                </div>
                <input
                  type="number"
                  value={deductions[d.id] || ''}
                  onChange={e => setDeductions({ ...deductions, [d.id]: e.target.value })}
                  placeholder="₹0"
                  className="w-28 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-right font-mono"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tax Slabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-sm font-bold mb-2 text-violet-600">Old Regime Slabs</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span>₹0 – ₹2.5L</span><span className="font-bold">0%</span></div>
            <div className="flex justify-between"><span>₹2.5L – ₹5L</span><span className="font-bold">5%</span></div>
            <div className="flex justify-between"><span>₹5L – ₹10L</span><span className="font-bold">20%</span></div>
            <div className="flex justify-between"><span>₹10L+</span><span className="font-bold">30%</span></div>
          </div>
        </div>
        <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-sm font-bold mb-2 text-emerald-600">New Regime Slabs</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span>₹0 – ₹3L</span><span className="font-bold">0%</span></div>
            <div className="flex justify-between"><span>₹3L – ₹7L</span><span className="font-bold">5%</span></div>
            <div className="flex justify-between"><span>₹7L – ₹10L</span><span className="font-bold">10%</span></div>
            <div className="flex justify-between"><span>₹10L – ₹12L</span><span className="font-bold">15%</span></div>
            <div className="flex justify-between"><span>₹12L – ₹15L</span><span className="font-bold">20%</span></div>
            <div className="flex justify-between"><span>₹15L+</span><span className="font-bold">30%</span></div>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-900 dark:text-blue-100">
            <strong>Note:</strong> This is an estimate only. 4% Health & Education Cess included. Consult a CA for exact tax calculation. Surcharge not included.
          </p>
        </div>
      </div>
    </div>
  );
}
