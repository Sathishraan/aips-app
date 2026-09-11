import * as SecureStore from 'expo-secure-store';
import { setAuthToken, getAuthToken } from '../api/base';
import { queryClient } from '../api/queryClient';
import { resetLinkedStudents } from './linkedStudents.store';
import { disconnectSocket } from '../api/socket';

export interface SavedAccount {
  id: string; // unique ID: normalized username
  username: string;
  token: string;
  name: string;
  role?: string;
  photo?: string | null;
  academicYear?: string;
  lastActiveAt: number;
  studentId?: string;
  employeeId?: string;
}

const SAVED_ACCOUNTS_KEY = 'saved_user_accounts_v1';
const ACTIVE_ACCOUNT_ID_KEY = 'active_account_id_v1';

type Listener = () => void;

let savedAccounts: SavedAccount[] = [];
let activeAccountId: string | null = null;
let isInitialized = false;

// Cached immutable snapshots for useSyncExternalStore stability
let cachedSortedAccounts: SavedAccount[] = [];
let cachedActiveAccount: SavedAccount | null = null;

const listeners = new Set<Listener>();

const updateCachedState = () => {
  cachedSortedAccounts = [...savedAccounts].sort((a, b) => b.lastActiveAt - a.lastActiveAt);
  if (activeAccountId) {
    cachedActiveAccount = savedAccounts.find((acc) => acc.id === activeAccountId) || null;
  } else {
    cachedActiveAccount = null;
  }
};

const emit = () => {
  updateCachedState();
  listeners.forEach((listener) => listener());
};

export const subscribeSavedAccounts = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const normalizeAccountId = (username: string) => username.trim().toLowerCase();

const persist = async () => {
  try {
    if (savedAccounts.length > 0) {
      await SecureStore.setItemAsync(SAVED_ACCOUNTS_KEY, JSON.stringify(savedAccounts));
    } else {
      await SecureStore.deleteItemAsync(SAVED_ACCOUNTS_KEY);
    }

    if (activeAccountId) {
      await SecureStore.setItemAsync(ACTIVE_ACCOUNT_ID_KEY, activeAccountId);
    } else {
      await SecureStore.deleteItemAsync(ACTIVE_ACCOUNT_ID_KEY);
    }
  } catch (error) {
    console.error('⚠️ [SavedAccounts] Persistence error:', error);
  }
};

export const getSavedAccounts = (): SavedAccount[] => {
  return cachedSortedAccounts;
};

export const getActiveAccount = (): SavedAccount | null => {
  return cachedActiveAccount;
};

export const initSavedAccounts = async (): Promise<string | null> => {
  if (isInitialized) return getAuthToken();

  try {
    const rawAccounts = await SecureStore.getItemAsync(SAVED_ACCOUNTS_KEY);
    const rawActiveId = await SecureStore.getItemAsync(ACTIVE_ACCOUNT_ID_KEY);

    if (rawAccounts) {
      const parsed: SavedAccount[] = JSON.parse(rawAccounts);
      if (Array.isArray(parsed) && parsed.length > 0) {
        savedAccounts = parsed;
        activeAccountId = rawActiveId || parsed[0].id;
        const activeAcc = savedAccounts.find((a) => a.id === activeAccountId) || parsed[0];
        activeAccountId = activeAcc.id;
        await setAuthToken(activeAcc.token);
        isInitialized = true;
        emit();
        return activeAcc.token;
      }
    }

    // Fallback/Legacy migration: check existing auth_token
    const existingToken = await SecureStore.getItemAsync('auth_token');
    if (existingToken) {
      const legacyAccount: SavedAccount = {
        id: 'user_default',
        username: 'User',
        token: existingToken,
        name: 'Logged in User',
        lastActiveAt: Date.now(),
      };
      savedAccounts = [legacyAccount];
      activeAccountId = legacyAccount.id;
      await setAuthToken(existingToken);
      await persist();
    }
  } catch (error) {
    console.error('⚠️ [SavedAccounts] Initialization error:', error);
  }

  isInitialized = true;
  emit();
  return getAuthToken();
};

export const saveAccount = async (data: {
  username: string;
  token: string;
  name?: string;
  role?: string;
  photo?: string | null;
  academicYear?: string;
  studentId?: string;
  employeeId?: string;
}): Promise<SavedAccount> => {
  const id = normalizeAccountId(data.username);
  const now = Date.now();

  const existingIndex = savedAccounts.findIndex((acc) => acc.id === id);

  const newAccount: SavedAccount = {
    id,
    username: data.username.trim(),
    token: data.token,
    name: data.name || data.username.trim(),
    role: data.role || (existingIndex >= 0 ? savedAccounts[existingIndex].role : undefined),
    photo: data.photo !== undefined ? data.photo : (existingIndex >= 0 ? savedAccounts[existingIndex].photo : null),
    academicYear: data.academicYear || (existingIndex >= 0 ? savedAccounts[existingIndex].academicYear : undefined),
    studentId: data.studentId || (existingIndex >= 0 ? savedAccounts[existingIndex].studentId : undefined),
    employeeId: data.employeeId || (existingIndex >= 0 ? savedAccounts[existingIndex].employeeId : undefined),
    lastActiveAt: now,
  };

  if (existingIndex >= 0) {
    savedAccounts[existingIndex] = { ...savedAccounts[existingIndex], ...newAccount };
  } else {
    savedAccounts.push(newAccount);
  }

  activeAccountId = id;
  await setAuthToken(data.token);
  await persist();
  emit();

  return newAccount;
};

export const updateActiveAccountProfile = async (updates: Partial<SavedAccount>) => {
  if (!activeAccountId) return;
  const index = savedAccounts.findIndex((acc) => acc.id === activeAccountId);
  if (index < 0) return;

  const current = savedAccounts[index];
  let changed = false;

  (Object.keys(updates) as (keyof SavedAccount)[]).forEach((key) => {
    if (updates[key] !== undefined && updates[key] !== current[key]) {
      changed = true;
    }
  });

  if (!changed) return; // Prevent unnecessary re-renders & infinite update loops

  savedAccounts[index] = {
    ...savedAccounts[index],
    ...updates,
  };

  await persist();
  emit();
};

export const switchToAccount = async (accountId: string): Promise<boolean> => {
  const target = savedAccounts.find((acc) => acc.id === accountId);
  if (!target) {
    console.warn(`⚠️ [SavedAccounts] Cannot switch: Account ${accountId} not found.`);
    return false;
  }

  activeAccountId = target.id;
  target.lastActiveAt = Date.now();

  // Set auth token for API calls
  disconnectSocket();
  await setAuthToken(target.token);
  await resetLinkedStudents();

  // Clear query cache so new user profile and data reload fresh
  queryClient.clear();
  await persist();
  emit();

  console.log(`✅ [SavedAccounts] Switched active account to: ${target.name} (${target.username})`);
  return true;
};

export const removeAccount = async (accountId: string): Promise<SavedAccount | null> => {
  const targetIndex = savedAccounts.findIndex((acc) => acc.id === accountId);
  if (targetIndex < 0) return getActiveAccount();

  savedAccounts.splice(targetIndex, 1);

  if (activeAccountId === accountId) {
    if (savedAccounts.length > 0) {
      // Sort by last active to pick most recently used remaining account
      savedAccounts.sort((a, b) => b.lastActiveAt - a.lastActiveAt);
      const nextActive = savedAccounts[0];
      activeAccountId = nextActive.id;
      nextActive.lastActiveAt = Date.now();
      await setAuthToken(nextActive.token);
      await resetLinkedStudents();
      queryClient.clear();
    } else {
      activeAccountId = null;
      await setAuthToken(null);
      await resetLinkedStudents();
      queryClient.clear();
    }
  }

  await persist();
  emit();

  return getActiveAccount();
};

export const removeAllAccounts = async () => {
  savedAccounts = [];
  activeAccountId = null;
  await setAuthToken(null);
  await resetLinkedStudents();
  queryClient.clear();
  await persist();
  emit();
};
