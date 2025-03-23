"use client";

import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import * as React from "react";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Define the missing types
export type StringKeyOf<T> = Extract<keyof T, string>;

export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

export type ColumnType = "text" | "number" | "date" | "select" | "boolean";

export interface DataTableFilterField<TData> {
  id: StringKeyOf<TData>;
  label: string;
  placeholder?: string;
  options?: Option[];
}

export interface DataTableAdvancedFilterField<TData>
  extends DataTableFilterField<TData> {
  type: ColumnType;
}

interface DataTableToolbarProps<TData>
  extends React.HTMLAttributes<HTMLDivElement> {
  table: Table<TData>;
  /**
   * An array of filter field configurations for the data table.
   * When options are provided, a faceted filter is rendered.
   * Otherwise, a search filter is rendered.
   *
   * @example
   * const filterFields = [
   *   {
   *     id: 'name',
   *     label: 'Name',
   *     placeholder: 'Filter by name...'
   *   },
   *   {
   *     id: 'status',
   *     label: 'Status',
   *     options: [
   *       { label: 'Active', value: 'active', icon: ActiveIcon, count: 10 },
   *       { label: 'Inactive', value: 'inactive', icon: InactiveIcon, count: 5 }
   *     ]
   *   }
   * ]
   */
  filterFields?: DataTableFilterField<TData>[];
}

export function DataTableToolbar<TData>({
  table,
  filterFields = [],
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  // Memoize computation of searchableColumns and filterableColumns
  const { searchableColumns, filterableColumns } = React.useMemo(() => {
    return {
      searchableColumns: filterFields.filter((field) => !field.options),
      filterableColumns: filterFields.filter((field) => field.options),
    };
  }, [filterFields]);

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex w-full items-center justify-between gap-2 overflow-auto",
        className
      )}
      {...props}
    >
      <div className="flex flex-1 items-center gap-2">
        {searchableColumns.length > 0 &&
          searchableColumns.map(
            (column) => {
              const columnId = String(column.id);
              const columnObj = table.getColumn(columnId);
              return columnObj ? (
                <Input
                  key={columnId}
                  placeholder={column.placeholder}
                  value={(columnObj.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    columnObj.setFilterValue(event.target.value)
                  }
                  className="h-8 w-40 lg:w-64"
                />
              ) : null;
            }
          )}
        {filterableColumns.length > 0 &&
          filterableColumns.map(
            (column) => {
              const columnId = String(column.id);
              const columnObj = table.getColumn(columnId);
              return columnObj ? (
                <DataTableFacetedFilter
                  key={columnId}
                  column={columnObj}
                  title={column.label}
                  options={column.options ?? []}
                />
              ) : null;
            }
          )}
        {isFiltered && (
          <Button
            aria-label="Reset filters"
            variant="ghost"
            className="h-8 px-2 lg:px-3"
            onClick={() => table.resetColumnFilters()}
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
