"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAccounts } from "@/contexts/AccountsContext";
import {
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetsByUserId,
} from "@/database/Budgets";
import {
  Budget,
  BudgetFrequency,
  BudgetCategory,
  categoriesToString,
  stringToCategories,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from "@/types/Budgets";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DataTable } from "@/components/DataTable/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronsUpDown, MoreVertical, Edit, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function BudgetsPage() {
  const { getUserId } = useAuth();
  const { getCombinedTransactions } = useAccounts();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [editCategoryDropdownOpen, setEditCategoryDropdownOpen] =
    useState(false);
  const [newBudget, setNewBudget] = useState({
    budget_name: "",
    categories: [] as BudgetCategory[],
    budgetAmount: 0,
    frequency: BudgetFrequency.MONTHLY,
  });
  const [editBudget, setEditBudget] = useState({
    id: "",
    budget_name: "",
    categories: [] as BudgetCategory[],
    budgetAmount: 0,
    frequency: BudgetFrequency.MONTHLY,
  });
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  // Fetch all budgets on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userId = getUserId();

        if (!userId) return;

        const fetchedBudgets = await getBudgetsByUserId(userId);
        setBudgets(fetchedBudgets);
      } catch (error) {
        console.error("Error fetching budgets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getUserId]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const userId = getUserId();

      if (!userId) return;

      const fetchedBudgets = await getBudgetsByUserId(userId);
      setBudgets(fetchedBudgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = async () => {
    try {
      const userId = getUserId();
      if (!userId) return;

      await createBudget({
        userId,
        budget_name: newBudget.budget_name,
        category: categoriesToString(newBudget.categories),
        budgetAmount: newBudget.budgetAmount,
        frequency: newBudget.frequency,
      });

      setNewBudget({
        budget_name: "",
        categories: [] as BudgetCategory[],
        budgetAmount: 0,
        frequency: BudgetFrequency.MONTHLY,
      });

      setIsAddOpen(false);
      fetchBudgets();
    } catch (error) {
      console.error("Error adding budget:", error);
    }
  };

  const handleDeleteBudget = async (budget: Budget) => {
    try {
      await deleteBudget(budget.id);
      fetchBudgets();
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  };

  const handleUpdateBudget = async (
    budget: Budget,
    updatedBudget: Partial<Budget>
  ) => {
    try {
      await updateBudget({
        id: budget.id,
        budget_name: updatedBudget.budget_name || budget.budget_name,
        category: updatedBudget.category || budget.category,
        budgetAmount: updatedBudget.budget_amount || budget.budget_amount,
        frequency:
          (updatedBudget.frequency as BudgetFrequency) || budget.frequency,
      });
      fetchBudgets();
      setIsEditOpen(false);
    } catch (error) {
      console.error("Error updating budget:", error);
    }
  };

  // Toggle a category in the multiselect (edit mode)
  const toggleEditCategory = (category: BudgetCategory) => {
    setEditBudget((prev) => {
      const isSelected = prev.categories.includes(category);
      if (isSelected) {
        return {
          ...prev,
          categories: prev.categories.filter((c) => c !== category),
        };
      } else {
        return {
          ...prev,
          categories: [...prev.categories, category],
        };
      }
    });
  };

  // Handle category checkbox clicks without closing the dropdown (edit mode)
  const handleEditCategoryChange = (
    e: React.MouseEvent<HTMLDivElement>,
    category: BudgetCategory
  ) => {
    e.preventDefault();
    toggleEditCategory(category);
  };

  // Open edit modal and populate with budget data
  const openEditModal = (budget: Budget) => {
    setEditBudget({
      id: budget.id,
      budget_name: budget.budget_name,
      categories: stringToCategories(budget.category),
      budgetAmount: budget.budget_amount,
      frequency: budget.frequency as BudgetFrequency,
    });
    setIsEditOpen(true);
  };

  // Toggle a category in the multiselect
  const toggleCategory = (category: BudgetCategory) => {
    setNewBudget((prev) => {
      const isSelected = prev.categories.includes(category);
      if (isSelected) {
        return {
          ...prev,
          categories: prev.categories.filter((c) => c !== category),
        };
      } else {
        return {
          ...prev,
          categories: [...prev.categories, category],
        };
      }
    });
  };

  // Handle category checkbox clicks without closing the dropdown
  const handleCategoryChange = (
    e: React.MouseEvent<HTMLDivElement>,
    category: BudgetCategory
  ) => {
    e.preventDefault();
    toggleCategory(category);
  };

  // Calculate spent amount for a budget
  const calculateSpent = (budget: Budget) => {
    const allTransactions = getCombinedTransactions();
    // Filter for bank transactions only
    const transactions = allTransactions.filter(
      (tx) =>
        // Check for bank transactions based on object properties
        "account_id" in tx && !("wallet_id" in tx)
    );
    const categories = stringToCategories(budget.category);

    // Filter transactions by category and time period
    const filteredTransactions = transactions.filter((tx) => {
      const txDate = new Date(tx.transaction_date);
      const now = new Date();

      // Match category - handle different transaction types
      let txCategory = "";
      if ("category" in tx) {
        txCategory = tx.category as string;
      } else if ("merchant" in tx) {
        // Use merchant as fallback for transactions that don't have category
        txCategory = tx.merchant as string;
      } else {
        return false;
      }

      // Check if any of the budget categories matches the transaction category
      const categoryMatch = categories.some((cat) =>
        txCategory.toLowerCase().includes(cat.toLowerCase())
      );

      if (!categoryMatch) return false;

      // Check if transaction is within the current budget period
      switch (budget.frequency) {
        case BudgetFrequency.DAILY:
          return txDate.toDateString() === now.toDateString();
        case BudgetFrequency.WEEKLY:
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          return txDate >= weekStart;
        case BudgetFrequency.MONTHLY:
          return (
            txDate.getMonth() === now.getMonth() &&
            txDate.getFullYear() === now.getFullYear()
          );
        case BudgetFrequency.YEARLY:
          return txDate.getFullYear() === now.getFullYear();
        default:
          return false;
      }
    });

    // Sum up the transaction amounts (use absolute value to count spending)
    return filteredTransactions.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0
    );
  };

  // Calculate progress percentage
  const calculateProgress = (budget: Budget) => {
    const spent = calculateSpent(budget);
    return Math.min(100, (spent / budget.budget_amount) * 100);
  };

  // Get friendly display of categories with tooltip for hidden ones
  const displayCategories = (categoriesString: string) => {
    const categories = stringToCategories(categoriesString);
    if (categories.length === 0) return "None";

    return (
      <div className="flex flex-wrap gap-1 items-center">
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant="secondary"
            className="text-xs py-0.5 px-2 max-h-5"
          >
            {cat}
          </Badge>
        ))}
      </div>
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  // Define table columns
  const columns: ColumnDef<Budget>[] = [
    {
      accessorKey: "budget_name",
      header: "Budget Name",
      size: 150,
    },
    {
      accessorKey: "category",
      header: "Categories",
      cell: ({ row }) => displayCategories(row.original.category),
      size: 200,
    },
    {
      id: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const budget = row.original;
        const spent = calculateSpent(budget);
        const progress = calculateProgress(budget);
        const isOverBudget = spent > budget.budget_amount;

        return (
          <div className="w-full py-2">
            <Progress
              value={progress}
              className={`h-4 ${isOverBudget ? "bg-red-200" : "bg-green-400"}`}
              indicatorClassName={isOverBudget ? "bg-red-500" : "bg-gray-300"}
            />
          </div>
        );
      },
      size: 400,
    },
    {
      id: "spent",
      header: "Spent",
      cell: ({ row }) => {
        const spent = calculateSpent(row.original);
        return formatCurrency(spent);
      },
      size: 120,
    },
    {
      id: "remaining",
      header: "Remaining",
      cell: ({ row }) => {
        const budget = row.original;
        const spent = calculateSpent(budget);
        const remaining = budget.budget_amount - spent;
        const isOverBudget = remaining < 0;

        return (
          <span
            className={
              isOverBudget
                ? "text-red-500 font-medium"
                : "text-green-500 font-medium"
            }
          >
            {isOverBudget
              ? `-${formatCurrency(Math.abs(remaining))} (${Math.round(
                  (Math.abs(remaining) / budget.budget_amount) * 100
                )}%)`
              : formatCurrency(remaining)}
          </span>
        );
      },
      size: 120,
    },
  ];

  // Group budgets by frequency
  const dailyBudgets = budgets.filter(
    (b) => b.frequency === BudgetFrequency.DAILY
  );
  const weeklyBudgets = budgets.filter(
    (b) => b.frequency === BudgetFrequency.WEEKLY
  );
  const monthlyBudgets = budgets.filter(
    (b) => b.frequency === BudgetFrequency.MONTHLY
  );
  const yearlyBudgets = budgets.filter(
    (b) => b.frequency === BudgetFrequency.YEARLY
  );

  // Define a budget item that goes inside a section card
  const BudgetItem = ({ budget }: { budget: Budget }) => {
    const spent = calculateSpent(budget);
    const progress = calculateProgress(budget);
    const remaining = budget.budget_amount - spent;
    const isOverBudget = remaining < 0;

    return (
      <div className="py-2 border-b last:border-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="font-medium truncate">{budget.budget_name}</div>
            <div className="flex-shrink-0">
              {displayCategories(budget.category)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => openEditModal(budget)}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setBudgetToDelete(budget);
                    setDeleteAlertOpen(true);
                  }}
                  className="text-destructive cursor-pointer"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Progress Bar with integrated stats */}
        <div className="relative">
          <Progress
            value={progress}
            className={`h-6 w-full ${
              isOverBudget ? "bg-red-100" : "bg-green-100"
            }`}
            indicatorClassName={isOverBudget ? "bg-red-300" : "bg-gray-300"}
          />
          <div className="absolute inset-0 flex justify-between items-center px-2 text-xs">
            <span className="font-medium text-black">
              {formatCurrency(spent)} / {formatCurrency(budget.budget_amount)}
            </span>
            <span className="font-medium text-black">
              {isOverBudget
                ? `Over: ${formatCurrency(Math.abs(remaining))} (${Math.round(
                    (Math.abs(remaining) / budget.budget_amount) * 100
                  )}%)`
                : `Left: ${formatCurrency(Math.abs(remaining))}`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Define section card component that groups budgets by frequency
  const BudgetSection = ({
    title,
    budgets,
  }: {
    title: string;
    budgets: Budget[];
  }) => {
    if (budgets.length === 0) return null;

    return (
      <Card className="w-full max-w-[600px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1">
            {budgets.map((budget) => (
              <BudgetItem key={budget.id} budget={budget} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Budgets</h1>
        <Button onClick={() => setIsAddOpen(true)}>Add Budget</Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            No budgets found. Create your first budget!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <BudgetSection title="Daily Budgets" budgets={dailyBudgets} />
          <BudgetSection title="Weekly Budgets" budgets={weeklyBudgets} />
          <BudgetSection title="Monthly Budgets" budgets={monthlyBudgets} />
          <BudgetSection title="Yearly Budgets" budgets={yearlyBudgets} />
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Budget</DialogTitle>
            <DialogDescription>
              Create a new budget for specific categories.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Budget Name</Label>
              <Input
                id="name"
                value={newBudget.budget_name}
                onChange={(e) =>
                  setNewBudget({
                    ...newBudget,
                    budget_name: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="categories">Categories</Label>
              <DropdownMenu
                open={categoryDropdownOpen}
                onOpenChange={setCategoryDropdownOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-auto min-h-10 py-2"
                  >
                    {newBudget.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {newBudget.categories.map((category) => (
                          <Badge key={category} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        Select categories...
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-full max-h-96 overflow-auto p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuLabel>Categories</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.values(BudgetCategory)
                    // Filter to only show expense categories (exclude income categories)
                    .filter((category) => !INCOME_CATEGORIES.includes(category))
                    .map((category) => (
                      <div
                        key={category}
                        className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                        onClick={(e) => handleCategoryChange(e, category)}
                      >
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                          {newBudget.categories.includes(category) && (
                            <Check className="h-4 w-4" />
                          )}
                        </span>
                        {category}
                      </div>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Budget Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={newBudget.budgetAmount}
                onChange={(e) =>
                  setNewBudget({
                    ...newBudget,
                    budgetAmount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={newBudget.frequency}
                onValueChange={(value) =>
                  setNewBudget({
                    ...newBudget,
                    frequency: value as BudgetFrequency,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BudgetFrequency.DAILY}>Daily</SelectItem>
                  <SelectItem value={BudgetFrequency.WEEKLY}>Weekly</SelectItem>
                  <SelectItem value={BudgetFrequency.MONTHLY}>
                    Monthly
                  </SelectItem>
                  <SelectItem value={BudgetFrequency.YEARLY}>Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddBudget}
              disabled={
                !newBudget.budget_name ||
                newBudget.categories.length === 0 ||
                newBudget.budgetAmount <= 0
              }
            >
              Add Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
            <DialogDescription>Update your existing budget.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Budget Name</Label>
              <Input
                id="edit-name"
                value={editBudget.budget_name}
                onChange={(e) =>
                  setEditBudget({
                    ...editBudget,
                    budget_name: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-categories">Categories</Label>
              <DropdownMenu
                open={editCategoryDropdownOpen}
                onOpenChange={setEditCategoryDropdownOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-auto min-h-10 py-2"
                  >
                    {editBudget.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {editBudget.categories.map((category) => (
                          <Badge key={category} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        Select categories...
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-full max-h-96 overflow-auto p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuLabel>Categories</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.values(BudgetCategory)
                    // Filter to only show expense categories (exclude income categories)
                    .filter((category) => !INCOME_CATEGORIES.includes(category))
                    .map((category) => (
                      <div
                        key={category}
                        className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                        onClick={(e) => handleEditCategoryChange(e, category)}
                      >
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                          {editBudget.categories.includes(category) && (
                            <Check className="h-4 w-4" />
                          )}
                        </span>
                        {category}
                      </div>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-amount">Budget Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                min="0"
                step="0.01"
                value={editBudget.budgetAmount}
                onChange={(e) =>
                  setEditBudget({
                    ...editBudget,
                    budgetAmount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-frequency">Frequency</Label>
              <Select
                value={editBudget.frequency}
                onValueChange={(value) =>
                  setEditBudget({
                    ...editBudget,
                    frequency: value as BudgetFrequency,
                  })
                }
              >
                <SelectTrigger id="edit-frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BudgetFrequency.DAILY}>Daily</SelectItem>
                  <SelectItem value={BudgetFrequency.WEEKLY}>Weekly</SelectItem>
                  <SelectItem value={BudgetFrequency.MONTHLY}>
                    Monthly
                  </SelectItem>
                  <SelectItem value={BudgetFrequency.YEARLY}>Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const budget = budgets.find((b) => b.id === editBudget.id);
                if (budget) {
                  handleUpdateBudget(budget, {
                    budget_name: editBudget.budget_name,
                    category: categoriesToString(editBudget.categories),
                    budget_amount: editBudget.budgetAmount,
                    frequency: editBudget.frequency,
                  });
                }
              }}
              disabled={
                !editBudget.budget_name ||
                editBudget.categories.length === 0 ||
                editBudget.budgetAmount <= 0
              }
            >
              Update Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this budget. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBudgetToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (budgetToDelete) {
                  handleDeleteBudget(budgetToDelete);
                  setBudgetToDelete(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
