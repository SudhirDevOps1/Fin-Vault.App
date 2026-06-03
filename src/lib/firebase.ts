import { initializeApp, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  type Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  type Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import type { Transaction, FirebaseConfig } from '@/types';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function isFirebaseConfigured(): boolean {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
}

export function getFirebaseConfig(): FirebaseConfig | null {
  if (!isFirebaseConfigured()) return null;
  
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
}

export function initializeFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } | null {
  if (!isFirebaseConfigured()) return null;
  
  if (app && auth && db) {
    return { app, auth, db };
  }

  const config = getFirebaseConfig()!;
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  
  return { app, auth, db };
}

// Auth functions
export async function signIn(email: string, password: string) {
  const firebase = initializeFirebase();
  if (!firebase) throw new Error('Firebase not configured');
  
  return signInWithEmailAndPassword(firebase.auth, email, password);
}

export async function signUp(email: string, password: string) {
  const firebase = initializeFirebase();
  if (!firebase) throw new Error('Firebase not configured');
  
  return createUserWithEmailAndPassword(firebase.auth, email, password);
}

export async function logOut() {
  const firebase = initializeFirebase();
  if (!firebase) throw new Error('Firebase not configured');
  
  return signOut(firebase.auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  const firebase = initializeFirebase();
  if (!firebase) return () => {};
  
  return onAuthStateChanged(firebase.auth, callback);
}

export function getCurrentUser(): User | null {
  const firebase = initializeFirebase();
  if (!firebase) return null;
  
  return firebase.auth.currentUser;
}

// Firestore sync functions
export async function syncTransactionToCloud(transaction: Transaction, userId: string) {
  const firebase = initializeFirebase();
  if (!firebase) throw new Error('Firebase not configured');
  
  const docRef = doc(firebase.db, 'users', userId, 'transactions', transaction.id);
  await setDoc(docRef, {
    ...transaction,
    syncedAt: Timestamp.now(),
  });
}

export async function deleteTransactionFromCloud(transactionId: string, userId: string) {
  const firebase = initializeFirebase();
  if (!firebase) throw new Error('Firebase not configured');
  
  const docRef = doc(firebase.db, 'users', userId, 'transactions', transactionId);
  await deleteDoc(docRef);
}

export async function fetchTransactionsFromCloud(userId: string): Promise<Transaction[]> {
  const firebase = initializeFirebase();
  if (!firebase) throw new Error('Firebase not configured');
  
  const q = query(
    collection(firebase.db, 'users', userId, 'transactions'),
    orderBy('date', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Transaction);
}

export async function syncAllToCloud(transactions: Transaction[], userId: string) {
  const firebase = initializeFirebase();
  if (!firebase) throw new Error('Firebase not configured');
  
  const batch = transactions.map(tx => syncTransactionToCloud(tx, userId));
  await Promise.all(batch);
}
