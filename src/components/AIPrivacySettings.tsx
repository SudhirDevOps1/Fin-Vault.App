import { useState } from 'react';
import { Shield, Lock, EyeOff, Database, FileWarning } from 'lucide-react';
import { getAIPrivacyConfig, saveAIPrivacyConfig, type AIPrivacyConfig } from '@/lib/aiProviders';
import { useToast } from '@/contexts/ToastContext';
import { Toggle } from '@/components/Toggle';

export function AIPrivacySettings() {
  const [config, setConfig] = useState<AIPrivacyConfig>(getAIPrivacyConfig());
  const { addToast } = useToast();

  const update = (patch: Partial<AIPrivacyConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    saveAIPrivacyConfig(next);
    addToast('success', 'AI privacy settings updated');
  };

  const rows = [
    {
      key: 'safeMode' as const,
      title: 'Safe Mode',
      desc: 'Redact sensitive references before any AI request.',
      icon: Shield,
    },
    {
      key: 'redactDescriptions' as const,
      title: 'Redact Descriptions',
      desc: 'Mask merchant-like text, tags, references, and account-like strings.',
      icon: EyeOff,
    },
    {
      key: 'sendOnlySummary' as const,
      title: 'Send Summary Only',
      desc: 'Share aggregated totals and top categories instead of detailed transaction lists.',
      icon: FileWarning,
    },
    {
      key: 'storeChatLocally' as const,
      title: 'Store AI Chat Locally',
      desc: 'Keep assistant chat history only in this browser. Turn off for no local history.',
      icon: Database,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center flex-shrink-0">
          <Lock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold">AI Privacy Shield</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            FinVault never auto-sends your data. AI runs only when you explicitly ask. These controls decide how much context gets shared.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.key} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{row.title}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{row.desc}</p>
                </div>
              </div>
              <Toggle checked={config[row.key]} onChange={(checked) => update({ [row.key]: checked } as Partial<AIPrivacyConfig>)} />
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
        <strong className="text-zinc-900 dark:text-zinc-100">Recommended for production:</strong> keep all 4 options enabled.
      </div>
    </div>
  );
}
