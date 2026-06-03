import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, Calendar, DollarSign, Tag, FileText, Repeat, Sparkles } from 'lucide-react';
import { db } from '@/lib/db';
import { useToast } from '@/contexts/ToastContext';
import { AINaturalInput } from '@/components/AINaturalInput';
import type { Category, Transaction } from '@/types';
import { format } from 'date-fns';

const schema = z.object({
  date: z.string().min(1, 'Date is required'),
  amount: z.number().refine(val => val !== 0, 'Amount cannot be zero'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required').max(200),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTransaction?: Transaction | null;
}

export function AddTransactionModal({ isOpen, onClose, onSuccess, editTransaction }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [showAIInput, setShowAIInput] = useState(false);
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: 0,
      category: '',
      description: '',
      isRecurring: false,
    },
  });

  const amount = watch('amount');
  const isRecurring = watch('isRecurring');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (editTransaction) {
      setValue('date', format(new Date(editTransaction.date), 'yyyy-MM-dd'));
      setValue('amount', editTransaction.amount);
      setValue('category', editTransaction.category);
      setValue('description', editTransaction.description);
      setValue('isRecurring', editTransaction.isRecurring || false);
      setReceiptImage(editTransaction.receiptImage || null);
    } else {
      reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: 0,
        category: '',
        description: '',
        isRecurring: false,
      });
      setReceiptImage(null);
    }
  }, [editTransaction, setValue, reset]);

  const loadCategories = async () => {
    const cats = await db.categories.toArray();
    setCategories(cats);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('error', 'Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setReceiptImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormData) => {
    try {
      let categoryId = data.category;
      
      // Handle custom category
      if (data.category === 'custom' && customCategory) {
        const newCat: Category = {
          id: `custom-${Date.now()}`,
          name: customCategory,
          icon: '📌',
          color: '#6366f1',
          type: data.amount > 0 ? 'income' : 'expense',
          isCustom: true,
        };
        await db.categories.add(newCat);
        categoryId = newCat.id;
        setCategories(prev => [...prev, newCat]);
      }

      const transactionData = {
        date: new Date(data.date).toISOString(),
        amount: data.amount,
        category: categoryId,
        description: data.description,
        receiptImage: receiptImage || undefined,
        isRecurring: data.isRecurring,
        recurringPattern: data.isRecurring ? {
          frequency: data.recurringFrequency || 'monthly',
          interval: 1,
          nextDate: new Date(data.date).toISOString(),
        } : undefined,
      };

      if (editTransaction) {
        await db.transactions.update(editTransaction.id, {
          ...transactionData,
          updatedAt: new Date().toISOString(),
        });
        addToast('success', 'Transaction updated successfully');
      } else {
        await db.transactions.add({
          ...transactionData,
          id: `tx-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        addToast('success', 'Transaction added successfully');
      }

      onSuccess();
      onClose();
      reset();
      setReceiptImage(null);
      setCustomCategory('');
      setShowCustomCategory(false);
    } catch (error) {
      addToast('error', 'Failed to save transaction');
      console.error(error);
    }
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter(cat => 
    amount > 0 ? cat.type === 'income' || cat.type === 'both' : cat.type === 'expense' || cat.type === 'both'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-[20px] shadow-2xl border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 rounded-t-[20px]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">
              {editTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* AI Toggle */}
          {!editTransaction && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAIInput(false)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  !showAIInput
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                Manual
              </button>
              <button
                type="button"
                onClick={() => setShowAIInput(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  showAIInput
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                AI Natural
              </button>
            </div>
          )}
        </div>

        {showAIInput && !editTransaction ? (
          <div className="p-6">
            <AINaturalInput
              onTransactionsParsed={async (parsed) => {
                // Add all parsed transactions
                for (const tx of parsed.transactions) {
                  await db.transactions.add({
                    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    date: tx.date || new Date().toISOString(),
                    amount: tx.amount,
                    category: tx.category || (tx.amount > 0 ? 'other-income' : 'other-expense'),
                    description: tx.description,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  });
                }
                addToast('success', `Added ${parsed.transactions.length} transactions!`);
                onSuccess();
                onClose();
              }}
              onClose={() => setShowAIInput(false)}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            {/* Amount Type Toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('amount', Math.abs(amount || 0))}
              className={`p-4 rounded-2xl border-2 transition-all ${
                amount >= 0
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
              }`}
            >
              <div className="text-2xl mb-1">💰</div>
              <div className="font-semibold text-sm">Income</div>
            </button>
            <button
              type="button"
              onClick={() => setValue('amount', -Math.abs(amount || 0))}
              className={`p-4 rounded-2xl border-2 transition-all ${
                amount < 0
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
              }`}
            >
              <div className="text-2xl mb-1">💸</div>
              <div className="font-semibold text-sm">Expense</div>
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <DollarSign className="w-4 h-4" />
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
              <input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-lg font-semibold"
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Calendar className="w-4 h-4" />
              Date
            </label>
            <input
              type="date"
              {...register('date')}
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Tag className="w-4 h-4" />
              Category
            </label>
            <select
              {...register('category')}
              onChange={(e) => {
                setValue('category', e.target.value);
                setShowCustomCategory(e.target.value === 'custom');
              }}
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">Select category</option>
              {filteredCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
              <option value="custom">+ Add Custom Category</option>
            </select>
            {showCustomCategory && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category name"
                className="w-full mt-2 px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
              />
            )}
            {errors.category && (
              <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <FileText className="w-4 h-4" />
              Description
            </label>
            <input
              type="text"
              {...register('description')}
              placeholder="e.g., masala laya, salary credited"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Upload className="w-4 h-4" />
              Receipt (Optional)
            </label>
            {receiptImage ? (
              <div className="relative">
                <img
                  src={receiptImage}
                  alt="Receipt"
                  className="w-full h-48 object-cover rounded-xl border border-zinc-300 dark:border-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => setReceiptImage(null)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block">
                <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center hover:border-violet-500 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Click to upload receipt image
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Max 2MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Recurring */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <input
              type="checkbox"
              {...register('isRecurring')}
              className="mt-1 w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
            />
            <div className="flex-1">
              <label className="flex items-center gap-2 font-medium text-sm">
                <Repeat className="w-4 h-4" />
                Make this recurring
              </label>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Automatically add this transaction on schedule
              </p>
              {isRecurring && (
                <select
                  {...register('recurringFrequency')}
                  className="mt-2 w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editTransaction ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
