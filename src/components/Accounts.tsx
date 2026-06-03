import { useState, useMemo, useEffect } from 'react';
import {
  Plus, Trash2, Edit2, Wallet, X,
  ArrowRightLeft
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useTransactions } from '@/hooks/useTransactions';
import { db } from '@/lib/db';

interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit_card' | 'wallet' | 'crypto' | 'investment';
  balance: number; // opening balance
  currency: string;
  icon: string;
  color: string;
  notes?: string;
  archived: boolean;
  createdAt: string;
}

const ACCOUNTS_KEY = 'finvault_accounts';

function getAccounts(): Account[] {
  const stored = localStorage.getItem(ACCOUNTS_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

function saveAccounts(accounts: Account[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function generateId() {
  return `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const TYPE_INFO = {
  cash: { label: 'Cash', icon: '💵', color: '#10b981' },
  bank: { label: 'Bank', icon: '🏦', color: '#6366f1' },
  credit_card: { label: 'Credit Card', icon: '💳', color: '#ef4444' },
  wallet: { label: 'Digital Wallet', icon: '📱', color: '#8b5cf6' },
  crypto: { label: 'Crypto', icon: '₿', color: '#f59e0b' },
  investment: { label: 'Investment', icon: '📈', color: '#06b6d4' },
};

export function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>(getAccounts());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [transferModal, setTransferModal] = useState(false);
  const { transactions } = useTransactions();
  const { addToast } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('bank');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [notes, setNotes] = useState('');

  // Transfer state
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  useEffect(() => {
    // Migrate from old single-balance if needed
  }, []);

  // Calculate current balance for each account
  const accountsWithBalance = useMemo(() => {
    return accounts.filter(a => !a.archived).map(acc => {
      const accountTxns = transactions.filter(t => (t as any).accountId === acc.id);
      const inflow = accountTxns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const outflow = Math.abs(accountTxns.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));
      const currentBalance = acc.balance + inflow - outflow;
      return { ...acc, currentBalance, transactionCount: accountTxns.length };
    });
  }, [accounts, transactions]);

  const totalBalance = accountsWithBalance.reduce((s, a) => s + a.currentBalance, 0);

  const handleSave = () => {
    if (!name || !balance) {
      addToast('error', 'Name and balance are required');
      return;
    }

    const newAcc: Account = {
      id: editing?.id || generateId(),
      name,
      type,
      balance: parseFloat(balance),
      currency,
      icon: TYPE_INFO[type].icon,
      color: TYPE_INFO[type].color,
      notes: notes || undefined,
      archived: editing?.archived || false,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };

    if (editing) {
      setAccounts(prev => prev.map(a => a.id === editing.id ? newAcc : a));
      addToast('success', 'Account updated');
    } else {
      setAccounts(prev => [...prev, newAcc]);
      addToast('success', 'Account created');
    }
    saveAccounts(accounts.filter(a => a.id !== newAcc.id).concat(newAcc));
    resetForm();
  };

  const resetForm = () => {
    setName(''); setType('bank'); setBalance(''); setCurrency('INR'); setNotes('');
    setEditing(null); setShowAddModal(false);
  };

  const handleEdit = (acc: Account) => {
    setName(acc.name);
    setType(acc.type);
    setBalance(acc.balance.toString());
    setCurrency(acc.currency);
    setNotes(acc.notes || '');
    setEditing(acc);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this account? Transactions linked to it will remain.')) return;
    setAccounts(prev => prev.filter(a => a.id !== id));
    saveAccounts(accounts.filter(a => a.id !== id));
    addToast('success', 'Account deleted');
  };

  const handleTransfer = async () => {
    const amt = parseFloat(transferAmount);
    if (!fromAccount || !toAccount || amt <= 0) {
      addToast('error', 'Invalid transfer details');
      return;
    }
    if (fromAccount === toAccount) {
      addToast('error', 'Cannot transfer to same account');
      return;
    }

    // Create paired transactions
    const now = new Date().toISOString();
    const fromAcc = accounts.find(a => a.id === fromAccount);
    const toAcc = accounts.find(a => a.id === toAccount);

    await db.transactions.bulkAdd([
      {
        id: generateId(),
        date: now,
        amount: -amt,
        category: 'other-expense',
        description: `Transfer to ${toAcc?.name}`,
        createdAt: now,
        updatedAt: now,
        // @ts-ignore
        accountId: fromAccount,
      } as any,
      {
        id: generateId(),
        date: now,
        amount: amt,
        category: 'other-income',
        description: `Transfer from ${fromAcc?.name}`,
        createdAt: now,
        updatedAt: now,
        // @ts-ignore
        accountId: toAccount,
      } as any,
    ]);

    addToast('success', `Transferred ₹${amt} from ${fromAcc?.name} to ${toAcc?.name}`);
    setTransferModal(false);
    setTransferAmount('');
    setFromAccount('');
    setToAccount('');
  };

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-4 h-4" />
          <span className="text-sm opacity-90">Total Net Worth</span>
        </div>
        <p className="text-3xl font-bold">₹{totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
        <p className="text-xs opacity-80 mt-1">Across {accountsWithBalance.length} account{accountsWithBalance.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
        <button
          onClick={() => setTransferModal(true)}
          disabled={accountsWithBalance.length < 2}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          <ArrowRightLeft className="w-4 h-4" />
          Transfer
        </button>
      </div>

      {/* Account List */}
      {accountsWithBalance.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <Wallet className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
          <p className="font-medium">No accounts yet</p>
          <p className="text-sm text-zinc-500 mt-1">Add cash, bank, cards, wallets</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {accountsWithBalance.map(acc => (
            <div key={acc.id} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: acc.color + '20' }}>
                    {acc.icon}
                  </div>
                  <div>
                    <h3 className="font-bold">{acc.name}</h3>
                    <p className="text-xs text-zinc-500">{TYPE_INFO[acc.type].label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(acc)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(acc.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className={`text-2xl font-bold ${acc.currentBalance < 0 ? 'text-red-600' : ''}`}>
                  ₹{acc.currentBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-zinc-500">{acc.transactionCount} txn{acc.transactionCount !== 1 ? 's' : ''}</p>
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
              <h2 className="text-lg font-bold">{editing ? 'Edit' : 'New'} Account</h2>
              <button onClick={resetForm} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Account Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., SBI Savings" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(TYPE_INFO) as Account['type'][]).map(t => (
                    <button key={t} onClick={() => setType(t)} className={`p-2 rounded-lg text-xs font-medium border-2 ${type === t ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-zinc-200 dark:border-zinc-700'}`}>
                      <div className="text-lg">{TYPE_INFO[t].icon}</div>
                      {TYPE_INFO[t].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Opening Balance</label>
                  <input type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none">
                    <option value="INR">₹ INR</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                    <option value="GBP">£ GBP</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <button onClick={resetForm} className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700">{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setTransferModal(false)}>
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Transfer Money</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">From</label>
                <select value={fromAccount} onChange={e => setFromAccount(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                  <option value="">Select account</option>
                  {accountsWithBalance.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name} (₹{a.currentBalance.toLocaleString('en-IN')})</option>)}
                </select>
              </div>
              <div className="flex justify-center">
                <ArrowRightLeft className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">To</label>
                <select value={toAccount} onChange={e => setToAccount(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                  <option value="">Select account</option>
                  {accountsWithBalance.filter(a => a.id !== fromAccount).map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Amount (₹)</label>
                <input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setTransferModal(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium">Cancel</button>
              <button onClick={handleTransfer} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700">Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
