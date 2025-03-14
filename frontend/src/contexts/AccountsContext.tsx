"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Account } from "@/types/Account";
import { BankTransaction } from "@/types/Transaction";
import { createClient } from "@/utils/supabase/client";
import { fetchUserAccounts } from "@/database/Accounts";
import { fetchAccountTransactions as fetchTxs } from "@/database/Transactions";

// Export database functions directly so components can use them
export type { Account, AccountType } from "@/types/Account";
export type { BankTransaction } from "@/types/Transaction";
export * from "@/database/Accounts";
export * from "@/database/Transactions";

// Define the Transaction type that will be used throughout the UI
export type Transaction = Omit<BankTransaction, "transaction_date"> & {
  transaction_date: string;
};

// Core context interface - focused only on state management
export type AccountsContextType = {
  // State
  accounts: Account[];
  isLoading: boolean;
  error: string | null;

  // Core actions
  refreshAccounts: () => Promise<void>;
  getTransactions: (accountId: string) => Promise<Transaction[]>;

  // Current user
  getCurrentUserId: () => Promise<string | null>;
};

const AccountsContext = createContext<AccountsContextType | null>(null);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch accounts on mount
  useEffect(() => {
    refreshAccounts();
  }, []);

  // Get the current user ID - useful for components to have access to
  const getCurrentUserId = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user?.id || null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  };

  // Refresh all accounts data - the main state management function
  const refreshAccounts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userId = await getCurrentUserId();
      if (!userId) {
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }

      // Use the database utility function to get accounts
      const accountsList = await fetchUserAccounts(userId);

      // For each account, retrieve its transactions
      const accountsWithTransactions = await Promise.all(
        accountsList.map(async (account) => {
          const transactions = await fetchTxs(account.id);
          return {
            ...account,
            transactions,
          };
        })
      );

      setAccounts(accountsWithTransactions);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch accounts";
      setError(message);
      console.error("Error fetching accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get transactions for a specific account - minimal wrapper around the database function
  const getTransactions = async (accountId: string): Promise<Transaction[]> => {
    try {
      const transactions = await fetchTxs(accountId);
      return transactions as unknown as Transaction[];
    } catch (error) {
      console.error(
        `Error fetching transactions for account ${accountId}:`,
        error
      );
      return [];
    }
  };

  return (
    <AccountsContext.Provider
      value={{
        // State
        accounts,
        isLoading,
        error,

        // Core actions
        refreshAccounts,
        getTransactions,

        // User info
        getCurrentUserId,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error("useAccounts must be used within an AccountsProvider");
  }
  return context;
}
