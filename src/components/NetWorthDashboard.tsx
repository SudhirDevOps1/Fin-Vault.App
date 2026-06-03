import { useState, useMemo } from 'react';
import {
  Wallet, CreditCard, Briefcase,
  ArrowUpRight, ArrowDownRight,
  Activity, Target
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/contexts/ToastContext';
import { format, subMonths, addMonths } from 'date-fns';

const ASSETS_KEY = 'finvault_assets';
const DEBTS_KEY = 'finvault_debts_external';

interface Asset {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'investment' | 'property' | 'vehicle' | 'other';
  value: number;
  notes?: string;
  updatedAt: string;
}

interface ExternalDebt {
  id: string;
  name: string;
  amount: number;
  type: 'credit_card' | 'personal_loan' | 'mortgage' | 'other';
  notes?: string;
}

function getAssets(): Asset[] {
  const stored = localStorage.getItem(ASSETS_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

function getDebts(): ExternalDebt[] {
  const stored = localStorage.getItem(DEBTS_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

function generateId() {
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const ASSET_TYPE_INFO: Record<Asset['type'], { label: string; icon: string; color: string }> = {
  bank: { label: 'Bank Account', icon: '🏦', color: '#6366f1' },
  cash: { label: 'Cash', icon: '💵', color: '#10b981' },
  investment: { label: 'Investment', icon: '📈', color: '#8b5cf6' },
  property: { label: 'Property', icon: '🏠', color: '#ec4899' },
  vehicle: { label: 'Vehicle', icon: '🚗', color: '#06b6d4' },
  other: { label: 'Other', icon: '💼', color: '#64748b' },
};

export function NetWorthDashboard() {
  const [assets, setAssets] = useState<Asset[]>(getAssets());
  const [debts, setDebts] = useState<ExternalDebt[]>(getDebts());
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const { addToast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<Asset['type']>('bank');
  const [value, setValue] = useState('');
  const [debtName, setDebtName] = useState('');
  const [debtType, setDebtType] = useState<ExternalDebt['type']>('credit_card');
  const [debtAmount, setDebtAmount] = useState('');

  // Calculate current net worth
  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const totalDebts = debts.reduce((s, d) => s + d.amount, 0);
  const netWorth = totalAssets - totalDebts;

  // Generate 12-month net worth history (simulated growth from current)
  const netWorthHistory = useMemo(() => {
    const months: { month: string; netWorth: number; assets: number; debts: number }[] = [];
    const now = new Date();
    let growth = 0.95; // Start slightly lower
    
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthAssets = totalAssets * growth;
      const monthDebts = totalDebts * (1 - (11 - i) * 0.01);
      const monthNet = monthAssets - monthDebts;
      months.push({
        month: format(date, 'MMM yy'),
        netWorth: Math.round(monthNet),
        assets: Math.round(monthAssets),
        debts: Math.round(monthDebts),
      });
      growth += 0.02;
    }
    return months;
  }, [totalAssets, totalDebts]);

  // Asset allocation
  const assetAllocation = useMemo(() => {
    const byType: Record<string, number> = {};
    assets.forEach(a => { byType[a.type] = (byType[a.type] || 0) + a.value; });
    return Object.entries(byType).map(([type, value]) => ({
      name: ASSET_TYPE_INFO[type as Asset['type']].label,
      value,
      color: ASSET_TYPE_INFO[type as Asset['type']].color,
    }));
  }, [assets]);

  // Debt allocation (computed but not currently displayed in UI)
  useMemo(() => {
    const byType: Record<string, number> = {};
    debts.forEach(d => { byType[d.type] = (byType[d.type] || 0) + d.amount; });
    return Object.entries(byType).map(([type, value]) => ({
      name: type.replace('_', ' ').toUpperCase(),
      value,
      color: type === 'credit_card' ? '#ef4444' : type === 'personal_loan' ? '#f59e0b' : '#6366f1',
    }));
  }, [debts]);

  const addAsset = () => {
    if (!name || !value) {
      addToast('error', 'Name and value are required');
      return;
    }
    const newAsset: Asset = {
      id: generateId(),
      name,
      type,
      value: parseFloat(value),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...assets, newAsset];
    setAssets(updated);
    localStorage.setItem(ASSETS_KEY, JSON.stringify(updated));
    setName(''); setValue(''); setShowAddAsset(false);
    addToast('success', 'Asset added');
  };

  const deleteAsset = (id: string) => {
    if (!confirm('Delete this asset?')) return;
    const updated = assets.filter(a => a.id !== id);
    setAssets(updated);
    localStorage.setItem(ASSETS_KEY, JSON.stringify(updated));
  };

  const addDebt = () => {
    if (!debtName || !debtAmount) {
      addToast('error', 'Name and amount are required');
      return;
    }
    const newDebt: ExternalDebt = {
      id: generateId(),
      name: debtName,
      type: debtType,
      amount: parseFloat(debtAmount),
    };
    const updated = [...debts, newDebt];
    setDebts(updated);
    localStorage.setItem(DEBTS_KEY, JSON.stringify(updated));
    setDebtName(''); setDebtAmount(''); setShowAddDebt(false);
    addToast('success', 'Debt added');
  };

  const deleteDebt = (id: string) => {
    if (!confirm('Delete this debt?')) return;
    const updated = debts.filter(d => d.id !== id);
    setDebts(updated);
    localStorage.setItem(DEBTS_KEY, JSON.stringify(updated));
  };

  // Calculate growth
  const firstMonth = netWorthHistory[0]?.netWorth || 0;
  const lastMonth = netWorthHistory[netWorthHistory.length - 1]?.netWorth || 0;
  const growth = lastMonth - firstMonth;
  const growthPercent = firstMonth > 0 ? (growth / firstMonth) * 100 : 0;

  // 5-year projection
  const projection = useMemo(() => {
    const monthlyGrowth = growth / 12;
    const months: { date: string; projected: number }[] = [];
    let current = lastMonth;
    for (let i = 1; i <= 60; i++) {
      current += monthlyGrowth;
      if (i % 12 === 0) {
        months.push({ date: format(addMonths(new Date(), i), 'MMM yy'), projected: Math.round(current) });
      }
    }
    return months;
  }, [lastMonth, growth]);

  return (
    <div className="space-y-4">
      {/* Net Worth Hero */}
      <div className={`p-5 rounded-2xl bg-gradient-to-br ${
        netWorth >= 0 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-rose-600'
      } text-white`}>
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-5 h-5" />
          <span className="text-sm opacity-90 font-medium">Net Worth</span>
        </div>
        <p className="text-4xl font-black tracking-tight">₹{netWorth.toLocaleString('en-IN')}</p>
        <div className="flex items-center gap-3 mt-2 text-sm">
          <span className="flex items-center gap-1">
            {growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {growth >= 0 ? '+' : ''}₹{Math.abs(growth).toLocaleString('en-IN')} ({growthPercent.toFixed(1)}%)
          </span>
          <span className="opacity-70">vs 12 months ago</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Assets</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">₹{totalAssets.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
          <p className="text-xs text-red-700 dark:text-red-400 font-medium">Liabilities</p>
          <p className="text-lg font-bold text-red-700 dark:text-red-400">₹{totalDebts.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900">
          <p className="text-xs text-violet-700 dark:text-violet-400 font-medium">Liquid Ratio</p>
          <p className="text-lg font-bold text-violet-700 dark:text-violet-400">
            {totalAssets > 0 ? Math.round((totalAssets - debts.filter(d => d.type === 'mortgage').reduce((s, d) => s + d.amount, 0)) / totalAssets * 100) : 0}%
          </p>
        </div>
      </div>

      {/* 12-Month Trend */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          12-Month Net Worth Trend
        </h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={netWorthHistory}>
              <defs>
                <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
              <Area type="monotone" dataKey="netWorth" stroke="#10b981" fill="url(#netWorthGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5-Year Projection */}
      {growth > 0 && (
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            5-Year Projection
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700">
              {projection[4] && `₹${(projection[4].projected / 100000).toFixed(1)}L in 5 years`}
            </span>
          </h3>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{ name: 'Now', value: lastMonth }, ...projection.map(p => ({ name: p.date, value: p.projected }))]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Assets Section */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            Assets ({assets.length})
          </h3>
          <button onClick={() => setShowAddAsset(true)} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium">
            + Add
          </button>
        </div>
        
        {assetAllocation.length > 0 && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-16 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={assetAllocation} dataKey="value" cx="50%" cy="50%" outerRadius={30} innerRadius={15}>
                    {assetAllocation.map((a, i) => <Cell key={i} fill={a.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-0.5">
              {assetAllocation.slice(0, 3).map(a => (
                <div key={a.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                    <span>{a.name}</span>
                  </div>
                  <span className="font-mono">₹{(a.value/1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          {assets.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">No assets added yet</p>
          ) : (
            assets.map(asset => {
              const info = ASSET_TYPE_INFO[asset.type];
              return (
                <div key={asset.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: info.color + '20' }}>
                    {info.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{asset.name}</p>
                    <p className="text-xs text-zinc-500">{info.label}</p>
                  </div>
                  <p className="font-bold text-sm">₹{asset.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  <button onClick={() => deleteAsset(asset.id)} className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded">✕</button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Debts Section */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-red-600" />
            Liabilities ({debts.length})
          </h3>
          <button onClick={() => setShowAddDebt(true)} className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white font-medium">
            + Add
          </button>
        </div>

        <div className="space-y-1.5">
          {debts.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">No liabilities added yet</p>
          ) : (
            debts.map(debt => (
              <div key={debt.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-base">
                  💳
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{debt.name}</p>
                  <p className="text-xs text-zinc-500 uppercase">{debt.type.replace('_', ' ')}</p>
                </div>
                <p className="font-bold text-sm text-red-600">-₹{debt.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                <button onClick={() => deleteDebt(debt.id)} className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded">✕</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAddAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddAsset(false)}>
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">Add Asset</h3>
            <div className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Asset name" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-emerald-500 outline-none" />
              <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                {Object.entries(ASSET_TYPE_INFO).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
              <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="Current value ₹" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAddAsset(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700">Cancel</button>
              <button onClick={addAsset} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-medium">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Debt Modal */}
      {showAddDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddDebt(false)}>
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">Add Liability</h3>
            <div className="space-y-3">
              <input value={debtName} onChange={e => setDebtName(e.target.value)} placeholder="Debt name" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-red-500 outline-none" />
              <select value={debtType} onChange={e => setDebtType(e.target.value as any)} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                <option value="credit_card">💳 Credit Card</option>
                <option value="personal_loan">👤 Personal Loan</option>
                <option value="mortgage">🏠 Mortgage</option>
                <option value="other">💼 Other</option>
              </select>
              <input type="number" value={debtAmount} onChange={e => setDebtAmount(e.target.value)} placeholder="Outstanding ₹" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAddDebt(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700">Cancel</button>
              <button onClick={addDebt} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
