import { useState } from 'react';
import {
  Wallet, Target, Briefcase, Receipt, Repeat, Hash, Search,
  ChevronRight, Sparkles, PiggyBank, CreditCard, FileSpreadsheet,
  TrendingUp, Calculator, IndianRupee
} from 'lucide-react';
import { Accounts } from './Accounts';
import { Budgets } from './Budgets';
import { Goals } from './Goals';
import { Investments } from './Investments';
import { DebtTracker } from './DebtTracker';
import { RecurringManager } from './RecurringManager';
import { BillReminders } from './BillReminders';
import { TagManager } from './TagManager';
import { AdvancedSearch } from './AdvancedSearch';
import { BankCSVImport } from './BankCSVImport';
import { NetWorth } from './NetWorth';
import { TaxEstimator } from './TaxEstimator';
import { EMICalculator } from './EMICalculator';

type Section = 'home' | 'accounts' | 'budgets' | 'goals' | 'investments' | 'debts'
  | 'recurring' | 'bills' | 'tags' | 'search' | 'csv' | 'networth' | 'tax' | 'emi';

const COMPONENTS: Record<Exclude<Section, 'home'>, React.FC> = {
  accounts: Accounts,
  budgets: Budgets,
  goals: Goals,
  investments: Investments,
  debts: DebtTracker,
  recurring: RecurringManager,
  bills: BillReminders,
  tags: TagManager,
  search: AdvancedSearch,
  csv: BankCSVImport,
  networth: NetWorth,
  tax: TaxEstimator,
  emi: EMICalculator,
};

export function More() {
  const [section, setSection] = useState<Section>('home');

  if (section !== 'home') {
    const Component = COMPONENTS[section];
    return (
      <div className="min-h-screen pb-24 lg:pb-8">
        <div className="max-w-[1200px] mx-auto p-4 lg:p-8">
          <button
            onClick={() => setSection('home')}
            className="mb-4 text-sm text-violet-600 dark:text-violet-400 font-medium hover:underline flex items-center gap-1"
          >
            ← Back to all features
          </button>
          <Component />
        </div>
      </div>
    );
  }

  const features: { id: Section; label: string; desc: string; icon: any; color: string; badge?: string }[] = [
    { id: 'csv', label: 'Bank CSV Import', desc: 'HDFC, SBI, ICICI, Axis auto-detect', icon: FileSpreadsheet, color: 'from-blue-500 to-cyan-600', badge: '🔥 HOT' },
    { id: 'networth', label: 'Net Worth Dashboard', desc: 'Assets vs Liabilities + trend chart', icon: TrendingUp, color: 'from-violet-500 to-purple-600', badge: '🔥 HOT' },
    { id: 'tax', label: 'Indian Tax Estimator', desc: 'Old vs New regime, 80C/80D deductions', icon: IndianRupee, color: 'from-orange-500 to-red-600', badge: '🔥 HOT' },
    { id: 'emi', label: 'EMI Calculator', desc: 'Loan EMI with amortization schedule', icon: Calculator, color: 'from-emerald-500 to-teal-600', badge: '🔥 HOT' },
    { id: 'accounts', label: 'Accounts & Wallets', desc: 'Multi-account tracking with transfers', icon: Wallet, color: 'from-blue-500 to-indigo-600' },
    { id: 'budgets', label: 'Budgets', desc: 'Weekly, monthly, yearly spending caps', icon: PiggyBank, color: 'from-violet-500 to-indigo-600' },
    { id: 'goals', label: 'Savings Goals', desc: 'Track progress towards your dreams', icon: Target, color: 'from-emerald-500 to-teal-600' },
    { id: 'investments', label: 'Investments', desc: 'Stocks, MFs, crypto, gold, FDs', icon: Briefcase, color: 'from-amber-500 to-orange-600' },
    { id: 'debts', label: 'Debts & Loans', desc: 'EMIs, credit cards, mortgages', icon: CreditCard, color: 'from-red-500 to-rose-600' },
    { id: 'recurring', label: 'Recurring Transactions', desc: 'Auto-add rent, salary, subscriptions', icon: Repeat, color: 'from-pink-500 to-rose-600' },
    { id: 'bills', label: 'Bill Reminders', desc: 'Never miss a due date', icon: Receipt, color: 'from-orange-500 to-amber-600' },
    { id: 'tags', label: 'Tags & Hashtags', desc: 'Organize with #tags', icon: Hash, color: 'from-cyan-500 to-blue-600' },
    { id: 'search', label: 'Advanced Search', desc: 'Powerful filters & export', icon: Search, color: 'from-purple-500 to-fuchsia-600' },
  ];

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <div className="max-w-[1200px] mx-auto p-4 lg:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">More Features</h1>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">Advanced tools for complete financial management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => {
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                onClick={() => setSection(f.id)}
                className="group relative p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg transition-all text-left overflow-hidden"
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br ${f.color}`} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {f.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base mb-1">{f.label}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">{f.desc}</p>
                  <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 text-sm font-semibold">
                    Open <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
