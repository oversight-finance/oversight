import { createClient } from "@/utils/supabase/client";
import { InvestmentTransaction } from "@/types/Transaction";

type CreateInvestmentTransactionData = Omit<InvestmentTransaction, "id">;
type TransactionResult = { id: string; account_id: string };

/**
 * Fetches transactions for a specific investment account
 * @param accountId The account ID of the investment account
 * @returns Array of transactions or empty array if none found
 */
export const fetchInvestmentTransactions = async (
  accountId: string
): Promise<InvestmentTransaction[]> => {
  if (!accountId) return [];

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("investment_transactions")
      .select("*")
      .eq("account_id", accountId)
      .order("transaction_date", { ascending: false });

    if (error) {
      console.error("Error fetching investment transactions:", error.message);
      return [];
    }

    return data as InvestmentTransaction[];
  } catch (error) {
    console.error("Exception fetching investment transactions:", error);
    return [];
  }
};

/**
 * Fetches a specific investment transaction by ID
 * @param transactionId The ID of the transaction to fetch
 * @returns The transaction or null if not found
 */
export const fetchInvestmentTransactionById = async (
  transactionId: string
): Promise<InvestmentTransaction | null> => {
  if (!transactionId) return null;

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("investment_transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (error) {
      console.error("Error fetching investment transaction:", error.message);
      return null;
    }

    return data as InvestmentTransaction;
  } catch (error) {
    console.error("Exception fetching investment transaction:", error);
    return null;
  }
};

/**
 * Core implementation function for creating investment transactions
 * @param transactions Array of transaction data to insert
 * @returns Array of created transaction IDs or null if creation failed
 */
const createInvestmentTransactionsCore = async (
  transactions: CreateInvestmentTransactionData[]
): Promise<TransactionResult[] | null> => {
  if (!transactions.length) return null;

  // Ensure all transactions have an account_id
  const invalidTransaction = transactions.find((tx) => !tx.account_id);
  if (invalidTransaction) return null;

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("investment_transactions")
      .insert(transactions)
      .select("id, account_id");

    if (error) {
      console.error("Error creating investment transactions:", error.message);
      return null;
    }

    return data as TransactionResult[];
  } catch (error) {
    console.error("Exception creating investment transactions:", error);
    return null;
  }
};

/**
 * Creates a new investment transaction
 * @param transaction The transaction data to insert
 * @returns The created transaction ID or null if creation failed
 */
export const createInvestmentTransaction = async (
  transaction: CreateInvestmentTransactionData
): Promise<string | null> => {
  const results = await createInvestmentTransactionsCore([transaction]);
  return results ? results[0].id : null;
};

/**
 * Creates multiple investment transactions in a batch operation
 * @param transactions Array of transactions to create
 * @returns Array of created transaction IDs or null if creation failed
 */
export const createInvestmentTransactionBatch = async (
  transactions: CreateInvestmentTransactionData[]
): Promise<string[] | null> => {
  const results = await createInvestmentTransactionsCore(transactions);
  return results ? results.map((r) => r.id) : null;
};

/**
 * Creates multiple transactions for a specific investment account
 * @param transactions Array of partial transaction data (account_id will be set automatically)
 * @param accountId The account ID these transactions belong to
 * @returns Array of created transaction IDs or null if creation failed
 */
export const createInvestmentTransactionsForAccount = async (
  transactions: Omit<CreateInvestmentTransactionData, "account_id">[],
  accountId: string
): Promise<string[] | null> => {
  if (!accountId || !transactions.length) return null;

  // Add account_id to all transactions
  const completeTransactions = transactions.map((tx) => ({
    ...tx,
    account_id: accountId,
  }));

  return await createInvestmentTransactionBatch(completeTransactions);
};

/**
 * Core implementation for updating investment transactions
 * @param transactionIds Array of transaction IDs to update
 * @param updates The updates to apply to each transaction
 * @returns Map of transaction IDs to success/failure status
 */
const updateInvestmentTransactionsCore = async (
  transactionIds: string[],
  updates: Partial<CreateInvestmentTransactionData>
): Promise<Map<string, boolean>> => {
  if (!transactionIds.length) return new Map();

  const supabase = createClient();
  const results = new Map<string, boolean>();

  try {
    // Update the transactions
    const { error } = await supabase
      .from("investment_transactions")
      .update(updates)
      .in("id", transactionIds);

    if (error) {
      console.error("Error updating investment transactions:", error.message);
      // Set all transactions as failed
      transactionIds.forEach((id) => results.set(id, false));
      return results;
    }

    // Set all transactions as successful
    transactionIds.forEach((id) => results.set(id, true));
    return results;
  } catch (error) {
    console.error("Exception updating investment transactions:", error);
    // Set all transactions as failed
    transactionIds.forEach((id) => results.set(id, false));
    return results;
  }
};

/**
 * Updates an existing investment transaction
 * @param transactionId The ID of the transaction to update
 * @param updates The transaction fields to update
 * @returns True if successful, false otherwise
 */
export const updateInvestmentTransaction = async (
  transactionId: string,
  updates: Partial<CreateInvestmentTransactionData>
): Promise<boolean> => {
  if (!transactionId) return false;

  const results = await updateInvestmentTransactionsCore(
    [transactionId],
    updates
  );
  return results.get(transactionId) || false;
};

/**
 * Updates multiple investment transactions with the same updates
 * @param transactionIds Array of transaction IDs to update
 * @param updates The updates to apply to all transactions
 * @returns Map of transaction IDs to success/failure status
 */
export const updateInvestmentTransactionBatch = async (
  transactionIds: string[],
  updates: Partial<CreateInvestmentTransactionData>
): Promise<Map<string, boolean>> => {
  return await updateInvestmentTransactionsCore(transactionIds, updates);
};

/**
 * Core implementation for deleting investment transactions
 * @param transactionIds Array of transaction IDs to delete
 * @returns Map of transaction IDs to success/failure status
 */
const deleteInvestmentTransactionsCore = async (
  transactionIds: string[]
): Promise<Map<string, boolean>> => {
  if (!transactionIds.length) return new Map();

  const supabase = createClient();
  const results = new Map<string, boolean>();

  try {
    // Delete the transactions
    const { error } = await supabase
      .from("investment_transactions")
      .delete()
      .in("id", transactionIds);

    if (error) {
      console.error("Error deleting investment transactions:", error.message);
      // Set all transactions as failed
      transactionIds.forEach((id) => results.set(id, false));
      return results;
    }

    // Set all transactions as successful
    transactionIds.forEach((id) => results.set(id, true));
    return results;
  } catch (error) {
    console.error("Exception deleting investment transactions:", error);
    // Set all transactions as failed
    transactionIds.forEach((id) => results.set(id, false));
    return results;
  }
};

/**
 * Deletes an investment transaction
 * @param transactionId The ID of the transaction to delete
 * @returns True if successful, false otherwise
 */
export const deleteInvestmentTransaction = async (
  transactionId: string
): Promise<boolean> => {
  if (!transactionId) return false;

  const results = await deleteInvestmentTransactionsCore([transactionId]);
  return results.get(transactionId) || false;
};

/**
 * Deletes multiple investment transactions
 * @param transactionIds Array of transaction IDs to delete
 * @returns Map of transaction IDs to success/failure status
 */
export const deleteInvestmentTransactionBatch = async (
  transactionIds: string[]
): Promise<Map<string, boolean>> => {
  return await deleteInvestmentTransactionsCore(transactionIds);
};
