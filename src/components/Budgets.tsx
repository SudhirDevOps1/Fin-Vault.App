import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Edit2, Target, AlertTriangle,
  CheckCircle, DollarSign, X
} from 'lucide-react';
import { db } from '@/lib/db';
import { useToast } from '@/contexts/ToastContext';
import { useTransactions } from '@/hooks/useTransactions';
import type { Category } from '@/types';
import { startOfMonth, endOfMonth } from 'date-fns';

interface Budget {
  id: string;
  name: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  categoryId?: string; // Optional: budget for specific category
  startDate: string;
  endDate?: string;
  rollover: boolean; // Unused amount carries to next period
  notify: boolean;
  color: string;
  icon: string;
  spent: number;
  createdAt: string;
}

const BUDGETS_KEY = 'finvault_budgets';

function getBudgets(): Budget[] {
  const stored = localStorage.getItem(BUDGETS_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

function saveBudgets(budgets: Budget[]) {
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
}

function generateId() {
  return `budget-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>(getBudgets());
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const { transactions } = useTransactions();
  const { addToast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [categoryId, setCategoryId] = useState('');
  const [rollover, setRollover] = useState(false);
  const [notify, setNotify] = useState(true);
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState('🎯');

  useEffect(() => {
    db.categories.toArray().then(setCategories);
  }, []);

  // Calculate current spending for each budget
  const budgetsWithProgress = useMemo(() => {
    const now = new Date();
    return budgets.map(budget => {
      let periodStart: Date, periodEnd: Date;
      if (budget.period === 'weekly') {
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - now.getDay());
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 6);
      } else if (budget.period === 'monthly') {
        periodStart = startOfMonth(now);
        periodEnd = endOfMonth(now);
      } else {
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
      }

      const periodTxns = transactions.filter(tx => {
        const date = new Date(tx.date);
        return date >= periodStart && date <= periodEnd && tx.amount < 0 &&
          (!budget.categoryId || tx.category === budget.categoryId);
      });

      const spent = Math.abs(periodTxns.reduce((sum, tx) => sum + tx.amount, 0));
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const daysLeft = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / 86400000));
      const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / 86400000);
      const expectedSpent = budget.amount * (1 - daysLeft / totalDays);
      const onTrack = spent <= expectedSpent;

      return { ...budget, spent, remaining, percentage, daysLeft, totalDays, onTrack };
    });
  }, [budgets, transactions]);

  const handleSave = () => {
    if (!name || !amount) {
      addToast('error', 'Name and amount are required');
      return;
    }

    const newBudget: Budget = {
      id: editingBudget?.id || generateId(),
      name,
      amount: parseFloat(amount),
      period,
      categoryId: categoryId || undefined,
      startDate: editingBudget?.startDate || new Date().toISOString(),
      rollover,
      notify,
      color,
      icon,
      spent: editingBudget?.spent || 0,
      createdAt: editingBudget?.createdAt || new Date().toISOString(),
    };

    if (editingBudget) {
      setBudgets(prev => prev.map(b => b.id === editingBudget.id ? newBudget : b));
      addToast('success', 'Budget updated');
    } else {
      setBudgets(prev => [...prev, newBudget]);
      addToast('success', 'Budget created');
    }

    saveBudgets([...budgets.filter(b => b.id !== newBudget.id), newBudget]);
    resetForm();
  };

  const resetForm = () => {
    setName(''); setAmount(''); setPeriod('monthly'); setCategoryId('');
    setRollover(false); setNotify(true); setColor(COLORS[0]); setIcon('🎯');
    setEditingBudget(null); setShowAddModal(false);
  };

  const handleEdit = (budget: Budget) => {
    setName(budget.name);
    setAmount(budget.amount.toString());
    setPeriod(budget.period);
    setCategoryId(budget.categoryId || '');
    setRollover(budget.rollover);
    setNotify(budget.notify);
    setColor(budget.color);
    setIcon(budget.icon);
    setEditingBudget(budget);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this budget?')) return;
    setBudgets(prev => prev.filter(b => b.id !== id));
    saveBudgets(budgets.filter(b => b.id !== id));
    addToast('success', 'Budget deleted');
  };

  const totalBudget = budgetsWithProgress.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgetsWithProgress.reduce((s, b) => s + b.spent, 0);
  const onTrackCount = budgetsWithProgress.filter(b => b.onTrack).length;
  const overBudgetCount = budgetsWithProgress.filter(b => b.percentage > 100).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-medium text-zinc-500">Total Budget</span>
          </div>
          <p className="text-lg font-bold">₹{totalBudget.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-red-600" />
            <span className="text-xs font-medium text-zinc-500">Spent</span>
          </div>
          <p className="text-lg font-bold">₹{totalSpent.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-zinc-500">On Track</span>
          </div>
          <p className="text-lg font-bold text-emerald-600">{onTrackCount}/{budgets.length}</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-zinc-500">Over</span>
          </div>
          <p className="text-lg font-bold text-amber-600">{overBudgetCount}</p>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors text-sm font-medium text-zinc-600 dark:text-zinc-400"
      >
        <Plus className="w-4 h-4" />
        Create New Budget
      </button>

      {/* Budget List */}
      {budgetsWithProgress.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <Target className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
          <p className="font-medium">No budgets yet</p>
          <p className="text-sm text-zinc-500 mt-1">Create one to start tracking</p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgetsWithProgress.map(budget => {
            const status = budget.percentage > 100 ? 'over' : budget.percentage > 80 ? 'warning' : 'good';
            return (
              <div
                key={budget.id}
                className={`p-4 rounded-2xl border-2 bg-white dark:bg-zinc-900 transition-all ${
                  status === 'over' ? 'border-red-500' : status === 'warning' ? 'border-amber-500' : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: budget.color + '20' }}
                    >
                      {budget.icon}
                    </div>
                    <div>
                      <h3 className="font-bold">{budget.name}</h3>
                      <p className="text-xs text-zinc-500">
                        {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}
                        {budget.categoryId && ` • ${categories.find(c => c.id === budget.categoryId)?.name || 'Category'}`}
                        {' • '}{budget.daysLeft}d left
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(budget)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(budget.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-2xl font-bold">₹{budget.spent.toLocaleString('en-IN')}</span>
                    <span className="text-sm text-zinc-500"> / ₹{budget.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={`text-sm font-bold ${
                    status === 'over' ? 'text-red-600' : status === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {budget.percentage.toFixed(0)}%
                  </div>
                </div>

                <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      status === 'over' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
                  <span>₹{Math.max(0, budget.remaining).toLocaleString('en-IN')} remaining</span>
                  <span className="flex items-center gap-1">
                    {budget.onTrack ? (
                      <><CheckCircle className="w-3 h-3 text-emerald-500" /> On track</>
                    ) : (
                      <><AlertTriangle className="w-3 h-3 text-amber-500" /> Over pace</>
                    )}
                  </span>
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
              <h2 className="text-lg font-bold">{editingBudget ? 'Edit Budget' : 'New Budget'}</h2>
              <button onClick={resetForm} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1.5">Budget Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Monthly Groceries"
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Period</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['weekly', 'monthly', 'yearly'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`py-2 rounded-xl text-sm font-medium border-2 ${
                        period === p ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400' : 'border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Category (Optional)</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
                >
                  <option value="">All categories</option>
                  {categories.filter(c => c.type === 'expense' || c.type === 'both').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-white' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {['🎯','💰','🛒','🍔','🚗','🏠','📚','💊','🎬','✈️','🎁','📱'].map(i => (
                    <button
                      key={i}
                      onClick={() => setIcon(i)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border-2 ${
                        icon === i ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <div>
                  <p className="text-sm font-medium">Rollover unused</p>
                  <p className="text-xs text-zinc-500">Carry unused to next period</p>
                </div>
                <input type="checkbox" checked={rollover} onChange={e => setRollover(e.target.checked)} className="w-4 h-4" />
              </div>
            </div>
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <button onClick={resetForm} className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium">
                Cancel
              </button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700">
                {editingBudget ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
