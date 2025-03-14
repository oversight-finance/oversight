import { Account, AccountType, TransactionType } from "@/types/Account";

export const dummyAccounts: Account[] = [
    {
        id: "1",
        userId: "user1",
        bankName: "Chase Bank",
        accountNumber: "Chase-1234",
        accountType: AccountType.BANK,
        createdAt: "2023-01-01T00:00:00Z",
        balance: 4047.83,
        transactions: [
            {
                id: "t1",
                userId: "user1",
                transactionDate: "2023-01-01T00:00:00Z",
                amount: 2547.83,
                currency: "USD",
                merchant: "System",
                category: "Initial Balance",
                description: "Initial account balance",
                transactionType: TransactionType.EXTERNAL,
                createdAt: "2023-01-01T00:00:00Z"
            },
            {
                id: "t2",
                userId: "user1",
                transactionDate: "2023-04-15T00:00:00Z",
                amount: 3000.00,
                currency: "USD",
                merchant: "Employer Inc",
                category: "Income",
                description: "Salary deposit",
                transactionType: TransactionType.EXTERNAL,
                createdAt: "2023-04-15T00:00:00Z"
            },
            {
                id: "t3",
                userId: "user1",
                transactionDate: "2023-07-20T00:00:00Z",
                amount: -1500.00,
                currency: "USD",
                merchant: "Landlord",
                category: "Housing",
                description: "Monthly rent",
                transactionType: TransactionType.EXTERNAL,
                createdAt: "2023-07-20T00:00:00Z"
            },
            {
                id: "t4",
                userId: "user1",
                transactionDate: "2023-10-22T00:00:00Z",
                amount: -89.99,
                currency: "USD",
                merchant: "Netflix",
                category: "Entertainment",
                description: "Monthly subscription",
                transactionType: TransactionType.EXTERNAL,
                createdAt: "2023-10-22T00:00:00Z"
            },
            {
                id: "t5",
                userId: "user1",
                transactionDate: "2024-01-25T00:00:00Z",
                amount: -250.00,
                currency: "USD",
                merchant: "PG&E",
                category: "Utilities",
                description: "Electricity bill",
                transactionType: TransactionType.EXTERNAL,
                createdAt: "2024-01-25T00:00:00Z"
            },
            {
                id: "t6",
                userId: "user1",
                transactionDate: "2024-03-28T00:00:00Z",
                amount: -75.50,
                currency: "USD",
                merchant: "Whole Foods",
                category: "Groceries",
                description: "Weekly groceries",
                transactionType: TransactionType.EXTERNAL,
                createdAt: "2024-03-28T00:00:00Z"
            }
        ],
    },
    {
        id: "2",
        userId: "user1",
        bankName: "Wells Fargo",
        accountNumber: "WF-5678",
        accountType: AccountType.BANK,
        createdAt: "2023-02-01T00:00:00Z",
        balance: 16250.00,
        transactions: [
            {
                id: "t7",
                userId: "user1",
                transactionDate: "2023-02-01T00:00:00Z",
                amount: 15750.00,
                currency: "USD",
                merchant: "System",
                category: "Initial Balance",
                description: "Initial account balance",
                transactionType: TransactionType.EXTERNAL,
                createdAt: "2023-02-01T00:00:00Z"
            },
            {
                id: "t8",
                userId: "user1",
                transactionDate: "2023-05-25T00:00:00Z",
                amount: 500.00,
                currency: "USD",
                merchant: "Chase Bank",
                category: "Transfer",
                description: "Monthly savings transfer",
                transactionType: TransactionType.INTERNAL_TRANSFER,
                transactionGroupId: "transfer1",
                createdAt: "2023-05-25T00:00:00Z"
            },
            {
                id: "t9",
                userId: "user1",
                transactionDate: "2023-08-31T00:00:00Z",
                amount: 52.50,
                currency: "USD",
                merchant: "Wells Fargo",
                category: "Interest",
                description: "Monthly interest payment",
                transactionType: TransactionType.EXTERNAL,
                createdAt: "2023-08-31T00:00:00Z"
            },
            {
                id: "t10",
                userId: "user1",
                transactionDate: "2024-02-01T00:00:00Z",
                amount: -2000.00,
                currency: "USD",
                merchant: "Chase Bank",
                category: "Transfer",
                description: "Emergency fund withdrawal",
                transactionType: TransactionType.INTERNAL_TRANSFER,
                transactionGroupId: "transfer2",
                createdAt: "2024-02-01T00:00:00Z"
            }
        ],
    },
    {
        id: "3",
        userId: "user1",
        bankName: "Bank of America",
        accountNumber: "BOA-9012",
        accountType: AccountType.BANK,
        createdAt: "2023-03-01T00:00:00Z",
        balance: 11420.45,
        transactions: [
            {
                id: "t11",
                userId: "user1",
                transactionDate: "2023-03-01T00:00:00Z",
                amount: 8920.45,
                currency: "USD",
                merchant: "System",
                category: "Initial Balance",
                description: "Initial account balance",
                transactionType: TransactionType.EXTERNAL,
                createdAt: "2023-03-01T00:00:00Z"
            },
            {
                id: "t12",
                userId: "user1",
                transactionDate: "2023-06-10T00:00:00Z",
                amount: 5000.00,
                currency: "USD",
                merchant: "Client Corp",
                category: "Income",
                description: "Project payment",
                transactionType: TransactionType.EXTERNAL,
                createdAt: "2023-06-10T00:00:00Z"
            },
            {
                id: "t13",
                userId: "user1",
                transactionDate: "2023-09-22T00:00:00Z",
                amount: -2500.00,
                currency: "USD",
                merchant: "Office Supply Co",
                category: "Business Expenses",
                description: "Office equipment",
                transactionType: TransactionType.EXTERNAL,
                createdAt: "2023-09-22T00:00:00Z"
            },
            {
                id: "t14",
                userId: "user1",
                transactionDate: "2023-11-25T00:00:00Z",
                amount: -1200.00,
                currency: "USD",
                merchant: "Adobe",
                category: "Software",
                description: "Annual software licenses",
                transactionType: TransactionType.EXTERNAL,
                createdAt: "2023-11-25T00:00:00Z"
            },
            {
                id: "t15",
                userId: "user1",
                transactionDate: "2023-12-28T00:00:00Z",
                amount: 3500.00,
                currency: "USD",
                merchant: "New Client LLC",
                category: "Income",
                description: "Website development deposit",
                transactionType: TransactionType.EXTERNAL,
                createdAt: "2023-12-28T00:00:00Z"
            },
            {
                id: "t16",
                userId: "user1",
                transactionDate: "2024-01-30T00:00:00Z",
                amount: -850.00,
                currency: "USD",
                merchant: "Marketing Agency",
                category: "Marketing",
                description: "Monthly social media management",
                transactionType: TransactionType.EXTERNAL,
                createdAt: "2024-01-30T00:00:00Z"
            },
            {
                id: "t17",
                userId: "user1",
                transactionDate: "2024-03-01T00:00:00Z",
                amount: -450.00,
                currency: "USD",
                merchant: "WeWork",
                category: "Office Space",
                description: "Monthly hot desk subscription",
                transactionType: TransactionType.EXTERNAL,
                createdAt: "2024-03-01T00:00:00Z"
            }
        ],
    }
]; 