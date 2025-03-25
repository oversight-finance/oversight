"use client";

import React from "react";
import TransactionTable from "../TransactionTable";
import { AccountType, InvestmentTransaction } from "@/types";
import { toast } from "@/hooks/use-toast";
import AddInvestmentTransaction from "@/components/TransactionTables/Investment/AddInvestmentTransaction";
import { useAccounts } from "@/contexts/AccountsContext";

interface InvestmentTransactionTableProps {
  accountId: string;
  title?: string;
}

export default function InvestmentTransactionTable({
  accountId,
  title = "Investment Transactions",
}: InvestmentTransactionTableProps) {
  const {
    getTransactions,
    deleteTransaction,
    updateTransaction,
    deleteBatchTransaction,
    addTransactions,
  } = useAccounts();
  const [transactions, setTransactions] = React.useState<
    InvestmentTransaction[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Function to refresh transactions
  const refreshTransactions = React.useCallback(() => {
    if (!accountId) return;

    setLoading(true);
    try {
      setTransactions(
        getTransactions(
          AccountType.INVESTMENT,
          accountId
        ) as InvestmentTransaction[]
      );
    } catch (error) {
      console.error("Failed to load investment transactions:", error);
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
        AccountType.INVESTMENT,
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
    original: InvestmentTransaction,
    updated: Partial<InvestmentTransaction>
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

      const success = await updateTransaction(
        AccountType.INVESTMENT,
        accountId,
        original.id,
        { ...original, ...updates }
      );

      if (success) {
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

  // Handle add transaction(s) - adds to state and refreshes
  const handleTransactionAdd = async (
    newTransactions: InvestmentTransaction[]
  ) => {
    // Add the new transactions using the context method
    addTransactions(AccountType.INVESTMENT, accountId, newTransactions);

    // Refresh to ensure we have the latest data
    await refreshTransactions();
  };

  // Handle multi-delete transactions
  const handleMultiDelete = async (
    selectedTransactions: InvestmentTransaction[]
  ) => {
    if (selectedTransactions.length === 0) return;

    setIsSubmitting(true);
    const loadingToast = toast({
      title: "Processing",
      description: `Deleting ${selectedTransactions.length} transactions...`,
    });

    const transactionIds = selectedTransactions
      .map((transaction) => transaction.id)
      .filter((id) => id !== undefined);

    try {
      if (transactionIds.length === 0) {
        throw new Error("No valid transaction IDs found");
      }

      const success = await deleteBatchTransaction(
        AccountType.INVESTMENT,
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

  // Column configuration for investment transactions
  const columnConfig = React.useMemo(
    () => ({
      transaction_date: {
        title: "Date",
      },
      transaction_type: {
        title: "Type",
        cell: (value: string) => {
          const typeLabels: Record<string, string> = {
            buy: "Buy",
            sell: "Sell",
            dividend: "Dividend",
            contribution: "Contribution",
            withdrawal: "Withdrawal",
          };
          return typeLabels[value] || value;
        },
      },
      ticker_symbol: {
        title: "Symbol",
        cell: (value: string) => value || "-",
      },
      quantity: {
        title: "Quantity",
        cell: (value: number) => (value ? value.toFixed(2) : "-"),
      },
      price_per_unit: {
        title: "Price",
        cell: (value: number) => {
          if (!value && value !== 0) return "-";
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(value);
        },
      },
      amount: {
        title: "Amount",
        cell: (value: number) => {
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(value);
        },
      },
      fee: {
        title: "Fee",
        cell: (value: number) => {
          if (!value && value !== 0) return "-";
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(value);
        },
      },
      description: {
        title: "Description",
      },
    }),
    []
  );

  // Fields to exclude from automatic column generation
  const excludeFields = React.useMemo(
    () => ["account_id"] as Array<keyof InvestmentTransaction>,
    []
  );

  return (
    <div>
      {loading ? (
        <div className="flex justify-center p-4">Loading transactions...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end mb-2">
            <AddInvestmentTransaction onAdd={handleTransactionAdd} />
          </div>
          <TransactionTable<InvestmentTransaction>
            transactions={transactions}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onMultiDelete={handleMultiDelete}
            title={title}
            columnConfig={columnConfig}
            excludeFields={excludeFields}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
}
