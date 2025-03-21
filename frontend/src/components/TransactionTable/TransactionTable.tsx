"use client";

import * as React from "react";
import { UITransaction } from "@/types/Transaction";
import AddTransaction from "@/components/AddTransaction/AddTransaction";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/Cooking/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { TrendingDown, TrendingUp } from "lucide-react";
import { DataTable } from "@/components/Cooking/DataTable";

/**
 * Interface for the TransactionTable component props
 */
interface TransactionTableProps {
  transactions: UITransaction[];
  onDelete?: (transactionId: string) => void;
  onEdit?: (original: UITransaction, updated: Partial<UITransaction>) => void;
  onTransactionAdd?: (transactions: UITransaction[]) => void;
  accountType?: string; // Type of account: 'bank', 'investment', 'credit', etc.
  title?: string; // Optional custom title for the card
}

export default function TransactionTable({
  transactions,
  onDelete,
  onEdit,
  onTransactionAdd,
  title = "Transactions",
}: TransactionTableProps) {
  // Define the columns for the transactions data
  const columns: ColumnDef<UITransaction>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
        return <div>{date.toLocaleDateString()}</div>;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "merchant",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Merchant" />
      ),
      cell: ({ row }) => <div>{row.getValue("merchant") || "-"}</div>,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => {
        const category = row.getValue("category");
        return category ? (
          <Badge variant="outline" className="capitalize">
            {category as string}
          </Badge>
        ) : (
          "-"
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        const formatted = formatCurrency(amount);
        
        return (
          <div className="flex items-center">
            {amount < 0 ? (
              <TrendingDown className="mr-2 h-4 w-4 text-destructive" />
            ) : (
              <TrendingUp className="mr-2 h-4 w-4 text-success" />
            )}
            <span className={amount < 0 ? "text-destructive" : "text-success"}>
              {formatted}
            </span>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => <div>{row.getValue("description") || "-"}</div>,
      enableSorting: true,
      enableHiding: true,
    }
  ];

  // Handle the edit and delete operations
  const handleEdit = (row: UITransaction, updatedData: Partial<UITransaction>) => {
    if (onEdit) {
      onEdit(row, updatedData);
    }
  };

  const handleDelete = (row: UITransaction) => {
    if (onDelete) {
      onDelete(row.id);
    }
  };

  return (
    <div className="space-y-4">
      {onTransactionAdd && (
        <div className="flex justify-end mb-2">
          <AddTransaction
            onTransactionAdd={(parsedData) => {
              if (onTransactionAdd) {
                onTransactionAdd(parsedData as UITransaction[]);
              }
            }}
          />
        </div>
      )}
      
      <DataTable
        columns={columns}
        data={transactions}
        title={title}
        onEdit={onEdit ? handleEdit : undefined}
        onDelete={onDelete ? handleDelete : undefined}
      />
    </div>
  );
}
