import { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Settings,
  Globe,
  Shield,
  Sparkles,
  Activity,
  Cpu,
  Wifi,
  WifiOff,
  AlertTriangle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import {
  getAllProviders,
  getAIProviders,
  saveAIProvider,
  testProvider,
  getActiveProvider,
  type AIProvider,
  type AIProviderConfig
} from '@/lib/aiProviders';
import { useToast } from '@/contexts/ToastContext';

interface ProviderStatus {
  provider: AIProvider;
  status: 'idle' | 'testing' | 'online' | 'offline' | 'error';
  latency?: number;
  model?: string;
  error?: string;
  lastChecked?: string;
}

export function AIEngineConsole() {
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [statuses, setStatuses] = useState<Record<AIProvider, ProviderStatus>>({} as any);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<AIProvider | null>(null);
  const [preferredEngine, setPreferredEngine] = useState<AIProvider | 'auto' | 'offline'>('auto');
  const { addToast } = useToast();

  const allProviders = getAllProviders();
  const activeProvider = getActiveProvider();

  useEffect(() => {
    loadProviders();
    loadPreferredEngine();
    initializeStatuses();
  }, []);

  const loadProviders = () => {
    setProviders(getAIProviders());
  };

  const loadPreferredEngine = () => {
    const saved = localStorage.getItem('finvault_preferred_engine');
    if (saved) setPreferredEngine(saved as any);
  };

  const savePreferredEngine = (engine: AIProvider | 'auto' | 'offline') => {
    setPreferredEngine(engine);
    localStorage.setItem('finvault_preferred_engine', engine);
    addToast('success', `Preferred engine set to: ${engine === 'auto' ? 'Auto-Detect' : engine === 'offline' ? 'Offline Mode' : engine}`);
  };

  const initializeStatuses = () => {
    const initial: Record<AIProvider, ProviderStatus> = {} as any;
    allProviders.forEach(p => {
      initial[p.id] = { provider: p.id, status: 'idle' };
    });
    setStatuses(initial);
  };

  const handleAutoDetect = async () => {
    setAutoDetecting(true);
    addToast('info', '🔍 Scanning all AI providers...');

    const configuredProviders = providers.filter(p => p.apiKey);
    
    if (configuredProviders.length === 0) {
      addToast('warning', 'No API keys configured. Add keys first.');
      setAutoDetecting(false);
      return;
    }

    for (const config of configuredProviders) {
      setStatuses(prev => ({
        ...prev,
        [config.provider]: { provider: config.provider, status: 'testing' }
      }));

      const startTime = Date.now();
      
      try {
        const result = await testProvider(config);
        const latency = Date.now() - startTime;

        setStatuses(prev => ({
          ...prev,
          [config.provider]: {
            provider: config.provider,
            status: result.valid ? 'online' : 'offline',
            latency,
            model: result.model,
            error: result.error,
            lastChecked: new Date().toISOString()
          }
        }));

        if (result.valid) {
          // Auto-enable working provider
          saveAIProvider({ ...config, enabled: true });
        }
      } catch (error) {
        setStatuses(prev => ({
          ...prev,
          [config.provider]: {
            provider: config.provider,
            status: 'error',
            error: String(error),
            lastChecked: new Date().toISOString()
          }
        }));
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    loadProviders();
    setAutoDetecting(false);
    
    const onlineCount = Object.values(statuses).filter(s => s.status === 'online').length;
    addToast('success', `✅ Auto-detect complete! ${onlineCount} provider(s) online`);
  };

  const testSingleProvider = async (providerId: AIProvider) => {
    const config = providers.find(p => p.provider === providerId);
    if (!config?.apiKey) {
      addToast('error', 'Please add API key first');
      return;
    }

    setStatuses(prev => ({
      ...prev,
      [providerId]: { provider: providerId, status: 'testing' }
    }));

    const startTime = Date.now();
    
    try {
      const result = await testProvider(config);
      const latency = Date.now() - startTime;

      setStatuses(prev => ({
        ...prev,
        [providerId]: {
          provider: providerId,
          status: result.valid ? 'online' : 'offline',
          latency,
          model: result.model,
          error: result.error,
          lastChecked: new Date().toISOString()
        }
      }));

      if (result.valid) {
        addToast('success', `✓ ${providerId} is online (${latency}ms)`);
      } else {
        addToast('error', `✗ ${providerId} failed: ${result.error}`);
      }
    } catch (error) {
      setStatuses(prev => ({
        ...prev,
        [providerId]: {
          provider: providerId,
          status: 'error',
          error: String(error),
          lastChecked: new Date().toISOString()
        }
      }));
      addToast('error', `Test failed: ${String(error)}`);
    }
  };

  const getStatusIcon = (status: ProviderStatus['status']) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'offline': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'testing': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Activity className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getStatusColor = (status: ProviderStatus['status']) => {
    switch (status) {
      case 'online': return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
      case 'offline': return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'testing': return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'error': return 'border-amber-500 bg-amber-50 dark:bg-amber-950/20';
      default: return 'border-zinc-300 dark:border-zinc-700';
    }
  };

  const onlineProviders = Object.values(statuses).filter(s => s.status === 'online').length;
  const totalConfigured = providers.filter(p => p.apiKey).length;

  return (
    <div className="space-y-6">
      {/* Header Console */}
      <div className="rounded-[20px] border-2 border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-500/5 to-indigo-500/5 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                Multi-AI Engine Console
                <span className="text-xs px-2.5 py-1 rounded-full bg-violet-600 text-white font-bold">LIVE</span>
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                Real-time provider diagnostics & auto-detection
              </p>
            </div>
          </div>
          
          <button
            onClick={handleAutoDetect}
            disabled={autoDetecting || totalConfigured === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/25"
          >
            {autoDetecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Auto-Detect Working Keys
              </>
            )}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Providers</span>
            </div>
            <p className="text-2xl font-bold">{allProviders.length}</p>
            <p className="text-xs text-zinc-500">Available</p>
          </div>
          
          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Configured</span>
            </div>
            <p className="text-2xl font-bold">{totalConfigured}</p>
            <p className="text-xs text-zinc-500">With API keys</p>
          </div>
          
          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-1">
              <Wifi className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Online</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{onlineProviders}</p>
            <p className="text-xs text-zinc-500">Active now</p>
          </div>
          
          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Active</span>
            </div>
            <p className="text-lg font-bold truncate">
              {activeProvider ? activeProvider.provider.toUpperCase() : 'OFFLINE'}
            </p>
            <p className="text-xs text-zinc-500">Current engine</p>
          </div>
        </div>
      </div>

      {/* Preferred Engine Override */}
      <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-zinc-600" />
          <h4 className="font-bold">Preferred Engine Override</h4>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { id: 'auto', label: 'Auto-Detect', icon: Zap, desc: 'Best available' },
            { id: 'offline', label: 'Offline Mode', icon: WifiOff, desc: 'Deterministic' },
            ...providers.filter(p => p.enabled).map(p => ({
              id: p.provider,
              label: p.provider.toUpperCase(),
              icon: Brain,
              desc: p.model?.split('/').pop() || 'Default'
            }))
          ].map(option => (
            <button
              key={option.id}
              onClick={() => savePreferredEngine(option.id as any)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                preferredEngine === option.id
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
              }`}
            >
              <option.icon className={`w-5 h-5 mb-1 ${preferredEngine === option.id ? 'text-violet-600' : 'text-zinc-500'}`} />
              <p className="font-semibold text-sm">{option.label}</p>
              <p className="text-xs text-zinc-500 truncate">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Provider Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Provider Diagnostics Matrix
          </h4>
          <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 font-medium">
            {providers.filter(p => p.apiKey).length} configured
          </span>
        </div>

        {providers.filter(p => p.apiKey).length === 0 ? (
          <div className="p-8 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-center">
            <Brain className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
            <p className="font-medium mb-1">No providers configured</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Add API keys in the AI Assistant section above
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {providers.filter(p => p.apiKey).map(config => {
              const providerInfo = allProviders.find(p => p.id === config.provider)!;
              const status = statuses[config.provider] || { status: 'idle' };
              const isExpanded = expandedProvider === config.provider;

              return (
                <div
                  key={config.provider}
                  className={`rounded-2xl border-2 transition-all ${getStatusColor(status.status)}`}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedProvider(isExpanded ? null : config.provider)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-2xl">
                          {providerInfo.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold">{providerInfo.name}</h5>
                            {getStatusIcon(status.status)}
                            {config.enabled && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                                ENABLED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                              {config.model || providerInfo.defaultModel}
                            </span>
                            {status.latency && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">
                                {status.latency}ms
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            testSingleProvider(config.provider);
                          }}
                          disabled={status.status === 'testing'}
                          className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          {status.status === 'testing' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-zinc-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-zinc-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-2 bg-white/50 dark:bg-zinc-900/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Model Selection */}
                        <div>
                          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                            SELECT MODEL
                          </label>
                          <select
                            value={config.model || providerInfo.defaultModel}
                            onChange={(e) => {
                              saveAIProvider({ ...config, model: e.target.value });
                              loadProviders();
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                          >
                            {providerInfo.models.map(model => (
                              <option key={model} value={model}>
                                {model}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Status Details */}
                        <div>
                          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">
                            DIAGNOSTIC INFO
                          </label>
                          <div className="space-y-1.5 text-xs font-mono">
                            <div className="flex justify-between p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                              <span className="text-zinc-600 dark:text-zinc-400">Status:</span>
                              <span className="font-bold uppercase">{status.status}</span>
                            </div>
                            {status.lastChecked && (
                              <div className="flex justify-between p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                <span className="text-zinc-600 dark:text-zinc-400">Last Check:</span>
                                <span>{new Date(status.lastChecked).toLocaleTimeString()}</span>
                              </div>
                            )}
                            {status.error && (
                              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                                {status.error}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Free Tier Info */}
                      {['groq', 'gemini', 'cerebras'].includes(config.provider) && (
                        <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <p className="text-xs text-emerald-900 dark:text-emerald-100">
                            <strong>FREE TIER AVAILABLE</strong> • No credit card required • Generous limits
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Advanced Parser Info */}
      <div className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold mb-2">Advanced Multi-Transaction Parser</h4>
            <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              <p>
                <strong className="text-zinc-900 dark:text-zinc-100">Complex NLP Mode:</strong> When AI is active, sentences like 
                <code className="mx-1 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-xs">"1200 rs mila jisme se 129 ka pen liya aur 459 ka book"</code>
                are automatically split into 3 transactions with smart categorization.
              </p>
              <p>
                <strong className="text-zinc-900 dark:text-zinc-100">Deterministic Fallback:</strong> Offline mode uses Hindi/English conjunction splitting 
                (<code className="mx-1 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-xs">aur, and, jisme se, jis me se</code>) 
                to segment complex sentences without AI.
              </p>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                { pattern: 'aur / and', desc: 'Splits multiple items' },
                { pattern: 'jisme se / jis me se', desc: 'Nested expenses' },
                { pattern: '+ / - signs', desc: 'Explicit income/expense' }
              ].map(item => (
                <div key={item.pattern} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                  <p className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400">{item.pattern}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
