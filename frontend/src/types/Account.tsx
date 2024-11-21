export interface Account {
  id: string;
  accountNumber: string;
  name: string;
  description: string;
  type: AccountType;
  transactions: Transaction[];
  balance: number;
  interestRate?: number;
}

export enum AccountType {
  BANK = "bank",
  INVESTMENT = "investment",
  REAL_ESTATE = "realEstate",
  VEHICLE = "vehicle",
  LOAN = "loan",
  OTHER = "other",
}

export enum BankAccountType {
  CHECKING = "checking",
  SAVINGS = "savings",
  CREDIT = "credit",
}

export enum InvestmentType {
  STOCK = "stock",
  CRYPTO = "crypto",
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  description?: string;

  // Modified linking system
  transactionGroupId?: string;  // All related transactions share the same group ID
  transactionType: TransactionType;

  // Modified recurring fields
  isRecurring?: boolean;
  recurringParentId?: string;   // Reference to the parent transaction
  recurringFrequency?: string;
  recurringEndDate?: string;    // Optional end date for recurring series
  paymentMethod?: string;
}

export enum TransactionType {
  EXTERNAL = "external",
  INTERNAL_TRANSFER = "internal_transfer",
  RECURRING_PARENT = "recurring_parent",
  RECURRING_CHILD = "recurring_child",
  INITIAL = "initial",
}

// Helper types for managing transactions
export interface TransactionGroup {
  groupId: string;
  transactions: Transaction[];
  totalAmount: number;          // Net amount across all transactions
}

// Helper functions for managing recurring transactions
export const updateRecurringTransactions = (
  transactions: Transaction[],
  parentId: string,
  fromDate: string,
  updates: Partial<Transaction>
): Transaction[] => {
  return transactions.map(transaction => {
    if (
      transaction.recurringParentId === parentId &&
      new Date(transaction.date) >= new Date(fromDate)
    ) {
      return { ...transaction, ...updates };
    }
    return transaction;
  });
};

// Example usage:
/*
// Group of linked transactions (e.g., car purchase with multiple accounts)
const carPurchaseTransactions: Transaction[] = [
  {
    id: "t1",
    amount: -30000,
    transactionGroupId: "car-purchase-123",
    transactionType: TransactionType.INTERNAL_TRANSFER,
    // ... other fields
  },
  {
    id: "t2",
    amount: 30000,
    transactionGroupId: "car-purchase-123",
    transactionType: TransactionType.INTERNAL_TRANSFER,
    // ... other fields
  },
  {
    id: "t3",
    amount: -5000,
    transactionGroupId: "car-purchase-123",
    transactionType: TransactionType.INTERNAL_TRANSFER,
    // ... other fields
  }
];

// Modify recurring payments after a certain date
const updatedTransactions = updateRecurringTransactions(
  allTransactions,
  "recurring-parent-123",
  "2024-03-01",
  {
    amount: -550,  // Update monthly payment amount
    description: "Updated car payment"
  }
);
*/

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

