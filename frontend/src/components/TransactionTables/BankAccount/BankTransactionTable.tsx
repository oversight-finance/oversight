"use client";

import React from "react";
import {
  fetchBankAccountTransactions,
  deleteBankTransaction,
  updateBankTransaction,
} from "@/database/Transactions";
import TransactionTable from "../TransactionTable";
import { BankAccountTransaction } from "@/types";
import { toast } from "@/hooks/use-toast";

interface BankTransactionTableProps {
  accountId: string;
  title?: string;
}

export default function BankTransactionTable({
  accountId,
  title = "Bank Transactions",
}: BankTransactionTableProps) {
  const [transactions, setTransactions] = React.useState<
    BankAccountTransaction[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [, setIsSubmitting] = React.useState(false);

  // Function to refresh transactions
  const refreshTransactions = React.useCallback(async () => {
    if (!accountId) return;

    setLoading(true);
    try {
      const data = await fetchBankAccountTransactions(accountId);
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load bank transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  // Load transactions on mount and when accountId changes
  React.useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  // Handle delete transaction
  const handleDelete = async (transactionId: string) => {
    setIsSubmitting(true);
    const loadingToast = toast({
      title: "Processing",
      description: "Deleting transaction...",
    });

    try {
      const success = await deleteBankTransaction(transactionId);

      if (success) {
        // Update local state to remove the deleted transaction
        setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
        toast({
          title: "Success",
          description: "Transaction deleted successfully",
        });
      } else {
        throw new Error("Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    } finally {
      loadingToast.dismiss();
      setIsSubmitting(false);
    }
  };

  // Handle edit transaction
  const handleEdit = async (
    original: BankAccountTransaction,
    updated: Partial<BankAccountTransaction>
  ) => {
    setIsSubmitting(true);
    const loadingToast = toast({
      title: "Processing",
      description: "Updating transaction...",
    });

    try {
      // Remove id from updates (can't update primary key)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...updates } = updated;

      const success = await updateBankTransaction(original.id, updates);

      if (success) {
        // Update local state with the edited transaction
        setTransactions((prev) =>
          prev.map((t) => (t.id === original.id ? { ...t, ...updated } : t))
        );

        toast({
          title: "Success",
          description: "Transaction updated successfully",
        });
      } else {
        throw new Error("Failed to update transaction");
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    } finally {
      loadingToast.dismiss();
      setIsSubmitting(false);
    }
  };

  // Handle add transaction(s) - now just adds to state and refreshes
  const handleTransactionAdd = async (
    newTransactions: BankAccountTransaction[]
  ) => {
    // Add the new transactions to the local state
    setTransactions((prev) => [...prev, ...newTransactions]);

    // Refresh to ensure we have the latest data
    await refreshTransactions();
  };

  // Column configuration for bank transactions
  const columnConfig = React.useMemo(
    () => ({
      transaction_date: {
        title: "Date",
      },
      merchant: {
        title: "Merchant",
      },
      category: {
        title: "Category",
      },
      amount: {
        title: "Amount",
      },
    }),
    []
  );

  // Fields to exclude from automatic column generation
  const excludeFields = React.useMemo(
    () => ["account_id"] as Array<keyof BankAccountTransaction>,
    []
  );

  return (
    <div>
      {loading ? (
        <div className="flex justify-center p-4">Loading transactions...</div>
      ) : (
        <TransactionTable<BankAccountTransaction>
          transactions={transactions}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onTransactionAdd={handleTransactionAdd}
          title={title}
          columnConfig={columnConfig}
          excludeFields={excludeFields}
        />
      )}
    </div>
  );
}
