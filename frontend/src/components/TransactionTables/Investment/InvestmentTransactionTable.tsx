"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import TransactionTable from "../TransactionTable";
import { InvestmentTransaction } from "@/types/Investment";

interface InvestmentTransactionTableProps {
  transactions: InvestmentTransaction[];
  onDelete?: (transactionId: string) => void;
  onEdit?: (original: InvestmentTransaction, updated: Partial<InvestmentTransaction>) => void;
  onTransactionAdd?: (transactions: InvestmentTransaction[]) => void;
  title?: string;
}

export default function InvestmentTransactionTable({ transactions, onDelete, onEdit, onTransactionAdd, title = "Investment Transactions" }: InvestmentTransactionTableProps) {
  // Custom column configurations for investment transactions
  const columnConfig: Partial<
    Record<
      keyof InvestmentTransaction,
      {
        title?: string;
        hide?: boolean;
        sortable?: boolean;
        render?: (value: unknown, row: InvestmentTransaction) => React.ReactNode;
      }
    >
  > = {
    transaction_type: {
      title: "Type",
      render: (value: unknown) => (
        <Badge variant="outline" className="capitalize">
          {(value as string) || "-"}
        </Badge>
      ),
    },
    transaction_date: {
      title: "Date",
    },
    ticker_symbol: {
      title: "Ticker",
      render: (value: unknown) => (value ? String(value) : "-"),
    },
    quantity: {
      title: "Quantity",
      render: (value: unknown, row: InvestmentTransaction) => {
        // Only show quantity for buy/sell transactions
        if (["buy", "sell"].includes(row.transaction_type)) {
          return value ? Number(value).toFixed(4) : "-";
        }
        return "-";
      },
    },
    price_per_unit: {
      title: "Price",
      render: (value: unknown, row: InvestmentTransaction) => {
        // Only show price for buy/sell transactions
        if (["buy", "sell"].includes(row.transaction_type)) {
          return value ? formatCurrency(value as number, row.currency) : "-";
        }
        return "-";
      },
    },
    amount: {
      title: "Amount",
      render: (value: unknown, row: InvestmentTransaction) => formatCurrency(value as number, row.currency),
    },
    fee: {
      title: "Fee",
      render: (value: unknown, row: InvestmentTransaction) => (value ? formatCurrency(value as number, row.currency) : "-"),
    },
  };

  // Fields to exclude from the table
  const excludeFields: (keyof InvestmentTransaction)[] = ["account_id", "currency"];

  return (
    <div className="space-y-4">
      {onTransactionAdd && (
        <div className="flex justify-end mb-2">
          <React.Suspense fallback={<div>Loading...</div>}>
            {/* Dynamic import for AddInvestmentTransaction */}
            {React.createElement(
              React.lazy(() => import("./AddInvestmentTransaction")),
              {
                onTransactionAdd,
              }
            )}
          </React.Suspense>
        </div>
      )}

      <TransactionTable transactions={transactions} onDelete={onDelete} onEdit={onEdit} title={title} columnConfig={columnConfig} excludeFields={excludeFields} accountType="investment" />
    </div>
  );
}
