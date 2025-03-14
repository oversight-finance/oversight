"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { UITransaction } from "@/types/Transaction";
import AddTransaction from "@/components/AddTransaction/AddTransaction";
import { formatCurrency } from "@/lib/utils";

/**
 * Configuration for a table column
 */
export interface ColumnConfig {
  key: keyof UITransaction; // Property name in the transaction object
  label: string; // Display label
  type?: "text" | "date" | "currency"; // Format type
  width?: string; // Optional width specification
  align?: "left" | "right" | "center"; // Text alignment
}

interface TransactionTableProps {
  transactions: UITransaction[];
  onDelete?: (transactionId: string) => void;
  onTransactionAdd?: (transactions: UITransaction[]) => void;
  accountType?: string; // Type of account: 'bank', 'investment', 'credit', etc.
  columns?: ColumnConfig[]; // Custom column configuration
  title?: string; // Optional custom title for the card
}

// Helper to format cell value based on type
const formatCellValue = (value: unknown, type?: string): string => {
  if (value === null || value === undefined) return "";

  switch (type) {
    case "date":
      return typeof value === "string"
        ? new Date(value).toLocaleDateString()
        : String(value);
    case "currency":
      return typeof value === "number" ? formatCurrency(value) : String(value);
    default:
      return String(value);
  }
};

// Generate default columns based on transaction type
const generateColumnsFromType = (
  transaction?: UITransaction
): ColumnConfig[] => {
  // Default columns with common fields that should always be included
  const defaultColumns: ColumnConfig[] = [
    { key: "date", label: "Date", type: "date", align: "left" },
    { key: "amount", label: "Amount", type: "currency", align: "right" },
  ];

  // If no sample transaction provided, return default columns
  if (!transaction) return defaultColumns;

  // Generate additional columns from the transaction object
  const additionalColumns: ColumnConfig[] = [];

  // Add columns based on non-empty fields in the transaction
  if (transaction.merchant !== undefined) {
    additionalColumns.push({
      key: "merchant",
      label: "Merchant",
      type: "text",
      align: "left",
    });
  }

  if (transaction.category !== undefined) {
    additionalColumns.push({
      key: "category",
      label: "Category",
      type: "text",
      align: "left",
    });
  }

  if (transaction.description !== undefined) {
    additionalColumns.push({
      key: "description",
      label: "Description",
      type: "text",
      align: "left",
    });
  }

  if (transaction.currency !== undefined) {
    additionalColumns.push({
      key: "currency",
      label: "Currency",
      type: "text",
      align: "left",
    });
  }

  // Merge and order the columns (date first, amount last, others in between)
  return [
    defaultColumns[0], // date
    ...additionalColumns,
    defaultColumns[1], // amount
  ];
};

export default function TransactionTable({
  transactions,
  onDelete,
  onTransactionAdd,
  columns,
  title = "Transactions",
}: TransactionTableProps) {
  // State for editing (placeholders for now)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<UITransaction | null>(null);

  // Use provided columns or generate from transaction data
  const tableColumns =
    columns ||
    (transactions.length > 0 ? generateColumnsFromType(transactions[0]) : []);

  // Placeholder edit functions - to be implemented later
  const handleEditStart = (transaction: UITransaction) => {
    setEditingId(transaction.id);
    setEditingTransaction({ ...transaction });
    // This is just a UI placeholder for now
    console.log("Edit started for transaction:", transaction.id);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingTransaction(null);
    console.log("Edit cancelled");
  };

  const handleEditSave = (transactionId: string) => {
    // Placeholder - will implement actual saving logic later
    console.log(
      "Edit saved for transaction:",
      transactionId,
      editingTransaction
    );
    setEditingId(null);
    setEditingTransaction(null);
  };

  // Render cell content based on edit state
  const renderCell = (transaction: UITransaction, column: ColumnConfig) => {
    const isEditing = editingId === transaction.id;
    const key = column.key;
    const value = transaction[key];

    // When in edit mode, show input fields (non-functional placeholders for now)
    if (isEditing) {
      switch (column.type) {
        case "date":
          const dateValue =
            typeof value === "string" ? value.split("T")[0] : "";
          return (
            <Input
              type="date"
              value={dateValue}
              onChange={() => {}} // Placeholder - no functionality yet
              className="w-full"
              disabled
            />
          );
        case "currency":
          return (
            <Input
              type="number"
              value={value as number}
              onChange={() => {}} // Placeholder - no functionality yet
              className="w-full text-right"
              step="0.01"
              disabled
            />
          );
        default:
          return (
            <Input
              type="text"
              value={String(value || "")}
              onChange={() => {}} // Placeholder - no functionality yet
              className="w-full"
              disabled
            />
          );
      }
    }

    // Display mode - use the formatCellValue helper
    return formatCellValue(value, column.type);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {onTransactionAdd && (
          <AddTransaction
            onTransactionAdd={(parsedData) =>
              onTransactionAdd(parsedData as UITransaction[])
            }
          />
        )}
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <div className="max-h-[500px] overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-background border-b">
                <tr>
                  {tableColumns.map((column, index) => (
                    <th
                      key={index}
                      className={`px-4 py-2 text-${column.align || "left"}`}
                      style={{ width: column.width }}
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b last:border-b-0 hover:bg-muted/50"
                    >
                      {tableColumns.map((column, index) => {
                        const key = column.key;
                        const value = row[key];
                        const isAmountColumn = key === "amount";

                        return (
                          <td
                            key={index}
                            className={`px-4 py-2 ${
                              column.align ? `text-${column.align}` : ""
                            } ${
                              isAmountColumn && (value as number) < 0
                                ? "text-destructive"
                                : isAmountColumn && (value as number) > 0
                                ? "text-success"
                                : ""
                            }`}
                          >
                            {renderCell(row, column)}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          {editingId === row.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditSave(row.id)}
                                className="h-8 w-8"
                                title="Save changes"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleEditCancel}
                                className="h-8 w-8"
                                title="Cancel editing"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditStart(row)}
                                className="h-8 w-8"
                                title="Edit transaction"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {onDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onDelete(row.id)}
                                  className="h-8 w-8"
                                  title="Delete transaction"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={tableColumns.length + 1}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
