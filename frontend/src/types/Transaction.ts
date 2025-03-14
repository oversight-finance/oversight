// Transaction type definitions

/**
 * Represents a bank account transaction as defined in the bank_accounts_transactions table
 * transaction_date is a PostgreSQL timestamptz which Supabase returns as an ISO string
 */
export interface BankTransaction {
  id: string;
  account_id: string;
  transaction_date: string; // ISO formatted date string from timestamptz
  amount: number;
  merchant?: string;
  category?: string;
}

/**
 * UI-specific transaction type for display and form handling
 */
export interface UITransaction {
  id: string;
  account_id: string;
  date: string; // Date as ISO string
  amount: number;
  currency: string;
  merchant?: string;
  category?: string;
  description?: string;
  transactionType?: string;
}

/**
 * Transaction type enum for UI
 */
export enum TransactionType {
  EXTERNAL = "external",
  INTERNAL = "internal",
}

/**
 * Convert database transaction to UI transaction format
 */
export const toUITransaction = (tx: BankTransaction): UITransaction => ({
  id: tx.id,
  account_id: tx.account_id,
  date: tx.transaction_date, // Already an ISO string from Supabase
  amount: tx.amount,
  currency: "USD", // Default currency
  merchant: tx.merchant || "",
  category: tx.category || "",
  description: "", // Default empty description
  transactionType: TransactionType.EXTERNAL,
});

/**
 * Convert array of database transactions to UI transactions
 */
export const toUITransactions = (txs: BankTransaction[]): UITransaction[] => {
  return txs.map(toUITransaction);
};

/**
 * Convert UI transaction to database format (for creating/updating)
 */
export const toDatabaseTransaction = (
  tx: UITransaction
): Omit<BankTransaction, "id"> => ({
  account_id: tx.account_id,
  transaction_date: tx.date, // Both are ISO strings
  amount: tx.amount,
  merchant: tx.merchant,
  category: tx.category,
});
