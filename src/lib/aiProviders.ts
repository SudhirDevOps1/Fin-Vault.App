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
      'qwen-2.5-coder-32b',
      'qwen-qwq-32b',
      'allam-2-7b'
    ],
    icon: '⚡'
  },
  gemini: {
    name: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash-preview-05-20',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    models: [
      'gemini-2.5-flash-preview-05-20',
      'gemini-2.5-pro-preview-05-06',
      'gemini-2.5-flash-preview-04-17',
      'gemini-2.5-pro-preview-03-25',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash-thinking-exp-01-21',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest',
      'gemini-exp-1206',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-flash-002',
      'gemini-1.5-pro',
      'gemini-1.5-pro-002',
      'gemini-1.0-pro',
      'learnlm-1.5-pro-experimental',
      'gemma-3-27b-it',
      'gemma-3-12b-it',
      'gemma-3-4b-it',
      'gemma-3-1b-it',
      'gemini-2.5-flash-preview-04-17',
      'gemini-2.5-pro-exp-03-25'
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
      'deepseek-chat-v3-0324',
      'deepseek-reasoner',
      'deepseek-r1-0528',
      'deepseek-coder'
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
      'gpt-4.1-nano',
      'gpt-4.1-mini',
      'gpt-4.1',
      'gpt-4o-2024-11-20',
      'gpt-4o-mini-2024-07-18',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'o1',
      'o1-mini',
      'o3-mini',
      'o4-mini',
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

// ═══ Finance-scope gate: keep AI only about money ═══
const FINANCE_TERMS = [
  // English - core
  'saving','save','savings','budget','budgeting','budgeted','expense','spending',
  'income','salary','wage','wages','earn','earned','earning','earnings',
  'money','cash','fund','funds','rupee','rupees','dollar','dollars','pound','pounds',
  'invest','investing','investment','investor','stock','stocks','share','shares',
  'equity','bond','bonds','mutual','sip','elss','fd','fixed deposit','ppf','nps','epf',
  'tax','taxes','taxable','taxation','tds','gst','rebate','deduction','exemption',
  'debt','loan','loans','lend','lender','borrow','borrowed','emi','instalment',
  'credit','debit','card','cards','bill','bills','invoice','due','overdue','payment',
  'finance','financial','financially','finances','net worth','wealth','rich','poor',
  'goal','goals','target','targets','objective','aim','plan','planning',
  'track','tracker','tracking','monitor','monitoring','record','records','records',
  'report','reports','summary','insight','insights','analysis','analyze',
  'trend','trends','pattern','patterns','spend','spent','spends',
  'receipt','receipts','invoice','invoices','bill','bills','category','categories',
  'month','monthly','year','yearly','annual','quarter','quarterly','weekly','daily',
  'review','reviews','strategy','strategies','advice','recommendation','recommendations',
  'reduce','reducing','cut','cutting','lower','lowering','shrink','shrinkage',
  'grow','growing','growth','increase','increasing','raise','raising',
  'manage','managing','management','control','controlling','optimize','optimizing',
  'balance','total','net','surplus','deficit','profit','loss','gain','gains',
  'biggest','largest','highest','lowest','smallest','top','bottom',
  'compound','compounding','interest','dividend','dividends','yield','returns',
  'inflation','deflation','recession','economy','economic','gdp','cpi',
  'crypto','cryptocurrency','bitcoin','ethereum','blockchain','nft',
  'gold','silver','platinum','commodity','commodities','futures','options',
  'wallet','wallets','cashback','reward','rewards','miles','points',
  'afford','affordable','expensive','cheap','costly','price','prices','pricing',
  'pay','paid','paying','spend','spent','spending','purchase','purchased','buying',
  'rent','rental','lease','mortgage','home loan','car loan','personal loan','education loan',
  'insurance','premium','premiums','cover','coverage','claim','claims',
  'atm','withdraw','withdrawal','transfer','transferred','send','sent','receive','received',
  'remit','remittance','wire','neft','imps','rtgs','upi','ach',
  'overdraft','limit','limits','cap','caps','ceiling','threshold','budget cap',
  'save up','cut back','pay off','clear off','wipe off','knock off','settle','pay back',
  'interest rate','rate of return','apr','apy','emi rate','tenure','principal',
  'deadline','maturity','mature','matured','due date','pay date','maturity date',
  'festive','festival','bonus','13th month','appraisal','increment',
  // Hindi / Hinglish - core
  'bachat','bachat karna','bachaya','bachaye','jama','jama karna','jama kiya',
  'kharcha','kharch','kharchi','kharcho','kharcha karna','kharch kiya','kharch ki',
  'paisa','paise','paiso','rupay','rupaye','rupiya','rupaiya','dhan','daulat','sampatti',
  'tankhwah','tankhwa','vetan','salary','kamaai','kamai','kamaya','kamayi',
  'kharid','kharidna','kharidi','kharida','kharide','kharido','kharid liya','kharid lena',
  'mil gaya','milgaya','mile','mil','mila','mili','milne','mil gaya','prapt','prapti','prapti hui',
  'aaya','aaye','aai','aayi','aayaa','aayea','prapt hua','pata','pataya',
  'liya','li','liye','lena','lene','leliya','leliye','khareed liya','khareed li',
  'diya','di','diye','dene','dediya','dediye','bhugtan','bhugat','bhugat karna',
  'udhar','udhaar','karz','karod','rin','rin mukti','karz se aazaad',
  'emi','emi bhar raha','emi bhar','emi bhar rahi','installment',
  'kar','kar bharo','kar bharna','karo','karte','karna','karte hain','karta hoon','karta hu',
  'bill','bijli','bijli ka bill','water bill','gas bill','recharge','mobile recharge',
  'rent','kiraya','kiraye','ghar ka kiraya','kamra kiraya',
  'padhai','padhaai','school','school fees','school ki fees','tuition',
  'daactar','doctor','davai','dawai','ilaj','medicine','medical','hospital','test','report',
  'doodh','milk','sabzi','sabzi-mandi','kiraana','kirana','ration','daal','chawal','aata','atta',
  'chai','coffee','nashta','lunch','dinner','khana','food','mess','tiffin','tiffin tiffin',
  'tax','tax bharo','tax bharna','tax bachao','tax saving','kar bachat','kar bachana',
  'invest','nivesh','nivesh karna','nivesh karein','sip chalao','sip karo',
  'bank','bank account','bank balance','account','khata','khaata',
  'atm','atm se','atm se nikala','cash nikala','cash nikaalna','cash nikal',
  'salary','pension','stipend','khaarcha','aamdani','income aayi',
  'udaar','credit card','shopping','shop','store','dukaan','market','bazaar',
  'festive','tyohaar','festival','shadi','shaadi','wedding','birthday',
  'ghar','ghar banana','house','home','property','plot','flat','apartment',
  'car','gadi','gaadi','vehicle','bike','motorcycle','scooty','auto',
  'savings','bachat','jama','deposit','fd','fdr','mutual fund','mf',
  'maine liya','maine kharida','maine diya','maine kharcha kiya','maine bheja',
  'usne diya','usne bheja','uska','uski','mujhe mila','mujhe prapt','mujhe aaya',
  'papa se','papa se mila','papa se aaya','mummy se','mummy se mila','bhai se','behen se',
  'dost se','dost ne diya','dosto se','ghar se','ghar se aaya',
  'office se','office se mila','company se','company se aaya','client se',
  // Common finance verbs
  'mila','mile','mili','mil','aaya','aaye','aai','aayi','liya','li','liye',
  'diya','di','diye','dene','bheja','bhej','bheji','bheje','kharida','kharid',
  'bhar raha','bhar rahi','bhar diya','bhar di','bhar diye','bharna','bhar dijiye',
  'kat gaya','kat gaye','kat','kate','kata','katna','gaya','gayi','gaye',
  'rakha','rakhi','rakhe','rakhna','rakh diya','rakh','bachaya','bacha liya',
  'udhar liya','udhar diya','karz liya','karz diya','rin liya','rin diya',
  'pay kiya','pay kar diya','pay ki','pay karna','pay karein','pay karo',
  'kat raha','kat rahi','kat rahe','kat','dikh raha','dikh rahi','lag raha','lag rahi',
  'aur','and','phir','fir','uske baad','iske baad','baad mein','fir se','dobara',
  'jisme se','jis me se','jismein se','jis mein se','mein se','me se','isme se','ismein se',
  'aur bhi','aur kitna','kitna','kitne','kahan','kab','kaise','kyun','kyon',
  'maine','tumne','usne','aapne','humne','unko','unki','iska','iski','iska',
  'hoga','hogi','hoge','hota','hoti','hote','hona','hone','hona hai','karna hai',
  'kar diya','kar di','kar diye','kar denge','kar do','kar de','karna padega',
];

function isFinanceRelated(prompt: string): boolean {
  const lower = prompt.toLowerCase().trim();
  // Very short generic queries: accept if they contain finance keywords
  if (lower.split(/\s+/).length < 4) {
    return FINANCE_TERMS.some(t => lower.includes(t));
  }
  // For longer queries, accept if at least one finance keyword matches
  return FINANCE_TERMS.some(t => lower.includes(t));
}

function rejectNonFinance(originalQuestion: string): string {
  const short = originalQuestion.length > 60 ? originalQuestion.slice(0, 60) + '...' : originalQuestion;
  return `🙏 I'm FinVault's finance-only assistant. I can help you with:
• Budgeting, saving, and expense tracking
• Investment planning and portfolio insights
• Tax estimation and deduction strategies
• Debt management and EMI planning
• Spending analysis and category breakdowns
• Financial goal setting and progress tracking

Your question about "${short}" is outside my scope. Ask me anything about your money! 💰`;
}

export async function askFinanceAssistant(
  question: string,
  context: Record<string, unknown>,
  providerConfig?: AIProviderConfig
): Promise<string> {
  // Gate: reject non-finance questions upfront
  if (!isFinanceRelated(question)) {
    return rejectNonFinance(question);
  }

  const privacy = getAIPrivacyConfig();
  const config = providerConfig || getActiveProvider();
  const safeContext = buildSafeFinanceContext(context, privacy);
  const finalContext = privacy.sendOnlySummary ? buildSummaryOnlyContext(safeContext) : safeContext;

  // If NO provider configured, use local fallback (clearly indicate so)
  if (!config) {
    return localFinanceAssistant(question, finalContext);
  }

  const systemPrompt = `You are FinVault AI, a STRICT personal finance assistant built into an offline-first personal finance tracker app called FinVault.

CRITICAL SCOPE RULES:
- You ONLY answer questions about: personal finance, budgeting, saving money, expense tracking, investing, debt management, tax planning (Indian context), financial literacy, spending patterns, money management.
- If the user asks about ANY non-finance topic (coding, jokes, recipes, weather, general knowledge, philosophy, relationships, health, etc.), you MUST politely refuse and redirect to finance topics.
- Even if the question seems harmless but is unrelated to personal finance, refuse it.
- Never discuss anything outside the domain of personal finance management.

LANGUAGE RULE (VERY IMPORTANT):
- Respond in the SAME LANGUAGE as the user's question.
- If the user writes in Hindi, reply in Hindi.
- If the user writes in English, reply in English.
- If the user writes in Hinglish (mix of Hindi and English), reply in Hinglish.
- Use natural, conversational language that matches the user's style.
- Never reply in English when the user asked in Hindi.

PRIVACY RULES:
- Never ask for or infer account numbers, card numbers, or personal identifiers.
- Work only with the provided SAFE context.
- Be concise, practical, and action-oriented.
- Output plain text only (no markdown, no bullet lists with special characters that could break formatting).
- If data is limited, clearly say so.
- Do NOT mention sending data anywhere.
- Respect that the app is offline-first and privacy-first.

RESPONSE STYLE:
- Short, actionable, friendly.
- Use ₹ (Indian Rupees) when talking about money.
- Suggest specific features in FinVault when relevant (e.g., "Use the Tax Estimator in More → Indian Tax Estimator").
- Focus on practical next steps.
- Do NOT wrap your answer in code blocks or quotes.`;

  const userPrompt = `Question: ${question}\n\nSafe context (JSON):\n${JSON.stringify(finalContext, null, 2)}`;

  try {
    const response = await callAIProvider(config, systemPrompt, userPrompt);
    let text = String(response).trim();
    // Strip code fences and JSON wrappers from newer models
    text = stripModelWrapper(text);
    if (text) return text;
    throw new Error('Empty response');
  } catch (err) {
    console.warn('[FinVault] Online AI failed, using local fallback:', err);
    return localFinanceAssistant(question, finalContext);
  }
}

// Strip ```json ... ``` or stray markdown from newer models
function stripModelWrapper(text: string): string {
  let t = text.trim();
  // Remove leading ```json / ```json\n etc.
  t = t.replace(/^```(?:json|JSON)?\s*/i, '');
  t = t.replace(/```\s*$/i, '');
  // If the entire content is a JSON object, try to extract its "answer"/"text"/"response" key
  if (t.startsWith('{') && t.endsWith('}')) {
    try {
      const obj = JSON.parse(t);
      const candidate = obj.answer || obj.text || obj.response || obj.content || obj.message;
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    } catch {
      // not JSON, fall through
    }
  }
  return t;
}

function localFinanceAssistant(question: string, context: Record<string, unknown>): string {
  // Gate non-finance even in offline mode
  if (!isFinanceRelated(question)) {
    return rejectNonFinance(question);
  }

  const q = question.toLowerCase();
  const income = Number(context.totalIncome || 0);
  const expense = Number(context.totalExpense || 0);
  const net = Number(context.net || income - expense);
  const count = Number(context.transactionCount || 0);
  const topCats: Array<{ category: string; amount: number }> = Array.isArray(context.topExpenseCategories)
    ? (context.topExpenseCategories as Array<{ category: string; amount: number }>)
    : [];
  const top = topCats[0];
  const second = topCats[1];
  const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;
  const monthlyData: any[] = Array.isArray(context.monthlyData) ? context.monthlyData as any[] : [];

  // Detect language for response
  const isHindi = /[\u0900-\u097F]/.test(question);
  const isHinglish = isHindi && /[a-zA-Z]/.test(question);
  const lang = isHindi ? (isHinglish ? 'hinglish' : 'hindi') : 'english';

  const respond = (hindi: string, english: string, hinglish?: string): string => {
    if (lang === 'hindi') return hindi;
    if (lang === 'hinglish' && hinglish) return hinglish;
    return english;
  };

  // ─ Saving-focused questions ─
  if (q.includes('saving') || q.includes('save') || q.includes('bachat') || q.includes('jama') || q.includes('bachaye')) {
    if (income === 0) {
      return respond(
        'Pehle kuch income transactions add karo. Abhi tak ${count} transactions tracked hain. Salary, freelancing ya pocket money add karo.',
        `Add a few income transactions to get a savings snapshot. You have ${count} transactions tracked so far. Try logging salary, freelancing, or pocket money received.`,
        `Pehle income add karo, phir savings ka snapshot dikhaunga. Abhi ${count} transactions hain.`
      );
    }
    if (net <= 0) {
      return respond(
        `Aapka kharcha (₹${expense.toLocaleString('en-IN')}) income (₹${income.toLocaleString('en-IN')}) se zyada ho raha hai. Sabse bada leak: ${top ? top.category : 'unknown'}. Ise 20% kam karo aur har mahine salary aane ke din alag savings account mein auto-transfer set karo.`,
        `Your spending (₹${expense.toLocaleString('en-IN')}) has matched or exceeded your income (₹${income.toLocaleString('en-IN')}). Top leak: ${top ? top.category : 'unknown'}. Cut this category by 20% and auto-transfer the saved amount to a separate savings account on day-1 of every month.`,
        `Kharcha income se zyada ho raha hai. Sabse bada kharcha ${top ? top.category : 'unknown'} hai. Ise kam karo aur auto-transfer set karo.`
      );
    }
    return respond(
      `Aap ₹${net.toLocaleString('en-IN')} (${savingsRate}%) bacha rahe hain. Behtar karne ke liye: (1) sabse pehle ${top ? top.category : 'top category'} ko cap karo, (2) 50/30/20 rule try karo (needs/wants/savings), (3) salary aane ke din auto-transfer set karo. 20%+ savings rate ka target rakho.`,
      `You are saving ₹${net.toLocaleString('en-IN')} (${savingsRate}% of income). To improve: (1) cap ${top ? top.category : 'your top category'} first, (2) try a 50/30/20 split (needs/wants/savings), (3) automate a transfer the day salary lands. Aim for 20%+ savings rate.`,
      `Aap ${savingsRate}% bacha rahe hain. Top category ko cap karo, 50/30/20 rule try karo aur salary day pe auto-transfer set karo.`
    );
  }

  // ─ Budget / spending ─
  if (q.includes('budget') || q.includes('spend') || q.includes('kharcha') || q.includes('kharch') || q.includes('cap') || q.includes('kharche')) {
    if (topCats.length === 0) {
      return respond(
        `Abhi tak spending data kam hai. Kuch expense transactions add karo. Tab tak Settings → Cap Limits & Categories mein monthly cap set kar sakte ho.`,
        `Not enough spending data yet. Add a few expense transactions and I will identify your biggest budget pressure points. Until then, try setting a monthly cap in Settings → Cap Limits & Categories.`,
        `Spending data kam hai. Expense add karo aur Settings mein cap set karo.`
      );
    }
    const totalTracked = topCats.reduce((s, c) => s + c.amount, 0);
    const topPct = totalTracked > 0 ? Math.round((top.amount / totalTracked) * 100) : 0;
    return respond(
      `Sabse bada kharcha ${top.category} ka hai — ₹${top.amount.toLocaleString('en-IN')} (~${topPct}%). ${second ? `Doosra: ${second.category} (₹${second.amount.toLocaleString('en-IN')}).` : ''} Ise weekly cap set karo aur har Sunday review karo.`,
      `Your top expense area is ${top.category} at about ₹${top.amount.toLocaleString('en-IN')} (~${topPct}% of tracked expense). ${second ? `Runner-up: ${second.category} (₹${second.amount.toLocaleString('en-IN')}).` : ''} Set a weekly cap for ${top.category} and review it every Sunday.`,
      `Sabse bada kharcha ${top.category} hai. Ise weekly cap set karo aur Sunday ko review karo.`
    );
  }

  // ─ Tax ─
  if (q.includes('tax') || q.includes('gst') || q.includes('tds') || q.includes('kar') || q.includes('kar bachao')) {
    return respond(
      `Tax planning ke liye salary, rent/HRA, insurance, medical, education loan interest, NPS, ELSS, PPF, home loan principal aur interest ko clearly tag karo. More → Indian Tax Estimator mein Old vs New regime compare kar sakte ho. New regime usually behtar hai agar total deduction ₹3-4 lakh se kam ho.`,
      `For Indian tax planning, keep these tagged clearly: salary, rent/HRA, insurance premiums, medical, education loan interest, NPS, ELSS, PPF, home loan principal/interest, donations. Open the Tax Estimator in More → Indian Tax Estimator to compare Old vs New regime. The new regime is usually better if total deductions are below ₹3-4L per year.`,
      `Tax ke liye salary, rent, insurance, medical, NPS, ELSS, PPF, home loan ko tag karo. More mein Tax Estimator use karo. New regime zyadatar behtar hai agar deduction kam ho.`
    );
  }

  // ─ Investment ─
  if (q.includes('invest') || q.includes('nivesh') || q.includes('stock') || q.match(/\bsip\b/) || q.includes('mutual') || q.includes('crypto') || q.includes('gold') || q.includes('fd') || q.includes('ppf') || q.includes('nps')) {
    return respond(
      `Simple starter mix: 50% equity (Nifty 50 index fund via SIP), 30% debt (PPF/FD), 10% gold, 10% emergency cash. Har saal age ke hisaab se equity badhao. Crypto ko net worth ka 5% se zyada mat rakho. Sab kuch More → Investments mein track karo.`,
      `Simple starter mix: 50% equity (Nifty 50 index fund via SIP), 30% debt (PPF/FD), 10% gold, 10% emergency cash. Increase equity allocation by 1% per year of age you have left until 60. Avoid crypto above 5% of net worth. Track all of this in More → Investments.`,
      `50% equity SIP, 30% debt, 10% gold, 10% cash. Har saal equity badhao. Crypto 5% se zyada mat rakho. More → Investments mein track karo.`
    );
  }

  // ─ EMI / Loan / Debt ─
  if (q.includes('emi') || q.includes('loan') || q.includes('rin') || q.includes('udhar') || q.includes('karz') || q.includes('debt') || q.includes('karza')) {
    return respond(
      `Rule of thumb: total EMI monthly take-home ka 30% se kam rakhna chahiye. Agar EMI zyada hai toh snowball method (chhota debt pehle clear karo) motivation ke liye, ya avalanche method (highest interest pehle) math ke liye use karo. Har EMI ko More → Debts & Loans mein track karo.`,
      `Rule of thumb: keep total EMIs below 30% of monthly take-home. If you already have high EMIs, use the snowball method (clear smallest debt first) for motivation, or the avalanche method (clear highest-interest debt first) for math. Track every EMI in More → Debts & Loans.`,
      `Total EMI take-home ka 30% se kam rakhna chahiye. Snowball ya avalanche method use karo. More → Debts & Loans mein track karo.`
    );
  }

  // ─ Summary / report / insight ─
  if (q.includes('summary') || q.includes('report') || q.includes('insight') || q.includes('overview') || q.includes('saransh') || q.includes('samiksha') || q.includes('hisab')) {
    if (count === 0) {
      return respond(
        `Abhi tak koi transaction nahi hai. Pehla income ya expense add karo. Bank SMS paste kar sakte ho ya CSV import kar sakte ho Transactions page mein.`,
        `No transactions yet. Add your first income or expense to unlock insights. You can also paste a bank SMS or import a CSV in the Transactions page.`,
        `Koi transaction nahi hai. Pehla add karo. SMS ya CSV import kar sakte ho.`
      );
    }
    return respond(
      `Snapshot: ${count} transactions tracked. Income ₹${income.toLocaleString('en-IN')}, Expense ₹${expense.toLocaleString('en-IN')}, Net ₹${net.toLocaleString('en-IN')}, savings rate ${savingsRate}%. ${top ? `Sabse bada kharcha: ${top.category} (₹${top.amount.toLocaleString('en-IN')}).` : ''} Zyada analysis ke liye Reports kholo.`,
      `Snapshot: ${count} transactions tracked. Income ₹${income.toLocaleString('en-IN')}, Expense ₹${expense.toLocaleString('en-IN')}, Net ₹${net.toLocaleString('en-IN')}, savings rate ${savingsRate}%. ${top ? `Top expense: ${top.category} (₹${top.amount.toLocaleString('en-IN')}).` : ''} For deeper analysis open Reports.`,
      `Snapshot: Income ₹${income.toLocaleString('en-IN')}, Expense ₹${expense.toLocaleString('en-IN')}, Net ₹${net.toLocaleString('en-IN')}. Top kharcha ${top ? top.category : 'unknown'}. Reports mein zyada dekho.`
    );
  }

  // ─ Trend ─
  if (q.includes('trend') || q.includes('pattern') || q.includes('compare') || q.includes('last') || q.includes('previous') || q.includes('month over month') || q.includes('mahine se mahine')) {
    if (monthlyData.length >= 2) {
      const last = monthlyData[monthlyData.length - 1] || {};
      const prev = monthlyData[monthlyData.length - 2] || {};
      const expDelta = Number(last.expense || 0) - Number(prev.expense || 0);
      const incDelta = Number(last.income || 0) - Number(prev.income || 0);
      const sign = expDelta > 0 ? 'up' : 'down';
      return respond(
        `Month-over-month: income ${incDelta >= 0 ? 'badha' : 'ghata'} ₹${Math.abs(incDelta).toLocaleString('en-IN')} se, expense ${sign} ₹${Math.abs(expDelta).toLocaleString('en-IN')} se. ${expDelta > 0 ? 'Spending badh raha hai — top category review karo.' : 'Spending kam ho raha hai — achha momentum hai, aise hi chalo.'}`,
        `Month-over-month: income ${incDelta >= 0 ? 'up' : 'down'} by ₹${Math.abs(incDelta).toLocaleString('en-IN')}, expense ${sign} by ₹${Math.abs(expDelta).toLocaleString('en-IN')}. ${expDelta > 0 ? 'Spending is growing — review your top category.' : 'Spending is reducing — good momentum, keep going.'}`,
        `Income ${incDelta >= 0 ? 'badha' : 'ghata'}, expense ${sign}. ${expDelta > 0 ? 'Top category review karo.' : 'Achha momentum hai.'}`
      );
    }
    return respond(
      `Abhi tak monthly data kam hai. Kuch aur mahine ke transactions add karo taaki trend insights de saku. Reports mein jaakar dekho.`,
      `Not enough monthly data yet. Add a few more months of transactions to see trend insights in Reports.`,
      `Monthly data kam hai. Reports mein jaao.`
    );
  }

  // ─ Fallback generic answer ─
  return respond(
    `Aapke data se yeh dikhta hai: income ₹${income.toLocaleString('en-IN')}, expense ₹${expense.toLocaleString('en-IN')}, net ₹${net.toLocaleString('en-IN')}, savings rate ${savingsRate}%. ${top ? `Sabse bada kharcha ${top.category} hai.` : 'Zyada data add karo taaki behtar insight de saku.'} Aap mujhse saving, budget, tax, investment, EMI/loan, summary ya trend ke baare mein pooch sakte ho.`,
    `Here is what I can see from your data: income ₹${income.toLocaleString('en-IN')}, expense ₹${expense.toLocaleString('en-IN')}, net ₹${net.toLocaleString('en-IN')}, savings rate ${savingsRate}%. ${top ? `Your largest expense area is ${top.category}.` : 'Add more data for deeper insights.'} You can ask me about saving, budget, tax, investment, EMI/loan, summary, or trend.`,
    `Income ₹${income.toLocaleString('en-IN')}, expense ₹${expense.toLocaleString('en-IN')}, net ₹${net.toLocaleString('en-IN')}. ${top ? `Sabse bada kharcha ${top.category} hai.` : 'Zyada data add karo.'} Saving, budget, tax, investment ke baare mein pooch sakte ho.`
  );
}

export async function parseTransactionText(
  text: string,
  providerConfig?: AIProviderConfig
): Promise<MultiTransactionParse> {
  const config = providerConfig || getActiveProvider();

  if (!config) {
    return fallbackParse(text);
  }

  // First expand Hindi number words so the AI sees the actual amounts
  const normalized = expandHindiNumbers(text);

  const systemPrompt = `You are a STRICT financial transaction parser for an Indian personal-finance app called FinVault.
You ONLY parse finance-related text. If the input is not about money/transactions, return {"transactions":[],"totalIncome":0,"totalExpense":0,"summary":"Not a finance input"}.

CRITICAL RULES:
1. Positive amounts = INCOME. Negative amounts = EXPENSE.
2. Output STRICT JSON with exactly these keys: transactions (array), totalIncome (number), totalExpense (number), summary (string).
3. Each transaction: { amount (number, signed), description (string), category (string), type ("income" or "expense"), confidence (0-1) }.
4. Categories (use exactly these strings): food, transport, shopping, bills, health, entertainment, education, rent, groceries, salary, freelance, investment, gift, other-income, other-expense.
5. Handle ALL of these patterns (do not miss any):
   - "1200 rs mila" → +1200 income
   - "1200 rs mila jisme se 129 ka pen liya aur 459 ka book" → +1200 income AND -129 (pen) AND -459 (book)
   - "1 lakh mila jismein se 50 hajaar emi kiya" → +100000 income AND -50000 expense
   - "salary 45000 credited, rent 12000 paid, groceries 3500" → 1 income + 2 expenses
   - "+5000 freelance, -200 coffee" → signed amounts preserved
6. If the text has "jisme se" / "jismein se" / "mein se" / "out of which" / "of which", the FIRST amount is the main income/expense and the rest are sub-items.
7. Amounts can be: rs, ₹, INR, rupees, "hazaar/hazar"=1000, "lakh/lac"=100000, "crore"=10000000.
8. Default date is today unless specified.
9. Output ONLY the JSON. No markdown, no code fences, no explanation.

EXAMPLES:

Input: "1200 rs mila jisme se 129 ka pen liya aur 459 ka book"
Output:
{
  "transactions": [
    {"amount": 1200, "description": "Money received", "category": "other-income", "type": "income", "confidence": 0.9},
    {"amount": -129, "description": "Pen purchase", "category": "education", "type": "expense", "confidence": 0.85},
    {"amount": -459, "description": "Book purchase", "category": "education", "type": "expense", "confidence": 0.85}
  ],
  "totalIncome": 1200,
  "totalExpense": 588,
  "summary": "Received ₹1200, spent ₹588 on pen+book, saved ₹612"
}

Input: "1 lakh mila jismein se 50 hajaar emi kiya"
Output:
{
  "transactions": [
    {"amount": 100000, "description": "Money received", "category": "other-income", "type": "income", "confidence": 0.9},
    {"amount": -50000, "description": "EMI payment", "category": "bills", "type": "expense", "confidence": 0.9}
  ],
  "totalIncome": 100000,
  "totalExpense": 50000,
  "summary": "Received ₹1,00,000, paid ₹50,000 EMI, net ₹50,000"
}`;

  try {
    const response = await callAIProvider(config, systemPrompt, normalized);
    const cleaned = stripModelWrapper(response);
    const parsed = JSON.parse(cleaned);

    if (!parsed || !Array.isArray(parsed.transactions)) {
      throw new Error('AI returned invalid shape');
    }

    return {
      transactions: parsed.transactions.map((t: any) => ({
        amount: Number(t.amount),
        description: t.description || 'Transaction',
        category: t.category || (Number(t.amount) > 0 ? 'other-income' : 'other-expense'),
        type: Number(t.amount) > 0 ? 'income' : 'expense',
        confidence: t.confidence || 0.8,
        date: new Date().toISOString()
      })),
      totalIncome: parsed.totalIncome || 0,
      totalExpense: parsed.totalExpense || 0,
      summary: parsed.summary || ''
    };
  } catch (error) {
    console.warn('[FinVault] Parser online AI failed, using local fallback:', error);
    return fallbackParse(normalized);
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
          parts: [{ text: `${systemPrompt}\n\nUser: ${userText}` }]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1500 }
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Gemini API error: ${response.status} ${errText}`);
    }
    const data = await response.json();

    // Newer Gemini responses can come in multiple shapes
    if (data?.promptFeedback?.blockReason) {
      throw new Error(`Gemini blocked the request: ${data.promptFeedback.blockReason}`);
    }

    const candidate = data?.candidates?.[0];
    if (!candidate) throw new Error('Gemini returned no candidates');

    // 1) parts[].text
    const parts = candidate?.content?.parts;
    if (Array.isArray(parts)) {
      const textPart = parts.find((p: any) => typeof p?.text === 'string');
      if (textPart) return textPart.text;
    }
    // 2) content.text directly
    if (typeof candidate?.content?.text === 'string') return candidate.content.text;
    // 3) output_text on newer preview models
    if (typeof candidate?.output_text === 'string') return candidate.output_text;
    // 4) text on candidate (rare)
    if (typeof candidate?.text === 'string') return candidate.text;
    throw new Error('Gemini response had no text content');
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
  // Convert Hindi number words to digits first ("1 lakh" / "do lakh" / "50 hajaar")
  const normalized = expandHindiNumbers(text);
  const transactions: ParsedTransaction[] = [];
  let totalIncome = 0;
  let totalExpense = 0;

  // ─ Step 1: Try nested pattern first ("X mila jisme se Y ka Z liya aur …") ─
  const nestedResult = parseNestedPattern(normalized);
  if (nestedResult.length > 0) {
    transactions.push(...nestedResult);
  } else {
    // ─ Step 2: Split by conjunctions and parse each segment ─
    const segments = splitByConjunctions(normalized);
    if (segments.length > 1) {
      segments.forEach(seg => {
        const parsed = parseSegment(seg.text, seg.fullText);
        if (parsed) transactions.push(parsed);
      });
    } else {
      // ─ Step 3: Simple amount extraction ─
      const simple = parseSimpleAmounts(normalized);
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

// ═══ Convert Hindi/Urdu number words to digits ═══
const HINDI_NUMBERS: Record<string, number> = {
  'ek': 1, 'one': 1, 'do': 2, 'two': 2, 'teen': 3, 'three': 3, 'char': 4, 'four': 4,
  'paanch': 5, 'panch': 5, 'five': 5, 'chhe': 6, 'six': 6, 'saat': 7, 'seven': 7,
  'aath': 8, 'eight': 8, 'nau': 9, 'nine': 9, 'das': 10, 'ten': 10,
  'hazaar': 1000, 'hajar': 1000, 'hazr': 1000, 'thousand': 1000, 'k': 1000,
  'lakh': 100000, 'lac': 100000, 'lacs': 100000,
  'crore': 10000000, 'cr': 10000000,
};

function expandHindiNumbers(text: string): string {
  let result = text;
  // numeric + unit (1 lakh, 1.5 lakh, 50 hajaar)
  result = result.replace(/(\d+(?:\.\d+)?)\s*(lakh|lac|lacs|crore|cr|thousand|hazaar|hajar|hazr|hazars|k)\b/gi, (_, num, unit) => {
    const n = parseFloat(num);
    const m = HINDI_NUMBERS[(unit || '').toLowerCase()] || 1;
    return String(Math.round(n * m));
  });
  // word + unit (do lakh, teen hazaar, ek crore)
  result = result.replace(/\b(ek|do|teen|char|paanch|panch|chhe|saat|aath|nau|das|one|two|three|four|five|six|seven|eight|nine|ten)\s+(lakh|lac|lacs|crore|thousand|hazaar|hajar|hazr)\b/gi, (_, w, unit) => {
    const n = HINDI_NUMBERS[(w || '').toLowerCase()] || 1;
    const m = HINDI_NUMBERS[(unit || '').toLowerCase()] || 1;
    return String(Math.round(n * m));
  });
  return result;
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
