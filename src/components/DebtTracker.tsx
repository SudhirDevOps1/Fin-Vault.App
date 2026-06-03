import { useState, useMemo } from 'react';
import {
  Plus, Trash2, Edit2, CreditCard, CheckCircle,
  Calendar, X, Percent, DollarSign,
  Banknote
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { db } from '@/lib/db';
import type { Transaction } from '@/types';
import { format } from 'date-fns';

interface Debt {
  id: string;
  name: string; // e.g., "Home Loan", "Credit Card"
  type: 'loan' | 'credit_card' | 'mortgage' | 'student' | 'personal' | 'other';
  principal: number; // original amount
  outstanding: number; // current amount owed
  interestRate: number; // annual percentage
  emiAmount?: number; // monthly payment
  startDate: string;
  endDate?: string;
  lender: string;
  notes?: string;
  payments: DebtPayment[];
}

interface DebtPayment {
  id: string;
  date: string;
  amount: number;
  principal: number;
  interest: number;
  note?: string;
}

const DEBTS_KEY = 'finvault_debts';

function getDebts(): Debt[] {
  const stored = localStorage.getItem(DEBTS_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

function saveDebts(debts: Debt[]) {
  localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));
}

function generateId() {
  return `debt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const TYPE_INFO = {
  loan: { label: 'Loan', icon: '🏦', color: '#6366f1' },
  credit_card: { label: 'Credit Card', icon: '💳', color: '#ef4444' },
  mortgage: { label: 'Mortgage', icon: '🏠', color: '#8b5cf6' },
  student: { label: 'Student', icon: '🎓', color: '#06b6d4' },
  personal: { label: 'Personal', icon: '👤', color: '#f59e0b' },
  other: { label: 'Other', icon: '💼', color: '#64748b' },
};

export function DebtTracker() {
  const [debts, setDebts] = useState<Debt[]>(getDebts());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [paymentModal, setPaymentModal] = useState<Debt | null>(null);
  const { addToast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<Debt['type']>('loan');
  const [principal, setPrincipal] = useState('');
  const [outstanding, setOutstanding] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [lender, setLender] = useState('');

  // Payment state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const stats = useMemo(() => {
    const totalOutstanding = debts.reduce((s, d) => s + d.outstanding, 0);
    const totalPrincipal = debts.reduce((s, d) => s + d.principal, 0);
    const totalPaid = totalPrincipal - totalOutstanding;
    const monthlyEMI = debts.reduce((s, d) => s + (d.emiAmount || 0), 0);
    const avgInterest = debts.length > 0 ? debts.reduce((s, d) => s + d.interestRate, 0) / debts.length : 0;
    return { totalOutstanding, totalPrincipal, totalPaid, monthlyEMI, avgInterest };
  }, [debts]);

  const handleSave = () => {
    if (!name || !principal || !outstanding || !interestRate) {
      addToast('error', 'Fill all required fields');
      return;
    }

    const newDebt: Debt = {
      id: editingDebt?.id || generateId(),
      name,
      type,
      principal: parseFloat(principal),
      outstanding: parseFloat(outstanding),
      interestRate: parseFloat(interestRate),
      emiAmount: emiAmount ? parseFloat(emiAmount) : undefined,
      startDate,
      endDate: endDate || undefined,
      lender,
      payments: editingDebt?.payments || [],
    };

    if (editingDebt) {
      setDebts(prev => prev.map(d => d.id === editingDebt.id ? newDebt : d));
      addToast('success', 'Debt updated');
    } else {
      setDebts(prev => [...prev, newDebt]);
      addToast('success', 'Debt added');
    }
    saveDebts(debts.filter(d => d.id !== newDebt.id).concat(newDebt));
    resetForm();
  };

  const resetForm = () => {
    setName(''); setType('loan'); setPrincipal(''); setOutstanding('');
    setInterestRate(''); setEmiAmount(''); setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate(''); setLender(''); setEditingDebt(null); setShowAddModal(false);
  };

  const recordPayment = async () => {
    if (!paymentModal || !paymentAmount) return;
    const amt = parseFloat(paymentAmount);
    if (amt <= 0 || amt > paymentModal.outstanding) {
      addToast('error', 'Invalid amount');
      return;
    }

    // Calculate interest vs principal split (simplified)
    const monthlyRate = paymentModal.interestRate / 12 / 100;
    const interestPart = paymentModal.outstanding * monthlyRate;
    const principalPart = Math.max(0, amt - interestPart);

    const payment: DebtPayment = {
      id: generateId(),
      date: new Date(paymentDate).toISOString(),
      amount: amt,
      principal: principalPart,
      interest: interestPart,
    };

    const updatedDebts = debts.map(d => d.id === paymentModal.id ? {
      ...d,
      outstanding: d.outstanding - principalPart,
      payments: [...d.payments, payment],
    } : d);

    setDebts(updatedDebts);
    saveDebts(updatedDebts);

    // Add as expense transaction
    const txn: Transaction = {
      id: `tx-${Date.now()}`,
      date: new Date(paymentDate).toISOString(),
      amount: -amt,
      category: 'bills',
      description: `Debt payment: ${paymentModal.name}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.transactions.add(txn);

    addToast('success', `Payment of ₹${amt} recorded`);
    setPaymentModal(null);
    setPaymentAmount('');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this debt record?')) return;
    setDebts(prev => prev.filter(d => d.id !== id));
    saveDebts(debts.filter(d => d.id !== id));
    addToast('success', 'Debt deleted');
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4" />
            <span className="text-xs font-medium opacity-90">Outstanding</span>
          </div>
          <p className="text-lg font-bold">₹{stats.totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-zinc-500">Total Paid</span>
          </div>
          <p className="text-lg font-bold text-emerald-600">₹{stats.totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-zinc-500">Monthly EMI</span>
          </div>
          <p className="text-lg font-bold">₹{stats.monthlyEMI.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Percent className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-medium text-zinc-500">Avg Interest</span>
          </div>
          <p className="text-lg font-bold">{stats.avgInterest.toFixed(2)}%</p>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors text-sm font-medium text-zinc-600 dark:text-zinc-400"
      >
        <Plus className="w-4 h-4" />
        Add Debt / Loan
      </button>

      {/* Debts List */}
      {debts.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <CreditCard className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
          <p className="font-medium">No debts tracked</p>
          <p className="text-sm text-zinc-500 mt-1">Track loans, credit cards, mortgages</p>
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map(debt => {
            const info = TYPE_INFO[debt.type];
            const paidPercent = ((debt.principal - debt.outstanding) / debt.principal) * 100;
            const isPaidOff = debt.outstanding <= 0;
            return (
              <div key={debt.id} className={`p-4 rounded-2xl border bg-white dark:bg-zinc-900 ${isPaidOff ? 'border-emerald-500' : 'border-zinc-200 dark:border-zinc-800'}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: info.color + '20' }}>
                      {info.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold truncate">{debt.name}</h3>
                        {isPaidOff && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-zinc-500">{info.label} • {debt.lender || 'Self'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!isPaidOff && (
                      <button onClick={() => setPaymentModal(debt)} className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200" title="Record payment">
                        <DollarSign className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => { setEditingDebt(debt); setName(debt.name); setType(debt.type); setPrincipal(debt.principal.toString()); setOutstanding(debt.outstanding.toString()); setInterestRate(debt.interestRate.toString()); setEmiAmount(debt.emiAmount?.toString() || ''); setStartDate(debt.startDate.split('T')[0]); setEndDate(debt.endDate?.split('T')[0] || ''); setLender(debt.lender); setShowAddModal(true); }} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(debt.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div>
                    <p className="text-xs text-zinc-500">Principal</p>
                    <p className="text-sm font-bold">₹{debt.principal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Outstanding</p>
                    <p className="text-sm font-bold text-red-600">₹{debt.outstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Interest</p>
                    <p className="text-sm font-bold">{debt.interestRate}%</p>
                  </div>
                </div>

                <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${Math.min(paidPercent, 100)}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{paidPercent.toFixed(0)}% paid off</span>
                  {debt.emiAmount && <span>EMI: ₹{debt.emiAmount.toLocaleString('en-IN')}/mo</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={resetForm}>
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold">{editingDebt ? 'Edit' : 'New'} Debt</h2>
              <button onClick={resetForm} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Home Loan - SBI" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(TYPE_INFO) as Debt['type'][]).map(t => (
                    <button key={t} onClick={() => setType(t)} className={`p-2 rounded-lg text-xs font-medium border-2 ${type === t ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-zinc-200 dark:border-zinc-700'}`}>
                      <div className="text-lg">{TYPE_INFO[t].icon}</div>
                      {TYPE_INFO[t].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Principal (₹)</label>
                  <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} placeholder="500000" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Outstanding (₹)</label>
                  <input type="number" value={outstanding} onChange={e => setOutstanding(e.target.value)} placeholder="350000" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Interest %</label>
                  <input type="number" step="0.1" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="8.5" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">EMI (₹)</label>
                  <input type="number" value={emiAmount} onChange={e => setEmiAmount(e.target.value)} placeholder="9000" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Lender</label>
                <input value={lender} onChange={e => setLender(e.target.value)} placeholder="e.g., SBI, HDFC" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
            </div>
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <button onClick={resetForm} className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700">{editingDebt ? 'Update' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setPaymentModal(null)}>
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{TYPE_INFO[paymentModal.type].icon}</div>
              <h2 className="text-lg font-bold">{paymentModal.name}</h2>
              <p className="text-sm text-zinc-500">Outstanding: ₹{paymentModal.outstanding.toLocaleString('en-IN')}</p>
            </div>
            <div className="space-y-3">
              <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Payment amount ₹" autoFocus className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-emerald-500 outline-none text-center text-xl font-bold" />
              {paymentModal.emiAmount && (
                <button onClick={() => setPaymentAmount(paymentModal.emiAmount!.toString())} className="w-full py-2 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                  Use EMI Amount (₹{paymentModal.emiAmount.toLocaleString('en-IN')})
                </button>
              )}
              <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPaymentModal(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium">Cancel</button>
              <button onClick={recordPayment} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700">Pay ₹{paymentAmount || 0}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
