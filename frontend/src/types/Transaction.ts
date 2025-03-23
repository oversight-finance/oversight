// Transaction type definitions

/**
 * Represents a bank account transaction as defined in the bank_accounts_transactions table
 * transaction_date is a PostgreSQL timestamptz which Supabase returns as an ISO string
 */
export interface BankAccountTransaction {
  id: string;
  account_id: string;
  transaction_date: string; // ISO formatted date string from timestamptz
  amount: number;
  merchant?: string;
  category?: string;
}

/**
 * Represents a crypto wallet transaction as defined in the crypto_wallet_transactions table
 */
export interface CryptoWalletTransaction {
  id: string;
  account_id: string;
  transaction_date: string;
  transaction_type: string; // 'buy', 'sell', 'transfer', 'stake', 'unstake', etc.
  coin_symbol: string;
  amount: number;
  price_per_coin: number;
  fee?: number;
}

/**
 * Represents an investment transaction as defined in the investment_transactions table
 */
export interface InvestmentTransaction {
  id: string;
  account_id: string;
  transaction_date: string;
  transaction_type: string; // 'buy', 'sell', 'dividend', 'contribution', 'withdrawal'
  ticker_symbol?: string;
  quantity?: number;
  price_per_unit?: number;
  amount: number;
  fee?: number;
  currency?: string;
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
export const toUITransaction = (tx: BankAccountTransaction): UITransaction => ({
  id: tx.id,
  account_id: tx.account_id,
  date: tx.transaction_date, // Already an ISO string from Supabase
  amount: tx.amount,
  currency: "CAD", // Default currency according to schema
  merchant: tx.merchant || "",
  category: tx.category || "",
  description: "", // Default empty description
  transactionType: TransactionType.EXTERNAL,
});

/**
 * Convert array of database transactions to UI transactions
 */
export const toUITransactions = (txs: BankAccountTransaction[]): UITransaction[] => {
  return txs.map(toUITransaction);
};

/**
 * Convert UI transaction to database format (for creating/updating)
 */
export const toDatabaseTransaction = (
  tx: UITransaction
): Omit<BankAccountTransaction, "id"> => ({
  account_id: tx.account_id,
  transaction_date: tx.date, // Both are ISO strings
  amount: tx.amount,
  merchant: tx.merchant,
  category: tx.category,
});
