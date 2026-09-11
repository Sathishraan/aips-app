import { useSyncExternalStore } from 'react';
import {
  SavedAccount,
  getSavedAccounts,
  getActiveAccount,
  subscribeSavedAccounts,
  switchToAccount,
  removeAccount,
  removeAllAccounts,
  updateActiveAccountProfile,
} from '../store/savedAccounts.store';

export const useSavedAccounts = () => {
  const accounts = useSyncExternalStore(
    subscribeSavedAccounts,
    getSavedAccounts,
    getSavedAccounts
  );

  const activeAccount = useSyncExternalStore(
    subscribeSavedAccounts,
    getActiveAccount,
    getActiveAccount
  );

  return {
    accounts,
    activeAccount,
    hasMultipleAccounts: accounts.length > 1,
    switchToAccount,
    removeAccount,
    removeAllAccounts,
    updateActiveAccountProfile,
  };
};

export type { SavedAccount };
