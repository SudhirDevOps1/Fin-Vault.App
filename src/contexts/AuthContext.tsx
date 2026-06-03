import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { db } from '@/lib/db';
import { verifyPin, hashPin, generateSalt } from '@/lib/crypto';
import { isFirebaseConfigured, onAuthChange } from '@/lib/firebase';
import type { User } from 'firebase/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isPinSet: boolean;
  isFirebaseEnabled: boolean;
  firebaseUser: User | null;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  setPin: (pin: string) => Promise<void>;
  resetPin: () => Promise<void>;
  checkPinSet: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPinSet, setIsPinSet] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const isFirebaseEnabled = isFirebaseConfigured();

  useEffect(() => {
    checkPinSet();
    
    if (isFirebaseEnabled) {
      const unsubscribe = onAuthChange((user) => {
        setFirebaseUser(user);
      });
      return unsubscribe;
    }
  }, [isFirebaseEnabled]);

  const checkPinSet = async (): Promise<boolean> => {
    const settings = await db.getSettings();
    const hasPin = !!settings.pinHash;
    setIsPinSet(hasPin);
    
    // If no PIN set, auto-authenticate for first time
    if (!hasPin) {
      setIsAuthenticated(true);
    }
    
    return hasPin;
  };

  const login = async (pin: string): Promise<boolean> => {
    const settings = await db.getSettings();
    
    if (!settings.pinHash || !settings.pinSalt) {
      // No PIN set, authenticate anyway
      setIsAuthenticated(true);
      return true;
    }

    const isValid = verifyPin(pin, settings.pinHash, settings.pinSalt);
    if (isValid) {
      setIsAuthenticated(true);
      sessionStorage.setItem('finvault_auth', 'true');
    }
    return isValid;
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('finvault_auth');
  };

  const setPin = async (pin: string) => {
    const salt = generateSalt();
    const hash = hashPin(pin, salt);
    
    await db.updateSettings({
      pinHash: hash,
      pinSalt: salt,
    });
    
    setIsPinSet(true);
    setIsAuthenticated(true);
    sessionStorage.setItem('finvault_auth', 'true');
  };

  const resetPin = async () => {
    await db.updateSettings({
      pinHash: undefined,
      pinSalt: undefined,
    });
    setIsPinSet(false);
    setIsAuthenticated(true);
  };

  // Check session on mount
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('finvault_auth');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isPinSet,
      isFirebaseEnabled,
      firebaseUser,
      login,
      logout,
      setPin,
      resetPin,
      checkPinSet,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
