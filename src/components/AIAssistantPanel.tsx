import { useMemo, useState } from 'react';
import { Brain, Shield, Sparkles, Send, Loader2, Trash2, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { askFinanceAssistant, getAIPrivacyConfig, getActiveProvider } from '@/lib/aiProviders';
import { useToast } from '@/contexts/ToastContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface Props {
  title?: string;
  pageKey: string;
  context: Record<string, unknown>;
  suggestions?: string[];
}

const chatStorageKey = (pageKey: string) => `finvault_ai_chat_${pageKey}`;

export function AIAssistantPanel({
  title = 'AI Assistant',
  pageKey,
  context,
  suggestions = [],
}: Props) {
  const privacy = getAIPrivacyConfig();
  const provider = getActiveProvider();
  const [expanded, setExpanded] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (!privacy.storeChatLocally) return [];
    const stored = localStorage.getItem(chatStorageKey(pageKey));
    if (!stored) return [];
    try { return JSON.parse(stored) as ChatMessage[]; } catch { return []; }
  });
  const { addToast } = useToast();

  const safeInfo = useMemo(() => ({
    safeMode: privacy.safeMode,
    summaryOnly: privacy.sendOnlySummary,
    provider: provider?.provider || 'offline-local',
  }), [privacy, provider]);

  const persistMessages = (next: ChatMessage[]) => {
    setMessages(next);
    if (privacy.storeChatLocally) {
      localStorage.setItem(chatStorageKey(pageKey), JSON.stringify(next));
    }
  };

  const ask = async (prompt: string) => {
    if (!prompt.trim()) return;
    const next = [...messages, { role: 'user', text: prompt } as ChatMessage];
    persistMessages(next);
    setQuestion('');
    setExpanded(true);
    setLoading(true);
    try {
      const answer = await askFinanceAssistant(prompt, context);
      persistMessages([...next, { role: 'assistant', text: answer }]);
    } catch {
      addToast('error', 'AI response failed');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    localStorage.removeItem(chatStorageKey(pageKey));
    setMessages([]);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold flex items-center gap-2">
              {title}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-bold">
                {provider ? provider.provider.toUpperCase() : 'LOCAL'}
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
              <Shield className="w-3.5 h-3.5" />
              {safeInfo.safeMode ? 'Safe mode on' : 'Safe mode off'} • {safeInfo.summaryOnly ? 'Summary only' : 'Detailed context'}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
      </button>

      {expanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 space-y-4 animate-fade-in">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <Lock className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-emerald-900 dark:text-emerald-100 leading-relaxed">
              AI is never called automatically here. It only runs when you click a suggestion or send a prompt. In safe mode, IDs, account-like text, receipt images, and sensitive references are redacted.
            </p>
          </div>

          {suggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 mb-2">Quick prompts</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="text-xs px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
            {messages.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-500">
                Ask for insights, savings tips, spending summary, risk areas, budget suggestions, or tax prep advice.
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 ml-6'
                      : 'bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 mr-6'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-1 text-zinc-500">
                    {m.role === 'user' ? 'You' : 'Assistant'}
                  </p>
                  <p>{m.text}</p>
                </div>
              ))
            )}
            {loading && (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 mr-6 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking safely...
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), ask(question))}
              placeholder="Ask for insights..."
              className="flex-1 px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none text-sm"
            />
            <button
              onClick={() => ask(question)}
              disabled={!question.trim() || loading}
              className="px-3 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
            <button
              onClick={clearChat}
              className="px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              title="Clear local chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <Sparkles className="w-3.5 h-3.5" />
            Provider: <span className="font-semibold">{safeInfo.provider}</span> • Chat stored locally: <span className="font-semibold">{privacy.storeChatLocally ? 'Yes' : 'No'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
