"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import TransactionTable from "@/components/TransactionTable/TransactionTable";
import { useAccounts } from "@/contexts/AccountsContext";
import AccountBalance from "@/components/AccountBalance/AccountBalance";
import { formatCurrency } from "@/lib/utils";
import { Transaction, TransactionType } from "@/types/Account";

const sortTransactionsByDate = (transactions: Transaction[]): Transaction[] => {
  return [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export default function AccountPage() {
  const { id } = useParams();
  const {
    accounts,
    fetchAccountTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    isLoading,
    error,
  } = useAccounts();

  const account = accounts.find((a) => a.id === id);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch transactions when the account ID changes
  useEffect(() => {
    if (account) {
      setTransactions(account.transactions);
    }
  }, [account]);

  const handleDataUpdate = (data: Transaction[]) => {
    const newTransactions: Transaction[] = data.map((item) => ({
      id: crypto.randomUUID(),
      date: item.date,
      amount: item.amount,
      currency: "USD",
      merchant: item.merchant || "Unknown",
      category: item.category || "Uncategorized",
      description: item.description || "",
      transactionType: TransactionType.EXTERNAL,
    }));

    const updatedTransactions = sortTransactionsByDate([
      ...transactions,
      ...newTransactions,
    ]);
    updateTransactions(updatedTransactions);
  };

  const handleTransactionAdd = async (newTransactions: Transaction[]) => {
    try {
      // Add each transaction to the database
      for (const transaction of newTransactions) {
        // Extract id and created_at to avoid sending them to the API
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, created_at, ...newTransaction } = transaction;
        await addTransaction(newTransaction);
      }

      // Refresh transactions
      const fetchedTransactions = await fetchAccountTransactions(id as string);
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Error adding transactions:", error);
    }
  };

  const handleTransactionDelete = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);

      // Refresh transactions
      const fetchedTransactions = await fetchAccountTransactions(id as string);
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleTransactionEdit = async (
    transactionId: string,
    updatedTransaction: Partial<Transaction>
  ) => {
    try {
      await updateTransaction(transactionId, updatedTransaction);

      // Refresh transactions
      const fetchedTransactions = await fetchAccountTransactions(id as string);
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
};

  if (isLoading || loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!account) return <div>Account not found</div>;

  const currentBalance = calculateAccountBalance(transactions);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          {/* <h1 className="text-2xl font-bold">{account.name}</h1>
          <p className="text-muted-foreground">{account.description}</p> */}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {formatCurrency(currentBalance)}
          </div>
          <div className="text-sm text-muted-foreground">Current Balance</div>
        </div>
      </div>

      <div className="w-full">
        <AccountBalance account={account} />
      </div>

      <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
        <div className="flex-1 min-w-0">
          <TransactionTable
            transactions={transactions}
            onDelete={handleTransactionDelete}
            onEdit={handleTransactionEdit}
            onTransactionAdd={handleTransactionAdd}
          />
        </div>
        <div className="w-full xl:w-80 shrink-0">
          <CSVUploader onDataUpdate={handleDataUpdate} />
        </div>
      </div>
    </div>
  );
}
