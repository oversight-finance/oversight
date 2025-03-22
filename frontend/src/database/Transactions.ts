import { createClient } from "@/utils/supabase/client";
import { BankAccountTransaction } from "@/types";
import { syncAccountBalance } from "./Accounts";

type CreateBankTransactionData = Omit<BankAccountTransaction, "id">;
type TransactionResult = { id: string; account_id: string };

/**
 * Fetches all transactions for a specific account
 * @param accountId The ID of the account whose transactions to fetch
 * @param limit Optional limit for the number of transactions to return
 * @param offset Optional offset for pagination
 * @returns Array of transactions or empty array if none found
 */
export const fetchBankAccountTransactions = async (
  accountId: string,
  limit?: number,
  offset?: number
): Promise<BankAccountTransaction[]> => {
  if (!accountId) {
    console.error("No account ID provided to fetchAccountTransactions");
    return [];
  }

  try {
    const supabase = createClient();

    let query = supabase
      .from("bank_accounts_transactions")
      .select("*")
      .eq("account_id", accountId)
      .order("transaction_date", { ascending: false });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 20) - 1);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching account transactions:", error.message);
      return [];
    }

    return data as BankAccountTransaction[];
  } catch (error) {
    console.error("Exception fetching account transactions:", error);
    return [];
  }
};

/**
 * Fetches a specific transaction by ID
 * @param transactionId The ID of the transaction to fetch
 * @returns The transaction or null if not found
 */
export const fetchBankTransactionById = async (
  transactionId: string
): Promise<BankAccountTransaction | null> => {
  if (!transactionId) return null;

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("bank_accounts_transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (error) {
      console.error("Error fetching transaction:", error.message);
      return null;
    }

    return data as BankAccountTransaction;
  } catch (error) {
    console.error("Exception fetching transaction:", error);
    return null;
  }
};

/**
 * Core implementation function for creating transactions
 * @param transactions Array of transaction data to insert
 * @returns Array of created transaction IDs or null if creation failed
 */
const createTransactionsCore = async (
  transactions: CreateBankTransactionData[]
): Promise<TransactionResult[] | null> => {
  if (!transactions.length) return null;

  // Ensure all transactions have an account_id
  const invalidTransaction = transactions.find((tx) => !tx.account_id);
  if (invalidTransaction) return null;

  try {
    const supabase = createClient();

    const now = new Date().toISOString();
    const preparedTransactions = transactions.map((tx) => ({
      ...tx,
      transaction_date: now,
    }));

    const { data, error } = await supabase
      .from("bank_accounts_transactions")
      .insert(preparedTransactions)
      .select("id, account_id");

    if (error) {
      console.error("Error creating transactions:", error.message);
      return null;
    }

    // Get the unique account IDs to update balances
    const accountIdsToUpdate = new Set<string>();
    for (const tx of data) {
      accountIdsToUpdate.add(tx.account_id);
    }

    // Update all affected account balances in parallel
    const updatePromises =
      Array.from(accountIdsToUpdate).map(syncAccountBalance);
    await Promise.all(updatePromises);

    return data as TransactionResult[];
  } catch (error) {
    console.error("Exception creating transactions:", error);
    return null;
  }
};

/**
 * Creates a new transaction and updates account balance
 * @param transaction The transaction data to insert
 * @returns The created transaction ID or null if creation failed
 */
export const createTransaction = async (
  transaction: CreateBankTransactionData
): Promise<string | null> => {
  const results = await createTransactionsCore([transaction]);
  return results ? results[0].id : null;
};

/**
 * Creates multiple transactions in a batch operation
 * @param transactions Array of transactions to create
 * @returns Array of created transaction IDs or null if creation failed
 */
export const createBankTransactionBatch = async (
  transactions: CreateBankTransactionData[]
): Promise<string[] | null> => {
  const results = await createTransactionsCore(transactions);
  return results ? results.map((r) => r.id) : null;
};

/**
 * Creates multiple transactions for a specific account
 * @param transactions Array of partial transaction data (account_id will be set automatically)
 * @param accountId The account ID these transactions belong to
 * @returns Array of created transaction IDs or null if creation failed
 */
export const createBankTransactionsForAccount = async (
  transactions: Omit<CreateBankTransactionData, "account_id">[],
  accountId: string
): Promise<string[] | null> => {
  if (!accountId || !transactions.length) return null;

  // Add account_id to all transactions
  const completeTransactions = transactions.map((tx) => ({
    ...tx,
    account_id: accountId,
  }));

  return await createBankTransactionBatch(completeTransactions);
};

/**
 * Core implementation for updating transactions
 * @param transactionIds Array of transaction IDs to update
 * @param updates The updates to apply to each transaction
 * @returns Map of transaction IDs to success/failure status
 */
const updateBankTransactionsCore = async (
  transactionIds: string[],
  updates: Partial<CreateBankTransactionData>
): Promise<Map<string, boolean>> => {
  if (!transactionIds.length) return new Map();

  const supabase = createClient();
  const results = new Map<string, boolean>();
  const accountsToUpdate = new Set<string>();

  try {
    // First get all the transactions to know which accounts to sync
    const { data: currentTransactions, error: fetchError } = await supabase
      .from("bank_accounts_transactions")
      .select("id, account_id")
      .in("id", transactionIds);

    if (fetchError) {
      console.error(
        "Error fetching transactions for update:",
        fetchError.message
      );
      // Set all transactions as failed
      transactionIds.forEach((id) => results.set(id, false));
      return results;
    }

    // Create a map of transaction ID to account ID for easy lookup
    const transactionAccountMap = new Map<string, string>();
    currentTransactions.forEach((tx) => {
      transactionAccountMap.set(tx.id, tx.account_id);
      accountsToUpdate.add(tx.account_id);
    });

    // Update the transactions
    const { error } = await supabase
      .from("bank_accounts_transactions")
      .update(updates)
      .in("id", transactionIds);

    if (error) {
      console.error("Error updating transactions:", error.message);
      // Set all transactions as failed
      transactionIds.forEach((id) => results.set(id, false));
      return results;
    }

    // If account_id was changed, add the new account IDs to the set
    if (updates.account_id) {
      accountsToUpdate.add(updates.account_id as string);
    }

    // Update all account balances in parallel
    const updatePromises = Array.from(accountsToUpdate).map(syncAccountBalance);
    await Promise.all(updatePromises);

    // Set all transactions as successful
    transactionIds.forEach((id) => results.set(id, true));

    return results;
  } catch (error) {
    console.error("Exception updating transactions:", error);
    // Set all transactions as failed
    transactionIds.forEach((id) => results.set(id, false));
    return results;
  }
};

/**
 * Updates an existing transaction
 * @param transactionId The ID of the transaction to update
 * @param updates The transaction fields to update
 * @returns True if successful, false otherwise
 */
export const updateBankTransaction = async (
  transactionId: string,
  updates: Partial<CreateBankTransactionData>
): Promise<boolean> => {
  if (!transactionId) return false;

  const results = await updateBankTransactionsCore([transactionId], updates);
  return results.get(transactionId) || false;
};

/**
 * Updates multiple transactions with the same updates
 * @param transactionIds Array of transaction IDs to update
 * @param updates The updates to apply to all transactions
 * @returns Map of transaction IDs to success/failure status
 */
export const updateBankTransactionBatch = async (
  transactionIds: string[],
  updates: Partial<CreateBankTransactionData>
): Promise<Map<string, boolean>> => {
  return await updateBankTransactionsCore(transactionIds, updates);
};

/**
 * Core implementation for deleting transactions
 * @param transactionIds Array of transaction IDs to delete
 * @returns Map of transaction IDs to success/failure status
 */
const deleteBankTransactionsCore = async (
  transactionIds: string[]
): Promise<Map<string, boolean>> => {
  if (!transactionIds.length) return new Map();

  const supabase = createClient();
  const results = new Map<string, boolean>();
  const accountsToUpdate = new Set<string>();

  try {
    // First get all the transactions to know which accounts to sync
    const { data: transactions, error: fetchError } = await supabase
      .from("bank_accounts_transactions")
      .select("id, account_id")
      .in("id", transactionIds);

    if (fetchError) {
      console.error(
        "Error fetching transactions for deletion:",
        fetchError.message
      );
      // Set all transactions as failed
      transactionIds.forEach((id) => results.set(id, false));
      return results;
    }

    // Track which accounts will need balance updates
    transactions.forEach((tx) => {
      accountsToUpdate.add(tx.account_id);
    });

    // Delete the transactions
    const { error } = await supabase
      .from("bank_accounts_transactions")
      .delete()
      .in("id", transactionIds);

    if (error) {
      console.error("Error deleting transactions:", error.message);
      // Set all transactions as failed
      transactionIds.forEach((id) => results.set(id, false));
      return results;
    }

    // Update all account balances in parallel
    const updatePromises = Array.from(accountsToUpdate).map(syncAccountBalance);
    await Promise.all(updatePromises);

    // Set all transactions as successful
    transactionIds.forEach((id) => results.set(id, true));

    return results;
  } catch (error) {
    console.error("Exception deleting transactions:", error);
    // Set all transactions as failed
    transactionIds.forEach((id) => results.set(id, false));
    return results;
  }
};

/**
 * Deletes a transaction
 * @param transactionId The ID of the transaction to delete
 * @returns True if successful, false otherwise
 */
export const deleteBankTransaction = async (
  transactionId: string
): Promise<boolean> => {
  if (!transactionId) return false;

  const results = await deleteBankTransactionsCore([transactionId]);
  return results.get(transactionId) || false;
};

/**
 * Deletes multiple transactions
 * @param transactionIds Array of transaction IDs to delete
 * @returns Map of transaction IDs to success/failure status
 */
export const deleteBankTransactionBatch = async (
  transactionIds: string[]
): Promise<Map<string, boolean>> => {
  return await deleteBankTransactionsCore(transactionIds);
};

/**
 * Fetches transactions for a specific date range with optional filtering
 * @param accountId The account ID to fetch transactions for
 * @param startDate The start date of the range (inclusive)
 * @param endDate The end date of the range (inclusive)
 * @param filters Optional additional filters like merchant or category
 * @returns Array of transactions or empty array if none found
 */
export const fetchBankTransactionsByDateRange = async (
  accountId: string,
  startDate: string,
  endDate: string,
  filters?: {
    merchant?: string;
    category?: string;
    minAmount?: number;
    maxAmount?: number;
  }
): Promise<BankAccountTransaction[]> => {
  if (!accountId) return [];

  try {
    const supabase = createClient();

    let query = supabase
      .from("bank_accounts_transactions")
      .select("*")
      .eq("account_id", accountId)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate);

    // Apply optional filters
    if (filters) {
      if (filters.merchant) {
        query = query.ilike("merchant", `%${filters.merchant}%`);
      }

      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      if (filters.minAmount !== undefined) {
        query = query.gte("amount", filters.minAmount);
      }

      if (filters.maxAmount !== undefined) {
        query = query.lte("amount", filters.maxAmount);
      }
    }

    // Order by date descending
    query = query.order("transaction_date", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error(
        "Error fetching transactions by date range:",
        error.message
      );
      return [];
    }

    return data as BankAccountTransaction[];
  } catch (error) {
    console.error("Exception fetching transactions by date range:", error);
    return [];
  }
};
