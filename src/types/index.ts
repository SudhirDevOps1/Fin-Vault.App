export interface Transaction {
  id: string;
  date: string; // ISO string
  amount: number; // positive for income, negative for expense
  category: string;
  description: string;
  receiptImage?: string; // base64
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // e.g., every 2 weeks
  endDate?: string;
  nextDate: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  isCustom: boolean;
}

export interface MonthlySummary {
  month: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  transactionCount: number;
}

export interface AppSettings {
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'system';
  pinHash?: string;
  pinSalt?: string;
  firebaseEnabled: boolean;
  syncEnabled: boolean;
  lastSyncAt?: string;
  aiEnabled?: boolean;
  aiAutoParse?: boolean;
  aiSafeMode?: boolean;
  aiRedactDescriptions?: boolean;
  aiSendOnlySummary?: boolean;
  aiStoreChatLocally?: boolean;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  transactions: Transaction[];
  categories: Category[];
  settings: Partial<AppSettings>;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}
