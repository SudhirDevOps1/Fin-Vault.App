import type { ReactNode } from 'react';

interface Props {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: ReactNode;
  gradient: string;
}

export function StatCard({ title, value, change, changeType = 'neutral', icon, gradient }: Props) {
  const changeColors = {
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-zinc-600 dark:text-zinc-400',
  };

  return (
    <div className="group relative overflow-hidden rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-black/50 transition-all duration-300">
      {/* Gradient Background */}
      <div className={`absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity ${gradient}`} />
      
      {/* Content */}
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-2xl ${gradient} shadow-lg`}>
            {icon}
          </div>
          {change && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 ${changeColors[changeType]}`}>
              {change}
            </span>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}
