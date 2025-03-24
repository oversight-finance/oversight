import { createClient } from "@/utils/supabase/client";
import { CryptoWalletTransaction } from "@/types/Transaction";

type CreateCryptoWalletTransactionData = Omit<CryptoWalletTransaction, "id">;
type TransactionResult = { id: string; account_id: string };

/**
 * Fetches transactions for a specific crypto wallet
 * @param accountId The account ID of the crypto wallet
 * @returns Array of transactions or empty array if none found
 */
export const fetchCryptoWalletTransactions = async (
  accountId: string
): Promise<CryptoWalletTransaction[]> => {
  if (!accountId) return [];

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("crypto_wallet_transactions")
      .select("*")
      .eq("account_id", accountId)
      .order("transaction_date", { ascending: false });

    if (error) {
      console.error(
        "Error fetching crypto wallet transactions:",
        error.message
      );
      return [];
    }

    return data as CryptoWalletTransaction[];
  } catch (error) {
    console.error("Exception fetching crypto wallet transactions:", error);
    return [];
  }
};

/**
 * Fetches a specific crypto wallet transaction by ID
 * @param transactionId The ID of the transaction to fetch
 * @returns The transaction or null if not found
 */
export const fetchCryptoWalletTransactionById = async (
  transactionId: string
): Promise<CryptoWalletTransaction | null> => {
  if (!transactionId) return null;

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("crypto_wallet_transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (error) {
      console.error("Error fetching crypto wallet transaction:", error.message);
      return null;
    }

    return data as CryptoWalletTransaction;
  } catch (error) {
    console.error("Exception fetching crypto wallet transaction:", error);
    return null;
  }
};

/**
 * Core implementation function for creating crypto wallet transactions
 * @param transactions Array of transaction data to insert
 * @returns Array of created transaction IDs or null if creation failed
 */
const createCryptoWalletTransactionsCore = async (
  transactions: CreateCryptoWalletTransactionData[]
): Promise<TransactionResult[] | null> => {
  if (!transactions.length) return null;

  // Ensure all transactions have an account_id
  const invalidTransaction = transactions.find((tx) => !tx.account_id);
  if (invalidTransaction) return null;

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("crypto_wallet_transactions")
      .insert(transactions)
      .select("id, account_id");

    if (error) {
      console.error(
        "Error creating crypto wallet transactions:",
        error.message
      );
      return null;
    }

    return data as TransactionResult[];
  } catch (error) {
    console.error("Exception creating crypto wallet transactions:", error);
    return null;
  }
};

/**
 * Creates a new crypto wallet transaction
 * @param transaction The transaction data to insert
 * @returns The created transaction ID or null if creation failed
 */
export const createCryptoWalletTransaction = async (
  transaction: CreateCryptoWalletTransactionData
): Promise<string | null> => {
  const results = await createCryptoWalletTransactionsCore([transaction]);
  return results ? results[0].id : null;
};

/**
 * Creates multiple crypto wallet transactions in a batch operation
 * @param transactions Array of transactions to create
 * @returns Array of created transaction IDs or null if creation failed
 */
export const createCryptoWalletTransactionBatch = async (
  transactions: CreateCryptoWalletTransactionData[]
): Promise<string[] | null> => {
  const results = await createCryptoWalletTransactionsCore(transactions);
  return results ? results.map((r) => r.id) : null;
};

/**
 * Creates multiple transactions for a specific crypto wallet
 * @param transactions Array of partial transaction data (account_id will be set automatically)
 * @param accountId The account ID these transactions belong to
 * @returns Array of created transaction IDs or null if creation failed
 */
export const createCryptoWalletTransactionsForAccount = async (
  transactions: Omit<CreateCryptoWalletTransactionData, "account_id">[],
  accountId: string
): Promise<string[] | null> => {
  if (!accountId || !transactions.length) return null;

  // Add account_id to all transactions
  const completeTransactions = transactions.map((tx) => ({
    ...tx,
    account_id: accountId,
  }));

  return await createCryptoWalletTransactionBatch(completeTransactions);
};

/**
 * Core implementation for updating crypto wallet transactions
 * @param transactionIds Array of transaction IDs to update
 * @param updates The updates to apply to each transaction
 * @returns Map of transaction IDs to success/failure status
 */
const updateCryptoWalletTransactionsCore = async (
  transactionIds: string[],
  updates: Partial<CreateCryptoWalletTransactionData>
): Promise<Map<string, boolean>> => {
  if (!transactionIds.length) return new Map();

  const supabase = createClient();
  const results = new Map<string, boolean>();

  try {
    // Update the transactions
    const { error } = await supabase
      .from("crypto_wallet_transactions")
      .update(updates)
      .in("id", transactionIds);

    if (error) {
      console.error(
        "Error updating crypto wallet transactions:",
        error.message
      );
      // Set all transactions as failed
      transactionIds.forEach((id) => results.set(id, false));
      return results;
    }

    // Set all transactions as successful
    transactionIds.forEach((id) => results.set(id, true));
    return results;
  } catch (error) {
    console.error("Exception updating crypto wallet transactions:", error);
    // Set all transactions as failed
    transactionIds.forEach((id) => results.set(id, false));
    return results;
  }
};

/**
 * Updates an existing crypto wallet transaction
 * @param transactionId The ID of the transaction to update
 * @param updates The transaction fields to update
 * @returns True if successful, false otherwise
 */
export const updateCryptoWalletTransaction = async (
  transactionId: string,
  updates: Partial<CreateCryptoWalletTransactionData>
): Promise<boolean> => {
  if (!transactionId) return false;

  const results = await updateCryptoWalletTransactionsCore(
    [transactionId],
    updates
  );
  return results.get(transactionId) || false;
};

/**
 * Updates multiple crypto wallet transactions with the same updates
 * @param transactionIds Array of transaction IDs to update
 * @param updates The updates to apply to all transactions
 * @returns Map of transaction IDs to success/failure status
 */
export const updateCryptoWalletTransactionBatch = async (
  transactionIds: string[],
  updates: Partial<CreateCryptoWalletTransactionData>
): Promise<Map<string, boolean>> => {
  return await updateCryptoWalletTransactionsCore(transactionIds, updates);
};

/**
 * Core implementation for deleting crypto wallet transactions
 * @param transactionIds Array of transaction IDs to delete
 * @returns Map of transaction IDs to success/failure status
 */
const deleteCryptoWalletTransactionsCore = async (
  transactionIds: string[]
): Promise<Map<string, boolean>> => {
  if (!transactionIds.length) return new Map();

  const supabase = createClient();
  const results = new Map<string, boolean>();

  try {
    // Delete the transactions
    const { error } = await supabase
      .from("crypto_wallet_transactions")
      .delete()
      .in("id", transactionIds);

    if (error) {
      console.error(
        "Error deleting crypto wallet transactions:",
        error.message
      );
      // Set all transactions as failed
      transactionIds.forEach((id) => results.set(id, false));
      return results;
    }

    // Set all transactions as successful
    transactionIds.forEach((id) => results.set(id, true));
    return results;
  } catch (error) {
    console.error("Exception deleting crypto wallet transactions:", error);
    // Set all transactions as failed
    transactionIds.forEach((id) => results.set(id, false));
    return results;
  }
};

/**
 * Deletes a crypto wallet transaction
 * @param transactionId The ID of the transaction to delete
 * @returns True if successful, false otherwise
 */
export const deleteCryptoWalletTransaction = async (
  transactionId: string
): Promise<boolean> => {
  if (!transactionId) return false;

  const results = await deleteCryptoWalletTransactionsCore([transactionId]);
  return results.get(transactionId) || false;
};

/**
 * Deletes multiple crypto wallet transactions
 * @param transactionIds Array of transaction IDs to delete
 * @returns Map of transaction IDs to success/failure status
 */
export const deleteCryptoWalletTransactionBatch = async (
  transactionIds: string[]
): Promise<Map<string, boolean>> => {
  return await deleteCryptoWalletTransactionsCore(transactionIds);
};
