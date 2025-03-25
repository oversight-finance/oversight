"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Account, AccountType, Accounts } from "@/types/Account";
import {
  BankAccountTransaction,
  CryptoWalletTransaction,
  InvestmentTransaction,
} from "@/types/Transaction";
import { createAccount } from "@/database/Accounts";
import {
  fetchBankAccountsWithTransactions,
  fetchCryptoWalletsWithTransactions,
  fetchInvestmentAccountsWithTransactions,
} from "@/database";

// Export database functions directly so components can use them
export * from "@/database/Accounts";
export * from "@/database/Transactions";

// Create a union type for all transaction types
export type Transaction =
  | BankAccountTransaction
  | CryptoWalletTransaction
  | InvestmentTransaction;

// Extended account type that includes transactions data
export type AccountWithTransactions = Accounts & {
  transactions: Transaction[];
};

// Core context interface - focused only on state management
export type AccountsContextType = {
  // State
  accounts: Record<AccountType, Record<string, AccountWithTransactions>>;
  isLoading: boolean;
  error: string | null;

  // Core actions
  refreshAccounts: () => Promise<void>;
  getTransactions: (accountType: AccountType, accountId: string) => Transaction[];
  getAllTransactions: (accountType: AccountType) => Transaction[];
  getCombinedTransactions: () => Transaction[];
  getCombinedBalances: () => number;
  addAccount: (
    account: Omit<Account, "id" | "created_at" | "updated_at">
  ) => Promise<Account | null>;
};

const AccountsContext = createContext<AccountsContextType | null>(null);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<
    Record<AccountType, Record<string, AccountWithTransactions>>
  >({} as Record<AccountType, Record<string, AccountWithTransactions>>);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedRange, setCachedRange] = useState<{ start: Date; end: Date }>(
    () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      return { start: startDate, end: endDate };
    }
  );
  const { getUserId } = useAuth();
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

      let accounts: Record<
        AccountType,
        Record<string, AccountWithTransactions>
      > = {
        [AccountType.BANK]: await fetchBankAccountsWithTransactions(
          userId,
          AccountType.BANK
        ),
        // TODO: Support CREDIT and SAVINGS accounts
        // Currently fetches ALL transactions for all accounts
        // TODO: Implement date range filtering optimizations
        [AccountType.CREDIT]: {}, // await fetchBankAccountsWithTransactions(userId, AccountType.CREDIT, cachedRange),
        [AccountType.SAVINGS]: {}, // await fetchBankAccountsWithTransactions(userId, AccountType.SAVINGS, cachedRange),
        [AccountType.INVESTMENT]: await fetchInvestmentAccountsWithTransactions(
          userId
        ),
        [AccountType.CRYPTO]: await fetchCryptoWalletsWithTransactions(userId),
      };

      setAccounts(accounts);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch accounts";
      setError(message);
      console.error("Error fetching accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get all transactions for a specific account type
   * @param accountType - The type of account to get transactions for
   * @returns An array of transactions
   */
  const getAllTransactions = (accountType: AccountType): Transaction[] => {
    if (!accounts[accountType]) {
      return [];
    }
    const accountsOfType = Object.values(accounts[accountType]);
    return accountsOfType.flatMap((account) => account.transactions);
  };

  /**
   * Get combined transactions for all accounts types
   * @returns An array of transactions
   */
  const getCombinedTransactions = (): Transaction[] => {
    // Get all transactions from each account type
    const allTransactions = Object.values(AccountType).flatMap(
      (accountType) => {
        return getAllTransactions(accountType).map((transaction) => {
          // For investment and crypto transactions, calculate the actual amount
          if (
            "price_per_unit" in transaction &&
            transaction.quantity &&
            transaction.price_per_unit
          ) {
            // Investment transaction
            const amount = transaction.price_per_unit * transaction.quantity;
            return {
              ...transaction,
              amount:
                amount * (transaction.transaction_type === "sell" ? -1 : 1),
            };
          } else if ("price_at_transaction" in transaction) {
            // Crypto transaction
            const amount =
              transaction.price_at_transaction * transaction.amount;
            return {
              ...transaction,
              amount:
                amount * (transaction.transaction_type === "sell" ? -1 : 1),
            };
          }
          return transaction;
        });
      }
    );

    // Sort transactions by date, most recent first
    return allTransactions.sort(
      (a, b) =>
        new Date(b.transaction_date).getTime() -
        new Date(a.transaction_date).getTime()
    );
  };

  const getCombinedBalances = (): number => {
    const combinedTransactions = getCombinedTransactions();
    return combinedTransactions.reduce((acc, transaction) => {
      return acc + transaction.amount;
    }, 0);
  };
  // Get transactions for a specific account - handles different account types
  const getTransactions = (
    accountType: AccountType,
    accountId: string
  ): Transaction[] => {
    const account = accounts[accountType][accountId];
    return account.transactions;
  };

  const setDateRange = (start: Date, end: Date) => {
    // Check if the requested date range is already cached
    if (
      !cachedRange ||
      start.getTime() < cachedRange.start.getTime() ||
      end.getTime() > cachedRange.end.getTime()
    ) {
      // If the range isn't cached or is outside the current cache, refresh accounts with the new range
      const newRange = { start, end };
      setCachedRange(newRange);

      // Trigger a refresh with the new date range
      setTimeout(() => {
        refreshAccounts();
      }, 0);
    } else {
      // If the range is already within our cached data, just update the visible range
      setCachedRange({ start, end });
    }
    setCachedRange({ start, end });
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
        accounts: accounts,
        isLoading,
        error,

        // Core actions
        refreshAccounts,
        getTransactions,
        getAllTransactions,
        getCombinedTransactions,
        getCombinedBalances,
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
