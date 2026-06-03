import { useState, useMemo } from 'react';
import {
  Calculator, FileText, Award,
  IndianRupee, Info, Sparkles
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useTransactions } from '@/hooks/useTransactions';

const TAX_REGIMES = {
  old: {
    name: 'Old Regime',
    description: 'Higher slabs but allows 80C, 80D, HRA deductions',
    slabs: [
      { upTo: 250000, rate: 0 },
      { upTo: 500000, rate: 5 },
      { upTo: 1000000, rate: 20 },
      { upTo: Infinity, rate: 30 },
    ],
    standardDeduction: 50000,
    rebate87A: { upTo: 500000, max: 12500 },
  },
  new: {
    name: 'New Regime (FY 2024-25)',
    description: 'Lower slabs but limited deductions',
    slabs: [
      { upTo: 300000, rate: 0 },
      { upTo: 700000, rate: 5 },
      { upTo: 1000000, rate: 10 },
      { upTo: 1200000, rate: 15 },
      { upTo: 1500000, rate: 20 },
      { upTo: Infinity, rate: 30 },
    ],
    standardDeduction: 75000,
    rebate87A: { upTo: 700000, max: 25000 },
  },
};

const DEDUCTION_SECTIONS = [
  { id: '80c', name: '80C', limit: 150000, desc: 'PPF, ELSS, Life Insurance, EPF, Home Loan Principal' },
  { id: '80d', name: '80D', limit: 25000, desc: 'Health Insurance Premium (Self & Family)' },
  { id: '80ccd1b', name: '80CCD(1B)', limit: 50000, desc: 'NPS Additional Contribution' },
  { id: '80e', name: '80E', limit: Infinity, desc: 'Education Loan Interest' },
  { id: '80g', name: '80G', limit: Infinity, desc: 'Donations to Charity' },
  { id: '80tta', name: '80TTA', limit: 10000, desc: 'Savings Account Interest' },
  { id: '24b', name: '24(b)', limit: 200000, desc: 'Home Loan Interest' },
  { id: 'hra', name: 'HRA', limit: Infinity, desc: 'House Rent Allowance' },
];

function calculateTax(income: number, deductions: number, regime: 'old' | 'new'): number {
  const r = TAX_REGIMES[regime];
  const taxableIncome = Math.max(0, income - deductions - r.standardDeduction);
  
  // Apply 87A rebate
  if (taxableIncome <= r.rebate87A.upTo) {
    return 0;
  }

  let tax = 0;
  let prevLimit = 0;
  
  for (const slab of r.slabs) {
    if (taxableIncome > prevLimit) {
      const slabIncome = Math.min(taxableIncome, slab.upTo) - prevLimit;
      tax += (slabIncome * slab.rate) / 100;
      prevLimit = slab.upTo;
    } else break;
  }

  // Health & Education Cess: 4%
  tax = tax * 1.04;
  
  return Math.round(tax);
}

export function TaxEstimator() {
  const [annualIncome, setAnnualIncome] = useState('1200000');
  const [regime, setRegime] = useState<'old' | 'new'>('new');
  const [deductions, setDeductions] = useState<Record<string, string>>({
    '80c': '150000',
    '80d': '25000',
  });
  const [filingYear] = useState('2024-25');
  const { transactions } = useTransactions();
  const { addToast } = useToast();

  const [showDeductions, setShowDeductions] = useState(false);

  // Auto-detect income from transactions (last 12 months)
  const detectedIncome = useMemo(() => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return transactions
      .filter(t => t.amount > 0 && new Date(t.date) >= oneYearAgo)
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  const totalDeductions = useMemo(() => {
    return Object.entries(deductions).reduce((sum, [id, val]) => {
      const section = DEDUCTION_SECTIONS.find(s => s.id === id);
      if (!section) return sum;
      const amount = parseFloat(val) || 0;
      return sum + Math.min(amount, section.limit === Infinity ? amount : section.limit);
    }, 0);
  }, [deductions]);

  const oldRegimeTax = useMemo(() => calculateTax(parseFloat(annualIncome) || 0, totalDeductions, 'old'), [annualIncome, totalDeductions]);
  const newRegimeTax = useMemo(() => calculateTax(parseFloat(annualIncome) || 0, totalDeductions, 'new'), [annualIncome, totalDeductions]);
  
  const currentTax = regime === 'old' ? oldRegimeTax : newRegimeTax;
  const bestRegime = oldRegimeTax < newRegimeTax ? 'old' : 'new';
  const taxSaved = Math.abs(oldRegimeTax - newRegimeTax);
  const monthlyTakeHome = ((parseFloat(annualIncome) || 0) - currentTax) / 12;

  const useDetectedIncome = () => {
    setAnnualIncome(detectedIncome.toString());
    addToast('success', `Income auto-detected: ₹${detectedIncome.toLocaleString('en-IN')}`);
  };

  const handleDeductionChange = (id: string, value: string) => {
    setDeductions(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold">Indian Tax Estimator</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">FY {filingYear} • Old vs New Regime Comparison</p>
          </div>
        </div>
      </div>

      {/* Income Input */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <label className="block text-sm font-semibold mb-2">Annual Gross Income (₹)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={annualIncome}
            onChange={e => setAnnualIncome(e.target.value)}
            placeholder="1200000"
            className="flex-1 px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-amber-500 outline-none text-lg font-bold"
          />
          {detectedIncome > 0 && (
            <button
              onClick={useDetectedIncome}
              className="px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-xs font-semibold"
            >
              <Sparkles className="w-3 h-3 inline mr-1" />
              Auto ({detectedIncome.toLocaleString('en-IN')})
            </button>
          )}
        </div>
      </div>

      {/* Regime Toggle */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50">
        {(['new', 'old'] as const).map(r => (
          <button
            key={r}
            onClick={() => setRegime(r)}
            className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              regime === r
                ? 'bg-white dark:bg-zinc-900 shadow-sm text-amber-700'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {TAX_REGIMES[r].name}
            {r === bestRegime && currentTax > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700">
                BEST
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={`p-4 rounded-2xl border-2 ${regime === 'old' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'}`}>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-bold">Old Regime</span>
          </div>
          <p className="text-2xl font-black">₹{oldRegimeTax.toLocaleString('en-IN')}</p>
          <p className="text-xs text-zinc-500 mt-1">{TAX_REGIMES.old.description}</p>
        </div>
        <div className={`p-4 rounded-2xl border-2 ${regime === 'new' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'}`}>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-bold">New Regime</span>
          </div>
          <p className="text-2xl font-black">₹{newRegimeTax.toLocaleString('en-IN')}</p>
          <p className="text-xs text-zinc-500 mt-1">{TAX_REGIMES.new.description}</p>
        </div>
      </div>

      {taxSaved > 0 && currentTax > 0 && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              You save ₹{taxSaved.toLocaleString('en-IN')} by choosing the {bestRegime === 'old' ? 'Old' : 'New'} Regime
            </p>
          </div>
        </div>
      )}

      {/* Detailed Breakdown */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
        <h3 className="font-bold flex items-center gap-2">
          <IndianRupee className="w-4 h-4" />
          Calculation Breakdown
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
            <span>Gross Income</span>
            <span className="font-bold">₹{(parseFloat(annualIncome) || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
            <span>Standard Deduction</span>
            <span className="text-red-600">-₹{TAX_REGIMES[regime].standardDeduction.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
            <span>Other Deductions</span>
            <span className="text-red-600">-₹{totalDeductions.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 font-bold">
            <span>Taxable Income</span>
            <span>₹{Math.max(0, (parseFloat(annualIncome) || 0) - TAX_REGIMES[regime].standardDeduction - totalDeductions).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
            <span>Tax (before cess)</span>
            <span>₹{Math.round(currentTax / 1.04).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
            <span>Health & Education Cess (4%)</span>
            <span>₹{Math.round(currentTax - currentTax / 1.04).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 font-black text-lg">
            <span>Total Tax Liability</span>
            <span className="text-amber-700 dark:text-amber-400">₹{currentTax.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-sm">
            <span>Monthly Take-Home (after tax)</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">₹{Math.round(monthlyTakeHome).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Deductions */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <button
          onClick={() => setShowDeductions(!showDeductions)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="font-bold flex items-center gap-2">
            <Award className="w-4 h-4" />
            Deductions (₹{totalDeductions.toLocaleString('en-IN')})
          </h3>
          <span className="text-xs text-zinc-500">{showDeductions ? '▼' : '▶'}</span>
        </button>

        {showDeductions && (
          <div className="mt-3 space-y-2">
            {DEDUCTION_SECTIONS.map(section => (
              <div key={section.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{section.name}</p>
                  <p className="text-xs text-zinc-500">{section.desc}</p>
                </div>
                <input
                  type="number"
                  value={deductions[section.id] || ''}
                  onChange={e => handleDeductionChange(section.id, e.target.value)}
                  placeholder={section.limit === Infinity ? '∞' : `≤₹${section.limit.toLocaleString('en-IN')}`}
                  className="w-28 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-right"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-900 dark:text-blue-100">
            <strong>Pro tip:</strong> The New Regime is best if your total deductions are below ₹3-4L. The Old Regime suits those with home loans, HRA, and heavy 80C investments. Compare both yearly!
          </p>
        </div>
      </div>
    </div>
  );
}
