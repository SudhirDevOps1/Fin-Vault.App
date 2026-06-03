import Dexie, { Table } from 'dexie';
import type { Transaction, Category, AppSettings } from '@/types';

export class FinVaultDB extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  settings!: Table<AppSettings & { id: string }>;

  constructor() {
    super('FinVaultDB');
    
    this.version(1).stores({
      transactions: 'id, date, amount, category, createdAt',
      categories: 'id, name, type',
      settings: 'id'
    });
  }

  async initDefaultCategories() {
    const count = await this.categories.count();
    if (count === 0) {
      const defaults: Category[] = [
        // Income
        { id: 'salary', name: 'Salary', icon: '💼', color: '#10b981', type: 'income', isCustom: false },
        { id: 'freelance', name: 'Freelance', icon: '💻', color: '#059669', type: 'income', isCustom: false },
        { id: 'investment', name: 'Investment', icon: '📈', color: '#047857', type: 'income', isCustom: false },
        { id: 'gift', name: 'Gift', icon: '🎁', color: '#34d399', type: 'income', isCustom: false },
        { id: 'other-income', name: 'Other Income', icon: '💰', color: '#6ee7b7', type: 'income', isCustom: false },
        
        // Expense
        { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#ef4444', type: 'expense', isCustom: false },
        { id: 'transport', name: 'Transport', icon: '🚗', color: '#f97316', type: 'expense', isCustom: false },
        { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'expense', isCustom: false },
        { id: 'bills', name: 'Bills & Utilities', icon: '💡', color: '#eab308', type: 'expense', isCustom: false },
        { id: 'health', name: 'Healthcare', icon: '🏥', color: '#14b8a6', type: 'expense', isCustom: false },
        { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#8b5cf6', type: 'expense', isCustom: false },
        { id: 'education', name: 'Education', icon: '📚', color: '#3b82f6', type: 'expense', isCustom: false },
        { id: 'rent', name: 'Rent', icon: '🏠', color: '#6366f1', type: 'expense', isCustom: false },
        { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#84cc16', type: 'expense', isCustom: false },
        { id: 'other-expense', name: 'Other Expense', icon: '💸', color: '#f43f5e', type: 'expense', isCustom: false },
      ];
      await this.categories.bulkAdd(defaults);
    }
  }

  async initSettings() {
    const existing = await this.settings.get('main');
    if (!existing) {
      const defaults: AppSettings & { id: string } = {
        id: 'main',
        currency: 'INR',
        currencySymbol: '₹',
        dateFormat: 'dd/MM/yyyy',
        theme: 'system',
        firebaseEnabled: false,
        syncEnabled: false,
        aiEnabled: true,
        aiAutoParse: true,
        aiSafeMode: true,
        aiRedactDescriptions: true,
        aiSendOnlySummary: true,
        aiStoreChatLocally: true,
      };
      await this.settings.add(defaults);
    }
  }

  async getSettings(): Promise<AppSettings> {
    const settings = await this.settings.get('main');
    if (!settings) {
      await this.initSettings();
      return this.getSettings();
    }
    return settings;
  }

  async updateSettings(updates: Partial<AppSettings>) {
    await this.settings.update('main', updates);
  }
}

export const db = new FinVaultDB();

// Initialize on first load
db.initDefaultCategories();
db.initSettings();
