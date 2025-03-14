"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableFooter,
  TableCaption,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  PlusCircle,
  Plus,
  Check,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";

/**
 * Column configuration for the data table
 */
export interface ColumnDef<T> {
  accessorKey: keyof T; // Key to access the data property
  header: string; // Display label for column header
  cell?: (value: any, row: T) => React.ReactNode; // Optional custom cell renderer
  type?: "text" | "date" | "currency" | "number"; // Format type
  editable?: boolean; // Whether this column can be edited
  width?: string; // Optional width specification
  align?: "left" | "right" | "center"; // Text alignment
}

interface DataTableProps<T extends Record<string, any>> {
  data: T[]; // Array of data objects
  columns: ColumnDef<T>[]; // Column definitions
  title?: string; // Table title
  onDelete?: (row: T) => void; // Delete handler
  onAdd?: (row: T) => void; // Add handler
  onEdit?: (original: T, updated: Partial<T>) => void; // Edit handler
  showActions?: boolean; // Whether to show action buttons
  emptyMessage?: string; // Custom message for empty state
}

/**
 * Format a value for display based on its type
 */
function formatValue(value: any, type?: string): string {
  if (value === null || value === undefined) return "";

  switch (type) {
    case "date":
      return value instanceof Date
        ? value.toLocaleDateString()
        : typeof value === "string"
        ? new Date(value).toLocaleDateString()
        : String(value);
    case "currency":
      return typeof value === "number" ? formatCurrency(value) : String(value);
    case "number":
      return typeof value === "number" ? value.toString() : String(value);
    default:
      return String(value);
  }
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title = "Data",
  onDelete,
  onAdd,
  onEdit,
  showActions = true,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<T>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRowValues, setNewRowValues] = useState<Partial<T>>({});

  // Start editing a row
  const handleEditStart = (row: T) => {
    const rowId = row.id as string | number;
    setEditingId(rowId);
    setEditingValues({ ...row });
    console.log("Edit started for row:", rowId);
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditingId(null);
    setEditingValues({});
  };

  // Save edited row
  const handleEditSave = (original: T) => {
    if (onEdit) {
      onEdit(original, editingValues);
    }
    setEditingId(null);
    setEditingValues({});
  };

  // Handle field value change during editing
  const handleEditChange = (key: keyof T, value: any) => {
    setEditingValues((prev) => ({ ...prev, [key]: value }));
  };

  // Determine if a column's value is a number or currency for alignment
  const getColumnAlignment = (column: ColumnDef<T>) => {
    if (column.align) return column.align;
    if (column.type === "number" || column.type === "currency") return "right";
    return "left";
  };

  // Render a cell with custom formatting, editing support, and alignment
  const renderCell = (row: T, column: ColumnDef<T>) => {
    const key = column.accessorKey;
    const value = row[key];
    const isEditing =
      editingId !== null && editingId === (row.id as string | number);

    // Custom cell renderer takes priority
    if (column.cell && !isEditing) {
      return column.cell(value, row);
    }

    // When in edit mode, show input fields
    if (isEditing && column.editable !== false) {
      switch (column.type) {
        case "date":
          const dateValue =
            value instanceof Date
              ? value.toISOString().split("T")[0]
              : typeof value === "string"
              ? value.split("T")[0]
              : "";
          return (
            <Input
              type="date"
              value={dateValue}
              onChange={(e) => handleEditChange(key, e.target.value)}
              className="w-full"
            />
          );
        case "currency":
        case "number":
          return (
            <Input
              type="number"
              value={
                editingValues[key] !== undefined ? editingValues[key] : value
              }
              onChange={(e) =>
                handleEditChange(
                  key,
                  e.target.value ? parseFloat(e.target.value) : ""
                )
              }
              className={`w-full text-${getColumnAlignment(column)}`}
              step="0.01"
            />
          );
        default:
          return (
            <Input
              type="text"
              value={
                editingValues[key] !== undefined
                  ? String(editingValues[key])
                  : String(value || "")
              }
              onChange={(e) => handleEditChange(key, e.target.value)}
              className="w-full"
            />
          );
      }
    }

    // Display mode
    return formatValue(value, column.type);
  };

  // Apply style classes for a cell
  const getCellClasses = (column: ColumnDef<T>, row: T) => {
    const classes = [`text-${getColumnAlignment(column)}`];

    // Add special styling for currency and number fields
    if (
      (column.type === "currency" || column.type === "number") &&
      typeof row[column.accessorKey] === "number"
    ) {
      const value = row[column.accessorKey] as number;
      if (value < 0) classes.push("text-destructive");
      else if (value > 0 && column.type === "currency")
        classes.push("text-success");
    }

    return classes.join(" ");
  };

  // Handle adding a new item
  const handleAddNew = () => {
    setIsAddingNew(true);
    // Initialize with empty values
    const initialValues: Partial<T> = {};
    columns.forEach((column) => {
      if (column.editable !== false) {
        // Set default values based on type
        switch (column.type) {
          case "date":
            initialValues[column.accessorKey] = new Date()
              .toISOString()
              .split("T")[0] as any;
            break;
          case "number":
          case "currency":
            initialValues[column.accessorKey] = 0 as any;
            break;
          default:
            initialValues[column.accessorKey] = "" as any;
        }
      }
    });
    setNewRowValues(initialValues);
  };

  // Cancel adding new item
  const handleAddCancel = () => {
    setIsAddingNew(false);
    setNewRowValues({});
  };

  // Save new item
  const handleAddSave = () => {
    if (onAdd) {
      onAdd(newRowValues as T);
    }
    setIsAddingNew(false);
    setNewRowValues({});
  };

  // Handle field value change when adding new item
  const handleAddChange = (key: keyof T, value: any) => {
    setNewRowValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {onAdd && (
          <>
            <Button variant="outline" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New
            </Button>

            {isAddingNew && (
              <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New {title.replace(/s$/, "")}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {columns.map((column, index) => {
                      if (column.editable === false) return null;

                      const key = column.accessorKey;
                      const value = newRowValues[key];

                      return (
                        <div
                          key={index}
                          className="grid grid-cols-4 items-center gap-4"
                        >
                          <label className="text-right">{column.header}</label>
                          {column.type === "date" ? (
                            <Input
                              type="date"
                              value={
                                typeof value === "string"
                                  ? value.split("T")[0]
                                  : ""
                              }
                              onChange={(e) =>
                                handleAddChange(key, e.target.value)
                              }
                              className="col-span-3"
                            />
                          ) : column.type === "number" ||
                            column.type === "currency" ? (
                            <Input
                              type="number"
                              value={value !== undefined ? value : ""}
                              onChange={(e) =>
                                handleAddChange(
                                  key,
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : 0
                                )
                              }
                              className="col-span-3"
                              step="0.01"
                            />
                          ) : (
                            <Input
                              type="text"
                              value={value !== undefined ? String(value) : ""}
                              onChange={(e) =>
                                handleAddChange(key, e.target.value)
                              }
                              className="col-span-3"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleAddCancel}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSave}>Add</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead
                    key={index}
                    className={`text-${getColumnAlignment(column)}`}
                    style={{ width: column.width }}
                  >
                    {column.header}
                  </TableHead>
                ))}
                {showActions && (
                  <TableHead className="text-right w-[100px]">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((row, rowIndex) => {
                  const rowId = row.id as string | number;
                  const isEditing = editingId === rowId;

                  return (
                    <TableRow key={rowId || rowIndex}>
                      {columns.map((column, colIndex) => (
                        <TableCell
                          key={`${rowId || rowIndex}-${colIndex}`}
                          className={getCellClasses(column, row)}
                        >
                          {renderCell(row, column)}
                        </TableCell>
                      ))}
                      {showActions && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditSave(row)}
                                  className="h-8 w-8"
                                  title="Save changes"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleEditCancel}
                                  className="h-8 w-8"
                                  title="Cancel editing"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                {onEdit && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditStart(row)}
                                    className="h-8 w-8"
                                    title="Edit row"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                )}
                                {onDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDelete(row)}
                                    className="h-8 w-8"
                                    title="Delete row"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (showActions ? 1 : 0)}
                    className="h-24 text-center"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
