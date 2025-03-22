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
