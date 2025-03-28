"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Switch } from "@/components/ui/switch";
import { BankAccountTransaction } from "@/types";
import { useParams } from "next/navigation";
import { useAccounts } from "@/contexts/AccountsContext";
import { toast } from "@/hooks/use-toast";
import React from "react";
import { createRecurringSchedule } from "@/database/RecurringSchedules";
import { formatCurrency } from "@/lib/utils";
import { FrequencyType } from "@/types/RecurringSchedule";
import {
  BudgetCategory,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from "@/types/Budgets";

const formSchema = z
  .object({
    transactionType: z.enum(["income", "expense"]),
    merchant: z.string().min(1, "Merchant name is required"),
    amount: z.string().refine((val) => !isNaN(Number(val)), {
      message: "Amount must be a valid number",
    }),
    category: z.string().min(1, "Category is required"),
    date: z.string().min(1, "Date is required"),
    isRecurring: z.boolean().default(false),
    recurringFrequency: z.enum(["weekly", "monthly", "yearly"]).optional(),
    recurringEndDate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring) {
      if (!data.recurringFrequency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Frequency is required for recurring transactions",
          path: ["recurringFrequency"],
        });
      }
    }
  });

interface AddBankTransactionProps {
  onTransactionAdd: (transactions: BankAccountTransaction[]) => void;
}

// Use the imported category arrays
// Define income category values using BudgetCategory enum values
const incomeCategories = INCOME_CATEGORIES;

// Define expense category values using BudgetCategory enum values
const expenseCategories = EXPENSE_CATEGORIES;

export default function AddBankTransaction({
  onTransactionAdd,
}: AddBankTransactionProps) {
  const [open, setOpen] = useState(false);
  const { id: accountId } = useParams();
  const { refreshAccounts, processRecurringTransactions } = useAccounts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transactionType: "expense",
      merchant: "",
      amount: "",
      category: "",
      date: format(new Date(), "yyyy-MM-dd"),
      isRecurring: false,
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        transactionType: "expense",
        merchant: "",
        amount: "",
        category: "",
        date: format(new Date(), "yyyy-MM-dd"),
        isRecurring: false,
      });
    }
  }, [open, form]);

  const isRecurring = form.watch("isRecurring");
  const transactionType = form.watch("transactionType");

  // Reset category when transaction type changes
  useEffect(() => {
    // Reset the category when transaction type changes
    form.setValue("category", "");
  }, [transactionType, form]);

  // Get the appropriate categories based on transaction type
  const categories =
    transactionType === "income" ? incomeCategories : expenseCategories;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Form submission started with values:", values);

    // Validate accountId is available
    if (!accountId) {
      console.error("No account ID available");
      toast({
        title: "Error",
        description: "No account selected. Cannot add transaction.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast({
      title: "Processing",
      description: "Adding transaction...",
    });

    try {
      // Convert amount to positive or negative based on transaction type
      const amountValue = Math.abs(Number(values.amount));
      if (isNaN(amountValue) || amountValue <= 0) {
        console.error("Invalid amount value:", values.amount);
        throw new Error("Invalid amount value");
      }

      const adjustedAmount =
        values.transactionType === "income" ? amountValue : -amountValue;

      // Ensure date is properly formatted as ISO string for the database
      // This prevents browser timezone issues by setting the time to noon UTC
      const dateParts = values.date.split("-");
      const formattedDate = new Date(
        Number(dateParts[0]),
        Number(dateParts[1]) - 1, // Month is 0-indexed in JavaScript
        Number(dateParts[2]),
        12, // Set to noon UTC to avoid timezone issues
        0,
        0
      ).toISOString();

      // Handle either recurring or immediate transaction
      if (values.isRecurring && values.recurringFrequency) {
        if (!accountId) {
          console.error("No account ID available for recurring schedule");
          toast({
            title: "Error",
            description:
              "Could not create recurring transaction. Please try again.",
            variant: "destructive",
          });
          loadingToast.dismiss();
          setIsSubmitting(false);
          return;
        }

        // Map form frequency to RecurringSchedule frequency
        let scheduleFrequency;
        switch (values.recurringFrequency) {
          case "weekly":
            scheduleFrequency = FrequencyType.WEEKLY;
            break;
          case "monthly":
            scheduleFrequency = FrequencyType.MONTHLY;
            break;
          case "yearly":
            scheduleFrequency = FrequencyType.ANNUALLY;
            break;
        }

        // Create recurring schedule data according to RecurringSchedule interface
        const scheduleData = {
          account_id: accountId as string,
          frequency: scheduleFrequency,
          start_date: values.date,
          end_date: values.recurringEndDate || null,
          merchant: values.merchant,
          category: values.category,
          amount: adjustedAmount,
        };

        // Create the recurring schedule
        const scheduleId = await createRecurringSchedule(scheduleData);

        if (!scheduleId) {
          console.error("Failed to create recurring schedule");
          toast({
            title: "Error",
            description: "Failed to create recurring transaction",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Recurring transaction schedule created successfully",
          });
          processRecurringTransactions();
        }
      } else {
        // For non-recurring transactions, create an immediate transaction
        const baseTransactionData = {
          account_id: accountId as string,
          transaction_date: formattedDate,
          amount: adjustedAmount,
          merchant: values.merchant,
          category: values.category,
        };

        // Call the onTransactionAdd function from parent component
        onTransactionAdd([baseTransactionData as BankAccountTransaction]);

        toast({
          title: "Success",
          description: "Transaction added successfully",
        });
      }

      // Close the dialog and reset the form
      console.log("Closing dialog and resetting form");
      setOpen(false);
      form.reset({
        transactionType: "expense",
        merchant: "",
        amount: "",
        category: "",
        date: new Date().toISOString(),
        isRecurring: false,
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    } finally {
      loadingToast.dismiss();
      setIsSubmitting(false);
      console.log("Form submission process completed");
    }
  }

  // Add validation log to form setup
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      console.log("Form values changed:", value);
      const formState = form.getFieldState("amount");
      if (formState.error) {
        console.log("Amount field error:", formState.error);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        console.log("Dialog open state changing to:", newOpen);
        setOpen(newOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            console.log("Add Transaction button clicked");
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Enter the details of your transaction below
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              console.log("Form submit event triggered");
              console.log("Current form values:", form.getValues());
              console.log("Form errors:", form.formState.errors);
              form.handleSubmit(onSubmit)(e);
            }}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Transaction Type</FormLabel>
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="income-option"
                        value="income"
                        checked={field.value === "income"}
                        onChange={() => field.onChange("income")}
                        className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor="income-option"
                        className="font-normal cursor-pointer"
                      >
                        Income
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="expense-option"
                        value="expense"
                        checked={field.value === "expense"}
                        onChange={() => field.onChange("expense")}
                        className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor="expense-option"
                        className="font-normal cursor-pointer"
                      >
                        Expense
                      </label>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="merchant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {transactionType === "income" ? "Source" : "Merchant"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        transactionType === "income"
                          ? "Enter income source"
                          : "Enter merchant name"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter amount"
                      type="number"
                      step="0.01"
                      min="0"
                      onKeyDown={(e) => {
                        // Prevent minus sign
                        if (e.key === "-" || e.key === "e") {
                          e.preventDefault();
                        }
                      }}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter amount as a positive value.{" "}
                    {transactionType === "income"
                      ? "This will be recorded as income."
                      : "This will be recorded as an expense."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      // Reset value when transaction type changes
                      field.onChange(value);
                    }}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Recurring Transaction</FormLabel>
                    <FormDescription>
                      Make this a recurring transaction
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Toggle recurring transaction"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isRecurring && (
              <>
                <FormField
                  control={form.control}
                  name="recurringFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recurringEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          min={form.getValues().date}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave blank for an indefinite recurring transaction
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  console.log("Cancel button clicked");
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={() =>
                  console.log(
                    "Submit button clicked, form valid:",
                    form.formState.isValid
                  )
                }
              >
                Add
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
