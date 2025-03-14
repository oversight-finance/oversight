// Account-related type definitions that match the database schema

import { BankAccountTransaction } from "./BankAccountTransaction";

/**
 * Aligns with the account_type enum in the database
 */
export enum AccountType {
  BANK = "bank",
  INVESTMENT = "investment",
  CRYPTO = "crypto",
  CREDIT = "credit",
  SAVINGS = "savings",
  STOCK = "stock",
  REAL_ESTATE = "real_estate",
  VEHICLE = "vehicle",
}

/**
 * Base account interface matching accounts table
 */
export interface Account {
  id: string;
  user_id: string;
  account_type: AccountType;
  balance: number;
  created_at: string;
  updated_at: string;
}

/**
 * Bank account interface matching bank_accounts table
 */
export interface BankAccount {
  account_id: string;
  account_name: string;
  institution_name: string;
  account_number: string;
  routing_number: string;
  currency: string;
  balance: number;
}

/**
 * Bank account types (not in schema but useful for UI)
 */
export enum BankAccountType {
  CHECKING = "checking",
  SAVINGS = "savings",
  CREDIT = "credit",
}

/**
 * Asset related types matching assets table
 */
export interface Asset {
  id: string;
  user_id: string;
  type: string;
  name: string;
  purchase_value?: number;
  current_value?: number;
  purchase_date?: string;
  metadata?: AssetMetadata;
  created_at: string;
}

/**
 * Asset price interface matching asset_prices table
 */
export interface AssetPrice {
  id: string;
  asset_id: string;
  price_date: string;
  price: number;
  recorded_at: string;
}

/**
 * Extended account interface with transactions for UI components
 */
export interface BankAccountWithTransactions extends Account {
  transactions: BankAccountTransaction[];
}

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
