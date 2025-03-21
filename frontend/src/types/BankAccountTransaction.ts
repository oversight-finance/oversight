export interface BankAccountTransaction {
  id: string;
  account_id: string;
  transaction_date: string;
  amount: number;
  merchant?: string;
  category?: string;
} 