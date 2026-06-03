import { useState } from 'react';
import { Smartphone, Send, Check, X, Sparkles } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { db } from '@/lib/db';

interface ParsedSMS {
  amount: number;
  type: 'income' | 'expense';
  merchant: string;
  date: string;
  account: string;
  balance?: number;
  raw: string;
  category: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ['swiggy', 'zomato', 'restaurant', 'hotel', 'food', 'cafe', 'bar', 'pizza', 'burger', 'biryani', 'chai'],
  transport: ['uber', 'ola', 'rapido', 'petrol', 'diesel', 'metro', 'irctc', 'railway', 'parking', 'toll', 'fastag'],
  shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'lifestyle', 'shoppers', 'shopping'],
  bills: ['electricity', 'water', 'gas', 'recharge', 'broadband', 'jio', 'airtel', 'vi', 'bsnl', 'wifi', 'netflix', 'spotify', 'hotstar', 'disney', 'amazon prime', 'youtube'],
  health: ['apollo', 'medplus', 'pharmacy', 'hospital', 'doctor', 'clinic', 'medicine', 'lab', 'diagnostic'],
  rent: ['rent', 'landlord', 'housing', 'apartment', 'pg ', 'hostel'],
  salary: ['salary', 'payroll', 'wages', 'stipend', 'sal cr'],
  groceries: ['bigbasket', 'grofers', 'blinkit', 'instamart', 'reliance fresh', 'dmart', 'more store'],
  atm: ['atm', 'cash withdrawal', 'cash wdl'],
  transfer: ['imps', 'neft', 'rtgs', 'upi', 'transfer', 'sent to', 'received from'],
};

export function BankSMSParser({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [smsText, setSmsText] = useState('');
  const [parsed, setParsed] = useState<ParsedSMS | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const detectCategory = (text: string): string => {
    const l = text.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(k => l.includes(k))) return cat;
    }
    return 'other-expense';
  };

  const parseSMS = (text: string): ParsedSMS | null => {
    if (!text.trim()) return null;
    const original = text.trim();
    const lower = text.toLowerCase();

    // Detect transaction type
    const isDebit = lower.match(/debited|withdrawn|spent|paid|sent|dr\b|deducted|purchase|transferred/);
    const isCredit = lower.match(/credited|received|deposited|salary|credited to|added|cr\b|refund|cashback/);
    
    let type: 'income' | 'expense' = isDebit ? 'expense' : (isCredit ? 'income' : 'expense');

    // Extract amount (multiple patterns)
    let amount = 0;
    const patterns = [
      /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
      /([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹)/i,
      /amount[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
      /debited.*?([\d,]+(?:\.\d{1,2})?)/i,
      /credited.*?([\d,]+(?:\.\d{1,2})?)/i,
    ];

    for (const p of patterns) {
      const m = text.match(p);
      if (m) {
        const num = parseFloat(m[1].replace(/,/g, ''));
        if (!isNaN(num) && num > 0) {
          amount = num;
          break;
        }
      }
    }

    if (amount === 0) return null;

    // Extract merchant/description
    let merchant = 'Transaction';
    const merchantPatterns = [
      /(?:at|to|from|via)\s+([A-Z][A-Z0-9\s\.\-]{2,40}?)(?:\s+on|\s+dated|\.|,|\s+ref|\s+txn|\s+available|$)/i,
      /(?:vpa|merchant)[:\s]+([a-zA-Z0-9@._-]+)/i,
      /at\s+([A-Z][A-Z\s]+(?:IND|IN)?)/,
    ];
    for (const p of merchantPatterns) {
      const m = text.match(p);
      if (m && m[1] && m[1].length > 2) {
        merchant = m[1].trim().toUpperCase();
        break;
      }
    }

    // If still no merchant, try to extract from UPI or card ref
    if (merchant === 'Transaction') {
      const upiMatch = text.match(/[a-zA-Z0-9._-]+@[a-z]+/);
      if (upiMatch) merchant = upiMatch[0];
    }
    if (merchant === 'Transaction') {
      const cardMatch = text.match(/card\s+(?:no\.?|ending)?\s*(\d{4})/i);
      if (cardMatch) merchant = `Card ${cardMatch[1]}`;
    }

    // Extract account number
    const accMatch = text.match(/a\/c\s+(?:no\.?)?\s*(\w+\d+\w*|\d+x+|\d+)/i) ||
                     text.match(/account\s+(?:no\.?)?\s*(\w+\d+\w*|\d+)/i);
    const account = accMatch ? accMatch[1] : '';

    // Extract balance
    const balMatch = text.match(/(?:available\s+)?balance[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i);
    const balance = balMatch ? parseFloat(balMatch[1].replace(/,/g, '')) : undefined;

    // Extract date - default to now
    const date = new Date().toISOString();

    return {
      amount: type === 'expense' ? -amount : amount,
      type,
      merchant: merchant.slice(0, 50),
      date,
      account,
      balance,
      raw: original,
      category: detectCategory(merchant + ' ' + text),
    };
  };

  const handleParse = () => {
    setParsing(true);
    setTimeout(() => {
      const result = parseSMS(smsText);
      if (result) {
        setParsed(result);
        addToast('success', '✓ SMS parsed successfully');
      } else {
        addToast('error', 'Could not extract amount. Try including "Rs. XXX debited/credited"');
        setParsed(null);
      }
      setParsing(false);
    }, 300);
  };

  const handleSave = async () => {
    if (!parsed) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await db.transactions.add({
        id: `sms-${Date.now()}`,
        date: parsed.date,
        amount: parsed.amount,
        category: parsed.category,
        description: `${parsed.merchant}${parsed.account ? ` (${parsed.account})` : ''}`,
        createdAt: now,
        updatedAt: now,
      });
      addToast('success', '✓ Transaction added!');
      onSuccess();
      onClose();
    } catch (error) {
      addToast('error', 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const pasteExample = (ex: string) => {
    setSmsText(ex);
    setTimeout(() => {
      const result = parseSMS(ex);
      setParsed(result);
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            Bank SMS Parser
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100">How it works</p>
            </div>
            <p className="text-xs text-blue-800 dark:text-blue-200">Copy any bank transaction SMS and paste here. AI will extract amount, merchant, and create a transaction. Supports SBI, HDFC, ICICI, Axis, Paytm, GPay, PhonePe, and more.</p>
          </div>

          {!parsed ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1.5">Paste SMS</label>
                <textarea
                  value={smsText}
                  onChange={e => setSmsText(e.target.value)}
                  rows={5}
                  placeholder="e.g., INR 500.00 debited from a/c XX1234 at AMAZON.IN on 15-06-2026. Available balance: Rs. 12500.00"
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm font-mono"
                />
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-500 mb-2">📋 Try examples:</p>
                <div className="space-y-1.5">
                  {[
                    'INR 450.00 debited from a/c **1234 at SWIGGY on 15-06-2026. Avl bal: Rs.12500',
                    'Rs. 50000 credited to your account XX5678 from ACME CORP SALARY JUN 2026',
                    'Rs.250 sent to zomato@upi via UPI. Ref 123456789. Avl bal Rs.8750',
                    'You have spent Rs.1299 on Amazon Pay. Card ending 4567. Available limit: Rs.38701',
                  ].map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => pasteExample(ex)}
                      className="w-full text-left p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-mono"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleParse}
                disabled={!smsText.trim() || parsing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {parsing ? 'Parsing...' : (
                  <>
                    <Send className="w-4 h-4" />
                    Parse SMS
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <p className="font-bold text-emerald-900 dark:text-emerald-100">Parsed Successfully</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-emerald-700 dark:text-emerald-300">Amount:</span>
                    <span className={`font-bold text-lg ${parsed.amount > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {parsed.amount > 0 ? '+' : ''}₹{Math.abs(parsed.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700 dark:text-emerald-300">Type:</span>
                    <span className="font-semibold">{parsed.type === 'income' ? '💰 Income' : '💸 Expense'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700 dark:text-emerald-300">Merchant:</span>
                    <span className="font-semibold">{parsed.merchant}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700 dark:text-emerald-300">Category:</span>
                    <span className="font-semibold capitalize">{parsed.category}</span>
                  </div>
                  {parsed.account && (
                    <div className="flex justify-between">
                      <span className="text-emerald-700 dark:text-emerald-300">Account:</span>
                      <span className="font-mono">{parsed.account}</span>
                    </div>
                  )}
                  {parsed.balance !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-emerald-700 dark:text-emerald-300">Balance:</span>
                      <span className="font-mono">₹{parsed.balance.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Original SMS</p>
                <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{parsed.raw}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setParsed(null); setSmsText(''); }}
                  className="flex-1 px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 font-medium"
                >
                  Try Another
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Add Transaction'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
