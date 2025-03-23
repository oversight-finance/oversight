"use client";

import React from "react";
import {
  fetchCryptoWalletTransactions,
  deleteCryptoWalletTransaction,
  updateCryptoWalletTransaction,
} from "@/database/CryptoWalletTransactions";
import TransactionTable from "../TransactionTable";
import { CryptoWalletTransaction } from "@/types/Transaction";
import { toast } from "@/hooks/use-toast";
import AddCryptoWalletTransaction from "./AddCryptoWalletTransaction";

interface CryptoWalletTransactionTableProps {
  accountId: string;
  title?: string;
}

export default function CryptoWalletTransactionTable({
  accountId,
  title = "Crypto Transactions",
}: CryptoWalletTransactionTableProps) {
  const [transactions, setTransactions] = React.useState<
    CryptoWalletTransaction[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [, setIsSubmitting] = React.useState(false);

  // Function to refresh transactions
  const refreshTransactions = React.useCallback(async () => {
    if (!accountId) return;

    setLoading(true);
    try {
      const data = await fetchCryptoWalletTransactions(accountId);
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load crypto wallet transactions:", error);
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
      const success = await deleteCryptoWalletTransaction(transactionId);

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
    original: CryptoWalletTransaction,
    updated: Partial<CryptoWalletTransaction>
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

      const success = await updateCryptoWalletTransaction(original.id, updates);

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

  // Handle add transaction(s) - adds to state and refreshes
  const handleTransactionAdd = async (
    newTransactions: CryptoWalletTransaction[]
  ) => {
    // Add the new transactions to the local state
    setTransactions((prev) => [...prev, ...newTransactions]);

    // Refresh to ensure we have the latest data
    await refreshTransactions();
  };

  // Column configuration for crypto wallet transactions
  const columnConfig = React.useMemo(
    () => ({
      transaction_date: {
        title: "Date",
      },
      transaction_type: {
        title: "Type",
      },
      amount: {
        title: "Amount",
      },
      price_at_transaction: {
        title: "Price",
      },
      fee: {
        title: "Fee",
      },
    }),
    []
  );

  // Fields to exclude from automatic column generation
  const excludeFields = React.useMemo(
    () => ["account_id"] as Array<keyof CryptoWalletTransaction>,
    []
  );

  return (
    <div>
      {loading ? (
        <div className="flex justify-center p-4">Loading transactions...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end mb-2">
            <AddCryptoWalletTransaction
              onTransactionAdd={handleTransactionAdd}
            />
          </div>
          <TransactionTable<CryptoWalletTransaction>
            transactions={transactions}
            onDelete={handleDelete}
            onEdit={handleEdit}
            title={title}
            columnConfig={columnConfig}
            excludeFields={excludeFields}
          />
        </div>
      )}
    </div>
  );
}
