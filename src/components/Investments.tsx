import { useState, useMemo } from 'react';
import {
  Plus, Trash2, Edit2, TrendingUp, TrendingDown, Briefcase,
  PieChart as PieIcon, X, ArrowUpRight, ArrowDownRight,
  Activity, LineChart as LineIcon
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';

interface Investment {
  id: string;
  name: string;
  type: 'stock' | 'mutual_fund' | 'crypto' | 'gold' | 'fd' | 'ppf' | 'real_estate' | 'other';
  symbol?: string;
  quantity: number;
  buyPrice: number; // per unit
  currentPrice: number; // per unit
  buyDate: string;
  notes?: string;
}

const INVESTMENTS_KEY = 'finvault_investments';

function getInvestments(): Investment[] {
  const stored = localStorage.getItem(INVESTMENTS_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

function saveInvestments(items: Investment[]) {
  localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(items));
}

function generateId() {
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const TYPE_INFO: Record<Investment['type'], { label: string; icon: string; color: string }> = {
  stock: { label: 'Stocks', icon: '📈', color: '#6366f1' },
  mutual_fund: { label: 'Mutual Funds', icon: '💼', color: '#8b5cf6' },
  crypto: { label: 'Crypto', icon: '₿', color: '#f59e0b' },
  gold: { label: 'Gold', icon: '🥇', color: '#eab308' },
  fd: { label: 'Fixed Deposit', icon: '🏦', color: '#10b981' },
  ppf: { label: 'PPF/EPF', icon: '🛡️', color: '#06b6d4' },
  real_estate: { label: 'Real Estate', icon: '🏠', color: '#ec4899' },
  other: { label: 'Other', icon: '💰', color: '#64748b' },
};

export function Investments() {
  const [investments, setInvestments] = useState<Investment[]>(getInvestments());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const { addToast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<Investment['type']>('stock');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [buyDate, setBuyDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

  const stats = useMemo(() => {
    const totalInvested = investments.reduce((s, i) => s + i.buyPrice * i.quantity, 0);
    const totalCurrent = investments.reduce((s, i) => s + i.currentPrice * i.quantity, 0);
    const totalGain = totalCurrent - totalInvested;
    const gainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
    return { totalInvested, totalCurrent, totalGain, gainPercent };
  }, [investments]);

  const allocation = useMemo(() => {
    const byType: Record<string, number> = {};
    investments.forEach(inv => {
      const value = inv.currentPrice * inv.quantity;
      byType[inv.type] = (byType[inv.type] || 0) + value;
    });
    return Object.entries(byType).map(([type, value]) => ({
      name: TYPE_INFO[type as Investment['type']].label,
      value,
      color: TYPE_INFO[type as Investment['type']].color,
    }));
  }, [investments]);

  const handleSave = () => {
    if (!name || !quantity || !buyPrice || !currentPrice) {
      addToast('error', 'Fill all required fields');
      return;
    }

    const item: Investment = {
      id: editing?.id || generateId(),
      name,
      type,
      symbol: symbol || undefined,
      quantity: parseFloat(quantity),
      buyPrice: parseFloat(buyPrice),
      currentPrice: parseFloat(currentPrice),
      buyDate,
      notes: notes || undefined,
    };

    if (editing) {
      setInvestments(prev => prev.map(i => i.id === editing.id ? item : i));
      addToast('success', 'Investment updated');
    } else {
      setInvestments(prev => [...prev, item]);
      addToast('success', 'Investment added');
    }

    saveInvestments(investments.filter(i => i.id !== item.id).concat(item));
    resetForm();
  };

  const resetForm = () => {
    setName(''); setType('stock'); setSymbol(''); setQuantity('');
    setBuyPrice(''); setCurrentPrice(''); setBuyDate(format(new Date(), 'yyyy-MM-dd'));
    setNotes(''); setEditing(null); setShowAddModal(false);
  };

  const handleEdit = (item: Investment) => {
    setName(item.name); setType(item.type); setSymbol(item.symbol || '');
    setQuantity(item.quantity.toString()); setBuyPrice(item.buyPrice.toString());
    setCurrentPrice(item.currentPrice.toString()); setBuyDate(item.buyDate.split('T')[0]);
    setNotes(item.notes || ''); setEditing(item); setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this investment?')) return;
    setInvestments(prev => prev.filter(i => i.id !== id));
    saveInvestments(investments.filter(i => i.id !== id));
    addToast('success', 'Investment deleted');
  };

  const updateCurrentPrice = (id: string, newPrice: number) => {
    const updated = investments.map(i => i.id === id ? { ...i, currentPrice: newPrice } : i);
    setInvestments(updated);
    saveInvestments(updated);
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4" />
            <span className="text-xs font-medium opacity-90">Invested</span>
          </div>
          <p className="text-lg font-bold">₹{stats.totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
          <div className="flex items-center gap-2 mb-1">
            <LineIcon className="w-4 h-4" />
            <span className="text-xs font-medium opacity-90">Current</span>
          </div>
          <p className="text-lg font-bold">₹{stats.totalCurrent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className={`p-3 rounded-xl text-white ${stats.totalGain >= 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
          <div className="flex items-center gap-2 mb-1">
            {stats.totalGain >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-xs font-medium opacity-90">{stats.totalGain >= 0 ? 'Profit' : 'Loss'}</span>
          </div>
          <p className="text-lg font-bold">{stats.totalGain >= 0 ? '+' : ''}₹{Math.abs(stats.totalGain).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-medium text-zinc-500">Returns</span>
          </div>
          <p className={`text-lg font-bold ${stats.gainPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {stats.gainPercent >= 0 ? '+' : ''}{stats.gainPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Allocation Chart */}
      {allocation.length > 0 && (
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <PieIcon className="w-4 h-4" />
            Asset Allocation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocation} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {allocation.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
              {allocation.map(a => (
                <div key={a.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                    <span>{a.name}</span>
                  </div>
                  <span className="font-semibold">₹{a.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors text-sm font-medium text-zinc-600 dark:text-zinc-400"
      >
        <Plus className="w-4 h-4" />
        Add Investment
      </button>

      {/* Investments List */}
      {investments.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <Briefcase className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
          <p className="font-medium">No investments yet</p>
          <p className="text-sm text-zinc-500 mt-1">Track stocks, MFs, crypto, gold, FDs</p>
        </div>
      ) : (
        <div className="space-y-2">
          {investments.map(inv => {
            const invested = inv.buyPrice * inv.quantity;
            const current = inv.currentPrice * inv.quantity;
            const gain = current - invested;
            const gainPercent = invested > 0 ? (gain / invested) * 100 : 0;
            const info = TYPE_INFO[inv.type];
            return (
              <div key={inv.id} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: info.color + '20' }}>
                      {info.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold truncate">{inv.name}</h3>
                      <p className="text-xs text-zinc-500">
                        {info.label}
                        {inv.symbol && ` • ${inv.symbol}`}
                        {' • '}{inv.quantity} units
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-zinc-500">₹{inv.buyPrice} → </span>
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={inv.currentPrice}
                          onBlur={e => updateCurrentPrice(inv.id, parseFloat(e.target.value) || inv.currentPrice)}
                          className="w-20 px-1.5 py-0.5 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold">₹{current.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    <p className={`text-xs font-bold flex items-center gap-0.5 justify-end ${gain >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {gain >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {gainPercent.toFixed(2)}%
                    </p>
                    <p className={`text-xs ${gain >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {gain >= 0 ? '+' : ''}₹{Math.abs(gain).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <button onClick={() => handleEdit(inv)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDelete(inv.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={resetForm}>
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold">{editing ? 'Edit' : 'New'} Investment</h2>
              <button onClick={resetForm} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Reliance Industries" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Type</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(TYPE_INFO) as Investment['type'][]).map(t => (
                    <button key={t} onClick={() => setType(t)} className={`p-2 rounded-lg text-xs font-medium border-2 ${type === t ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-zinc-200 dark:border-zinc-700'}`}>
                      <div className="text-lg">{TYPE_INFO[t].icon}</div>
                      <div className="truncate">{TYPE_INFO[t].label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Symbol (Optional)</label>
                <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="e.g., RELIANCE" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Quantity</label>
                <input type="number" step="0.0001" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="10" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Buy Price (₹)</label>
                  <input type="number" step="0.01" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="2400" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Current (₹)</label>
                  <input type="number" step="0.01" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} placeholder="2850" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Buy Date</label>
                <input type="date" value={buyDate} onChange={e => setBuyDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
            </div>
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <button onClick={resetForm} className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700">{editing ? 'Update' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
