import { useState, useMemo, useEffect } from 'react';
import {
  Search, Filter, ArrowUpDown, Download
} from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { db } from '@/lib/db';
import type { Category } from '@/types';
import { format } from 'date-fns';

interface FilterState {
  query: string;
  category: string;
  type: 'all' | 'income' | 'expense';
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
  tags: string[];
  sortBy: 'date' | 'amount' | 'description';
  sortOrder: 'asc' | 'desc';
}

export function AdvancedSearch() {
  const { transactions } = useTransactions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    query: '',
    category: 'all',
    type: 'all',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    tags: [],
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    db.categories.toArray().then(setCategories);
  }, []);

  const getCategoryInfo = (id: string) =>
    categories.find(c => c.id === id) || { name: id, icon: '📌', color: '#6366f1' };

  const filtered = useMemo(() => {
    let result = transactions.filter(tx => {
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const cat = getCategoryInfo(tx.category);
        if (!tx.description.toLowerCase().includes(q) && !cat.name.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filters.category !== 'all' && tx.category !== filters.category) return false;
      if (filters.type === 'income' && tx.amount <= 0) return false;
      if (filters.type === 'expense' && tx.amount >= 0) return false;
      if (filters.minAmount && Math.abs(tx.amount) < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && Math.abs(tx.amount) > parseFloat(filters.maxAmount)) return false;
      if (filters.startDate && new Date(tx.date) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(tx.date) > new Date(filters.endDate + 'T23:59:59')) return false;
      if (filters.tags.length > 0) {
        const descTags = (tx.description.match(/#[\w\u0900-\u097F]+/g) || []).map(t => t.toLowerCase());
        if (!filters.tags.some(t => descTags.includes(t.toLowerCase()))) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (filters.sortBy === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (filters.sortBy === 'amount') cmp = Math.abs(a.amount) - Math.abs(b.amount);
      else cmp = a.description.localeCompare(b.description);
      return filters.sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [transactions, filters, categories]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const exportFiltered = () => {
    const csv = [
      ['Date', 'Description', 'Category', 'Amount', 'Type'].join(','),
      ...filtered.map(tx => [
        format(new Date(tx.date), 'yyyy-MM-dd'),
        `"${tx.description}"`,
        getCategoryInfo(tx.category).name,
        Math.abs(tx.amount),
        tx.amount > 0 ? 'Income' : 'Expense',
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totals = useMemo(() => {
    const income = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expense = Math.abs(filtered.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));
    return { income, expense, net: income - expense };
  }, [filtered]);

  const activeFilterCount = [
    filters.query, filters.category !== 'all', filters.type !== 'all',
    filters.minAmount, filters.maxAmount, filters.startDate, filters.endDate, filters.tags.length > 0
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilters({
      query: '', category: 'all', type: 'all', minAmount: '', maxAmount: '',
      startDate: '', endDate: '', tags: [], sortBy: 'date', sortOrder: 'desc',
    });
    setPage(0);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              value={filters.query}
              onChange={e => { setFilters({ ...filters, query: e.target.value }); setPage(0); }}
              placeholder="Search transactions, categories, #tags..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative px-4 py-2.5 rounded-xl border font-medium text-sm ${
              showFilters || activeFilterCount > 0
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400'
                : 'border-zinc-300 dark:border-zinc-700'
            }`}
          >
            <Filter className="w-4 h-4 inline" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500">Type</label>
              <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value as any })} className="w-full mt-1 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm">
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Category</label>
              <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} className="w-full mt-1 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm">
                <option value="all">All</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Min ₹</label>
              <input type="number" value={filters.minAmount} onChange={e => setFilters({ ...filters, minAmount: e.target.value })} placeholder="0" className="w-full mt-1 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Max ₹</label>
              <input type="number" value={filters.maxAmount} onChange={e => setFilters({ ...filters, maxAmount: e.target.value })} placeholder="∞" className="w-full mt-1 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">From</label>
              <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="w-full mt-1 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">To</label>
              <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="w-full mt-1 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-zinc-500">Sort By</label>
              <div className="flex gap-1 mt-1">
                <select value={filters.sortBy} onChange={e => setFilters({ ...filters, sortBy: e.target.value as any })} className="flex-1 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm">
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="description">Description</option>
                </select>
                <button onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })} className="px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="col-span-2 md:col-span-4 flex justify-end">
                <button onClick={resetFilters} className="text-xs px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
          <p className="text-xs text-emerald-700 dark:text-emerald-400">Income</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">₹{totals.income.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
          <p className="text-xs text-red-700 dark:text-red-400">Expense</p>
          <p className="text-lg font-bold text-red-700 dark:text-red-400">₹{totals.expense.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900">
          <p className="text-xs text-violet-700 dark:text-violet-400">Net</p>
          <p className={`text-lg font-bold ${totals.net >= 0 ? 'text-violet-700 dark:text-violet-400' : 'text-red-600'}`}>
            ₹{totals.net.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} • Page {page + 1} of {totalPages || 1}
        </p>
        <button
          onClick={exportFiltered}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Results */}
      <div className="space-y-2">
        {paged.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <Search className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
            <p className="font-medium">No results found</p>
          </div>
        ) : (
          paged.map(tx => {
            const cat = getCategoryInfo(tx.category);
            const isIncome = tx.amount > 0;
            return (
              <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                  isIncome ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-red-100 dark:bg-red-950/50'
                }`}>
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{tx.description}</p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{cat.name}</span>
                    <span>•</span>
                    <span>{format(new Date(tx.date), 'dd MMM yyyy')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isIncome ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm font-medium disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-zinc-500">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm font-medium disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
