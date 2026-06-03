import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Receipt, Bell, CheckCircle2, Clock,
  X, Calendar, Repeat, AlertCircle, Zap
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { format, addDays, addWeeks, addMonths, addYears, differenceInDays, parseISO } from 'date-fns';

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string; // ISO date
  frequency: 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  category: string; // utility, subscription, etc.
  reminderDays: number; // remind N days before
  autoPay: boolean;
  paid: boolean;
  lastPaid?: string;
  notes?: string;
  icon: string;
  color: string;
}

const BILLS_KEY = 'finvault_bills';

function getBills(): Bill[] {
  const stored = localStorage.getItem(BILLS_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

function saveBills(bills: Bill[]) {
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
}

function generateId() {
  return `bill-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const CATEGORIES = [
  { id: 'utility', label: 'Utility', icon: '💡', color: '#f59e0b' },
  { id: 'subscription', label: 'Subscription', icon: '📺', color: '#8b5cf6' },
  { id: 'internet', label: 'Internet', icon: '🌐', color: '#06b6d4' },
  { id: 'phone', label: 'Phone', icon: '📱', color: '#10b981' },
  { id: 'insurance', label: 'Insurance', icon: '🛡️', color: '#3b82f6' },
  { id: 'rent', label: 'Rent', icon: '🏠', color: '#ec4899' },
  { id: 'emi', label: 'EMI', icon: '🏦', color: '#6366f1' },
  { id: 'other', label: 'Other', icon: '📄', color: '#64748b' },
];

export function BillReminders() {
  const [bills, setBills] = useState<Bill[]>(getBills());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const { addToast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [frequency, setFrequency] = useState<Bill['frequency']>('monthly');
  const [category, setCategory] = useState('utility');
  const [reminderDays, setReminderDays] = useState('3');
  const [autoPay, setAutoPay] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);
      if (result === 'granted') {
        addToast('success', '🔔 Notifications enabled!');
      }
    }
  };

  const sendNotification = (bill: Bill, daysLeft: number) => {
    if (notificationPermission === 'granted') {
      new Notification(`💰 Bill Reminder: ${bill.name}`, {
        body: `Due in ${daysLeft} day${daysLeft > 1 ? 's' : ''} - ₹${bill.amount.toLocaleString('en-IN')}`,
        icon: '💎',
      });
    }
  };

  // Check bills daily
  useEffect(() => {
    const checkBills = () => {
      const now = new Date();
      bills.forEach(bill => {
        if (bill.paid) return;
        const due = parseISO(bill.dueDate);
        const days = differenceInDays(due, now);
        if (days <= bill.reminderDays && days >= 0) {
          const lastNotified = localStorage.getItem(`bill_notif_${bill.id}_${days}`);
          if (!lastNotified) {
            sendNotification(bill, days);
            localStorage.setItem(`bill_notif_${bill.id}_${days}`, '1');
          }
        }
      });
    };
    checkBills();
    const interval = setInterval(checkBills, 60 * 60 * 1000); // hourly
    return () => clearInterval(interval);
  }, [bills, notificationPermission]);

  const enrichedBills = useMemo(() => {
    return bills.map(bill => {
      const due = parseISO(bill.dueDate);
      const now = new Date();
      const daysLeft = differenceInDays(due, now);
      const isOverdue = daysLeft < 0 && !bill.paid;
      const isDueSoon = daysLeft <= bill.reminderDays && daysLeft >= 0 && !bill.paid;
      return { ...bill, daysLeft, isOverdue, isDueSoon };
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [bills]);

  const stats = useMemo(() => {
    const upcoming = enrichedBills.filter(b => !b.paid && b.daysLeft >= 0);
    const overdue = enrichedBills.filter(b => b.isOverdue);
    const totalUpcoming = upcoming.reduce((s, b) => s + b.amount, 0);
    const monthlyTotal = bills.reduce((s, b) => {
      if (b.paid) return s;
      const multiplier = b.frequency === 'weekly' ? 4.33 : b.frequency === 'monthly' ? 1 : b.frequency === 'quarterly' ? 1/3 : b.frequency === 'yearly' ? 1/12 : 0;
      return s + b.amount * multiplier;
    }, 0);
    return { upcoming: upcoming.length, overdue: overdue.length, totalUpcoming, monthlyTotal };
  }, [enrichedBills, bills]);

  const handleSave = () => {
    if (!name || !amount || !dueDate) {
      addToast('error', 'Fill all required fields');
      return;
    }

    const cat = CATEGORIES.find(c => c.id === category)!;
    const newBill: Bill = {
      id: editing?.id || generateId(),
      name,
      amount: parseFloat(amount),
      dueDate: new Date(dueDate).toISOString(),
      frequency,
      category,
      reminderDays: parseInt(reminderDays),
      autoPay,
      paid: editing?.paid || false,
      lastPaid: editing?.lastPaid,
      notes: notes || undefined,
      icon: cat.icon,
      color: cat.color,
    };

    if (editing) {
      setBills(prev => prev.map(b => b.id === editing.id ? newBill : b));
      addToast('success', 'Bill updated');
    } else {
      setBills(prev => [...prev, newBill]);
      addToast('success', 'Bill reminder added');
    }
    saveBills(bills.filter(b => b.id !== newBill.id).concat(newBill));
    resetForm();
  };

  const resetForm = () => {
    setName(''); setAmount(''); setDueDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
    setFrequency('monthly'); setCategory('utility'); setReminderDays('3');
    setAutoPay(false); setNotes(''); setEditing(null); setShowAddModal(false);
  };

  const togglePaid = (id: string) => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;
    const updated = bills.map(b => b.id === id ? { ...b, paid: !b.paid, lastPaid: !b.paid ? new Date().toISOString() : b.lastPaid } : b);
    setBills(updated);
    saveBills(updated);
    
    if (!bill.paid) {
      // Schedule next occurrence if recurring
      if (bill.frequency !== 'once') {
        const next = calculateNext(parseISO(bill.dueDate), bill.frequency);
        setTimeout(() => {
          const finalBills = updated.map(b => b.id === id ? { ...b, dueDate: next.toISOString() } : b);
          setBills(finalBills);
          saveBills(finalBills);
        }, 100);
      }
      addToast('success', '✓ Bill marked paid');
    }
  };

  const calculateNext = (from: Date, freq: Bill['frequency']): Date => {
    switch (freq) {
      case 'weekly': return addWeeks(from, 1);
      case 'monthly': return addMonths(from, 1);
      case 'quarterly': return addMonths(from, 3);
      case 'yearly': return addYears(from, 1);
      default: return from;
    }
  };

  const handleEdit = (bill: Bill) => {
    setName(bill.name);
    setAmount(bill.amount.toString());
    setDueDate(bill.dueDate.split('T')[0]);
    setFrequency(bill.frequency);
    setCategory(bill.category);
    setReminderDays(bill.reminderDays.toString());
    setAutoPay(bill.autoPay);
    setNotes(bill.notes || '');
    setEditing(bill);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this bill?')) return;
    setBills(prev => prev.filter(b => b.id !== id));
    saveBills(bills.filter(b => b.id !== id));
    addToast('success', 'Bill deleted');
  };

  return (
    <div className="space-y-4">
      {/* Notification Banner */}
      {notificationPermission !== 'granted' && (
        <button
          onClick={requestNotificationPermission}
          className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-800 hover:border-amber-500 transition-colors"
        >
          <Bell className="w-5 h-5 text-amber-600" />
          <div className="text-left flex-1">
            <p className="text-sm font-semibold">Enable Browser Notifications</p>
            <p className="text-xs text-zinc-500">Get reminded before bills are due</p>
          </div>
          <Zap className="w-4 h-4 text-amber-600" />
        </button>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4" />
            <span className="text-xs font-medium opacity-90">Upcoming</span>
          </div>
          <p className="text-lg font-bold">{stats.upcoming}</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium opacity-90">Overdue</span>
          </div>
          <p className="text-lg font-bold">{stats.overdue}</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-medium text-zinc-500">Next 30d</span>
          </div>
          <p className="text-lg font-bold">₹{stats.totalUpcoming.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-zinc-500">Monthly Avg</span>
          </div>
          <p className="text-lg font-bold">₹{stats.monthlyTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors text-sm font-medium text-zinc-600 dark:text-zinc-400"
      >
        <Plus className="w-4 h-4" />
        Add Bill Reminder
      </button>

      {/* Bills List */}
      {enrichedBills.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <Receipt className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
          <p className="font-medium">No bills tracked</p>
          <p className="text-sm text-zinc-500 mt-1">Never miss a due date</p>
        </div>
      ) : (
        <div className="space-y-2">
          {enrichedBills.map(bill => (
            <div
              key={bill.id}
              className={`p-4 rounded-2xl border-2 transition-all ${
                bill.paid
                  ? 'border-zinc-200 dark:border-zinc-800 opacity-60'
                  : bill.isOverdue
                  ? 'border-red-500 bg-red-50/30 dark:bg-red-950/20'
                  : bill.isDueSoon
                  ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-950/20'
                  : 'border-zinc-200 dark:border-zinc-800'
              } bg-white dark:bg-zinc-900`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => togglePaid(bill.id)}
                  className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    bill.paid ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300 dark:border-zinc-600 hover:border-emerald-500'
                  }`}
                >
                  {bill.paid && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl flex-shrink-0">{bill.icon}</span>
                      <div className="min-w-0">
                        <h3 className={`font-bold truncate ${bill.paid ? 'line-through' : ''}`}>{bill.name}</h3>
                        <p className="text-xs text-zinc-500">
                          {bill.frequency !== 'once' && <><Repeat className="w-3 h-3 inline" /> {bill.frequency} • </>}
                          {CATEGORIES.find(c => c.id === bill.category)?.label}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold">₹{bill.amount.toLocaleString('en-IN')}</p>
                      {!bill.paid && (
                        <p className={`text-xs font-semibold ${
                          bill.isOverdue ? 'text-red-600' : bill.isDueSoon ? 'text-amber-600' : 'text-zinc-500'
                        }`}>
                          {bill.isOverdue
                            ? `${Math.abs(bill.daysLeft)}d overdue`
                            : bill.daysLeft === 0
                            ? 'Due today'
                            : `${bill.daysLeft}d left`}
                        </p>
                      )}
                      {bill.autoPay && <p className="text-[10px] text-blue-600 font-semibold">AUTO-PAY</p>}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Due: {format(parseISO(bill.dueDate), 'dd MMM yyyy')}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <button onClick={() => handleEdit(bill)} className="text-xs px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">Edit</button>
                    <button onClick={() => handleDelete(bill.id)} className="text-xs px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={resetForm}>
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold">{editing ? 'Edit' : 'New'} Bill</h2>
              <button onClick={resetForm} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Electricity, Netflix" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setCategory(c.id)} className={`p-2 rounded-lg text-xs font-medium border-2 ${category === c.id ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-zinc-200 dark:border-zinc-700'}`}>
                      <div className="text-lg">{c.icon}</div>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Amount (₹)</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="500" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Frequency</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['once', 'weekly', 'monthly', 'quarterly', 'yearly'] as const).map(f => (
                    <button key={f} onClick={() => setFrequency(f)} className={`py-2 rounded-lg text-xs font-medium border-2 ${frequency === f ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-zinc-200 dark:border-zinc-700'}`}>
                      {f.charAt(0).toUpperCase() + f.slice(1, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Remind me (days before)</label>
                <input type="number" min="0" value={reminderDays} onChange={e => setReminderDays(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
              <label className="flex items-center gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 cursor-pointer">
                <input type="checkbox" checked={autoPay} onChange={e => setAutoPay(e.target.checked)} className="w-4 h-4" />
                <span className="text-sm">Auto-pay enabled</span>
              </label>
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
