import { useState } from 'react';
import {
  Wallet, Target, Briefcase, Receipt, Repeat, Hash, Search,
  ChevronRight, Sparkles, PiggyBank, CreditCard, TrendingUp, Calculator
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
import { NetWorthDashboard } from './NetWorthDashboard';
import { TaxEstimator } from './TaxEstimator';
import { AIAssistantPanel } from './AIAssistantPanel';

type Section = 'home' | 'accounts' | 'budgets' | 'goals' | 'investments' | 'debts' | 'recurring' | 'bills' | 'tags' | 'search' | 'networth' | 'tax';

export function More() {
  const [section, setSection] = useState<Section>('home');

  if (section !== 'home') {
    return (
      <div className="min-h-screen pb-24 lg:pb-8">
        <div className="max-w-[1200px] mx-auto p-4 lg:p-8">
          <button
            onClick={() => setSection('home')}
            className="mb-4 text-sm text-violet-600 dark:text-violet-400 font-medium hover:underline flex items-center gap-1"
          >
            ← Back to all features
          </button>
          {section === 'accounts' && <Accounts />}
          {section === 'budgets' && <Budgets />}
          {section === 'goals' && <Goals />}
          {section === 'investments' && <Investments />}
          {section === 'debts' && <DebtTracker />}
          {section === 'recurring' && <RecurringManager />}
          {section === 'bills' && <BillReminders />}
          {section === 'tags' && <TagManager />}
          {section === 'search' && <AdvancedSearch />}
          {section === 'networth' && <NetWorthDashboard />}
          {section === 'tax' && <TaxEstimator />}
        </div>
      </div>
    );
  }

  const features = [
    { id: 'accounts' as Section, label: 'Accounts & Wallets', desc: 'Multi-account tracking with transfers', icon: Wallet, color: 'from-blue-500 to-cyan-600', badge: 'NEW' },
    { id: 'budgets' as Section, label: 'Budgets', desc: 'Weekly, monthly, yearly caps', icon: PiggyBank, color: 'from-violet-500 to-indigo-600', badge: 'NEW' },
    { id: 'goals' as Section, label: 'Savings Goals', desc: 'Track progress towards dreams', icon: Target, color: 'from-emerald-500 to-teal-600', badge: 'NEW' },
    { id: 'investments' as Section, label: 'Investments', desc: 'Stocks, MFs, crypto, gold, FDs', icon: Briefcase, color: 'from-amber-500 to-orange-600', badge: 'NEW' },
    { id: 'debts' as Section, label: 'Debts & Loans', desc: 'EMIs, credit cards, mortgages', icon: CreditCard, color: 'from-red-500 to-rose-600', badge: 'NEW' },
    { id: 'recurring' as Section, label: 'Recurring Transactions', desc: 'Auto-add rent, salary, subscriptions', icon: Repeat, color: 'from-pink-500 to-rose-600', badge: 'NEW' },
    { id: 'bills' as Section, label: 'Bill Reminders', desc: 'Never miss a due date', icon: Receipt, color: 'from-orange-500 to-amber-600', badge: 'NEW' },
    { id: 'tags' as Section, label: 'Tags & Hashtags', desc: 'Organize with #tags', icon: Hash, color: 'from-cyan-500 to-blue-600', badge: 'NEW' },
    { id: 'search' as Section, label: 'Advanced Search', desc: 'Powerful filters & export', icon: Search, color: 'from-purple-500 to-fuchsia-600', badge: 'NEW' },
    { id: 'networth' as Section, label: 'Net Worth Dashboard', desc: 'Track assets vs liabilities', icon: TrendingUp, color: 'from-emerald-500 to-teal-600', badge: 'NEW' },
    { id: 'tax' as Section, label: 'Indian Tax Estimator', desc: 'Old vs New regime, 80C/80D', icon: Calculator, color: 'from-amber-500 to-orange-600', badge: 'NEW' },
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

        <AIAssistantPanel
          pageKey="more-home"
          title="AI Wealth & Strategy Assistant"
          context={{
            page: 'more-home',
            availableModules: features.map(f => f.label),
            featureCount: features.length,
          }}
          suggestions={[
            'Which feature should I use first?',
            'Help me build a better money system',
            'How should I plan savings, debt, and investing together?',
            'What should I track weekly vs monthly?'
          ]}
        />

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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-600 text-white">
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
