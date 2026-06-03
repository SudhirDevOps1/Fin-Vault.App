import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, AlertTriangle, TrendingUp } from 'lucide-react';
import { db } from '@/lib/db';
import { useToast } from '@/contexts/ToastContext';
import { useTransactions } from '@/hooks/useTransactions';
import type { Category } from '@/types';

interface CategoryLimit {
  categoryId: string;
  monthlyLimit: number;
  alertThreshold: number; // percentage, e.g. 80 = alert at 80%
}

const LIMITS_KEY = 'finvault_category_limits';

function getStoredLimits(): CategoryLimit[] {
  const stored = localStorage.getItem(LIMITS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLimits(limits: CategoryLimit[]) {
  localStorage.setItem(LIMITS_KEY, JSON.stringify(limits));
}

export function CategoryLimits() {
  const [limits, setLimits] = useState<CategoryLimit[]>(getStoredLimits());
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('80');
  const { addToast } = useToast();
  const { getCategoryBreakdown } = useTransactions();

  useEffect(() => {
    db.categories.toArray().then(setCategories);
  }, []);

  const now = new Date();
  const breakdown = getCategoryBreakdown(now.getFullYear(), now.getMonth() + 1);

  const getCategoryInfo = (id: string) => {
    return categories.find(c => c.id === id) || { name: id, icon: '📌', color: '#6366f1' };
  };

  const getCategorySpending = (categoryId: string) => {
    return breakdown.find(b => b.category === categoryId)?.amount || 0;
  };

  const handleAddLimit = () => {
    if (!selectedCategory || !newLimit) {
      addToast('error', 'Select category and enter limit');
      return;
    }

    const existing = limits.find(l => l.categoryId === selectedCategory);
    if (existing) {
      addToast('warning', 'Limit already exists for this category');
      return;
    }

    const updated = [...limits, {
      categoryId: selectedCategory,
      monthlyLimit: parseFloat(newLimit),
      alertThreshold: parseFloat(alertThreshold),
    }];
    
    setLimits(updated);
    saveLimits(updated);
    setSelectedCategory('');
    setNewLimit('');
    addToast('success', 'Spending limit added');
  };

  const handleRemoveLimit = (categoryId: string) => {
    const updated = limits.filter(l => l.categoryId !== categoryId);
    setLimits(updated);
    saveLimits(updated);
    addToast('success', 'Limit removed');
  };

  const handleUpdateLimit = (categoryId: string, field: 'monthlyLimit' | 'alertThreshold', value: number) => {
    const updated = limits.map(l =>
      l.categoryId === categoryId ? { ...l, [field]: value } : l
    );
    setLimits(updated);
    saveLimits(updated);
  };

  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');
  const availableCategories = expenseCategories.filter(c => !limits.find(l => l.categoryId === c.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-200 dark:border-orange-800">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25 flex-shrink-0">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Cap Limits & Categories</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Set monthly spending caps per category. Get alerts before overspending.
          </p>
        </div>
      </div>

      {/* Add New Limit */}
      <div className="p-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Spending Cap
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="">Select category</option>
            {availableCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
          <input
            type="number"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            placeholder="Monthly limit ₹"
            className="px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          />
          <input
            type="number"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(e.target.value)}
            placeholder="Alert at %"
            min="1"
            max="100"
            className="px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          />
          <button
            onClick={handleAddLimit}
            disabled={!selectedCategory || !newLimit}
            className="px-4 py-2.5 rounded-xl bg-orange-600 text-white font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            Add Cap
          </button>
        </div>
      </div>

      {/* Active Limits */}
      <div className="space-y-3">
        <h4 className="font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Active Spending Caps ({limits.length})
        </h4>

        {limits.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <Target className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
            <p className="font-medium mb-1">No spending caps set</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Add caps above to control overspending
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {limits.map(limit => {
              const cat = getCategoryInfo(limit.categoryId);
              const spent = getCategorySpending(limit.categoryId);
              const percentage = (spent / limit.monthlyLimit) * 100;
              const isOverLimit = percentage > 100;
              const isWarning = percentage >= limit.alertThreshold && !isOverLimit;

              return (
                <div
                  key={limit.categoryId}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    isOverLimit
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                      : isWarning
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl">
                        {cat.icon}
                      </div>
                      <div>
                        <p className="font-bold">{cat.name}</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          ₹{spent.toLocaleString('en-IN')} of ₹{limit.monthlyLimit.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOverLimit && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-600 text-white font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          OVER LIMIT
                        </span>
                      )}
                      {isWarning && (
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-500 text-white font-bold">
                          ⚠ {percentage.toFixed(0)}%
                        </span>
                      )}
                      <button
                        onClick={() => handleRemoveLimit(limit.categoryId)}
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isOverLimit ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  {/* Edit Limit */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <label className="text-xs text-zinc-600 dark:text-zinc-400">Monthly Limit</label>
                      <input
                        type="number"
                        value={limit.monthlyLimit}
                        onChange={(e) => handleUpdateLimit(limit.categoryId, 'monthlyLimit', parseFloat(e.target.value))}
                        className="w-full mt-1 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-600 dark:text-zinc-400">Alert at %</label>
                      <input
                        type="number"
                        value={limit.alertThreshold}
                        onChange={(e) => handleUpdateLimit(limit.categoryId, 'alertThreshold', parseFloat(e.target.value))}
                        min="1"
                        max="100"
                        className="w-full mt-1 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
