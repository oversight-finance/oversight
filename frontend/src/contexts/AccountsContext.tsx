"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Account,
  AccountType,
  Accounts,
  BankAccount,
  CryptoWallet,
  InvestmentAccount,
} from "@/types/Account";
import {
  BankAccountTransaction,
  CryptoWalletTransaction,
  InvestmentTransaction,
} from "@/types/Transaction";
import {
  createAccount,
  deleteAccount as deleteAccountFromDB,
} from "@/database/Accounts";
import {
  createBankTransactionsForAccount,
  deleteBankTransaction,
  deleteBankTransactionBatch,
  fetchBankAccountsWithTransactions,
  fetchCryptoWalletsWithTransactions,
  fetchInvestmentAccountsWithTransactions,
  updateBankTransaction,
} from "@/database";
import {
  createCryptoWalletTransaction,
  createCryptoWalletTransactionsForAccount,
  deleteCryptoWalletTransaction,
  deleteCryptoWalletTransactionBatch,
  updateCryptoWalletTransaction,
} from "@/database/CryptoWalletTransactions";
import {
  createInvestmentTransactionsForAccount,
  deleteInvestmentTransaction,
  deleteInvestmentTransactionBatch,
  updateInvestmentTransaction,
} from "@/database/InvestmentTransactions";
import { createBankAccount, fetchBankAccountWithTransactions } from "@/database/BankAccounts";
import { createCryptoWallet, fetchCryptoWalletWithTransactions } from "@/database/CryptoWallets";
import {
  createInvestmentAccount,
  fetchInvestmentAccount,
  fetchInvestmentAccountWithTransactions,
} from "@/database/InvestmentAccounts";
import { useRouter } from "next/navigation";

// Export database functions directly so components can use them
export * from "@/database/Accounts";
export * from "@/database/Transactions";
export * from "@/database/InvestmentAccounts";
export * from "@/types/Account";

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
  getTransactions: (
    accountType: AccountType,
    accountId: string
  ) => Transaction[];
  getAllTransactions: (accountType: AccountType) => Transaction[];
  getCombinedTransactions: () => Transaction[];
  getCombinedBalances: () => number;
  addTransactions: (
    accountType: AccountType,
    accountId: string,
    transactions: Transaction[]
  ) => Promise<boolean>;
  addAccount: (
    account: Omit<Accounts, "id" | "created_at" | "updated_at">
  ) => Promise<Accounts | null>;
  deleteAccount: (
    accountType: AccountType,
    accountId: string
  ) => Promise<boolean>;
  deleteTransaction: (
    accountType: AccountType,
    accountId: string,
    transactionId: string
  ) => Promise<boolean>;
  deleteBatchTransaction: (
    accountType: AccountType,
    accountId: string,
    transactionIds: string[]
  ) => Promise<boolean>;
  updateTransaction: (
    accountType: AccountType,
    accountId: string,
    transactionId: string,
    transaction: Transaction
  ) => Promise<boolean>;
};

const AccountsContext = createContext<AccountsContextType | null>(null);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
  const { getUserId, isLoading: isAuthLoading } = useAuth();
  const userId = getUserId();

  // Fetch accounts on mount
  useEffect(() => {
    const loadAccounts = async () => {
      await refreshAccounts();
    };

    loadAccounts();
  }, [userId]);

  // Refresh all accounts data - the main state management function
  const refreshAccounts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Wait for auth context to be ready
      if (isAuthLoading) {
        return;
      }
      if (!userId) {
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }

      const accounts: Record<
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
    const account = accounts[accountType]?.[accountId];
    if (!account) {
      console.error(`Account not found: ${accountType} ${accountId}`);
      return [];
    }
    if (!account.transactions) {
      console.error(
        `No transactions found for account: ${accountType} ${accountId}`
      );
      return [];
    }
    return account.transactions;
  };

  const addTransactions = async (
    accountType: AccountType,
    accountId: string,
    transactions: Transaction[]
  ): Promise<boolean> => {
    if (!accountId || !transactions) {
      console.error("Missing required parameters for addTransaction");
      return false;
    }

    const account = accounts[accountType]?.[accountId];
    if (!account) {
      console.error(`Account not found: ${accountType} ${accountId}`);
      return false;
    }

    // update database accordingly based on account type
    let success = false;
    try {
      switch (accountType) {
        case AccountType.BANK:
          await createBankTransactionsForAccount(
            transactions as BankAccountTransaction[],
            accountId
          );
          success = true;
          break;
        case AccountType.CRYPTO:
          await createCryptoWalletTransactionsForAccount(
            transactions as CryptoWalletTransaction[],
            accountId
          );
          success = true;
          break;
        case AccountType.INVESTMENT:
          await createInvestmentTransactionsForAccount(
            transactions as InvestmentTransaction[],
            accountId
          );
          success = true;
          break;
      }
      if (!success) {
        console.error(
          `Failed to add ${accountType} transactions: ${transactions
            .map((t) => t.id)
            .join(", ")}`
        );
        return false;
      }

      const updatedTransactions = account.transactions.concat(transactions);
      setAccounts((prev) => ({
        ...prev,
        [accountType]: {
          ...prev[accountType],
          [accountId]: { ...account, transactions: updatedTransactions },
        },
      }));
      return true;
    } catch (error) {
      console.error(`Error adding ${accountType} transactions:`, error);
      return false;
    }
  };

  const deleteTransaction = async (
    accountType: AccountType,
    accountId: string,
    transactionId: string
  ): Promise<boolean> => {
    if (!accountId || !transactionId) {
      console.error("Missing required parameters for deleteTransaction");
      return false;
    }

    const account = accounts[accountType]?.[accountId];
    if (!account) {
      console.error(`Account not found: ${accountType} ${accountId}`);
      return false;
    }

    // update database accordingly based on account type
    let success = false;
    try {
      switch (accountType) {
        case AccountType.BANK:
          success = await deleteBankTransaction(transactionId);
          break;
        case AccountType.CRYPTO:
          success = await deleteCryptoWalletTransaction(transactionId);
          break;
        case AccountType.INVESTMENT:
          success = await deleteInvestmentTransaction(transactionId);
          break;
        default:
          console.error(`Unknown account type: ${accountType}`);
          return false;
      }

      if (!success) {
        console.error(
          `Failed to delete ${accountType} transaction with ID: ${transactionId}`
        );
        return false;
      }

      const updatedTransactions = account.transactions.filter(
        (transaction) => transaction.id !== transactionId
      );

      setAccounts((prev) => ({
        ...prev,
        [accountType]: {
          ...prev[accountType],
          [accountId]: { ...account, transactions: updatedTransactions },
        },
      }));

      return true;
    } catch (error) {
      console.error(`Error deleting ${accountType} transaction:`, error);
      return false;
    }
  };

  const deleteBatchTransaction = async (
    accountType: AccountType,
    accountId: string,
    transactionIds: string[]
  ): Promise<boolean> => {
    if (!accountId || !transactionIds) {
      console.error("Missing required parameters for deleteTransaction");
      return false;
    }

    const account = accounts[accountType]?.[accountId];
    if (!account) {
      console.error(`Account not found: ${accountType} ${accountId}`);
      return false;
    }

    // update database accordingly based on account type
    let success = false;
    try {
      switch (accountType) {
        case AccountType.BANK:
          const bankResults = await deleteBankTransactionBatch(transactionIds);
          success = Array.from(bankResults.values()).every(
            (result) => result === true
          );
          break;
        case AccountType.CRYPTO:
          const cryptoResults = await deleteCryptoWalletTransactionBatch(
            transactionIds
          );
          success = Array.from(cryptoResults.values()).every(
            (result) => result === true
          );
          break;
        case AccountType.INVESTMENT:
          const investmentResults = await deleteInvestmentTransactionBatch(
            transactionIds
          );
          success = Array.from(investmentResults.values()).every(
            (result) => result === true
          );
          break;
        default:
          console.error(`Unknown account type: ${accountType}`);
          return false;
      }

      if (!success) {
        console.error(
          `Failed to delete ${accountType} transaction with ID: ${transactionIds}`
        );
        return false;
      }

      const updatedTransactions = account.transactions.filter(
        (transaction) => !transactionIds.includes(transaction.id)
      );

      setAccounts((prev) => ({
        ...prev,
        [accountType]: {
          ...prev[accountType],
          [accountId]: { ...account, transactions: updatedTransactions },
        },
      }));

      return true;
    } catch (error) {
      console.error(`Error deleting ${accountType} transaction:`, error);
      return false;
    }
  };

  const updateTransaction = async (
    accountType: AccountType,
    accountId: string,
    transactionId: string,
    transaction: Transaction
  ): Promise<boolean> => {
    // Validate input parameters
    if (!accountType || !accountId || !transactionId || !transaction) {
      console.error("Missing required parameters for updateTransaction");
      return false;
    }

    // Check if account exists
    const account = accounts[accountType]?.[accountId];
    if (!account) {
      console.error(`Account not found: ${accountType} ${accountId}`);
      return false;
    }

    // Check if transaction exists in this account
    const existingTransaction = account.transactions.find(
      (t) => t.id === transactionId
    );
    if (!existingTransaction) {
      console.error(
        `Transaction with ID ${transactionId} not found in account ${accountId}`
      );
      return false;
    }

    // update database accordingly based on account type
    let success = false;
    try {
      switch (accountType) {
        case AccountType.BANK:
          success = await updateBankTransaction(
            transactionId,
            transaction as BankAccountTransaction
          );
          break;
        case AccountType.CRYPTO:
          success = await updateCryptoWalletTransaction(
            transactionId,
            transaction as CryptoWalletTransaction
          );
          break;
        case AccountType.INVESTMENT:
          await updateInvestmentTransaction(
            transactionId,
            transaction as InvestmentTransaction
          );
          success = true;
          break;
        default:
          console.error(`Unknown account type: ${accountType}`);
          return false;
      }

      if (!success) {
        console.error(
          `Failed to update ${accountType} transaction with ID: ${transactionId}`
        );
        return false;
      }
    } catch (error) {
      console.error(`Error updating ${accountType} transaction:`, error);
      return false;
    }
    const updatedTransactions = account.transactions.map((t) =>
      t.id === transactionId ? transaction : t
    );
    setAccounts((prev) => ({
      ...prev,
      [accountType]: {
        ...prev[accountType],
        [accountId]: { ...account, transactions: updatedTransactions },
      },
    }));
    return true;
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
      setTimeout(async () => {
        await refreshAccounts();
      }, 0);
    } else {
      // If the range is already within our cached data, just update the visible range
      setCachedRange({ start, end });
    }
    setCachedRange({ start, end });
  };

  // Add a new account to the database
  const addAccount = async (
    accountData: Omit<Accounts, "id" | "created_at" | "updated_at">
  ): Promise<Accounts | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the current user ID
      const userId = getUserId();
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Create the account based on its type
      let newAccount: Accounts | null = null;

      switch (accountData.account_type) {
        case AccountType.BANK:
          // For bank accounts, use the specialized bank account creation function
          const bankAccountId = await createBankAccount(
            userId,
            accountData as BankAccount
          );
          if (bankAccountId) {
            const bankAccount = await fetchBankAccountWithTransactions(bankAccountId);
            
            if (bankAccount) {
              setAccounts((prevAccounts) => ({
                ...prevAccounts,
                [AccountType.BANK]: {
                  ...prevAccounts[AccountType.BANK],
                  [bankAccountId]: {
                    ...bankAccount,
                  },
                },
              }));
              router.push(`/accounts/bank/${bankAccountId}`);
            }
            newAccount = bankAccount;
          }
          break;

        case AccountType.INVESTMENT:
          // For investment accounts, use the specialized investment account creation function
          const investmentAccountId = await createInvestmentAccount(
            userId,
            accountData as InvestmentAccount
          );
          if (investmentAccountId) {
            const investmentAccount =
              await fetchInvestmentAccountWithTransactions(investmentAccountId);

            if (investmentAccount) {
              setAccounts((prevAccounts) => ({
                ...prevAccounts,
                [AccountType.INVESTMENT]: {
                  ...prevAccounts[AccountType.INVESTMENT],
                  [investmentAccountId]: {
                    ...investmentAccount,
                  },
                },
              }));
            }
            newAccount = investmentAccount;
          }
          break;

        case AccountType.CRYPTO:
          // For crypto wallets, use the specialized crypto wallet creation function
          const cryptoWalletId = await createCryptoWallet(
            userId,
            accountData as CryptoWallet
          );
          if (cryptoWalletId) {
            const cryptoWallet = await fetchCryptoWalletWithTransactions(cryptoWalletId);
            
            if (cryptoWallet) {
              setAccounts((prevAccounts) => ({
                ...prevAccounts,
                [AccountType.CRYPTO]: {
                  ...prevAccounts[AccountType.CRYPTO],
                  [cryptoWalletId]: {
                    ...cryptoWallet,
                  },
                },
              }));
            }
            newAccount = cryptoWallet;
          }
          break;

        case AccountType.CREDIT:
        case AccountType.SAVINGS:
          // For now, these account types use the generic account creation
          // TODO: Implement specialized handlers for CREDIT and SAVINGS accounts
          // newAccount = await createAccount(accountData);
          // await refreshAccounts();
          break;

        default:
          throw new Error(
            `Unsupported account type: ${accountData.account_type}`
          );
      }

      if (!newAccount) {
        console.log(`Failed to create ${accountData.account_type} account`);
      }

      return newAccount as Accounts;
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

  // Delete an account
  const deleteAccount = async (
    accountType: AccountType,
    accountId: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!accountId) {
        console.error("Missing account ID for deleteAccount");
        return false;
      }

      const account = accounts[accountType]?.[accountId];
      if (!account) {
        console.error(`Account not found: ${accountType} ${accountId}`);
        return false;
      }

      // Delete account from the database - cascade will handle related transactions
      const success = await deleteAccountFromDB(accountId);

      if (!success) {
        throw new Error(
          `Failed to delete ${accountType} account with ID: ${accountId}`
        );
      }

      // Update our state to remove the deleted account
      setAccounts((prev) => {
        const updatedAccounts = { ...prev };
        if (updatedAccounts[accountType]) {
          const accountsCopy = { ...updatedAccounts[accountType] };
          delete accountsCopy[accountId];
          updatedAccounts[accountType] = accountsCopy;
        }
        return updatedAccounts;
      });

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete account";
      setError(message);
      console.error("Error deleting account:", error);
      return false;
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
        addTransactions,
        deleteAccount,
        deleteTransaction,
        deleteBatchTransaction,
        updateTransaction,
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
