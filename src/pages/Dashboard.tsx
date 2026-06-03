import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank,
  Plus,
  Receipt,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { useTransactions } from '@/hooks/useTransactions';
import { StatCard } from '@/components/StatCard';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { ReceiptModal } from '@/components/ReceiptModal';
import { db } from '@/lib/db';
import type { Transaction, Category } from '@/types';

export function Dashboard() {
  const { transactions, getMonthlySummary, getLast6MonthsSummary, getCategoryBreakdown, refresh } = useTransactions();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const now = new Date();
  const currentMonthSummary = getMonthlySummary(now.getFullYear(), now.getMonth() + 1);
  const last6Months = getLast6MonthsSummary();
  const categoryBreakdown = getCategoryBreakdown(now.getFullYear(), now.getMonth() + 1);
  const recentTransactions = transactions.slice(0, 10);

  useMemo(() => {
    db.categories.toArray().then(setCategories);
  }, []);

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || { name: categoryId, icon: '📌', color: '#6366f1' };
  };

  const pieData = categoryBreakdown.slice(0, 6).map(item => {
    const cat = getCategoryInfo(item.category);
    return {
      name: cat.name,
      value: item.amount,
      color: cat.color,
      icon: cat.icon,
    };
  });

  const barData = last6Months.map(s => ({
    month: format(new Date(s.month + '-01'), 'MMM'),
    income: s.totalIncome,
    expense: s.totalExpense,
  }));

  const savingsRate = currentMonthSummary.totalIncome > 0 
    ? ((currentMonthSummary.netSavings / currentMonthSummary.totalIncome) * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              {format(now, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Income"
            value={`₹ ${currentMonthSummary.totalIncome.toLocaleString('en-IN')}`}
            change="+12.5%"
            changeType="positive"
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          <StatCard
            title="Total Expense"
            value={`₹ ${currentMonthSummary.totalExpense.toLocaleString('en-IN')}`}
            change="+8.2%"
            changeType="negative"
            icon={<TrendingDown className="w-6 h-6 text-white" />}
            gradient="bg-gradient-to-br from-red-500 to-rose-600"
          />
          <StatCard
            title="Net Savings"
            value={`₹ ${currentMonthSummary.netSavings.toLocaleString('en-IN')}`}
            change={`${savingsRate}% rate`}
            changeType={currentMonthSummary.netSavings >= 0 ? 'positive' : 'negative'}
            icon={<PiggyBank className="w-6 h-6 text-white" />}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          />
          <StatCard
            title="Balance"
            value={`₹ ${(currentMonthSummary.totalIncome - currentMonthSummary.totalExpense).toLocaleString('en-IN')}`}
            change={`${currentMonthSummary.transactionCount} txns`}
            changeType="neutral"
            icon={<Wallet className="w-6 h-6 text-white" />}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Expense Categories */}
          <div className="lg:col-span-1 rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Expense Breakdown</h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 font-medium">
                This Month
              </span>
            </div>
            
            {pieData.length > 0 ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`₹ ${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e4e4e7',
                          backgroundColor: 'white',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-2 mt-4">
                  {pieData.slice(0, 4).map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium">{item.icon} {item.name}</span>
                      </div>
                      <span className="text-sm font-semibold">₹ {item.value.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-zinc-500">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <TrendingDown className="w-8 h-8" />
                </div>
                <p className="text-sm">No expenses yet</p>
              </div>
            )}
          </div>

          {/* Monthly Trend */}
          <div className="lg:col-span-2 rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">6-Month Trend</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="font-medium">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="font-medium">Expense</span>
                </div>
              </div>
            </div>
            
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#71717a' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#71717a' }}
                    tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`₹ ${Number(value).toLocaleString('en-IN')}`, '']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e4e4e7',
                      backgroundColor: 'white',
                    }}
                  />
                  <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-bold text-lg">Recent Transactions</h3>
            <a href="/transactions" className="flex items-center gap-1 text-sm font-medium text-violet-600 dark:text-violet-400 hover:gap-2 transition-all">
              View all <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => {
                const cat = getCategoryInfo(tx.category);
                const isIncome = tx.amount > 0;
                
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                    onClick={() => isIncome && setSelectedTransaction(tx)}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                      isIncome 
                        ? 'bg-emerald-100 dark:bg-emerald-950/50' 
                        : 'bg-red-100 dark:bg-red-950/50'
                    }`}>
                      {cat.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{tx.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 font-medium">
                              {cat.name}
                            </span>
                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(tx.date), 'dd MMM')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <p className={`font-bold text-lg ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isIncome ? '+' : '-'}₹ {Math.abs(tx.amount).toLocaleString('en-IN')}
                          </p>
                          {isIncome && (
                            <button className="text-xs text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1 ml-auto hover:gap-1.5 transition-all">
                              <Receipt className="w-3 h-3" />
                              Receipt
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-8 h-8 text-zinc-400" />
                </div>
                <p className="font-medium mb-1">No transactions yet</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Start by adding your first transaction
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Transaction
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refresh}
      />
      
      <ReceiptModal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />
    </div>
  );
}
