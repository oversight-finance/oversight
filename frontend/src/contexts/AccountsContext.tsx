"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Account, AccountType } from "@/types/Account";
import { BankAccountTransaction } from "@/types";
import { createClient } from "@/utils/supabase/client";
import {
  fetchUserAccounts,
  createAccount,
  fetchAccountById,
} from "@/database/Accounts";
import { fetchBankAccountTransactions as fetchTxs } from "@/database/Transactions";

// Export database functions directly so components can use them
export type { Account, AccountType } from "@/types/Account";
export type { BankAccountTransaction } from "@/types";
export * from "@/database/Accounts";
export * from "@/database/Transactions";

// Create a union type for all transaction types (currently just bank transactions)
export type Transaction = BankAccountTransaction; // Will extend with other types later

// Core context interface - focused only on state management
export type AccountsContextType = {
  // State
  accounts: Account[];
  isLoading: boolean;
  error: string | null;

  // Core actions
  refreshAccounts: () => Promise<void>;
  getTransactions: (accountId: string) => Promise<Transaction[]>;
  addAccount: (
    account: Omit<Account, "id" | "created_at" | "updated_at">
  ) => Promise<Account | null>;

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

  // Get transactions for a specific account - handles different account types
  const getTransactions = async (accountId: string): Promise<Transaction[]> => {
    try {
      // First, get the account to determine its type
      const account = await fetchAccountById(accountId);

      if (!account) {
        console.error(`Account not found with ID: ${accountId}`);
        return [];
      }

      // Based on account type, call the appropriate fetch function
      switch (account.account_type) {
        case AccountType.BANK:
          const bankTransactions = await fetchTxs(accountId);
          return bankTransactions as unknown as Transaction[];

        // Add cases for other account types as you implement them
        // case AccountType.INVESTMENT:
        //   return await fetchInvestmentTransactions(accountId) as unknown as Transaction[];

        // case AccountType.CRYPTO:
        //   return await fetchCryptoTransactions(accountId) as unknown as Transaction[];

        default:
          console.error(`Unsupported account type: ${account.account_type}`);
          return [];
      }
    } catch (error) {
      console.error(
        `Error fetching transactions for account ${accountId}:`,
        error
      );
      return [];
    }
  };

  // Add a new account to the database
  const addAccount = async (
    accountData: Omit<Account, "id" | "created_at" | "updated_at">
  ): Promise<Account | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Create the account in the database
      const newAccount = await createAccount(accountData);

      if (!newAccount) {
        throw new Error("Failed to create account");
      }

      // Refresh accounts to include the new account
      await refreshAccounts();

      return newAccount;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create account";
      setError(message);
      console.error("Error creating account:", error);
      return null;
    } finally {
      setIsLoading(false);
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
        addAccount,

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
