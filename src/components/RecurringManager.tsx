import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Edit2, Repeat, Pause, Play,
  X, Clock, CheckCircle, Zap
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { db } from '@/lib/db';
import type { Category, Transaction } from '@/types';
import { format, addDays, addWeeks, addMonths, addYears, isAfter } from 'date-fns';

interface RecurringRule {
  id: string;
  templateTxn: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // every N days/weeks/months/years
  startDate: string;
  endDate?: string;
  lastExecuted?: string;
  nextDue: string;
  active: boolean;
  executions: number;
}

const RULES_KEY = 'finvault_recurring_rules';

function getRules(): RecurringRule[] {
  const stored = localStorage.getItem(RULES_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

function saveRules(rules: RecurringRule[]) {
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

function generateId() {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function RecurringManager() {
  const [rules, setRules] = useState<RecurringRule[]>(getRules());
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);
  const { addToast } = useToast();

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [interval, setInterval] = useState('1');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    db.categories.toArray().then(setCategories);
    // Process pending rules on load
    processRules();
  }, []);

  const processRules = async () => {
    const currentRules = getRules();
    const now = new Date();
    let added = 0;
    
    for (const rule of currentRules) {
      if (!rule.active) continue;
      const nextDate = new Date(rule.nextDue);
      if (isAfter(nextDate, now)) continue;
      
      // Execute up to today's date
      let lastExec = new Date(rule.lastExecuted || rule.startDate);
      while (!isAfter(nextDate, now)) {
        const newTxn: Transaction = {
          ...rule.templateTxn,
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          date: nextDate.toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.transactions.add(newTxn);
        added++;
        lastExec = nextDate;
        
        // Calculate next
        const next = calculateNext(nextDate, rule.frequency, rule.interval);
        if (rule.endDate && isAfter(next, new Date(rule.endDate))) {
          rule.active = false;
          break;
        }
        nextDate.setTime(next.getTime());
      }
      
      rule.lastExecuted = lastExec.toISOString();
      rule.nextDue = nextDate.toISOString();
      rule.executions += added;
    }
    
    saveRules(currentRules);
    setRules(currentRules);
    
    if (added > 0) {
      addToast('info', `Processed ${added} recurring transaction(s)`);
    }
  };

  const calculateNext = (from: Date, freq: string, intv: number): Date => {
    switch (freq) {
      case 'daily': return addDays(from, intv);
      case 'weekly': return addWeeks(from, intv);
      case 'monthly': return addMonths(from, intv);
      case 'yearly': return addYears(from, intv);
      default: return from;
    }
  };

  const handleSave = () => {
    if (!description || !amount || !category) {
      addToast('error', 'Fill all required fields');
      return;
    }

    const amt = parseFloat(amount);
    const finalAmount = type === 'expense' ? -Math.abs(amt) : Math.abs(amt);
    const startDateObj = new Date(startDate);
    const nextDue = calculateNext(startDateObj, frequency, parseInt(interval) || 1);

    const newRule: RecurringRule = {
      id: editingRule?.id || generateId(),
      templateTxn: {
        date: startDate,
        amount: finalAmount,
        category,
        description,
      },
      frequency,
      interval: parseInt(interval) || 1,
      startDate,
      endDate: endDate || undefined,
      nextDue: editingRule?.nextDue || nextDue.toISOString(),
      lastExecuted: editingRule?.lastExecuted,
      active: editingRule?.active ?? true,
      executions: editingRule?.executions || 0,
    };

    if (editingRule) {
      setRules(prev => prev.map(r => r.id === editingRule.id ? newRule : r));
      addToast('success', 'Recurring rule updated');
    } else {
      setRules(prev => [...prev, newRule]);
      addToast('success', 'Recurring rule created');
    }

    saveRules(rules.filter(r => r.id !== newRule.id).concat(newRule));
    resetForm();
  };

  const resetForm = () => {
    setDescription(''); setAmount(''); setType('expense'); setCategory('');
    setFrequency('monthly'); setInterval('1'); setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate(''); setEditingRule(null); setShowAddModal(false);
  };

  const handleTogglePause = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, active: !r.active } : r);
    setRules(updated);
    saveRules(updated);
    addToast('info', updated.find(r => r.id === id)?.active ? 'Resumed' : 'Paused');
  };

  const handleEdit = (rule: RecurringRule) => {
    setDescription(rule.templateTxn.description);
    setAmount(Math.abs(rule.templateTxn.amount).toString());
    setType(rule.templateTxn.amount > 0 ? 'income' : 'expense');
    setCategory(rule.templateTxn.category);
    setFrequency(rule.frequency);
    setInterval(rule.interval.toString());
    setStartDate(rule.startDate.split('T')[0]);
    setEndDate(rule.endDate?.split('T')[0] || '');
    setEditingRule(rule);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this recurring rule?')) return;
    setRules(prev => prev.filter(r => r.id !== id));
    saveRules(rules.filter(r => r.id !== id));
    addToast('success', 'Rule deleted');
  };

  const activeRules = rules.filter(r => r.active).length;
  const monthlyImpact = rules.reduce((sum, r) => {
    if (!r.active) return sum;
    const monthlyAmount = Math.abs(r.templateTxn.amount) / (
      r.frequency === 'daily' ? 30 :
      r.frequency === 'weekly' ? 4 :
      r.frequency === 'monthly' ? 1 : 12
    ) * r.interval;
    return sum + monthlyAmount;
  }, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Repeat className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-medium text-zinc-500">Total Rules</span>
          </div>
          <p className="text-lg font-bold">{rules.length}</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Play className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-zinc-500">Active</span>
          </div>
          <p className="text-lg font-bold text-emerald-600">{activeRules}</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-zinc-500">Monthly Impact</span>
          </div>
          <p className="text-lg font-bold">₹{monthlyImpact.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors text-sm font-medium text-zinc-600 dark:text-zinc-400"
      >
        <Plus className="w-4 h-4" />
        Create Recurring Rule
      </button>

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <Repeat className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
          <p className="font-medium">No recurring rules</p>
          <p className="text-sm text-zinc-500 mt-1">Auto-add rent, salary, subscriptions</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => {
            const isIncome = rule.templateTxn.amount > 0;
            const nextDue = new Date(rule.nextDue);
            const isOverdue = nextDue < new Date() && rule.active;
            return (
              <div
                key={rule.id}
                className={`p-4 rounded-2xl border bg-white dark:bg-zinc-900 ${
                  !rule.active ? 'opacity-60 border-zinc-200 dark:border-zinc-800'
                    : isOverdue ? 'border-amber-500'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold truncate">{rule.templateTxn.description}</h3>
                      {!rule.active && <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600">PAUSED</span>}
                      {isOverdue && rule.active && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700">DUE</span>}
                    </div>
                    <p className={`text-lg font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isIncome ? '+' : '-'}₹{Math.abs(rule.templateTxn.amount).toLocaleString('en-IN')}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                      <Repeat className="w-3 h-3" />
                      <span>Every {rule.interval > 1 ? `${rule.interval} ` : ''}{rule.frequency.replace('ly', '')}s</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>Next: {format(nextDue, 'dd MMM')}</span>
                      {rule.executions > 0 && (
                        <>
                          <span>•</span>
                          <CheckCircle className="w-3 h-3" />
                          <span>{rule.executions}x done</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleTogglePause(rule.id)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title={rule.active ? 'Pause' : 'Resume'}>
                      {rule.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleEdit(rule)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(rule.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
              <h2 className="text-lg font-bold">{editingRule ? 'Edit Recurring' : 'New Recurring'}</h2>
              <button onClick={resetForm} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setType('expense')}
                  className={`py-2.5 rounded-xl text-sm font-medium border-2 ${type === 'expense' ? 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700' : 'border-zinc-200 dark:border-zinc-700'}`}
                >
                  💸 Expense
                </button>
                <button
                  onClick={() => setType('income')}
                  className={`py-2.5 rounded-xl text-sm font-medium border-2 ${type === 'income' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700' : 'border-zinc-200 dark:border-zinc-700'}`}
                >
                  💰 Income
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Netflix subscription" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Amount (₹)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="500" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none">
                  <option value="">Select</option>
                  {categories.filter(c => type === 'expense' ? (c.type === 'expense' || c.type === 'both') : (c.type === 'income' || c.type === 'both')).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Frequency</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFrequency(f)}
                      className={`py-2 rounded-xl text-xs font-medium border-2 ${frequency === f ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700' : 'border-zinc-200 dark:border-zinc-700'}`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Every</label>
                  <input type="number" min="1" value={interval} onChange={e => setInterval(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">End Date (Optional)</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
            </div>
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <button onClick={resetForm} className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700">
                {editingRule ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
