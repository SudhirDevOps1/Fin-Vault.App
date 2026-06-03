import { useState, useMemo } from 'react';
import {
  Plus, Trash2, Edit2, Trophy, Target,
  TrendingUp, Flag, X, Sparkles
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useTransactions } from '@/hooks/useTransactions';
import { format, differenceInDays } from 'date-fns';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  color: string;
  description?: string;
  autoContribute?: {
    enabled: boolean;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
  };
  milestones: number[]; // percentage milestones to celebrate
  createdAt: string;
  completedAt?: string;
}

const GOALS_KEY = 'finvault_goals';

function getGoals(): Goal[] {
  const stored = localStorage.getItem(GOALS_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

function saveGoals(goals: Goal[]) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

function generateId() {
  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
const ICONS = ['🎯','🏠','🚗','✈️','💍','🎓','💼','🎮','📱','💎','🎁','🏖️','🛒','💰','📚'];

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>(getGoals());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributeModal, setContributeModal] = useState<Goal | null>(null);
  const { addToast } = useToast();
  const { transactions } = useTransactions();

  // Form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState(COLORS[0]);
  const [description, setDescription] = useState('');
  const [contributeAmount, setContributeAmount] = useState('');

  const goalsWithProgress = useMemo(() => {
    return goals.map(goal => {
      const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : 0;
      const requiredPerDay = daysLeft > 0 ? remaining / daysLeft : 0;
      const isCompleted = goal.currentAmount >= goal.targetAmount;
      return { ...goal, percentage, remaining, daysLeft, requiredPerDay, isCompleted };
    });
  }, [goals]);

  // Auto-suggest from income
  const totalIncome = transactions
    .filter(t => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const suggestedSavings = totalIncome * 0.2; // 20% rule

  const handleSave = () => {
    if (!name || !targetAmount) {
      addToast('error', 'Name and target amount are required');
      return;
    }

    const newGoal: Goal = {
      id: editingGoal?.id || generateId(),
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      deadline: deadline || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      icon,
      color,
      description: description || undefined,
      milestones: editingGoal?.milestones || [25, 50, 75, 100],
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
      completedAt: parseFloat(currentAmount) >= parseFloat(targetAmount) ? new Date().toISOString() : undefined,
    };

    if (editingGoal) {
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? newGoal : g));
      addToast('success', 'Goal updated');
    } else {
      setGoals(prev => [...prev, newGoal]);
      addToast('success', 'Goal created!');
    }

    saveGoals(goals.filter(g => g.id !== newGoal.id).concat(newGoal));
    resetForm();
  };

  const resetForm = () => {
    setName(''); setTargetAmount(''); setCurrentAmount(''); setDeadline('');
    setIcon('🎯'); setColor(COLORS[0]); setDescription('');
    setEditingGoal(null); setShowAddModal(false);
  };

  const handleContribute = (goal: Goal, amount: number) => {
    if (amount <= 0) return;
    const updated = goals.map(g => g.id === goal.id ? {
      ...g,
      currentAmount: g.currentAmount + amount,
      completedAt: g.currentAmount + amount >= g.targetAmount ? new Date().toISOString() : g.completedAt,
    } : g);
    setGoals(updated);
    saveGoals(updated);
    
    const newAmount = goal.currentAmount + amount;
    if (newAmount >= goal.targetAmount && !goal.completedAt) {
      addToast('success', `🎉 Goal "${goal.name}" completed!`);
    } else {
      addToast('success', `Added ₹${amount} to ${goal.name}`);
    }
    setContributeModal(null);
    setContributeAmount('');
  };

  const handleEdit = (goal: Goal) => {
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setDeadline(goal.deadline?.split('T')[0] || '');
    setIcon(goal.icon);
    setColor(goal.color);
    setDescription(goal.description || '');
    setEditingGoal(goal);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this goal?')) return;
    setGoals(prev => prev.filter(g => g.id !== id));
    saveGoals(goals.filter(g => g.id !== id));
    addToast('success', 'Goal deleted');
  };

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const completedGoals = goals.filter(g => g.completedAt).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-xs font-medium opacity-90">Total Target</span>
          </div>
          <p className="text-lg font-bold">₹{totalTarget.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium opacity-90">Saved</span>
          </div>
          <p className="text-lg font-bold">₹{totalSaved.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-zinc-500">Completed</span>
          </div>
          <p className="text-lg font-bold">{completedGoals}</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span className="text-xs font-medium text-zinc-500">Suggested</span>
          </div>
          <p className="text-lg font-bold">₹{suggestedSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors text-sm font-medium text-zinc-600 dark:text-zinc-400"
      >
        <Plus className="w-4 h-4" />
        Add New Goal
      </button>

      {/* Goals List */}
      {goalsWithProgress.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <Flag className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
          <p className="font-medium">No goals yet</p>
          <p className="text-sm text-zinc-500 mt-1">Set your first savings goal</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goalsWithProgress
            .sort((a, b) => (a.isCompleted ? 1 : 0) - (b.isCompleted ? 1 : 0))
            .map(goal => (
              <div
                key={goal.id}
                className={`p-4 rounded-2xl border-2 bg-white dark:bg-zinc-900 transition-all ${
                  goal.isCompleted
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                      style={{ backgroundColor: goal.color + '20' }}
                    >
                      {goal.icon}
                    </div>
                    <div>
                      <h3 className="font-bold flex items-center gap-2">
                        {goal.name}
                        {goal.isCompleted && <Trophy className="w-4 h-4 text-amber-500" />}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {goal.daysLeft > 0 ? `${goal.daysLeft} days left` : 'Overdue'}
                        {goal.deadline && ` • by ${format(new Date(goal.deadline), 'dd MMM yyyy')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(goal)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-xl font-bold">₹{goal.currentAmount.toLocaleString('en-IN')}</span>
                    <span className="text-sm text-zinc-500"> / ₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={`text-sm font-bold ${goal.isCompleted ? 'text-emerald-600' : 'text-violet-600'}`}>
                    {goal.percentage.toFixed(0)}%
                  </div>
                </div>

                <div className="relative w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all rounded-full"
                    style={{
                      width: `${Math.min(goal.percentage, 100)}%`,
                      background: goal.color,
                    }}
                  />
                  {/* Milestones */}
                  {[25, 50, 75].map(m => (
                    <div
                      key={m}
                      className="absolute top-0 bottom-0 w-px bg-white/50"
                      style={{ left: `${m}%` }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-zinc-500">
                    {goal.isCompleted
                      ? '🎉 Goal achieved!'
                      : `₹${goal.remaining.toLocaleString('en-IN')} to go${goal.requiredPerDay > 0 ? ` • ₹${Math.round(goal.requiredPerDay).toLocaleString('en-IN')}/day` : ''}`}
                  </p>
                  {!goal.isCompleted && (
                    <button
                      onClick={() => setContributeModal(goal)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: goal.color }}
                    >
                      + Contribute
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={resetForm}>
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold">{editingGoal ? 'Edit Goal' : 'New Savings Goal'}</h2>
              <button onClick={resetForm} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1.5">Goal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., New Laptop, Europe Trip"
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Target (₹)</label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)}
                    placeholder="100000"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Current (₹)</label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={e => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Why is this important?"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(i => (
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
            </div>
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <button onClick={resetForm} className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium">
                Cancel
              </button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700">
                {editingGoal ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {contributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setContributeModal(null)}>
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{contributeModal.icon}</div>
              <h2 className="text-lg font-bold">{contributeModal.name}</h2>
              <p className="text-sm text-zinc-500">Add money to this goal</p>
            </div>
            <input
              type="number"
              value={contributeAmount}
              onChange={e => setContributeAmount(e.target.value)}
              placeholder="Amount in ₹"
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none text-center text-2xl font-bold"
            />
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[500, 1000, 5000, 10000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setContributeAmount(amt.toString())}
                  className="py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setContributeModal(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium">
                Cancel
              </button>
              <button
                onClick={() => handleContribute(contributeModal, parseFloat(contributeAmount))}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700"
              >
                Add ₹{contributeAmount || 0}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
