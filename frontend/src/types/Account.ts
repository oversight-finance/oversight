// Account-related type definitions that match the database schema

import { BankAccountTransaction, InvestmentTransaction, CryptoWalletTransaction } from "@/types/Transaction";
import { CreateCryptoWallet } from "@/database/CryptoWallets";
import { CreateInvestmentAccount } from "@/database/InvestmentAccounts";

/**
 * Aligns with the account_type enum in the database
 */
export enum AccountType {
  BANK = "bank",
  INVESTMENT = "investment",
  CRYPTO = "crypto",
  CREDIT = "credit",
  SAVINGS = "savings",
}

export type Accounts = BankAccount | CryptoWallet | InvestmentAccount;
export type CreateAccounts = BankAccount | CreateCryptoWallet | CreateInvestmentAccount;

/**
 * Base account type matching accounts table
 */
export type Account = {
  id: string;
  account_name: string;
  user_id: string;
  account_type: AccountType;
  balance: number;
  created_at: string;
  updated_at: string;
};

/**
 * Bank account type matching bank_accounts table
 * Extends the base Account type
 */
export type BankAccount = Account & {
  institution_name: string;
  account_number: string;
  routing_number: string;
  currency: string;
};

/**
 * Crypto wallet type matching crypto_wallets table
 */
export type CryptoWallet = Account & {
  wallet_address?: string;
  coin_symbol: string; // e.g., 'BTC', 'ETH', 'SOL'
};

/**
 * Investment account type matching investment_accounts table
 */
export type InvestmentAccount = Account & {
  investment_type: string; // e.g., 'RRSP', 'TFSA', 'General'
  institution: string;
  account_number?: string;
  contribution_room?: number;
  currency: string;
};

/**
 * Bank account types (not in schema but useful for UI)
 */
export enum BankAccountType {
  CHECKING = "checking",
  SAVINGS = "savings",
  CREDIT = "credit",
}

/**
 * Extended account type with transactions for UI components
 */
export type BankAccountWithTransactions = BankAccount & {
  transactions: BankAccountTransaction[];
};

export type InvestmentAccountWithTransactions = InvestmentAccount & {
  transactions: InvestmentTransaction[];
};

export type CryptoWalletWithTransactions = CryptoWallet & {
  transactions: CryptoWalletTransaction[];
};

/**
 * Use this to calculate the current balance based on transactions
 */
export const calculateAccountBalance = (
  transactions: BankAccountTransaction[]
): number => {
  return transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
};

/**
 * Common types for metadata records
 */
export type AccountMetadata = {
  [key: string]: string | number | boolean | null;
};

/**
 * Asset metadata type
 */
export type AssetMetadata = {
  [key: string]: string | number | boolean | null;
};

/**
 * Transaction metadata type
 */
export type TransactionMetadata = {
  [key: string]: string | number | boolean | null;
};
