import { useState, useEffect } from 'react';
import { 
  Lock,
  Cloud,
  Download,
  Upload,
  Trash2,
  Shield,
  Database,
  Moon,
  Sun,
  Monitor,
  AlertTriangle,
  Eye,
  EyeOff,
  Target,
  Cpu,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { AISettings } from '@/components/AISettings';
import { AIEngineConsole } from '@/components/AIEngineConsole';
import { AIPrivacySettings } from '@/components/AIPrivacySettings';
import { FirebaseSyncEngine } from '@/components/FirebaseSyncEngine';
import { CategoryLimits } from '@/components/CategoryLimits';
import type { AppSettings, ExportData } from '@/types';
import { format } from 'date-fns';

type SettingsTab = 'general' | 'privacy' | 'caps' | 'firebase' | 'ai';

const tabs = [
  { id: 'general' as SettingsTab, label: 'General Preferences', icon: Sliders, color: 'violet' },
  { id: 'privacy' as SettingsTab, label: 'Privacy & Lock PIN', icon: Shield, color: 'emerald' },
  { id: 'caps' as SettingsTab, label: 'Cap Limits & Categories', icon: Target, color: 'orange' },
  { id: 'firebase' as SettingsTab, label: 'Firebase Cloud Sync', icon: Cloud, color: 'blue' },
  { id: 'ai' as SettingsTab, label: 'AI Engine & Auto-Detect', icon: Cpu, color: 'purple' },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const { resetPin, isPinSet } = useAuth();
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await db.getSettings();
    setSettings(s);
  };

  const handleChangePin = async () => {
    if (newPin.length < 4) {
      addToast('error', 'PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      addToast('error', 'PINs do not match');
      return;
    }
    
    const { hashPin, generateSalt } = await import('@/lib/crypto');
    const salt = generateSalt();
    const hash = hashPin(newPin, salt);
    
    await db.updateSettings({ pinHash: hash, pinSalt: salt });
    addToast('success', 'PIN changed successfully');
    setNewPin('');
    setConfirmPin('');
  };

  const handleResetPin = async () => {
    if (confirm('Are you sure? This will remove PIN protection.')) {
      await resetPin();
      addToast('success', 'PIN removed');
      await loadSettings();
    }
  };

  const handleExportData = async () => {
    const data: ExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      transactions: await db.transactions.toArray(),
      categories: await db.categories.toArray(),
      settings: await db.getSettings(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finvault-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Backup downloaded');
  };

  const handleImportData = async () => {
    if (!importFile) return;

    try {
      const text = await importFile.text();
      const data: ExportData = JSON.parse(text);

      if (confirm(`Import ${data.transactions.length} transactions? This will merge with existing data.`)) {
        await db.transactions.bulkPut(data.transactions);
        addToast('success', `Imported ${data.transactions.length} transactions`);
        setImportFile(null);
      }
    } catch (error) {
      addToast('error', 'Invalid backup file');
    }
  };

  const handleClearData = async () => {
    if (confirm('⚠️ DANGER: This will delete ALL your transactions. This cannot be undone. Type "DELETE" to confirm.')) {
      const confirmation = prompt('Type "DELETE" to confirm:');
      if (confirmation === 'DELETE') {
        await db.transactions.clear();
        addToast('success', 'All data cleared');
      }
    }
  };

  if (!settings) return null;

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings System</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Manage your privacy, data, AI engines, and cloud sync
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar Tabs */}
          <aside className="lg:sticky lg:top-8 lg:self-start space-y-1">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                      isActive
                        ? `bg-${tab.color}-100 dark:bg-${tab.color}-950/50 text-${tab.color}-700 dark:text-${tab.color}-400`
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                    style={isActive ? {
                      background: tab.color === 'violet' ? 'rgba(139,92,246,0.1)' :
                                  tab.color === 'emerald' ? 'rgba(16,185,129,0.1)' :
                                  tab.color === 'orange' ? 'rgba(249,115,22,0.1)' :
                                  tab.color === 'blue' ? 'rgba(59,130,246,0.1)' :
                                  'rgba(168,85,247,0.1)',
                      color: tab.color === 'violet' ? '#7c3aed' :
                             tab.color === 'emerald' ? '#059669' :
                             tab.color === 'orange' ? '#ea580c' :
                             tab.color === 'blue' ? '#2563eb' :
                             '#9333ea'
                    } : {}}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{tab.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>

            {/* Quick Info */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <span className="text-sm">💎</span>
                </div>
                <div>
                  <p className="text-sm font-bold">FinVault</p>
                  <p className="text-xs text-zinc-500">v1.0.0</p>
                </div>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                100% Offline • Open Source • Zero Tracking. Your data stays with you.
              </p>
            </div>
          </aside>

          {/* Content Area */}
          <main className="space-y-6">
            {/* GENERAL PREFERENCES */}
            {activeTab === 'general' && (
              <>
                <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">Appearance</h2>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Customize how FinVault looks</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Monitor },
                    ].map(item => (
                      <button
                        key={item.value}
                        onClick={() => setTheme(item.value as any)}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          theme === item.value
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                        }`}
                      >
                        <item.icon className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-sm font-medium">{item.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data Management */}
                <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
                      <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">Data Management</h2>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Backup, restore, and export</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={handleExportData}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-all text-left group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Download className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <p className="font-semibold">Export Backup</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Download all data as JSON</p>
                      </div>
                    </button>

                    <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-semibold">Import Backup</p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">Restore from JSON file</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        className="w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-violet-600 file:text-white file:text-sm file:font-medium hover:file:bg-violet-700 file:cursor-pointer"
                      />
                      {importFile && (
                        <button
                          onClick={handleImportData}
                          className="mt-2 w-full px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                        >
                          Import {importFile.name}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-900 dark:text-red-100 mb-1">Danger Zone</p>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                          Permanently delete all transactions. This action cannot be undone.
                        </p>
                        <button
                          onClick={handleClearData}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Clear All Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* PRIVACY & LOCK PIN */}
            {activeTab === 'privacy' && (
              <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Security & Privacy</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Protect your financial data</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                      <div>
                        <p className="font-medium">PIN Protection</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {isPinSet ? 'Enabled • Data encrypted locally' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isPinSet 
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                    }`}>
                      {isPinSet ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium">Change PIN</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          type={showNewPin ? 'text' : 'password'}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="New PIN (4-6 digits)"
                          className="w-full px-4 py-3 pr-12 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPin(!showNewPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <input
                        type={showNewPin ? 'text' : 'password'}
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Confirm new PIN"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleChangePin}
                        disabled={!newPin || !confirmPin}
                        className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Update PIN
                      </button>
                      {isPinSet && (
                        <button
                          onClick={handleResetPin}
                          className="px-4 py-2 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          Remove PIN
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CAP LIMITS & CATEGORIES */}
            {activeTab === 'caps' && (
              <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                <CategoryLimits />
              </div>
            )}

            {/* FIREBASE CLOUD SYNC */}
            {activeTab === 'firebase' && (
              <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                <FirebaseSyncEngine />
              </div>
            )}

            {/* AI ENGINE & AUTO-DETECT */}
            {activeTab === 'ai' && (
              <>
                <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                  <AIPrivacySettings />
                </div>
                <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                  <AIEngineConsole />
                </div>
                <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                  <AISettings />
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
