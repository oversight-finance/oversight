"use client";

import * as React from "react";
import AddTransaction from "@/components/TransactionTable/AddTransaction";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/DataTable/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { TrendingDown, TrendingUp } from "lucide-react";
import { DataTable } from "@/components/DataTable/DataTable";

/**
 * Interface requiring common transaction fields
 */
export interface TransactionBase {
  id: string;
  [key: string]: unknown;
}

/**
 * Interface for the TransactionTable component props
 */
interface TransactionTableProps<T extends TransactionBase> {
  transactions: T[];
  onDelete?: (transactionId: string) => void;
  onEdit?: (original: T, updated: Partial<T>) => void;
  onTransactionAdd?: (transactions: T[]) => void;
  accountType?: string; // Type of account: 'bank', 'investment', 'credit', etc.
  title?: string; // Optional custom title for the card
  // Custom column renderers and configurations
  columnConfig?: Partial<
    Record<
      keyof T,
      {
        title?: string;
        hide?: boolean;
        sortable?: boolean;
        render?: (value: unknown, row: T) => React.ReactNode;
      }
    >
  >;
  // Fields to exclude from automatic column generation
  excludeFields?: Array<keyof T>;
}

// Define known field types for special rendering
type FieldType = "date" | "amount" | "currency" | "category" | "text";

export default function TransactionTable<T extends TransactionBase>({
  transactions,
  onDelete,
  onEdit,
  onTransactionAdd,
  title = "Transactions",
  columnConfig = {},
  excludeFields = [],
}: TransactionTableProps<T>) {
  // Generate columns dynamically based on T
  const generateColumns = React.useCallback((): ColumnDef<T>[] => {
    // Create selection column
    const selectionColumn: ColumnDef<T> = {
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
    };

    // Get sample transaction to determine field types if available
    const sampleTransaction = transactions[0] || {};

    // Determine field types
    const getFieldType = (key: string): FieldType => {
      // Check field name patterns
      if (key.includes("date")) return "date";
      if (key.includes("amount") || key === "price" || key === "cost")
        return "amount";
      if (key.includes("category")) return "category";

      // Check value types if sample available
      if (sampleTransaction) {
        const value = sampleTransaction[key as keyof typeof sampleTransaction];
        if (value instanceof Date) return "date";
        if (typeof value === "number") return "amount";
      }

      return "text";
    };

    // Get all keys from T type (using sample transaction or inference)
    const allKeys = Object.keys(sampleTransaction) as Array<keyof T>;

    // Filter out excluded fields
    const visibleKeys = allKeys.filter(
      (key) => !excludeFields.includes(key) && key !== "id" // Always exclude id from display
    );

    // Create columns for each key
    const dynamicColumns = visibleKeys.map((key) => {
      const fieldType = getFieldType(key as string);
      const config = columnConfig[key] || {};

      return {
        accessorKey: key as string,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={
              config.title ||
              (key as string)
                .replace(/_/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase())
            }
          />
        ),
        cell: ({ row }) => {
          // Use custom renderer if provided
          if (config.render) {
            return config.render(row.getValue(key as string), row.original);
          }

          // Otherwise use default renderers based on field type
          switch (fieldType) {
            case "date":
              const dateValue = row.getValue(key as string);
              const date = dateValue
                ? new Date(dateValue as string)
                : new Date();
              return <div>{date.toLocaleDateString()}</div>;

            case "amount":
              const amount = row.getValue(key as string) as number;
              const formatted = formatCurrency(amount);

              return (
                <div className="flex items-center">
                  {amount < 0 ? (
                    <TrendingDown className="mr-2 h-4 w-4 text-destructive" />
                  ) : (
                    <TrendingUp className="mr-2 h-4 w-4 text-success" />
                  )}
                  <span
                    className={amount < 0 ? "text-destructive" : "text-success"}
                  >
                    {formatted}
                  </span>
                </div>
              );

            case "category":
              const category = row.getValue(key as string);
              return category ? (
                <Badge variant="outline" className="capitalize">
                  {category as string}
                </Badge>
              ) : (
                "-"
              );

            default:
              return <div>{row.getValue(key as string) || "-"}</div>;
          }
        },
        enableSorting: config.sortable !== false,
        enableHiding: true,
      } as ColumnDef<T>;
    });

    // Combine selection column with dynamic columns
    return [selectionColumn, ...dynamicColumns];
  }, [transactions, columnConfig, excludeFields]);

  // Generate columns
  const columns = React.useMemo(() => generateColumns(), [generateColumns]);

  // Handle the edit and delete operations
  const handleEdit = (row: T, updatedData: Partial<T>) => {
    if (onEdit) {
      onEdit(row, updatedData);
    }
  };

  const handleDelete = (row: T) => {
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
                onTransactionAdd(parsedData as unknown as T[]);
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
