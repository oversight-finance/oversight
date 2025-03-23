// Transaction type definitions

import { TransactionBase } from "@/components/TransactionTable/TransactionTable";

/**
 * Represents a bank account transaction as defined in the bank_accounts_transactions table
 * transaction_date is a PostgreSQL timestamptz which Supabase returns as an ISO string
 */
export interface BankAccountTransaction extends TransactionBase {
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