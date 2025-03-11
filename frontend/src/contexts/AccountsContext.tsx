"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  Account,
  Transaction,
  calculateAccountBalance,
  createInitialTransaction,
} from "../types/Account";
import { createClient } from "@/utils/supabase/client";

export type AccountsContextType = {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
  addAccount: (newAccount: {
    account_name: string;
    account_type: string;
    account_number: string;
    balance?: number;
  }) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchAccountTransactions: (accountId: string) => Promise<Transaction[]>;
  addTransaction: (
    transaction: Omit<Transaction, "id" | "created_at">
  ) => Promise<void>;
  updateTransaction: (
    id: string,
    updates: Partial<Transaction>
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
};

const AccountsContext = createContext<AccountsContextType | null>(null);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Fetch all accounts for the current user
  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }

      // Use the custom database function to get accounts with balances
      const { data, error } = await supabase.rpc("get_accounts_with_balances", {
        user_id_param: user.id,
      });

      if (error) {
        throw error;
      }

      // For each account, retrieve its transactions
      const accountsWithTransactions = await Promise.all(
        data.map(async (account) => {
          const transactions = await fetchAccountTransactions(account.id);
          return {
            ...account,
            transactions,
          };
        })
      );

      setAccounts(accountsWithTransactions);
    } catch (error: any) {
      setError(error.message || "Failed to fetch accounts");
      console.error("Error fetching accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch transactions for a specific account
  const fetchAccountTransactions = async (
    accountId: string
  ): Promise<Transaction[]> => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("account_id", accountId)
        .order("transaction_date", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error(
        `Error fetching transactions for account ${accountId}:`,
        error
      );
      return [];
    }
  };

  // Get a single account with all its transactions
  const getAccountWithTransactions = async (
    accountId: string
  ): Promise<Account | null> => {
    try {
      // Use the custom database function to get account with transactions
      const { data, error } = await supabase.rpc(
        "get_account_with_transactions",
        { account_id_param: accountId }
      );

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // The function returns an array but we only need the first item
      const accountData = data[0];

      return {
        id: accountData.account_id,
        user_id: accountData.user_id,
        account_name: accountData.account_name,
        account_number: accountData.account_number,
        account_type: accountData.account_type,
        created_at: accountData.created_at,
        balance: accountData.balance,
        transactions: accountData.transactions || [],
      };
    } catch (error: any) {
      console.error(
        `Error fetching account with transactions for ${accountId}:`,
        error
      );
      return null;
    }
  };

  // Add a new account
  const addAccount = async (newAccount: {
    account_name: string;
    account_type: string;
    account_number: string;
    balance?: number;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("User not authenticated");
        return;
      }

      // Extract the balance for initial transaction
      const { balance, ...accountData } = newAccount;

      // Insert the new account
      const { data: accountResponse, error: accountError } = await supabase
        .from("accounts")
        .insert([
          {
            ...accountData,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (accountError) {
        throw accountError;
      }

      // Create initial transaction if balance is provided
      if (balance && balance !== 0) {
        const initialTransaction = createInitialTransaction(balance);

        const { error: transactionError } = await supabase
          .from("transactions")
          .insert([
            {
              ...initialTransaction,
              account_id: accountResponse.id,
              user_id: user.id,
            },
          ]);

        if (transactionError) {
          throw transactionError;
        }
      }

      // Refresh accounts
      await fetchAccounts();
    } catch (error: any) {
      setError(error.message || "Failed to add account");
      console.error("Error adding account:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove an account
  const removeAccount = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Delete account (transactions will cascade delete due to DB constraints)
      const { error } = await supabase.from("accounts").delete().eq("id", id);

      if (error) {
        throw error;
      }

      // Update local state
      setAccounts((current) => current.filter((account) => account.id !== id));
    } catch (error: any) {
      setError(error.message || "Failed to remove account");
      console.error("Error removing account:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update an account
  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      setIsLoading(true);
      setError(null);

      // Remove non-DB fields before sending to Supabase
      const { balance, transactions, ...dbUpdates } = updates;

      const { error } = await supabase
        .from("accounts")
        .update(dbUpdates)
        .eq("id", id);

      if (error) {
        throw error;
      }

      // Refresh accounts to get updated data
      await fetchAccounts();
    } catch (error: any) {
      setError(error.message || "Failed to update account");
      console.error("Error updating account:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new transaction
  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "createdAt">
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("User not authenticated");
        return;
      }

      // Add user_id if not provided
      if (!transaction.userId) {
        transaction.userId = user.id;
      }

      const { error } = await supabase
        .from("transactions")
        .insert([transaction]);

      if (error) {
        throw error;
      }

      // Refresh accounts to update balances
      await fetchAccounts();
    } catch (error: any) {
      setError(error.message || "Failed to add transaction");
      console.error("Error adding transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update a transaction
  const updateTransaction = async (
    id: string,
    updates: Partial<Transaction>
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id);

      if (error) {
        throw error;
      }

      // Refresh accounts to update balances
      await fetchAccounts();
    } catch (error: any) {
      setError(error.message || "Failed to update transaction");
      console.error("Error updating transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a transaction
  const deleteTransaction = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      // Refresh accounts to update balances
      await fetchAccounts();
    } catch (error: any) {
      setError(error.message || "Failed to delete transaction");
      console.error("Error deleting transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AccountsContext.Provider
      value={{
        accounts,
        isLoading,
        error,
        addAccount,
        removeAccount,
        updateAccount,
        fetchAccounts,
        fetchAccountTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
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
