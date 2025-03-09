"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import TransactionTable from "@/components/TransactionTable/TransactionTable";
import CSVUploader from "@/app/csvParser";
import { ParsedData } from "@/utils/dataTransformers";
import { AccountsProvider, useAccounts } from "@/contexts/AccountsContext";
import AccountBalance from "@/components/AccountBalance/AccountBalance";
import { formatCurrency } from "@/lib/utils";
import { Transaction, TransactionType } from "@/types/Account";

const sortTransactionsByDate = (transactions: Transaction[]): Transaction[] => {
  return [...transactions].sort(
    (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
  );
};

export default function AccountPage() {
  const { id } = useParams();
  const { accounts, updateAccount } = useAccounts();
  const account = accounts.find((a) => a.id === id);

  console.log(accounts);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (account) {
      setTransactions(account.transactions || []);
    }
  }, [account]);

  const handleDataUpdate = (data: Transaction[]) => {
    const now = new Date().toISOString();
    const newTransactions: Transaction[] = data.map((item) => ({
      id: crypto.randomUUID(),
      userId: account?.userId || "user1",
      transactionDate: item.transactionDate || now,
      amount: item.amount,
      currency: "USD",
      merchant: item.merchant || "Unknown",
      category: item.category || "Uncategorized",
      description: item.description || "",
      transactionType: TransactionType.EXTERNAL,
      createdAt: now
    }));

    const updatedTransactions = sortTransactionsByDate([
      ...transactions,
      ...newTransactions,
    ]);
    updateTransactions(updatedTransactions);
  };

  const handleTransactionAdd = (newTransactions: Transaction[]) => {
    const updatedTransactions = sortTransactionsByDate([
      ...transactions,
      ...newTransactions,
    ]);
    updateTransactions(updatedTransactions);
  };

  const handleTransactionDelete = (index: number) => {
    const updatedTransactions = transactions.filter((_, i) => i !== index);
    updateTransactions(updatedTransactions);
  };

  const handleTransactionEdit = (
    index: number,
    updatedTransaction: Transaction
  ) => {
    const updatedTransactions = [
      ...transactions.slice(0, index),
      updatedTransaction,
      ...transactions.slice(index + 1),
    ];
    updateTransactions(updatedTransactions);
  };

  // Helper function to update both local state and account context
  const updateTransactions = (updatedTransactions: Transaction[]) => {
    setTransactions(updatedTransactions);
    if (account) {
      updateAccount(account.id, {
        ...account,
        transactions: updatedTransactions,
      });
    }
  };

  if (!account) return <div>Account not found</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{account.bankName}</h1>
          <p className="text-muted-foreground">{account.accountType}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
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
        {/* <div className="w-full xl:w-80 shrink-0">
                    <CSVUploader onDataUpdate={handleDataUpdate} />
                </div> */}
      </div>
    </div>
  );
}
