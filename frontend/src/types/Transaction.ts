// Transaction type definitions

/**
 * Base transaction type with common properties across all transaction types
 */
export type TransactionBase = {
  id: string;
  account_id: string;
  transaction_date: string; // ISO formatted date string from timestamptz
  amount: number;
}

/**
 * Generic transaction type that can be used as a union of all transaction types
 */
export type Transaction =
  | BankAccountTransaction
  | CryptoWalletTransaction
  | InvestmentTransaction;

/**
 * Represents a bank account transaction as defined in the bank_accounts_transactions table
 */
export type BankAccountTransaction = TransactionBase & {
  merchant?: string;
  category?: string;
}

/**
 * Represents a crypto wallet transaction as defined in the crypto_wallet_transactions table
 */
export type CryptoWalletTransaction = TransactionBase & {
  transaction_type: 'buy' | 'sell' | 'transfer' | 'stake' | 'unstake' | 'swap';
  amount: number;
  price_at_transaction: number; // Price in fiat at transaction time
  fee?: number;
}

/**
 * Represents an investment transaction as defined in the investment_transactions table
 */
export type InvestmentTransaction = TransactionBase & {
  transaction_type: 'buy' | 'sell' | 'dividend' | 'contribution' | 'withdrawal';
  ticker_symbol?: string;
  quantity?: number;
  price_per_unit?: number;
  fee?: number;
  currency?: string;
}
