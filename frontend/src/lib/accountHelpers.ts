import { Account, Transaction, TransactionType } from "@/types/Account"

export const getCurrentBalance = (account: Account): number => {
    return account.transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
}

export const createInitialTransaction = (amount: number): Omit<Transaction, "id"> => {
    return {
        date: new Date().toISOString(),
        amount: amount,
        currency: "USD",
        merchant: "System",
        category: "Initial Balance",
        description: "Initial account balance",
        transactionType: TransactionType.INITIAL,
    }
}

export const createNewAccount = (
    newAccount: Omit<Account, "id" | "transactions" | "createdAt">,
    initialBalance: number
): Account => {
    const transactions: Transaction[] = []

    // Only create initial transaction if balance is not zero

    transactions.push({
        ...createInitialTransaction(initialBalance),
        id: crypto.randomUUID()
    })


    return {
        ...newAccount,
        id: crypto.randomUUID(),
        transactions,
    }
}
