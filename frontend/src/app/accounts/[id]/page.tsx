"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import TransactionTable from "@/components/TransactionTable/TransactionTable";
import {
  useAccounts,
  createTransaction,
  deleteTransaction as deleteTx,
  updateTransaction as updateTx,
} from "@/contexts/AccountsContext";
import AccountBalance from "@/components/AccountBalance/AccountBalance";
import { formatCurrency } from "@/lib/utils";
import {
  UITransaction,
  toUITransactions,
  toDatabaseTransaction,
} from "@/types/Transaction";

// Helper to calculate account balance from transactions
const calculateAccountBalance = (transactions: UITransaction[]): number => {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
};

export default function AccountPage() {
  const { id } = useParams();
  const { accounts, refreshAccounts, getTransactions, isLoading, error } =
    useAccounts();

  const account = accounts.find((a) => a.id === id);
  const [transactions, setTransactions] = useState<UITransaction[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Fetch transactions when the account ID changes
  useEffect(() => {
    const loadTransactions = async () => {
      if (account) {
        try {
          setPageLoading(true);
          // Fetch transactions from DB and convert to UI format
          const accountTxs = await getTransactions(account.id);
          setTransactions(toUITransactions(accountTxs));
        } catch (err) {
          console.error("Failed to load transactions:", err);
        } finally {
          setPageLoading(false);
        }
      }
    };

    loadTransactions();
  }, [account, getTransactions]);

  // Handle adding a new transaction
  const handleTransactionAdd = async (newTransactions: UITransaction[]) => {
    try {
      const createdTransactions = [];
      
      for (const newTx of newTransactions) {
        // Create base transaction with default values
        const transaction: UITransaction = {
          id: crypto.randomUUID(),
          account_id: id as string,
          date: new Date().toISOString(),
          amount: 0,
          currency: "USD",
          merchant: "",
          category: "",
          description: "",
        };
        
        // Apply the provided values (will override defaults)
        const completeTransaction = {
          ...transaction,
          ...newTx
        };

        // Convert UI transaction to database format
        const dbTransaction = toDatabaseTransaction(completeTransaction);

        // Create transaction in the database
        await createTransaction({
          ...dbTransaction,
          account_id: id as string,
        });
        
        createdTransactions.push(completeTransaction);
      }

      // Refresh transactions
      const updatedTxs = await getTransactions(id as string);
      setTransactions(toUITransactions(updatedTxs));

      // Also refresh account data to update balances
      await refreshAccounts();
      
      return createdTransactions;
    } catch (error) {
      console.error("Error adding transaction:", error);
      return [];
    }
  };

  // Handle deleting a transaction
  const handleTransactionDelete = async (transactionId: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await deleteTx(transactionId);

      // Refresh transactions
      const updatedTxs = await getTransactions(id as string);
      setTransactions(toUITransactions(updatedTxs));

      // Also refresh account data to update balances
      await refreshAccounts();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  // Handle editing a transaction
  const handleTransactionEdit = async (
    original: UITransaction,
    updates: Partial<UITransaction>
  ) => {
    try {
      // Map UI field names to database field names
      const dbUpdates: Record<string, string | number> = {};

      // Map UI fields to database fields
      if (updates.date) {
        dbUpdates.transaction_date = updates.date;
      }
      if (updates.amount !== undefined) {
        dbUpdates.amount = updates.amount;
      }
      if (updates.merchant !== undefined) {
        dbUpdates.merchant = updates.merchant;
      }
      if (updates.category !== undefined) {
        dbUpdates.category = updates.category;
      }
      if (updates.description !== undefined) {
        dbUpdates.description = updates.description;
      }

      await updateTx(original.id, dbUpdates);

      // Refresh transactions
      const updatedTxs = await getTransactions(id as string);
      setTransactions(toUITransactions(updatedTxs));

      // Also refresh account data to update balances
      await refreshAccounts();
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  if (isLoading || pageLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!account) return <div>Account not found</div>;

  const currentBalance = calculateAccountBalance(transactions);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Account {account.id}</h1>
          <p className="text-muted-foreground">Manage your transactions</p>
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
            title="Transactions"
            accountType="bank"
          />
        </div>
        <div className="w-full xl:w-80 shrink-0">
          <div className="p-4 border rounded-md">
            <h3 className="font-medium mb-2">Import Transactions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a CSV file to import your transactions
            </p>
            <button
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md"
              onClick={() => alert("CSV Uploader not implemented yet")}
            >
              Upload CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
