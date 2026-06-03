import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, CreditCard, BarChart3, Plus, X, Trash2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subMonths } from 'date-fns';
import { useTransactions } from '@/hooks/useTransactions';

interface NetWorthEntry {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

interface AssetItem {
  id: string; name: string; value: number; type: 'asset' | 'liability';
  category: 'bank' | 'investment' | 'property' | 'vehicle' | 'other_asset' | 'loan' | 'credit_card' | 'mortgage' | 'other_liability';
}

const NW_KEY = 'finvault_networth_items';
const NW_HISTORY_KEY = 'finvault_networth_history';

function getItems(): AssetItem[] {
  const s = localStorage.getItem(NW_KEY); if (!s) return [];
  try { return JSON.parse(s); } catch { return []; }
}
function saveItems(items: AssetItem[]) { localStorage.setItem(NW_KEY, JSON.stringify(items)); }
function getHistory(): NetWorthEntry[] {
  const s = localStorage.getItem(NW_HISTORY_KEY); if (!s) return [];
  try { return JSON.parse(s); } catch { return []; }
}
function saveHistory(h: NetWorthEntry[]) { localStorage.setItem(NW_HISTORY_KEY, JSON.stringify(h)); }

const CATEGORIES = {
  bank: { label: 'Bank Accounts', icon: '🏦', color: '#6366f1' },
  investment: { label: 'Investments', icon: '📈', color: '#10b981' },
  property: { label: 'Property', icon: '🏠', color: '#f59e0b' },
  vehicle: { label: 'Vehicles', icon: '🚗', color: '#8b5cf6' },
  other_asset: { label: 'Other Assets', icon: '💎', color: '#06b6d4' },
  loan: { label: 'Loans', icon: '🏦', color: '#ef4444' },
  credit_card: { label: 'Credit Cards', icon: '💳', color: '#f97316' },
  mortgage: { label: 'Mortgage', icon: '🏠', color: '#ec4899' },
  other_liability: { label: 'Other Liabilities', icon: '📄', color: '#64748b' },
};

export function NetWorth() {
  const [items, setItems] = useState<AssetItem[]>(getItems());
  const [history, setHistory] = useState<NetWorthEntry[]>(getHistory());
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<'asset' | 'liability'>('asset');
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState<string>('bank');
  const { addToast } = useToast();
  const { transactions } = useTransactions();

  const stats = useMemo(() => {
    const totalAssets = items.filter(i => i.type === 'asset').reduce((s, i) => s + i.value, 0);
    const totalLiabilities = items.filter(i => i.type === 'liability').reduce((s, i) => s + i.value, 0);
    const netWorth = totalAssets - totalLiabilities;

    // Running balance from transactions
    const txnBalance = transactions.reduce((s, t) => s + t.amount, 0);

    return { totalAssets: totalAssets + Math.max(0, txnBalance), totalLiabilities, netWorth: netWorth + txnBalance };
  }, [items, transactions]);

  // Record monthly snapshot
  useEffect(() => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const existing = history.find(h => h.date === currentMonth);
    if (!existing && stats.netWorth !== 0) {
      const updated = [...history, { date: currentMonth, assets: stats.totalAssets, liabilities: stats.totalLiabilities, netWorth: stats.netWorth }];
      setHistory(updated);
      saveHistory(updated);
    }
  }, [stats]);

  // Generate chart data (last 12 months)
  const chartData = useMemo(() => {
    const data: { month: string; netWorth: number; assets: number; liabilities: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, 'yyyy-MM');
      const entry = history.find(h => h.date === key);
      data.push({
        month: format(d, 'MMM'),
        netWorth: entry?.netWorth || 0,
        assets: entry?.assets || 0,
        liabilities: entry?.liabilities || 0,
      });
    }
    // Always include current
    data[data.length - 1] = { month: format(now, 'MMM'), netWorth: stats.netWorth, assets: stats.totalAssets, liabilities: stats.totalLiabilities };
    return data;
  }, [history, stats]);

  const prevMonth = chartData.length > 1 ? chartData[chartData.length - 2].netWorth : 0;
  const monthChange = stats.netWorth - prevMonth;
  const monthChangePct = prevMonth !== 0 ? ((monthChange / Math.abs(prevMonth)) * 100) : 0;

  // Future projection
  const avgMonthlySavings = transactions.length > 0
    ? transactions.reduce((s, t) => s + t.amount, 0) / Math.max(1, new Set(transactions.map(t => format(new Date(t.date), 'yyyy-MM'))).size)
    : 0;
  const projectedYear = stats.netWorth + avgMonthlySavings * 12;

  const handleAdd = () => {
    if (!name || !value) { addToast('error', 'Name and value required'); return; }
    const newItem: AssetItem = {
      id: `nw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name, value: parseFloat(value), type: addType, category: category as any,
    };
    const updated = [...items, newItem]; setItems(updated); saveItems(updated);
    setName(''); setValue(''); setShowAdd(false);
    addToast('success', `${addType === 'asset' ? 'Asset' : 'Liability'} added`);
  };

  const handleDelete = (id: string) => {
    const updated = items.filter(i => i.id !== id); setItems(updated); saveItems(updated);
    addToast('success', 'Removed');
  };

  const handleUpdateValue = (id: string, newValue: number) => {
    const updated = items.map(i => i.id === id ? { ...i, value: newValue } : i);
    setItems(updated); saveItems(updated);
  };

  const assets = items.filter(i => i.type === 'asset');
  const liabilities = items.filter(i => i.type === 'liability');

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <p className="text-sm opacity-90 mb-1">Total Net Worth</p>
          <p className="text-4xl font-black tracking-tight">₹{stats.netWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          <div className="flex items-center gap-3 mt-3 text-sm">
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${monthChange >= 0 ? 'bg-emerald-500/30' : 'bg-red-500/30'}`}>
              {monthChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {monthChange >= 0 ? '+' : ''}₹{Math.abs(monthChange).toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({monthChangePct.toFixed(1)}%)
            </span>
            <span className="opacity-80">this month</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Assets</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">₹{stats.totalAssets.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
          <p className="text-xs text-red-700 dark:text-red-400 font-medium">Liabilities</p>
          <p className="text-lg font-bold text-red-700 dark:text-red-400">₹{stats.totalLiabilities.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
          <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Avg Monthly Savings</p>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-400">₹{avgMonthlySavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900">
          <p className="text-xs text-violet-700 dark:text-violet-400 font-medium">Projected (1yr)</p>
          <p className="text-lg font-bold text-violet-700 dark:text-violet-400">₹{projectedYear.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Net Worth Over Time</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
              <Area type="monotone" dataKey="netWorth" stroke="#6366f1" fill="url(#nwGrad)" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Add Button */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => { setAddType('asset'); setCategory('bank'); setShowAdd(true); }} className="py-3 rounded-2xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Asset
        </button>
        <button onClick={() => { setAddType('liability'); setCategory('loan'); setShowAdd(true); }} className="py-3 rounded-2xl bg-red-600 text-white font-medium hover:bg-red-700 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Liability
        </button>
      </div>

      {/* Assets List */}
      {assets.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 font-bold text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Assets ({assets.length})
          </div>
          {assets.map(item => {
            const cat = CATEGORIES[item.category as keyof typeof CATEGORIES];
            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-xl">{cat?.icon || '💰'}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-zinc-500">{cat?.label}</p>
                </div>
                <input
                  type="number"
                  defaultValue={item.value}
                  onBlur={e => handleUpdateValue(item.id, parseFloat(e.target.value) || 0)}
                  className="w-28 px-2 py-1 text-right text-sm font-bold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
                <button onClick={() => handleDelete(item.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Liabilities List */}
      {liabilities.length > 0 && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="px-4 py-3 bg-red-50 dark:bg-red-950/30 font-bold text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Liabilities ({liabilities.length})
          </div>
          {liabilities.map(item => {
            const cat = CATEGORIES[item.category as keyof typeof CATEGORIES];
            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-xl">{cat?.icon || '📄'}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-zinc-500">{cat?.label}</p>
                </div>
                <input
                  type="number"
                  defaultValue={item.value}
                  onBlur={e => handleUpdateValue(item.id, parseFloat(e.target.value) || 0)}
                  className="w-28 px-2 py-1 text-right text-sm font-bold text-red-600 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
                <button onClick={() => handleDelete(item.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add {addType === 'asset' ? 'Asset' : 'Liability'}</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., SBI Savings Account" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
              <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="Value in ₹" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none">
                {Object.entries(CATEGORIES).filter(([k]) => addType === 'asset' ? !k.includes('loan') && !k.includes('credit') && !k.includes('mortgage') && !k.includes('other_liability') : k.includes('loan') || k.includes('credit') || k.includes('mortgage') || k.includes('other_liability')).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium">Cancel</button>
              <button onClick={handleAdd} className={`flex-1 py-2.5 rounded-xl text-white font-medium ${addType === 'asset' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
