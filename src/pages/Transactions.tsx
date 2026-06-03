import { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  Receipt, 
  Download,
  Calendar,
  ChevronDown,
  FileSpreadsheet,
  Smartphone
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { useTransactions } from '@/hooks/useTransactions';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { ReceiptModal } from '@/components/ReceiptModal';
import { BankStatementImport } from '@/components/BankStatementImport';
import { BankSMSParser } from '@/components/BankSMSParser';
import { AIAssistantPanel } from '@/components/AIAssistantPanel';
import { db } from '@/lib/db';
import { useToast } from '@/contexts/ToastContext';
import type { Transaction, Category, ExportData } from '@/types';

export function Transactions() {
  const { transactions, deleteTransaction, refresh } = useTransactions();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showSMSParser, setShowSMSParser] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [showFilters, setShowFilters] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    db.categories.toArray().then(setCategories);
  }, []);

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || { name: categoryId, icon: '📌', color: '#6366f1' };
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = 
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryInfo(tx.category).name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
      
      const matchesType = 
        filterType === 'all' ||
        (filterType === 'income' && tx.amount > 0) ||
        (filterType === 'expense' && tx.amount < 0);
      
      const txDate = new Date(tx.date);
      const matchesDate = 
        txDate >= new Date(dateRange.start) && 
        txDate <= new Date(dateRange.end + 'T23:59:59');
      
      return matchesSearch && matchesCategory && matchesType && matchesDate;
    });
  }, [transactions, searchTerm, filterCategory, filterType, dateRange, categories]);

  const totalFiltered = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction(id);
      addToast('success', 'Transaction deleted');
    }
  };

  const handleExport = async (formatType: 'csv' | 'json') => {
    const data: ExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      transactions: filteredTransactions,
      categories,
      settings: await db.getSettings(),
    };

    if (formatType === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finvault-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV export
      const headers = ['Date', 'Description', 'Category', 'Amount', 'Type'];
      const rows = filteredTransactions.map(tx => [
        format(new Date(tx.date), 'yyyy-MM-dd'),
        tx.description,
        getCategoryInfo(tx.category).name,
        Math.abs(tx.amount).toString(),
        tx.amount > 0 ? 'Income' : 'Expense',
      ]);
      
      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finvault-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    addToast('success', `Exported ${filteredTransactions.length} transactions`);
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              {filteredTransactions.length} transactions • Net: ₹ {totalFiltered.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-zinc-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-zinc-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSMSParser(true)}
                title="Parse Bank SMS"
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowCSVImport(true)}
                title="Import Bank CSV"
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-medium transition-all ${
                  showFilters
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400'
                    : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                {(['all', 'income', 'expense'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                      filterType === type
                        ? 'bg-white dark:bg-zinc-700 shadow-sm'
                        : 'hover:bg-white/50 dark:hover:bg-zinc-700/50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <AIAssistantPanel
          pageKey="transactions"
          title="AI Transaction Analyst"
          context={{
            page: 'transactions',
            filterSummary: {
              search: searchTerm,
              category: filterCategory,
              type: filterType,
              startDate: dateRange.start,
              endDate: dateRange.end,
            },
            totalIncome: filteredTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
            totalExpense: Math.abs(filteredTransactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)),
            net: totalFiltered,
            transactions: filteredTransactions.slice(0, 60).map(tx => ({
              amount: tx.amount,
              category: tx.category,
              description: tx.description,
              date: tx.date,
            })),
          }}
          suggestions={[
            'Summarize these filtered transactions',
            'Find unusual expenses',
            'What are the top recurring spending patterns?',
            'Suggest better categorization or budgeting tips'
          ]}
        />

        {/* Transactions List */}
        <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredTransactions.map((tx) => {
                const cat = getCategoryInfo(tx.category);
                const isIncome = tx.amount > 0;
                
                return (
                  <div
                    key={tx.id}
                    className="group flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
                      isIncome 
                        ? 'bg-emerald-100 dark:bg-emerald-950/50' 
                        : 'bg-red-100 dark:bg-red-950/50'
                    }`}>
                      {cat.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{tx.description}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 font-medium">
                              {cat.name}
                            </span>
                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(tx.date), 'dd MMM yyyy')}
                            </span>
                            {tx.isRecurring && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 font-medium">
                                Recurring
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className={`font-bold text-lg ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                              {isIncome ? '+' : '-'}₹ {Math.abs(tx.amount).toLocaleString('en-IN')}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isIncome && (
                              <button
                                onClick={() => setReceiptTransaction(tx)}
                                className="p-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                title="Generate receipt"
                              >
                                <Receipt className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditTransaction(tx);
                                setShowAddModal(true);
                              }}
                              className="p-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                <Search className="w-8 h-8 text-zinc-400" />
              </div>
              <p className="font-medium mb-1">No transactions found</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Try adjusting your filters or search term
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditTransaction(null);
        }}
        onSuccess={refresh}
        editTransaction={editTransaction}
      />
      
      <ReceiptModal
        isOpen={!!receiptTransaction}
        onClose={() => setReceiptTransaction(null)}
        transaction={receiptTransaction}
      />

      {showCSVImport && (
        <BankStatementImport
          onClose={() => setShowCSVImport(false)}
          onSuccess={refresh}
        />
      )}

      {showSMSParser && (
        <BankSMSParser
          onClose={() => setShowSMSParser(false)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
