import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Shield, Smartphone, Fingerprint } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export function Login() {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { isPinSet, login, setPin: savePin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPinSet) {
      setIsSettingPin(true);
    }
  }, [isPinSet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSettingPin) {
        if (pin.length < 4) {
          addToast('error', 'PIN must be at least 4 digits');
          setLoading(false);
          return;
        }
        if (pin !== confirmPin) {
          addToast('error', 'PINs do not match');
          setLoading(false);
          return;
        }
        await savePin(pin);
        addToast('success', 'PIN set successfully!');
        navigate('/');
      } else {
        const success = await login(pin);
        if (success) {
          addToast('success', 'Welcome back!');
          navigate('/');
        } else {
          addToast('error', 'Invalid PIN. Please try again.');
          setPin('');
        }
      }
    } catch (error) {
      addToast('error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinInput = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setPin(numericValue);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[24px] bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl shadow-violet-500/25 mb-4">
            <span className="text-4xl">💎</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">FinVault</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Privacy-First Personal Finance
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[24px] shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950/50 mb-3">
              <Lock className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-xl font-bold">
              {isSettingPin ? 'Set Your PIN' : 'Enter Your PIN'}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {isSettingPin 
                ? 'Create a 4-6 digit PIN to secure your data'
                : 'Unlock your financial vault'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* PIN Input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {isSettingPin ? 'New PIN' : 'PIN'}
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => handlePinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full px-4 py-4 pr-12 text-center text-2xl font-mono tracking-widest rounded-2xl border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                  autoFocus
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm PIN */}
            {isSettingPin && (
              <div>
                <label className="block text-sm font-medium mb-2">Confirm PIN</label>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••"
                  className="w-full px-4 py-4 text-center text-2xl font-mono tracking-widest rounded-2xl border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                  maxLength={6}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : isSettingPin ? 'Set PIN & Continue' : 'Unlock'}
            </button>
          </form>

          {/* Security Features */}
          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 mb-2">
                  <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-xs font-medium">AES Encrypted</p>
              </div>
              <div>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 mb-2">
                  <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs font-medium">100% Offline</p>
              </div>
              <div>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 mb-2">
                  <Fingerprint className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs font-medium">Local Only</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-500 mt-6">
          Your data never leaves your device • Open Source • No Tracking
        </p>
      </div>
    </div>
  );
}
