// Transaction type definitions

/**
 * Base transaction interface with common properties across all transaction types
 */
export interface TransactionBase {
  id: string;
  account_id: string;
  transaction_date: string; // ISO formatted date string from timestamptz
  amount: number;
}

/**
 * Generic transaction type that can be used as a union of all transaction types
 */
export type Transaction = BankAccountTransaction | CryptoWalletTransaction | InvestmentTransaction;

/**
 * Represents a bank account transaction as defined in the bank_accounts_transactions table
 */
export interface BankAccountTransaction extends TransactionBase {
  merchant?: string;
  category?: string;
}

/**
 * Represents a crypto wallet transaction as defined in the crypto_wallet_transactions table
 */
export interface CryptoWalletTransaction extends TransactionBase {
  transaction_type: string; // 'buy', 'sell', 'transfer', 'stake', 'unstake', etc.
  coin_symbol: string;
  price_per_coin: number;
  fee?: number;
}

/**
 * Represents an investment transaction as defined in the investment_transactions table
 */
export interface InvestmentTransaction extends TransactionBase {
  transaction_type: string; // 'buy', 'sell', 'dividend', 'contribution', 'withdrawal'
  ticker_symbol?: string;
  quantity?: number;
  price_per_unit?: number;
  fee?: number;
  currency?: string;
}