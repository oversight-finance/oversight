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
  REAL_ESTATE = "real_estate",
  VEHICLE = "vehicle",
  LOAN = "loan",
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

export interface RecurringSchedule {
  id: string;
  user_id: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  payment_method: string | null;
  default_amount: number;
  created_at: string;
}

export interface TransactionGroup {
  group_id: string;
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
  return transactions.map((transaction) => {
    if (
      transaction.recurringScheduleId === recurringScheduleId &&
      new Date(transaction.transactionDate) >= new Date(fromDate)
    ) {
      return { ...transaction, ...updates };
    }
    return transaction;
  });
};

// Use this to calculate the current balance based on transactions
export const calculateAccountBalance = (
  transactions: Transaction[]
): number => {
  return transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
};

// Helper function to create an initial transaction
export const createInitialTransaction = (
  amount: number
): Omit<Transaction, "id"> => {
  return {
    account_id: "", // This will be set when the account is created
    user_id: "", // This will be set when the account is created
    transaction_date: new Date().toISOString().split("T")[0],
    amount: amount,
    currency: "USD",
    merchant: "System",
    category: "Initial Balance",
    description: "Initial account balance",
    metadata: null,
    transaction_group_id: null,
    transaction_type: "initial",
    recurring_schedule_id: null,
    created_at: new Date().toISOString(),
  };
};

// Problem 1. HOW TO GROUPING TRANSACTIONS?
// Problem 2. CONTROLLING RECURRING GROUPS OF TRANSACTIONS

//Car:
// Transactions:

// Car Cash:
// Car: Transactoin +10000 car
// Checking: -10000

// Car Finance:
// Car: Transactions +10000 Downpayment
// Checking: -10000
// Recurring Checking: -500/month for the next 24 months
// Recurring payment: +370/month for the next 24 months

// Currentprice(api) - Sum Transactions
// Price you sell - how much money you put in the car = profit/loss
// Function types matching database functions
export interface AccountWithBalance extends Account {
  balance: number;
}

export interface AccountWithTransactions extends AccountWithBalance {
  transactions: Transaction[];
}

