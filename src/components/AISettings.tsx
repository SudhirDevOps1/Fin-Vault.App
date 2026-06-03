import { useState, useEffect } from 'react';
import { 
  Brain, 
  Key, 
  Check, 
  Eye, 
  EyeOff, 
  Zap, 
  Trash2,
  Plus,
  AlertCircle,
  Sparkles,
  Loader2
} from 'lucide-react';
import {
  getAllProviders,
  getAIProviders,
  saveAIProvider,
  removeAIProvider,
  testProvider,
  type AIProvider,
  type AIProviderConfig
} from '@/lib/aiProviders';
import { useToast } from '@/contexts/ToastContext';

export function AISettings() {
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({} as any);
  const [testing, setTesting] = useState<AIProvider | null>(null);
  const { addToast } = useToast();

  const allProviders = getAllProviders();

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = () => {
    setProviders(getAIProviders());
  };

  const handleAddProvider = (providerId: AIProvider) => {
    const existing = providers.find(p => p.provider === providerId);
    if (existing) {
      addToast('warning', 'Provider already added');
      return;
    }

    const config = getAllProviders().find(p => p.id === providerId);
    if (!config) return;

    const newConfig: AIProviderConfig = {
      provider: providerId,
      apiKey: '',
      model: config.defaultModel,
      enabled: false
    };

    saveAIProvider(newConfig);
    loadProviders();
  };

  const updateProvider = (providerId: AIProvider, updates: Partial<AIProviderConfig>) => {
    const provider = providers.find(p => p.provider === providerId);
    if (!provider) return;

    saveAIProvider({ ...provider, ...updates });
    loadProviders();
  };

  const handleTest = async (config: AIProviderConfig) => {
    if (!config.apiKey) {
      addToast('error', 'Please enter API key first');
      return;
    }

    setTesting(config.provider);
    try {
      const result = await testProvider(config);
      if (result.valid) {
        addToast('success', `✓ ${config.provider} connected! Model: ${result.model}`);
        updateProvider(config.provider, { enabled: true });
      } else {
        addToast('error', `✗ Connection failed: ${result.error || 'Invalid API key'}`);
      }
    } catch (error) {
      addToast('error', `Test failed: ${String(error)}`);
    } finally {
      setTesting(null);
    }
  };

  const handleRemove = (providerId: AIProvider) => {
    if (confirm(`Remove ${providerId} configuration?`)) {
      removeAIProvider(providerId);
      loadProviders();
      addToast('success', 'Provider removed');
    }
  };

  const toggleKeyVisibility = (providerId: AIProvider) => {
    setShowKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const availableProviders = allProviders.filter(
    p => !providers.find(existing => existing.provider === p.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-200 dark:border-violet-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold flex items-center gap-2">
            AI Assistant Configuration
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-600 text-white">POWERED BY YOU</span>
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Add your API keys to enable natural language transaction parsing. All keys stored locally in your browser.
          </p>
        </div>
      </div>

      {/* Add Provider */}
      {availableProviders.length > 0 && (
        <div className="p-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3 mb-3">
            <Plus className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <h4 className="font-semibold">Add AI Provider</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {availableProviders.map(provider => (
              <button
                key={provider.id}
                onClick={() => handleAddProvider(provider.id)}
                className="flex items-center gap-2 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all text-left group"
              >
                <span className="text-xl">{provider.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{provider.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{provider.models.length} models</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Configured Providers */}
      <div className="space-y-4">
        {providers.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <Brain className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
            <p className="font-medium mb-1">No AI providers configured</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Add a provider above to enable natural language parsing
            </p>
          </div>
        ) : (
          providers.map(config => {
            const providerInfo = allProviders.find(p => p.id === config.provider)!;
            const isVisible = showKeys[config.provider];
            
            return (
              <div
                key={config.provider}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-2xl">
                      {providerInfo.icon}
                    </div>
                    <div>
                      <h4 className="font-bold flex items-center gap-2">
                        {providerInfo.name}
                        {config.enabled && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {providerInfo.models.length} models available
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRemove(config.provider)}
                    className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* API Key */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Key className="w-4 h-4" />
                      API Key
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={isVisible ? 'text' : 'password'}
                          value={config.apiKey}
                          onChange={(e) => updateProvider(config.provider, { apiKey: e.target.value })}
                          placeholder={`Enter ${providerInfo.name} API key`}
                          className="w-full px-4 py-3 pr-12 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => toggleKeyVisibility(config.provider)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        onClick={() => handleTest(config)}
                        disabled={!config.apiKey || testing === config.provider}
                        className="px-4 py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        {testing === config.provider ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                        Test
                      </button>
                    </div>
                  </div>

                  {/* Model Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Model</label>
                    <select
                      value={config.model || providerInfo.defaultModel}
                      onChange={(e) => updateProvider(config.provider, { model: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
                    >
                      {providerInfo.models.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>

                  {/* Enable Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div>
                      <p className="font-medium text-sm">Enable Provider</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Use this provider for natural language parsing
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={config.enabled}
                      onClick={() => updateProvider(config.provider, { enabled: !config.enabled })}
                      className={`relative inline-flex flex-shrink-0 w-[52px] h-7 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${
                        config.enabled ? 'bg-violet-600' : 'bg-zinc-300 dark:bg-zinc-600'
                      }`}
                    >
                      <span
                        className={`inline-block w-[22px] h-[22px] mt-[3px] rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                          config.enabled ? 'translate-x-[26px]' : 'translate-x-[3px]'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">How it works</p>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                Type naturally like "1200 rs mila, pen 129 ka liya". AI extracts amounts, categories, and creates transactions automatically.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">Privacy First</p>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
                Your API keys never leave your browser. Stored in localStorage only. No tracking, no analytics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Links */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <h4 className="font-semibold mb-3">Get API Keys</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {[
            { name: 'Groq', url: 'https://console.groq.com/keys', free: true },
            { name: 'Gemini', url: 'https://aistudio.google.com/app/apikey', free: true },
            { name: 'Mistral', url: 'https://console.mistral.ai/api-keys', free: false },
            { name: 'Cerebras', url: 'https://cloud.cerebras.ai', free: true },
            { name: 'OpenRouter', url: 'https://openrouter.ai/keys', free: false },
            { name: 'Together', url: 'https://api.together.xyz/settings/api-keys', free: false },
          ].map(provider => (
            <a
              key={provider.name}
              href={provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
            >
              <span className="font-medium group-hover:text-violet-600 dark:group-hover:text-violet-400">
                {provider.name}
              </span>
              {provider.free && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold">
                  FREE
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
