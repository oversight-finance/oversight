export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
}

export interface Account {
  id: string;
  userId: string;
  bankName: string;
  accountNumber?: string;
  accountType?: string;
  createdAt: string;
  balance: number;
  transactions?: Transaction[];
  metadata?: Record<string, any>;
}

export enum AccountType {
  BANK = "bank",
  INVESTMENT = "investment",
  OTHER = "other",
}

export enum BankAccountType {
  CHECKING = "checking",
  SAVINGS = "savings",
  CREDIT = "credit",
}

// Recurring schedule types
export interface RecurringSchedule {
  id: string;
  userId: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  paymentMethod?: string;
  defaultAmount: number;
  createdAt: string;
}

// Transaction related types
export interface Transaction {
  id: string;
  accountId?: string;
  userId: string;
  transactionDate: string;
  amount: number;
  currency?: string;
  merchant?: string;
  category?: string;
  description?: string;
  metadata?: Record<string, any>;
  transactionGroupId?: string;
  transactionType: TransactionType;
  recurringScheduleId?: string;
  createdAt: string;
}

export enum TransactionType {
  EXTERNAL = "external",
  INTERNAL_TRANSFER = "internal_transfer",
  RECURRING = "recurring",
}

// Asset related types
export interface Asset {
  id: string;
  userId: string;
  type: AssetType;
  name: string;
  purchaseValue?: number;
  currentValue?: number;
  purchaseDate?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  prices?: AssetPrice[];
}

export enum AssetType {
  CRYPTO = "crypto",
  STOCK = "stock",
  REAL_ESTATE = "real_estate",
  VEHICLE = "vehicle",
}

export interface AssetPrice {
  id: string;
  assetId: string;
  priceDate: string;
  price: number;
  recordedAt: string;
}

// Helper types for managing transactions
export interface TransactionGroup {
  groupId: string;
  transactions: Transaction[];
  totalAmount: number;
}

// Helper functions for managing recurring transactions
export const updateRecurringTransactions = (
  transactions: Transaction[],
  recurringScheduleId: string,
  fromDate: string,
  updates: Partial<Transaction>
): Transaction[] => {
  return transactions.map(transaction => {
    if (
      transaction.recurringScheduleId === recurringScheduleId &&
      new Date(transaction.transactionDate) >= new Date(fromDate)
    ) {
      return { ...transaction, ...updates };
    }
    return transaction;
  });
};

// Function types matching database functions
export interface AccountWithBalance extends Account {
  balance: number;
}

export interface AccountWithTransactions extends AccountWithBalance {
  transactions: Transaction[];
}

