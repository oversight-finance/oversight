"use client";

import React from "react";
import { deleteBankTransactionBatch } from "@/database/Transactions";
import TransactionTable from "../TransactionTable";
import { AccountType, BankAccountTransaction } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAccounts } from "@/contexts/AccountsContext";

interface BankTransactionTableProps {
  accountId: string;
  title?: string;
}

export default function BankTransactionTable({
  accountId,
  title = "Bank Transactions",
}: BankTransactionTableProps) {
  const {
    getTransactions,
    deleteTransaction,
    deleteBatchTransaction,
    updateTransaction,
    addTransactions,
  } = useAccounts();
  const [transactions, setTransactions] = React.useState<
    BankAccountTransaction[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Function to refresh transactions
  const refreshTransactions = React.useCallback(() => {
    if (!accountId) return;

    setLoading(true);
    try {
      setTransactions(getTransactions(AccountType.BANK, accountId));
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
  }, [accountId, getTransactions]);

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
      const success = await deleteTransaction(
        AccountType.BANK,
        accountId,
        transactionId
      );

      refreshTransactions();

      if (success) {
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
    // Check if updated object is empty or has no changes
    // This prevents immediate processing when the modal first opens
    const hasChanges =
      Object.keys(updated).length > 0 &&
      Object.keys(updated).some(
        (key) =>
          updated[key as keyof BankAccountTransaction] !==
          original[key as keyof BankAccountTransaction]
      );

    if (!hasChanges) return;

    setIsSubmitting(true);
    const loadingToast = toast({
      title: "Processing",
      description: "Updating transaction...",
    });

    try {
      // Remove id from updates (can't update primary key)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...updates } = updated;

      const success = await updateTransaction(
        AccountType.BANK,
        accountId,
        original.id,
        { ...original, ...updates }
      );

      if (success) {
        // Update local state with the edited transaction
        refreshTransactions();

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
    addTransactions(AccountType.BANK, accountId, newTransactions);

    // Refresh to ensure we have the latest data
    await refreshTransactions();
  };

  // Handle multi-delete transactions
  const handleMultiDelete = async (
    selectedTransactions: BankAccountTransaction[]
  ) => {
    if (selectedTransactions.length === 0) return;

    setIsSubmitting(true);
    const loadingToast = toast({
      title: "Processing",
      description: `Deleting ${selectedTransactions.length} transactions...`,
    });

    console.log("Deleting transactions:", selectedTransactions);

    // Find the property that contains the ID
    const transactionIds = selectedTransactions
      .map((transaction) => {
        // Log the first transaction to see its structure
        if (selectedTransactions.indexOf(transaction) === 0) {
          console.log(
            "Transaction object structure:",
            JSON.stringify(transaction)
          );
        }

        // Check if the ID exists in the transaction object
        if (transaction.id) {
          return transaction.id;
        } else {
          // Look for an ID in a possible nested structure or with different naming
          const possibleIdKeys = [
            "id",
            "transactionId",
            "transaction_id",
            "ID",
          ];
          for (const key of possibleIdKeys) {
            // Use type assertion to handle the dynamic property access
            const transactionAny = transaction as Record<string, any>;
            if (transactionAny[key]) {
              return transactionAny[key];
            }
          }

          console.error(
            "Could not find ID in transaction object:",
            transaction
          );
          return null;
        }
      })
      .filter((id) => id !== null); // Remove any null IDs

    try {
      if (transactionIds.length === 0) {
        throw new Error("No valid transaction IDs found");
      }

      const success = await deleteBatchTransaction(
        AccountType.BANK,
        accountId,
        transactionIds as string[]
      );

      refreshTransactions();

      if (success) {
        toast({
          title: "Success",
          description: "Transactions deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error deleting multiple transactions:", error);
      toast({
        title: "Error",
        description: "Failed to delete transactions",
        variant: "destructive",
      });
    } finally {
      loadingToast.dismiss();
      setIsSubmitting(false);
    }
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
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Loading transactions...</p>
        </div>
      ) : (
        <TransactionTable<BankAccountTransaction>
          transactions={transactions}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onTransactionAdd={handleTransactionAdd}
          onMultiDelete={handleMultiDelete}
          title={title}
          columnConfig={columnConfig}
          excludeFields={excludeFields}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
