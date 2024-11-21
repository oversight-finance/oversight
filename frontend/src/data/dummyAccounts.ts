import { Account, AccountType, TransactionType } from "@/types/Account";

export const dummyAccounts: Account[] = [
    {
        id: "1",
        accountNumber: "Chase-1234",
        name: "Chase Bank",
        description: "Checking Account",
        type: AccountType.BANK,
        balance: 4047.83,
        transactions: [
            {
                id: "t1",
                date: "2023-01-01T00:00:00Z",
                amount: 2547.83,
                currency: "USD",
                merchant: "System",
                category: "Initial Balance",
                description: "Initial account balance",
                transactionType: TransactionType.INITIAL
            },
            {
                id: "t2",
                date: "2023-04-15T00:00:00Z",
                amount: 3000.00,
                currency: "USD",
                merchant: "Employer Inc",
                category: "Income",
                description: "Salary deposit",
                transactionType: TransactionType.EXTERNAL
            },
            {
                id: "t3",
                date: "2023-07-20T00:00:00Z",
                amount: -1500.00,
                currency: "USD",
                merchant: "Landlord",
                category: "Housing",
                description: "Monthly rent",
                transactionType: TransactionType.EXTERNAL
            },
            {
                id: "t4",
                date: "2023-10-22T00:00:00Z",
                amount: -89.99,
                currency: "USD",
                merchant: "Netflix",
                category: "Entertainment",
                description: "Monthly subscription",
                transactionType: TransactionType.EXTERNAL
            },
            {
                id: "t5",
                date: "2024-01-25T00:00:00Z",
                amount: -250.00,
                currency: "USD",
                merchant: "PG&E",
                category: "Utilities",
                description: "Electricity bill",
                transactionType: TransactionType.EXTERNAL
            },
            {
                id: "t6",
                date: "2024-03-28T00:00:00Z",
                amount: -75.50,
                currency: "USD",
                merchant: "Whole Foods",
                category: "Groceries",
                description: "Weekly groceries",
                transactionType: TransactionType.EXTERNAL
            }
        ],
    },
    {
        id: "2",
        accountNumber: "WF-5678",
        name: "Wells Fargo",
        description: "Savings Account",
        type: AccountType.BANK,
        balance: 16250.00,
        transactions: [
            {
                id: "t7",
                date: "2023-02-01T00:00:00Z",
                amount: 15750.00,
                currency: "USD",
                merchant: "System",
                category: "Initial Balance",
                description: "Initial account balance",
                transactionType: TransactionType.INITIAL
            },
            {
                id: "t8",
                date: "2023-05-25T00:00:00Z",
                amount: 500.00,
                currency: "USD",
                merchant: "Chase Bank",
                category: "Transfer",
                description: "Monthly savings transfer",
                transactionType: TransactionType.INTERNAL_TRANSFER
            },
            {
                id: "t9",
                date: "2023-08-31T00:00:00Z",
                amount: 52.50,
                currency: "USD",
                merchant: "Wells Fargo",
                category: "Interest",
                description: "Monthly interest payment",
                transactionType: TransactionType.EXTERNAL
            },
            {
                id: "t10",
                date: "2024-02-01T00:00:00Z",
                amount: -2000.00,
                currency: "USD",
                merchant: "Chase Bank",
                category: "Transfer",
                description: "Emergency fund withdrawal",
                transactionType: TransactionType.INTERNAL_TRANSFER
            }
        ],
    },
    {
        id: "3",
        accountNumber: "BOA-9012",
        name: "Bank of America",
        description: "Business Checking",
        type: AccountType.BANK,
        balance: 11420.45,
        transactions: [
            {
                id: "t11",
                date: "2023-03-01T00:00:00Z",
                amount: 8920.45,
                currency: "USD",
                merchant: "System",
                category: "Initial Balance",
                description: "Initial account balance",
                transactionType: TransactionType.INITIAL
            },
            {
                id: "t12",
                date: "2023-06-10T00:00:00Z",
                amount: 5000.00,
                currency: "USD",
                merchant: "Client Corp",
                category: "Income",
                description: "Project payment",
                transactionType: TransactionType.EXTERNAL
            },
            {
                id: "t13",
                date: "2023-09-22T00:00:00Z",
                amount: -2500.00,
                currency: "USD",
                merchant: "Office Supply Co",
                category: "Business Expenses",
                description: "Office equipment",
                transactionType: TransactionType.EXTERNAL
            },
            {
                id: "t14",
                date: "2023-11-25T00:00:00Z",
                amount: -1200.00,
                currency: "USD",
                merchant: "Adobe",
                category: "Software",
                description: "Annual software licenses",
                transactionType: TransactionType.EXTERNAL
            },
            {
                id: "t15",
                date: "2023-12-28T00:00:00Z",
                amount: 3500.00,
                currency: "USD",
                merchant: "New Client LLC",
                category: "Income",
                description: "Website development deposit",
                transactionType: TransactionType.EXTERNAL
            },
            {
                id: "t16",
                date: "2024-01-30T00:00:00Z",
                amount: -850.00,
                currency: "USD",
                merchant: "Marketing Agency",
                category: "Marketing",
                description: "Monthly social media management",
                transactionType: TransactionType.EXTERNAL
            },
            {
                id: "t17",
                date: "2024-03-01T00:00:00Z",
                amount: -450.00,
                currency: "USD",
                merchant: "WeWork",
                category: "Office Space",
                description: "Monthly hot desk subscription",
                transactionType: TransactionType.EXTERNAL
            }
        ],
    }
]; 