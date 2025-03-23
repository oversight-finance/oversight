"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Account,
  AccountType,
  BankAccount,
  InvestmentAccount,
  CryptoWallet,
  BankAccountWithTransactions,
} from "@/types/Account";
import {
  BankAccountTransaction,
  CryptoWalletTransaction,
  InvestmentTransaction,
} from "@/types/Transaction";
import { createClient } from "@/utils/supabase/client";
import {
  fetchUserAccounts,
  createAccount,
  fetchAccountById,
} from "@/database/Accounts";
import {
  fetchBankAccountTransactions as fetchBankTxs,
  // TODO: Implement these functions in the database/Transactions.ts file
  // fetchInvestmentTransactions as fetchInvestmentTxs,
  // fetchCryptoTransactions as fetchCryptoTxs
} from "@/database/Transactions";

// Export database functions directly so components can use them
export * from "@/database/Accounts";
export * from "@/database/Transactions";

// Create a union type for all transaction types
export type Transaction =
  | BankAccountTransaction
  | CryptoWalletTransaction
  | InvestmentTransaction;

// Extended account type that includes transactions data
export type AccountWithTransactions = Account & {
  transactions?: Transaction[];
};

// Core context interface - focused only on state management
export type AccountsContextType = {
  // State
  accounts: AccountWithTransactions[];
  isLoading: boolean;
  error: string | null;

  // Core actions
  refreshAccounts: () => Promise<void>;
  getTransactions: (accountId: string) => Promise<Transaction[]>;
  addAccount: (
    account: Omit<Account, "id" | "created_at" | "updated_at">
  ) => Promise<Account | null>;
};

const AccountsContext = createContext<AccountsContextType | null>(null);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<AccountWithTransactions[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getUserId } = useAuth();
  const supabase = createClient();
  const userId = getUserId();

  // Fetch accounts on mount
  useEffect(() => {
    refreshAccounts();
  }, [userId]);

  // Refresh all accounts data - the main state management function
  const refreshAccounts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!userId) {
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }

      // Use the database utility function to get accounts
      const accountsList = await fetchUserAccounts(userId);

      // For each account, retrieve its transactions based on account type
      const accountsWithTransactions = await Promise.all(
        accountsList.map(async (account) => {
          let transactions: Transaction[] = [];

          switch (account.account_type) {
            case AccountType.BANK:
            case AccountType.CREDIT:
            case AccountType.SAVINGS:
              transactions = await fetchBankTxs(account.id);
              break;
            case AccountType.INVESTMENT:
            case AccountType.STOCK:
              // TODO: Implement fetchInvestmentTxs
              // transactions = await fetchInvestmentTxs(account.id);
              console.warn("Investment transactions not yet implemented");
              break;
            case AccountType.CRYPTO:
              // TODO: Implement fetchCryptoTxs
              // transactions = await fetchCryptoTxs(account.id);
              console.warn("Crypto transactions not yet implemented");
              break;
            default:
              // Handle unsupported account types
              console.warn(
                `Transactions for account type ${account.account_type} not yet supported`
              );
          }

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
        case AccountType.CREDIT:
        case AccountType.SAVINGS:
          return await fetchBankTxs(accountId);

        case AccountType.INVESTMENT:
        case AccountType.STOCK:
          // TODO: Implement fetchInvestmentTxs
          // return await fetchInvestmentTxs(accountId);
          console.warn("Investment transactions not yet implemented");
          return [];

        case AccountType.CRYPTO:
          // TODO: Implement fetchCryptoTxs
          // return await fetchCryptoTxs(accountId);
          console.warn("Crypto transactions not yet implemented");
          return [];

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
