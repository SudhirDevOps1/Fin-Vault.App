import { useState } from 'react';
import { Sparkles, Loader2, CheckCircle, AlertCircle, Zap, Brain, Wand2 } from 'lucide-react';
import { parseTransactionText, getActiveProvider, getEnabledProviders } from '@/lib/aiProviders';
import { useToast } from '@/contexts/ToastContext';
import type { MultiTransactionParse } from '@/lib/aiProviders';

interface Props {
  onTransactionsParsed: (parsed: MultiTransactionParse) => void;
  onClose?: () => void;
}

export function AINaturalInput({ onTransactionsParsed, onClose }: Props) {
  const [input, setInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<MultiTransactionParse | null>(null);
  const { addToast } = useToast();

  const activeProvider = getActiveProvider();
  const enabledProviders = getEnabledProviders();

  const examples = [
    '1200 rs mila jisme se 129 ka pen liya aur 459 ka book',
    'salary 45000 credited, rent 12000 paid, groceries 3500',
    '+5000 freelance payment, -200 coffee, -1500 shopping',
    'Got 10000 from dad, spent 2500 on books and 800 on food'
  ];

  const handleParse = async () => {
    if (!input.trim()) {
      addToast('error', 'Please enter transaction text');
      return;
    }

    setParsing(true);
    try {
      const parsed = await parseTransactionText(input);
      setResult(parsed);
      
      if (parsed.transactions.length === 0) {
        addToast('warning', 'No transactions found. Try being more specific.');
      } else {
        addToast('success', `Parsed ${parsed.transactions.length} transactions!`);
      }
    } catch (error) {
      addToast('error', 'Failed to parse. Check your API key or try simpler format.');
      console.error(error);
    } finally {
      setParsing(false);
    }
  };

  const handleApply = () => {
    if (result && result.transactions.length > 0) {
      onTransactionsParsed(result);
      setInput('');
      setResult(null);
      onClose?.();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-200 dark:border-violet-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold flex items-center gap-2">
            AI Natural Language Input
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-600 text-white font-semibold">BETA</span>
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
            Type naturally in Hindi/English. AI will extract transactions automatically.
          </p>
          {activeProvider ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-medium">
                <Zap className="w-3 h-3" />
                {activeProvider.provider.toUpperCase()} Active
              </div>
              <span className="text-xs text-zinc-500">
                {enabledProviders.length} provider{enabledProviders.length > 1 ? 's' : ''} configured
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-medium mt-2 w-fit">
              <AlertCircle className="w-3 h-3" />
              No AI configured • Using basic parser
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., 1200 rs mila jisme se 129 ka pen liya aur 459 ka book..."
          className="w-full h-32 px-4 py-3 rounded-2xl border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none transition-all"
          disabled={parsing}
        />
        
        {/* Examples */}
        <div className="mt-3">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => setInput(ex)}
                className="text-xs px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-left"
              >
                "{ex.slice(0, 40)}..."
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Parse Button */}
      <button
        onClick={handleParse}
        disabled={parsing || !input.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {parsing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Parsing with AI...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5" />
            Parse Transactions
          </>
        )}
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
          {/* Summary */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium mb-2">Parsed Successfully</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{result.summary}</p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Income: <strong>₹{result.totalIncome.toLocaleString('en-IN')}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Expense: <strong>₹{result.totalExpense.toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {result.transactions.map((tx, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  tx.type === 'income'
                    ? 'bg-emerald-100 dark:bg-emerald-950/50'
                    : 'bg-red-100 dark:bg-red-950/50'
                }`}>
                  {tx.type === 'income' ? '💰' : '💸'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                      {tx.category}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {Math.round(tx.confidence * 100)}% confident
                    </span>
                  </div>
                </div>
                <div className={`font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {tx.type === 'income' ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setResult(null)}
              className="flex-1 px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Add {result.transactions.length} Transactions
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-900 dark:text-blue-100 leading-relaxed">
          <strong>Pro tip:</strong> Configure AI providers in Settings → AI Assistant for better accuracy. 
          Supports Hindi, English, and Hinglish. Your API keys stay in your browser only.
        </p>
      </div>
    </div>
  );
}
