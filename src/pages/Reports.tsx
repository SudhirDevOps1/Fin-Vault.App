import { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Filter
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useTransactions } from '@/hooks/useTransactions';
import { db } from '@/lib/db';
import type { Category } from '@/types';
import { AIAssistantPanel } from '@/components/AIAssistantPanel';

export function Reports() {
  const { transactions, getCategoryBreakdown } = useTransactions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    db.categories.toArray().then(setCategories);
  }, []);

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || { name: categoryId, icon: '📌', color: '#6366f1' };
  };

  // Monthly data for selected year
  const monthlyData = useMemo(() => {
    const data = [];
    for (let month = 1; month <= 12; month++) {
      const monthTxs = transactions.filter(tx => {
        const date = new Date(tx.date);
        return date.getFullYear() === selectedYear && date.getMonth() + 1 === month;
      });
      
      const income = monthTxs.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
      const expense = Math.abs(monthTxs.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0));
      
      data.push({
        month: format(new Date(selectedYear, month - 1), 'MMM'),
        income,
        expense,
        savings: income - expense,
      });
    }
    return data;
  }, [transactions, selectedYear]);

  // Category breakdown for selected month
  const categoryData = useMemo(() => {
    const breakdown = getCategoryBreakdown(selectedYear, selectedMonth);
    return breakdown.map(item => {
      const cat = getCategoryInfo(item.category);
      return {
        name: cat.name,
        value: item.amount,
        color: cat.color,
        icon: cat.icon,
      };
    });
  }, [selectedYear, selectedMonth, getCategoryBreakdown, categories]);

  // Daily spending for selected month
  const dailyData = useMemo(() => {
    const start = startOfMonth(new Date(selectedYear, selectedMonth - 1));
    const end = endOfMonth(new Date(selectedYear, selectedMonth - 1));
    const days = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayTxs = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.toDateString() === d.toDateString();
      });
      
      const expense = Math.abs(dayTxs.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0));
      const income = dayTxs.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
      
      days.push({
        day: format(d, 'dd'),
        expense,
        income,
      });
    }
    
    return days;
  }, [transactions, selectedYear, selectedMonth]);

  const totalYearIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
  const totalYearExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0);
  const totalYearSavings = totalYearIncome - totalYearExpense;
  const avgMonthlySavings = totalYearSavings / 12;

  const years = Array.from(new Set(transactions.map(tx => new Date(tx.date).getFullYear()))).sort((a, b) => b - a);
  if (years.length === 0) years.push(new Date().getFullYear());

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Deep insights into your financial habits
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium focus:ring-2 focus:ring-violet-500 outline-none"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium focus:ring-2 focus:ring-violet-500 outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {format(new Date(2024, i), 'MMMM')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Year Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 opacity-80" />
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/20">Year</span>
            </div>
            <p className="text-sm opacity-90 mb-1">Total Income</p>
            <p className="text-2xl font-bold">₹ {totalYearIncome.toLocaleString('en-IN')}</p>
          </div>
          
          <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-red-500 to-rose-600 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-6 h-6 opacity-80" />
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/20">Year</span>
            </div>
            <p className="text-sm opacity-90 mb-1">Total Expense</p>
            <p className="text-2xl font-bold">₹ {totalYearExpense.toLocaleString('en-IN')}</p>
          </div>
          
          <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-6 h-6 opacity-80" />
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/20">Net</span>
            </div>
            <p className="text-sm opacity-90 mb-1">Total Savings</p>
            <p className="text-2xl font-bold">₹ {totalYearSavings.toLocaleString('en-IN')}</p>
          </div>
          
          <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-2">
              <Filter className="w-6 h-6 text-zinc-400" />
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">Avg</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Monthly Savings</p>
            <p className="text-2xl font-bold">₹ {avgMonthlySavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trend */}
          <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h3 className="font-bold text-lg mb-6">Monthly Income vs Expense</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: any) => [`₹ ${Number(value).toLocaleString('en-IN')}`, '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expenseGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Savings Trend */}
          <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h3 className="font-bold text-lg mb-6">Monthly Savings Trend</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: any) => [`₹ ${Number(value).toLocaleString('en-IN')}`, 'Savings']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="savings" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <AIAssistantPanel
          pageKey="reports"
          title="AI Report Analyst"
          context={{
            page: 'reports',
            selectedYear,
            selectedMonth,
            monthlyData,
            categoryData,
            dailyData: dailyData.slice(0, 31),
            totalIncome: totalYearIncome,
            totalExpense: totalYearExpense,
            net: totalYearSavings,
          }}
          suggestions={[
            'Explain my yearly trend',
            'Which categories need attention?',
            'Summarize this month in simple words',
            'Give me 3 practical actions for next month'
          ]}
        />

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Pie */}
          <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h3 className="font-bold text-lg mb-6">
              {format(new Date(selectedYear, selectedMonth - 1), 'MMMM')} Expenses
            </h3>
            {categoryData.length > 0 ? (
              <>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`₹ ${Number(value).toLocaleString('en-IN')}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4 max-h-[200px] overflow-y-auto">
                  {categoryData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.icon} {item.name}</span>
                      </div>
                      <span className="font-semibold">₹ {item.value.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[340px] flex items-center justify-center text-zinc-500">
                <p className="text-sm">No expenses this month</p>
              </div>
            )}
          </div>

          {/* Daily Spending */}
          <div className="lg:col-span-2 rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h3 className="font-bold text-lg mb-6">
              Daily Spending - {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')}
            </h3>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} interval={2} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    formatter={(value: any) => [`₹ ${Number(value).toLocaleString('en-IN')}`, '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7' }}
                  />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
