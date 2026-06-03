/**
 * AI Providers for Natural Language Transaction Parsing
 * Supports: Groq, Gemini, Mistral, Cerebras, OpenRouter, and more
 * All API keys stored locally in browser - never sent to our servers
 */

export type AIProvider = 
  | 'groq' 
  | 'gemini' 
  | 'mistral' 
  | 'cerebras' 
  | 'openrouter'
  | 'together'
  | 'cohere'
  | 'perplexity'
  | 'deepseek'
  | 'openai';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  enabled: boolean;
}

export interface ParsedTransaction {
  amount: number;
  description: string;
  category?: string;
  date?: string;
  type: 'income' | 'expense';
  confidence: number;
}

export interface MultiTransactionParse {
  transactions: ParsedTransaction[];
  totalIncome: number;
  totalExpense: number;
  summary: string;
}

const PROVIDER_CONFIGS: Record<AIProvider, { 
  name: string; 
  defaultModel: string; 
  baseUrl: string;
  models: string[];
  icon: string;
}> = {
  groq: {
    name: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'llama-3.2-90b-vision-preview',
      'llama-3.2-11b-vision-preview',
      'llama-3.2-3b-preview',
      'llama-3.2-1b-preview',
      'llama3-groq-70b-8192-tool-use-preview',
      'llama3-groq-8b-8192-tool-use-preview',
      'llama-guard-3-8b',
      'llama3-70b-8192',
      'llama3-8b-8192',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
      'gemma-7b-it',
      'deepseek-r1-distill-llama-70b',
      'deepseek-r1-distill-qwen-32b',
      'qwen-2.5-32b',
      'qwen-2.5-coder-32b'
    ],
    icon: '⚡'
  },
  gemini: {
    name: 'Google Gemini',
    defaultModel: 'gemini-2.0-flash-exp',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    models: [
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash-thinking-exp',
      'gemini-exp-1206',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-flash-002',
      'gemini-1.5-pro',
      'gemini-1.5-pro-002',
      'gemini-1.0-pro',
      'learnlm-1.5-pro-experimental'
    ],
    icon: '✨'
  },
  mistral: {
    name: 'Mistral AI',
    defaultModel: 'mistral-large-latest',
    baseUrl: 'https://api.mistral.ai/v1/chat/completions',
    models: [
      'mistral-large-latest',
      'mistral-large-2411',
      'mistral-small-latest',
      'mistral-small-2409',
      'pixtral-large-latest',
      'pixtral-12b-2409',
      'ministral-8b-latest',
      'ministral-3b-latest',
      'codestral-latest',
      'codestral-2405',
      'open-mistral-nemo',
      'open-mixtral-8x22b',
      'open-mixtral-8x7b',
      'open-mistral-7b'
    ],
    icon: '🌪️'
  },
  cerebras: {
    name: 'Cerebras',
    defaultModel: 'llama-3.3-70b',
    baseUrl: 'https://api.cerebras.ai/v1/chat/completions',
    models: [
      'llama-3.3-70b',
      'llama3.1-70b',
      'llama3.1-8b',
      'llama-4-scout-17b-16e-instruct',
      'llama-4-maverick-17b-128e-instruct',
      'qwen-3-32b',
      'qwen-3-235b-a22b',
      'qwen-3-coder-480b',
      'deepseek-r1-distill-llama-70b',
      'glm-4.5-air',
      'glm-4.6',
      'gpt-oss-120b',
      'gpt-oss-20b'
    ],
    icon: '🧠'
  },
  openrouter: {
    name: 'OpenRouter',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    models: [
      'meta-llama/llama-3.3-70b-instruct',
      'meta-llama/llama-3.1-70b-instruct',
      'meta-llama/llama-3.1-405b-instruct',
      'meta-llama/llama-3.2-90b-vision-instruct',
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3.5-haiku',
      'anthropic/claude-3-opus',
      'google/gemini-2.0-flash-exp:free',
      'google/gemini-flash-1.5',
      'google/gemini-pro-1.5',
      'mistralai/mistral-large',
      'mistralai/mixtral-8x22b-instruct',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'openai/o1-preview',
      'openai/o1-mini',
      'deepseek/deepseek-chat',
      'deepseek/deepseek-r1',
      'qwen/qwen-2.5-72b-instruct',
      'x-ai/grok-2-1212',
      'nvidia/llama-3.1-nemotron-70b-instruct'
    ],
    icon: '🔀'
  },
  together: {
    name: 'Together AI',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    baseUrl: 'https://api.together.xyz/v1/chat/completions',
    models: [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      'meta-llama/Llama-Vision-Free',
      'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
      'mistralai/Mixtral-8x22B-Instruct-v0.1',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'Qwen/Qwen2.5-72B-Instruct-Turbo',
      'Qwen/Qwen2.5-Coder-32B-Instruct',
      'deepseek-ai/DeepSeek-V3',
      'deepseek-ai/DeepSeek-R1',
      'databricks/dbrx-instruct',
      'google/gemma-2-27b-it'
    ],
    icon: '🤝'
  },
  cohere: {
    name: 'Cohere',
    defaultModel: 'command-r-plus-08-2024',
    baseUrl: 'https://api.cohere.ai/v1/chat',
    models: [
      'command-r-plus-08-2024',
      'command-r-plus',
      'command-r-08-2024',
      'command-r',
      'command',
      'command-light',
      'c4ai-aya-expanse-32b',
      'c4ai-aya-expanse-8b'
    ],
    icon: '🌀'
  },
  perplexity: {
    name: 'Perplexity',
    defaultModel: 'llama-3.1-sonar-large-128k-online',
    baseUrl: 'https://api.perplexity.ai/chat/completions',
    models: [
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-small-128k-online',
      'llama-3.1-sonar-huge-128k-online',
      'llama-3.1-sonar-large-128k-chat',
      'llama-3.1-sonar-small-128k-chat',
      'llama-3.1-70b-instruct',
      'llama-3.1-8b-instruct'
    ],
    icon: '🔍'
  },
  deepseek: {
    name: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    models: [
      'deepseek-chat',
      'deepseek-reasoner',
      'deepseek-coder',
      'deepseek-v3',
      'deepseek-r1'
    ],
    icon: '🌊'
  },
  openai: {
    name: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4o-2024-11-20',
      'gpt-4o-2024-08-06',
      'gpt-4o-mini-2024-07-18',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-0125',
      'o1-preview',
      'o1-mini',
      'o3-mini',
      'chatgpt-4o-latest'
    ],
    icon: '🤖'
  }
};

export function getProviderConfig(provider: AIProvider) {
  return PROVIDER_CONFIGS[provider];
}

export function getAllProviders() {
  return Object.entries(PROVIDER_CONFIGS).map(([key, config]) => ({
    id: key as AIProvider,
    ...config
  }));
}

export function getProviderModels(provider: AIProvider): string[] {
  return PROVIDER_CONFIGS[provider]?.models || [];
}

export function getFreeTierProviders(): AIProvider[] {
  return ['groq', 'gemini', 'cerebras'];
}

export function getAIProviders(): AIProviderConfig[] {
  const stored = localStorage.getItem('finvault_ai_providers');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveAIProvider(config: AIProviderConfig) {
  const providers = getAIProviders();
  const index = providers.findIndex(p => p.provider === config.provider);
  if (index >= 0) {
    providers[index] = config;
  } else {
    providers.push(config);
  }
  localStorage.setItem('finvault_ai_providers', JSON.stringify(providers));
}

export function removeAIProvider(provider: AIProvider) {
  const providers = getAIProviders().filter(p => p.provider !== provider);
  localStorage.setItem('finvault_ai_providers', JSON.stringify(providers));
}

export function getEnabledProviders(): AIProviderConfig[] {
  return getAIProviders().filter(p => p.enabled && p.apiKey);
}

export function getActiveProvider(): AIProviderConfig | null {
  const enabled = getEnabledProviders();
  return enabled.length > 0 ? enabled[0] : null;
}

export interface AIPrivacyConfig {
  safeMode: boolean;
  redactDescriptions: boolean;
  sendOnlySummary: boolean;
  storeChatLocally: boolean;
}

const AI_PRIVACY_KEY = 'finvault_ai_privacy';

export function getAIPrivacyConfig(): AIPrivacyConfig {
  const stored = localStorage.getItem(AI_PRIVACY_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as AIPrivacyConfig;
    } catch {
      // ignore parse failure
    }
  }
  return {
    safeMode: true,
    redactDescriptions: true,
    sendOnlySummary: true,
    storeChatLocally: true,
  };
}

export function saveAIPrivacyConfig(config: AIPrivacyConfig) {
  localStorage.setItem(AI_PRIVACY_KEY, JSON.stringify(config));
}

function maskAccountLikeText(input: string): string {
  return input
    .replace(/\b\d{9,18}\b/g, '[redacted-number]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/[a-z0-9._-]+@[a-z]+/gi, '[redacted-upi]')
    .replace(/\b(?:acc|a\/c|account|card|upi|txn|ref|id)\s*[:#-]?\s*[a-z0-9*_-]+/gi, '[redacted-reference]');
}

function sanitizeDescription(description: string, redactDescriptions: boolean): string {
  if (!redactDescriptions) return maskAccountLikeText(description);
  const cleaned = description
    .replace(/#[\w\u0900-\u097F]+/g, '#tag')
    .replace(/\b[A-Z][A-Z0-9.]{2,}\b/g, '[merchant]')
    .replace(/\b\d+[A-Za-z]+\b/g, '[ref]');
  return maskAccountLikeText(cleaned);
}

export function buildSafeFinanceContext<T>(input: T, config = getAIPrivacyConfig()): T {
  if (!config.safeMode) return input;

  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      Object.entries(obj).forEach(([key, val]) => {
        if (['id', 'receiptImage', 'pinHash', 'pinSalt', 'apiKey', 'authDomain', 'appId', 'messagingSenderId', 'storageBucket'].includes(key)) {
          return;
        }
        if (key === 'description' && typeof val === 'string') {
          out[key] = sanitizeDescription(val, config.redactDescriptions);
          return;
        }
        if (key === 'date' && typeof val === 'string') {
          out[key] = val.slice(0, 10);
          return;
        }
        out[key] = walk(val);
      });
      return out;
    }
    if (typeof value === 'string') return maskAccountLikeText(value);
    return value;
  };

  return walk(input) as T;
}

function buildSummaryOnlyContext(context: Record<string, unknown>) {
  const txs = Array.isArray(context.transactions) ? context.transactions as Array<Record<string, unknown>> : [];
  const income = txs.filter(t => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount || 0), 0);
  const expense = Math.abs(txs.filter(t => Number(t.amount) < 0).reduce((s, t) => s + Number(t.amount || 0), 0));
  const categories = txs.reduce<Record<string, number>>((acc, tx) => {
    const cat = String(tx.category || 'other');
    const amt = Math.abs(Number(tx.amount || 0));
    if (Number(tx.amount) < 0) acc[cat] = (acc[cat] || 0) + amt;
    return acc;
  }, {});
  return {
    transactionCount: txs.length,
    totalIncome: income,
    totalExpense: expense,
    net: income - expense,
    topExpenseCategories: Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount })),
    ...Object.fromEntries(Object.entries(context).filter(([k]) => k !== 'transactions')),
  };
}

export async function askFinanceAssistant(
  question: string,
  context: Record<string, unknown>,
  providerConfig?: AIProviderConfig
): Promise<string> {
  const privacy = getAIPrivacyConfig();
  const config = providerConfig || getActiveProvider();
  const safeContext = buildSafeFinanceContext(context, privacy);
  const finalContext = privacy.sendOnlySummary ? buildSummaryOnlyContext(safeContext) : safeContext;

  if (!config) {
    return localFinanceAssistant(question, finalContext);
  }

  const systemPrompt = `You are FinVault AI, a privacy-first personal finance assistant.
Rules:
- Never ask for or infer account numbers, card numbers, or personal identifiers.
- Work only with the provided SAFE context.
- Be concise, practical, and action-oriented.
- Output plain text only.
- If data is limited, clearly say so.
- Suggest savings, risk areas, budgeting tips, tax-awareness, and trend observations.
- Do not mention sending data anywhere.
- Respect that the app is offline-first and privacy-first.`;

  const userPrompt = `Question: ${question}\n\nSafe context JSON:\n${JSON.stringify(finalContext, null, 2)}`;

  try {
    const response = await callAIProvider(config, systemPrompt, userPrompt);
    return String(response).trim();
  } catch {
    return localFinanceAssistant(question, finalContext);
  }
}

function localFinanceAssistant(question: string, context: Record<string, unknown>): string {
  const q = question.toLowerCase();
  const income = Number(context.totalIncome || 0);
  const expense = Number(context.totalExpense || 0);
  const net = Number(context.net || income - expense);
  const count = Number(context.transactionCount || 0);
  const topCats = Array.isArray(context.topExpenseCategories) ? context.topExpenseCategories as Array<{ category: string; amount: number }> : [];
  const top = topCats[0];

  if (q.includes('saving') || q.includes('save') || q.includes('bachat')) {
    if (net <= 0) return `You are not saving right now. Focus on reducing ${top ? top.category : 'top expenses'} and set a weekly cap.`;
    const rate = income > 0 ? Math.round((net / income) * 100) : 0;
    return `You are saving ₹${net.toLocaleString('en-IN')} with an estimated savings rate of ${rate}%. To improve further, review ${top ? top.category : 'your largest expense category'} first.`;
  }

  if (q.includes('budget') || q.includes('spend') || q.includes('kharcha')) {
    return top
      ? `Your biggest expense area is ${top.category} at about ₹${Number(top.amount).toLocaleString('en-IN')}. A practical next step is to set a cap for this category and track it weekly.`
      : `Not enough spending data yet. Add more transactions and I can identify your biggest budget pressure points.`;
  }

  if (q.includes('tax')) {
    return `For tax planning, keep salary, rent, insurance, medical, and investment-related entries clearly tagged. Use the Tax Estimator in More → Indian Tax Estimator to compare old vs new regime.`;
  }

  if (q.includes('summary') || q.includes('report') || q.includes('insight')) {
    return `You have ${count} tracked transactions. Income: ₹${income.toLocaleString('en-IN')}, Expense: ₹${expense.toLocaleString('en-IN')}, Net: ₹${net.toLocaleString('en-IN')}. ${top ? `Top expense category: ${top.category}.` : ''}`;
  }

  return `Current snapshot: income ₹${income.toLocaleString('en-IN')}, expense ₹${expense.toLocaleString('en-IN')}, net ₹${net.toLocaleString('en-IN')}. ${top ? `Highest expense category is ${top.category}.` : 'Add more data for deeper insights.'}`;
}

export async function parseTransactionText(
  text: string,
  providerConfig?: AIProviderConfig
): Promise<MultiTransactionParse> {
  const config = providerConfig || getActiveProvider();
  
  if (!config) {
    return fallbackParse(text);
  }

  const systemPrompt = `You are a financial transaction parser. Extract transactions from user text.

Rules:
1. Positive amounts = income, Negative amounts = expense
2. Return JSON with: transactions[], totalIncome, totalExpense, summary
3. Each transaction: {amount, description, category, type, confidence}
4. Categories: food, transport, shopping, bills, health, entertainment, education, rent, groceries, salary, freelance, investment, gift, other-income, other-expense
5. Handle complex scenarios: "1200 rs mila jisme se 129 ka pen liya aur 459 ka book" → Income 1200, Expenses 129+459
6. Dates: default today unless specified
7. Amounts can be in: rs, ₹, rupees, INR

Examples:
Input: "1200 rs mila jisme se 129 ka pen liya aur 459 ka book"
Output: {
  "transactions": [
    {"amount": 1200, "description": "Money received", "category": "other-income", "type": "income", "confidence": 0.9},
    {"amount": -129, "description": "Pen purchase", "category": "education", "type": "expense", "confidence": 0.85},
    {"amount": -459, "description": "Book purchase", "category": "education", "type": "expense", "confidence": 0.85}
  ],
  "totalIncome": 1200,
  "totalExpense": 588,
  "summary": "Received ₹1200, spent ₹588 (pen ₹129 + book ₹459), saved ₹612"
}

Return ONLY valid JSON, no markdown, no explanation.`;

  try {
    const response = await callAIProvider(config, systemPrompt, text);
    const parsed = JSON.parse(response);
    
    return {
      transactions: parsed.transactions.map((t: any) => ({
        amount: Number(t.amount),
        description: t.description || 'Transaction',
        category: t.category || (t.amount > 0 ? 'other-income' : 'other-expense'),
        type: t.amount > 0 ? 'income' : 'expense',
        confidence: t.confidence || 0.8,
        date: new Date().toISOString()
      })),
      totalIncome: parsed.totalIncome || 0,
      totalExpense: parsed.totalExpense || 0,
      summary: parsed.summary || ''
    };
  } catch (error) {
    console.error('AI parsing failed:', error);
    return fallbackParse(text);
  }
}

async function callAIProvider(
  config: AIProviderConfig,
  systemPrompt: string,
  userText: string
): Promise<string> {
  const providerInfo = PROVIDER_CONFIGS[config.provider];
  const model = config.model || providerInfo.defaultModel;

  if (config.provider === 'gemini') {
    const url = `${providerInfo.baseUrl}/${model}:generateContent?key=${config.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\nUser input: ${userText}` }]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
      })
    });
    
    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  if (config.provider === 'cohere') {
    const response = await fetch(providerInfo.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userText,
        preamble: systemPrompt,
        model,
        temperature: 0.1
      })
    });
    
    if (!response.ok) throw new Error(`Cohere API error: ${response.status}`);
    const data = await response.json();
    return data.text;
  }

  const response = await fetch(config.baseUrl || providerInfo.baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      ...(config.provider === 'openrouter' ? {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'FinVault'
      } : {})
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${providerInfo.name} API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * ═══════════════════════════════════════════════════
 *  ADVANCED MULTI-TRANSACTION NLP PARSER
 *  Supports: Hindi, English, Hinglish
 *  Pattern: "1200 rs mila jisme se 129 ka pen liya aur 459 ka book"
 * ═══════════════════════════════════════════════════
 */

// ── Income keywords (Hindi + English) ──
const INCOME_KW = [
  'mila','mile','milye','mili','received','credited','salary','income',
  'earned','got','aya','aaya','aaye','aai','deposit','jama','bonus',
  'refund','cashback','return','paisa aaya','paise aaye','payment received',
  'freelance','commission','dividend','prize','reward','stipend','allowance',
  'pocket money','ghr se','ghar se','papa se','mummy se','bhai se',
  'dost se','friend se'
];

// ── Expense keywords (Hindi + English) ──
const EXPENSE_KW = [
  'liya','li','liye','paid','spent','kharcha','kharche','bought','purchase',
  'diya','diye','di','gaya','gayi','gaye','kharida','kharide','kharidi',
  'bill','pay kiya','bheja','sent','transfer','withdrawn','nikala','nikale',
  'nikali','udhar','loan','emi','installment','fees','charge','shopping',
  'order kiya','ordered','subscribe','donation','tip','fine','penalty',
  'lagaya','lagaye','lagayi','invest kiya','bhara','bhare','bharti'
];

// ── Nested / sub-expense pattern keywords ──
const NESTED_KW = [
  'jisme se','jis me se','jismein se','jis mein se','mein se','me se',
  'usme se','usmein se','us mein se','isme se','ismein se','is mein se',
  'out of which','from which','from that','of which','se nikala'
];

function fallbackParse(text: string): MultiTransactionParse {
  const transactions: ParsedTransaction[] = [];
  let totalIncome = 0;
  let totalExpense = 0;

  // ─ Step 1: Try nested pattern first ("X mila jisme se Y ka Z liya aur …") ─
  const nestedResult = parseNestedPattern(text);
  if (nestedResult.length > 0) {
    transactions.push(...nestedResult);
  } else {
    // ─ Step 2: Split by conjunctions and parse each segment ─
    const segments = splitByConjunctions(text);
    if (segments.length > 1) {
      segments.forEach(seg => {
        const parsed = parseSegment(seg.text, seg.fullText);
        if (parsed) transactions.push(parsed);
      });
    } else {
      // ─ Step 3: Simple amount extraction ─
      const simple = parseSimpleAmounts(text);
      transactions.push(...simple);
    }
  }

  // Aggregate totals
  transactions.forEach(tx => {
    if (tx.amount > 0) totalIncome += tx.amount;
    else totalExpense += Math.abs(tx.amount);
  });

  const net = totalIncome - totalExpense;
  let summary = '';
  if (transactions.length > 0) {
    const parts = [];
    if (totalIncome > 0) parts.push(`Income: +₹${totalIncome.toLocaleString('en-IN')}`);
    if (totalExpense > 0) parts.push(`Expense: -₹${totalExpense.toLocaleString('en-IN')}`);
    if (totalIncome > 0 && totalExpense > 0) parts.push(`Net: ₹${net.toLocaleString('en-IN')}`);
    summary = `${transactions.length} transaction(s) found • ${parts.join(' • ')}`;
  } else {
    summary = 'Koi transaction nahi mila. Try: "1200 rs mila, 500 ka kharcha"';
  }

  return { transactions, totalIncome, totalExpense, summary };
}

// ═══ Split by Hindi/English conjunctions ═══
function splitByConjunctions(text: string): Array<{text: string, fullText: string}> {
  // Split on: aur, and, phir, then, fir, uske baad, comma, semicolon, +
  // But NOT on "jisme se" type patterns (those are nested)
  const pattern = /\s*(?:,\s*|\s+aur\s+|\s+and\s+|\s+phir\s+|\s+then\s+|\s+fir\s+|\s+uske\s+baad\s+|\s*;\s*)\s*/gi;
  const parts = text.split(pattern).filter(p => p.trim().length > 0);
  return parts.map(part => ({ text: part.trim(), fullText: text }));
}

// ═══ Nested pattern: "1200 rs mila jisme se 129 ka pen liya aur 459 ka book" ═══
function parseNestedPattern(text: string): ParsedTransaction[] {
  const txns: ParsedTransaction[] = [];
  const lower = text.toLowerCase();

  // Check if text contains a nested keyword
  const hasNested = NESTED_KW.some(kw => lower.includes(kw));
  if (!hasNested) return [];

  // Extract the main income amount (before "jisme se")
  const incomeMatch = text.match(/(\d[\d,]*\.?\d*)\s*(?:rs\.?|₹|rupees?)?\s+(.{0,30}?)(?:jisme|jis\s*me|usme|isme|out\s+of|from)/i);
  if (!incomeMatch && !text.match(/(\d[\d,]*\.?\d*)/)) return [];

  if (incomeMatch) {
    const amt = parseFloat(incomeMatch[1].replace(/,/g, ''));
    const ctx = incomeMatch[2].trim();
    const desc = cleanDescription(ctx) || 'Paisa mila';
    txns.push({
      amount: amt,
      description: desc,
      category: guessCategory(desc, true),
      type: 'income',
      confidence: 0.85
    });
  }

  // Find the part after "jisme se" and extract sub-expenses
  let afterNested = lower;
  for (const kw of NESTED_KW) {
    const idx = lower.indexOf(kw);
    if (idx !== -1) {
      afterNested = text.slice(idx + kw.length);
      break;
    }
  }

  // Split the "after" part by "aur/and/," to get individual expenses
  const expenseParts = afterNested.split(/\s*(?:aur|and|,)\s*/gi).filter(p => p.trim());

  for (const part of expenseParts) {
    // Try patterns: "129 ka pen", "pen 129 rs", "129 rs pen liya", etc.
    const m1 = part.match(/(\d[\d,]*\.?\d*)\s*(?:rs\.?|₹|rupees?)?\s*(?:ka|ki|ke|wala|wali)?\s*(.+)/i);
    const m2 = part.match(/(.+?)\s+(\d[\d,]*\.?\d*)\s*(?:rs\.?|₹|rupees?)?/i);
    
    let amount = 0;
    let itemName = '';
    
    if (m1) {
      amount = parseFloat(m1[1].replace(/,/g, ''));
      itemName = m1[2].trim();
    } else if (m2) {
      amount = parseFloat(m2[2].replace(/,/g, ''));
      itemName = m2[1].trim();
    } else {
      const numMatch = part.match(/(\d[\d,]*\.?\d*)/);
      if (numMatch) {
        amount = parseFloat(numMatch[1].replace(/,/g, ''));
        itemName = part.replace(numMatch[0], '').trim();
      }
    }

    if (amount > 0) {
      const desc = cleanDescription(itemName) || `Item (₹${amount})`;
      txns.push({
        amount: -amount,
        description: desc,
        category: guessCategory(desc, false),
        type: 'expense',
        confidence: 0.8
      });
    }
  }

  return txns;
}

// ═══ Parse simple amounts with context ═══
function parseSimpleAmounts(text: string): ParsedTransaction[] {
  const txns: ParsedTransaction[] = [];
  // Match: +500, -200, ₹300, 500 rs, rs 500 etc.
  const regex = /([+-])?\s*(?:rs\.?|₹|rupees?|inr)?\s*(\d[\d,]*\.?\d*)\s*(?:rs\.?|₹|rupees?|inr)?/gi;
  const matches = [...text.matchAll(regex)];
  
  if (matches.length === 0) return [];

  const lower = text.toLowerCase();
  const hasIncomeGlobal = INCOME_KW.some(k => lower.includes(k));
  const hasExpenseGlobal = EXPENSE_KW.some(k => lower.includes(k));

  matches.forEach((match, idx) => {
    const sign = match[1];
    const amount = parseFloat(match[2].replace(/,/g, ''));
    if (amount === 0) return;
    
    // Determine income/expense
    let isIncome: boolean;
    if (sign === '+') isIncome = true;
    else if (sign === '-') isIncome = false;
    else {
      // Check nearby context (30 chars around)
      const start = Math.max(0, (match.index || 0) - 40);
      const end = Math.min(text.length, (match.index || 0) + match[0].length + 40);
      const nearby = text.slice(start, end).toLowerCase();
      
      const nearbyIncome = INCOME_KW.some(k => nearby.includes(k));
      const nearbyExpense = EXPENSE_KW.some(k => nearby.includes(k));
      
      if (nearbyIncome && !nearbyExpense) isIncome = true;
      else if (nearbyExpense && !nearbyIncome) isIncome = false;
      else if (idx === 0 && hasIncomeGlobal && !hasExpenseGlobal) isIncome = true;
      else if (hasExpenseGlobal && !hasIncomeGlobal) isIncome = false;
      else isIncome = false; // default to expense if ambiguous
    }

    const nearby = text.slice(
      Math.max(0, (match.index || 0) - 20),
      Math.min(text.length, (match.index || 0) + match[0].length + 25)
    );
    const desc = cleanDescription(nearby) || (isIncome ? 'Income' : 'Expense');

    txns.push({
      amount: isIncome ? amount : -amount,
      description: desc,
      category: guessCategory(desc, isIncome),
      type: isIncome ? 'income' : 'expense',
      confidence: sign ? 0.9 : 0.65
    });
  });

  return txns;
}

// ═══ Parse a single segment ═══
function parseSegment(segText: string, fullText: string): ParsedTransaction | null {
  const numMatch = segText.match(/(\d[\d,]*\.?\d*)/);
  if (!numMatch) return null;

  const amount = parseFloat(numMatch[1].replace(/,/g, ''));
  if (amount === 0) return null;

  const lowerSeg = segText.toLowerCase();
  const lowerFull = fullText.toLowerCase();

  const segHasIncome = INCOME_KW.some(k => lowerSeg.includes(k));
  const segHasExpense = EXPENSE_KW.some(k => lowerSeg.includes(k));

  // If segment itself says expense → expense
  // If segment says income → income
  // If ambiguous, check global text
  let isIncome: boolean;
  if (segHasExpense && !segHasIncome) isIncome = false;
  else if (segHasIncome && !segHasExpense) isIncome = true;
  else {
    // Default: if full text has income keywords, first seg might be income
    const fullIncome = INCOME_KW.some(k => lowerFull.includes(k));
    isIncome = fullIncome && !segHasExpense;
  }

  const desc = cleanDescription(segText) || (isIncome ? 'Income' : 'Expense');

  return {
    amount: isIncome ? amount : -amount,
    description: desc,
    category: guessCategory(desc, isIncome),
    type: isIncome ? 'income' : 'expense',
    confidence: 0.7
  };
}

// ═══ Smart Category Detection ═══
function guessCategory(text: string, isIncome: boolean): string {
  if (isIncome) {
    const l = text.toLowerCase();
    if (l.match(/salary|tankhwa|naukri/)) return 'salary';
    if (l.match(/freelance|project|gig|client/)) return 'freelance';
    if (l.match(/invest|dividend|mutual|stock|share|fd|interest/)) return 'investment';
    if (l.match(/gift|tohfa|reward|prize|inam|shagun/)) return 'gift';
    return 'other-income';
  }
  return categorizeItem(text);
}

function categorizeItem(text: string): string {
  const l = text.toLowerCase();
  if (l.match(/pen|pencil|book|notebook|stationery|school|college|education|padhai|tuition|exam|copy|register|study/)) return 'education';
  if (l.match(/food|khana|restaurant|hotel|dinner|lunch|breakfast|chai|coffee|nashta|biryani|pizza|burger|snack|tiffin|mess|canteen|dhaba|swiggy|zomato/)) return 'food';
  if (l.match(/bus|train|auto|taxi|cab|petrol|diesel|fuel|transport|uber|ola|metro|rickshaw|flight|ticket|parking|toll/)) return 'transport';
  if (l.match(/medicine|doctor|hospital|health|dawai|medical|pharmacy|clinic|test|checkup|dentist|tablet|injection|ointment/)) return 'health';
  if (l.match(/cloth|shirt|pant|dress|shopping|kapda|shoes|jeans|tshirt|kurta|saree|watch|bag|accessories|amazon|flipkart|myntra/)) return 'shopping';
  if (l.match(/rent|kiraya|ghar|house|room|pg|hostel|flat|apartment/)) return 'rent';
  if (l.match(/bill|electricity|water|gas|recharge|mobile|phone|internet|wifi|broadband|dth|subscription|netflix|spotify|ott/)) return 'bills';
  if (l.match(/movie|entertainment|game|cinema|theatre|concert|party|outing|picnic|trip|tour|travel|holiday/)) return 'entertainment';
  if (l.match(/grocery|sabzi|vegetables|fruits|ration|kirana|atta|dal|chawal|rice|oil|doodh|milk|bread|egg|anda|masala|sugar|namak/)) return 'groceries';
  return 'other-expense';
}

// ═══ Clean description text ═══
function cleanDescription(text: string): string {
  return text
    .replace(/\d[\d,]*\.?\d*/g, '')       // remove numbers
    .replace(/rs\.?|₹|inr|rupees?/gi, '') // remove currency
    .replace(/\b(ka|ki|ke|se|ne|ko|me|mein|pe|par|liya|li|liye|kiya|ki|kiye|diya|di|diye|mila|mile|paid|spent|bought|got|received|aya)\b/gi, '') // remove common stop words
    .replace(/[^\w\s\u0900-\u097F]/g, ' ') // keep alphanumeric + Hindi chars
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60) || '';
}

export async function testProvider(config: AIProviderConfig): Promise<{ valid: boolean; error?: string; model?: string }> {
  try {
    const providerInfo = PROVIDER_CONFIGS[config.provider];
    const model = config.model || providerInfo.defaultModel;
    
    if (config.provider === 'gemini') {
      const url = `${providerInfo.baseUrl}/${model}?key=${config.apiKey}`;
      const response = await fetch(url);
      return { valid: response.ok, model };
    }
    
    const response = await fetch(config.baseUrl || providerInfo.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      })
    });
    
    return { valid: response.ok, model };
  } catch (error) {
    return { valid: false, error: String(error) };
  }
}
