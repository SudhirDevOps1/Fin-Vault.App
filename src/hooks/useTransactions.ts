import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import type { Transaction, MonthlySummary } from '@/types';
import { generateId } from '@/lib/crypto';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const txs = await db.transactions.orderBy('date').reverse().toArray();
      setTransactions(txs);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    
    await db.transactions.add(transaction);
    await loadTransactions();
    return transaction;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    await db.transactions.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await loadTransactions();
  };

  const deleteTransaction = async (id: string) => {
    await db.transactions.delete(id);
    await loadTransactions();
  };

  const getTransactionsByMonth = (year: number, month: number) => {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    
    return transactions.filter(tx => {
      const date = new Date(tx.date);
      return date >= start && date <= end;
    });
  };

  const getMonthlySummary = (year: number, month: number): MonthlySummary => {
    const monthTxs = getTransactionsByMonth(year, month);
    
    const totalIncome = monthTxs
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalExpense = Math.abs(monthTxs
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0));
    
    return {
      month: format(new Date(year, month - 1), 'yyyy-MM'),
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      transactionCount: monthTxs.length,
    };
  };

  const getLast6MonthsSummary = (): MonthlySummary[] => {
    const summaries: MonthlySummary[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      summaries.push(getMonthlySummary(date.getFullYear(), date.getMonth() + 1));
    }
    
    return summaries;
  };

  const getCategoryBreakdown = (year: number, month: number) => {
    const monthTxs = getTransactionsByMonth(year, month).filter(tx => tx.amount < 0);
    
    const breakdown = new Map<string, { amount: number; count: number }>();
    
    monthTxs.forEach(tx => {
      const existing = breakdown.get(tx.category) || { amount: 0, count: 0 };
      breakdown.set(tx.category, {
        amount: existing.amount + Math.abs(tx.amount),
        count: existing.count + 1,
      });
    });
    
    return Array.from(breakdown.entries()).map(([category, data]) => ({
      category,
      ...data,
    }));
  };

  const getRunningBalance = () => {
    let balance = 0;
    return transactions
      .slice()
      .reverse()
      .map(tx => {
        balance += tx.amount;
        return { ...tx, balance };
      })
      .reverse();
  };

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByMonth,
    getMonthlySummary,
    getLast6MonthsSummary,
    getCategoryBreakdown,
    getRunningBalance,
    refresh: loadTransactions,
  };
}
