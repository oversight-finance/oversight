"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MoreHorizontal, Plus, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

interface DataTableProps<TData extends Record<string, any>, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title?: string;
  isSubmitting?: boolean;
  onEdit?: (row: TData, updatedRow: Partial<TData>) => void;
  onDelete?: (row: TData) => void;
  onAdd?: (row: TData) => void;
  onMultiDelete?: (rows: TData[]) => void;
}

export function DataTable<TData extends Record<string, any>, TValue>({
  columns,
  data,
  title = "Data",
  isSubmitting = false,
  onEdit,
  onDelete,
  onAdd,
  onMultiDelete,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [deletingRow, setDeletingRow] = React.useState<string | null>(null);
  const [isDeletingMultiple, setIsDeletingMultiple] = React.useState(false);

  // Get selected rows
  const selectedRows = React.useMemo(() => {
    return Object.keys(rowSelection).map((key) => {
      const index = parseInt(key);
      return data[index];
    });
  }, [rowSelection, data]);

  // Handle multi-delete
  const handleMultiDelete = async () => {
    if (!onMultiDelete || selectedRows.length === 0) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedRows.length} selected items?`
      )
    ) {
      setIsDeletingMultiple(true);
      try {
        await onMultiDelete(selectedRows);
        setRowSelection({});
      } catch (error) {
        console.error("Error deleting multiple items:", error);
      } finally {
        setIsDeletingMultiple(false);
      }
    }
  };

  // Create stable action column reference
  const actionColumn = React.useMemo(
    () => ({
      id: "actions",
      enableHiding: false,
      cell: ({ row }: any) => {
        const rowData = row.original as TData;
        const isDeleting = deletingRow === row.id;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                aria-label="Open menu"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <EditDialog
                    row={rowData}
                    onEdit={onEdit}
                    title={title}
                    columns={columns}
                  />
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={async () => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this item?"
                      )
                    ) {
                      setDeletingRow(row.id);
                      try {
                        await onDelete(rowData);
                      } catch (error) {
                        console.error("Error deleting item:", error);
                      } finally {
                        setDeletingRow(null);
                      }
                    }
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </>
                  )}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    [deletingRow]
  );

  // Create selection column
  const selectionColumn: ColumnDef<TData, any> = React.useMemo(
    () => ({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }),
    []
  );

  // Prepare columns with selection and actions
  const tableColumns = React.useMemo(() => {
    const cols = [...columns];

    // Add selection column if multi-delete is available
    if (onMultiDelete && !cols.some((col) => col.id === "select")) {
      cols.unshift(selectionColumn);
    }

    if ((onEdit || onDelete) && !cols.some((col) => col.id === "actions")) {
      // @ts-ignore - We know this is safe
      cols.push(actionColumn);
    }

    return cols;
  }, [columns, actionColumn, onEdit, onDelete, onMultiDelete, selectionColumn]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="px-6 py-4 flex flex-row items-center justify-between space-y-0 bg-muted/5">
        <CardTitle className="text-xl font-semibold">
          {title}
          {isSubmitting && (
            <Loader2 className="h-4 w-4 animate-spin ml-2 inline-block" />
          )}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-8 rounded-md border"
            />
          </div>
          {selectedRows.length > 0 && onMultiDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleMultiDelete}
              disabled={isDeletingMultiple}
            >
              {isDeletingMultiple ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete Selected (
                  {selectedRows.length})
                </>
              )}
            </Button>
          )}
          {onAdd && (
            <Button
              variant="default"
              size="sm"
              className="ml-2"
              onClick={() => {
                if (onAdd) {
                  // Create a new row with empty values
                  if (data.length > 0) {
                    // Use the first row as template for structure
                    const template = data[0];
                    const newRow = {} as TData;

                    // Create empty version of the row
                    Object.keys(template).forEach((key) => {
                      // @ts-expect-error - We know this is safe
                      newRow[key] =
                        typeof template[key] === "number"
                          ? 0
                          : typeof template[key] === "boolean"
                          ? false
                          : "";
                    });

                    onAdd(newRow);
                  }
                }
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative overflow-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-4 py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="py-4 px-6 border-t">
          <DataTablePagination table={table} />
        </div>
      </CardContent>
    </Card>
  );
}

// EditDialog component
interface EditDialogProps<TData extends Record<string, any>, TValue> {
  row: TData;
  onEdit: (row: TData, updatedRow: Partial<TData>) => void;
  title: string;
  columns: ColumnDef<TData, TValue>[];
}

function EditDialog<TData extends Record<string, any>, TValue>({
  row,
  onEdit,
  title,
  columns,
}: EditDialogProps<TData, TValue>) {
  const [open, setOpen] = React.useState(false);
  const [editValues, setEditValues] = React.useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = React.useState(false);

  // Initialize edit values when dialog opens
  React.useEffect(() => {
    if (open) {
      const initialValues: Record<string, any> = {};
      Object.keys(row).forEach((key) => {
        initialValues[key] = row[key as keyof TData];
      });
      setEditValues(initialValues);
    }
  }, [open, row]);

  // Handle saving edits
  const handleEditSave = async () => {
    setIsSaving(true);
    const processedValues: Record<string, any> = { ...editValues };

    // Process values to ensure they match the original data types
    Object.entries(row).forEach(([key, originalValue]) => {
      if (key in processedValues) {
        const editValue = processedValues[key];

        // Convert strings to numbers if the original was a number
        if (
          typeof originalValue === "number" &&
          typeof editValue === "string"
        ) {
          const parsed = parseFloat(editValue);
          if (!isNaN(parsed)) {
            processedValues[key] = parsed;
          }
        }

        // Convert string "true"/"false" to boolean if original was boolean
        if (
          typeof originalValue === "boolean" &&
          typeof editValue === "string"
        ) {
          if (editValue === "true") processedValues[key] = true;
          if (editValue === "false") processedValues[key] = false;
        }

        // Handle date strings
        if (originalValue instanceof Date && typeof editValue === "string") {
          processedValues[key] = new Date(editValue);
        }
      }
    });

    // Check if there are actual changes before calling onEdit
    let hasChanges = false;
    const typedValues: Partial<TData> = {};

    Object.entries(processedValues).forEach(([key, value]) => {
      if (value !== row[key]) {
        hasChanges = true;
        typedValues[key as keyof TData] = value as any;
      }
    });

    // Only call onEdit if there are actual changes
    if (hasChanges) {
      try {
        await onEdit(row, typedValues);
      } catch (error) {
        console.error("Error saving changes:", error);
      }
    }

    setIsSaving(false);
    setOpen(false);
  };

  // Handle input change in edit form
  const handleEditChange = (key: string, value: any) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  // Get column keys that should be editable (exclude id, actions, etc.)
  const getEditableColumnKeys = () => {
    const columnKeys: string[] = [];
    columns.forEach((column) => {
      if (
        "accessorKey" in column &&
        typeof column.accessorKey === "string" &&
        column.id !== "select" &&
        column.id !== "actions"
      ) {
        columnKeys.push(column.accessorKey as string);
      }
    });
    return columnKeys;
  };

  // Function to determine input type based on value
  const getInputType = (key: string, value: any): string => {
    if (value === null || value === undefined) return "text";

    if (typeof value === "boolean") return "checkbox";
    if (typeof value === "number") return "number";

    // Check if it's a date
    if (value instanceof Date) return "date";
    if (typeof value === "string") {
      // Check if string is a date format
      const dateCheck = new Date(value);
      if (
        (!isNaN(dateCheck.getTime()) && value.match(/^\d{4}-\d{2}-\d{2}/)) ||
        value.match(/^\d{2}\/\d{2}\/\d{4}/)
      ) {
        return "date";
      }
    }

    return "text";
  };

  // Function to format value for input
  const formatValueForInput = (key: string, value: any): string => {
    if (value === null || value === undefined) return "";

    if (value instanceof Date) {
      return format(value, "yyyy-MM-dd");
    }

    if (typeof value === "string") {
      // Check if string is a date format
      const dateCheck = new Date(value);
      if (
        !isNaN(dateCheck.getTime()) &&
        (value.match(/^\d{4}-\d{2}-\d{2}/) ||
          value.match(/^\d{2}\/\d{2}\/\d{4}/))
      ) {
        return format(dateCheck, "yyyy-MM-dd");
      }
    }

    return String(value);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Only allow closing the dialog if we're not currently saving
        if (!isSaving || !newOpen) {
          setOpen(newOpen);
        }
      }}
    >
      <DialogTrigger asChild>
        <div
          className="flex items-center w-full cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {title.replace(/s$/, "")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {getEditableColumnKeys().map((key) => {
            const inputType = getInputType(key, row[key]);
            const formattedValue = formatValueForInput(key, editValues[key]);

            return (
              <div key={key} className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor={key}
                  className="text-right font-medium capitalize"
                >
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/_/g, " ")
                    .trim()}
                </Label>

                {inputType === "checkbox" ? (
                  <div className="col-span-3 flex items-center">
                    <Checkbox
                      id={key}
                      checked={Boolean(editValues[key])}
                      onCheckedChange={(checked) =>
                        handleEditChange(key, checked)
                      }
                    />
                  </div>
                ) : (
                  <Input
                    id={key}
                    type={inputType}
                    value={formattedValue}
                    onChange={(e) => handleEditChange(key, e.target.value)}
                    className="col-span-3"
                  />
                )}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleEditSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
