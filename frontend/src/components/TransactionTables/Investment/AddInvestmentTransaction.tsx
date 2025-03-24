"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { InvestmentTransaction } from "@/types/Investment";
import { useParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import React from "react";
import { createClient } from "@/utils/supabase/client";
import { useAccounts } from "@/contexts/AccountsContext";

// Form schema for investment transactions
const formSchema = z
  .object({
    transaction_type: z.enum(["buy", "sell", "dividend", "contribution", "withdrawal"]),
    transaction_date: z.string().min(1, "Date is required"),
    ticker_symbol: z.string().optional(),
    quantity: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Number(val)), {
        message: "Quantity must be a valid number",
      }),
    price_per_unit: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Number(val)), {
        message: "Price must be a valid number",
      }),
    amount: z.string().refine((val) => !isNaN(Number(val)), {
      message: "Amount must be a valid number",
    }),
    fee: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Number(val)), {
        message: "Fee must be a valid number",
      }),
    currency: z.string().min(1, "Currency is required"),
  })
  .refine(
    (data) => {
      // If transaction type is buy or sell, ticker symbol, quantity, and price are required
      if (data.transaction_type === "buy" || data.transaction_type === "sell") {
        return !!data.ticker_symbol && !!data.quantity && !!data.price_per_unit;
      }
      return true;
    },
    {
      message: "Ticker symbol, quantity, and price are required for buy/sell transactions",
      path: ["transaction_type"],
    }
  );

interface AddInvestmentTransactionProps {
  onTransactionAdd?: (transactions: InvestmentTransaction[]) => void;
  accountId?: string;
}

export default function AddInvestmentTransaction({ onTransactionAdd, accountId: propAccountId }: AddInvestmentTransactionProps) {
  const params = useParams();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshAccounts } = useAccounts();

  // Use the accountId from props if available, otherwise try to get it from params
  const paramAccountId = params?.id ? (typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null) : null;

  // Use propAccountId if available, otherwise fallback to paramAccountId
  const accountId = propAccountId || paramAccountId;

  console.log("Component initialized with propAccountId:", propAccountId, "paramAccountId:", paramAccountId, "final accountId:", accountId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transaction_type: "contribution",
      transaction_date: format(new Date(), "yyyy-MM-dd"),
      ticker_symbol: "",
      quantity: "",
      price_per_unit: "",
      amount: "",
      fee: "",
      currency: "CAD",
    },
  });

  // Make sure to reset isSubmitting when dialog opens/closes
  useEffect(() => {
    setIsSubmitting(false);

    if (open) {
      form.reset({
        transaction_type: "contribution",
        transaction_date: format(new Date(), "yyyy-MM-dd"),
        ticker_symbol: "",
        quantity: "",
        price_per_unit: "",
        amount: "",
        fee: "",
        currency: "CAD",
      });
    }
  }, [open, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Form submission started with accountId:", accountId, "and values:", values);

    if (!accountId) {
      console.error("No account ID available in params:", params);
      toast({
        title: "Error",
        description: "Account ID is missing. Please try again or refresh the page.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast({
      title: "Processing",
      description: "Adding transaction...",
    });

    try {
      // Convert string values to appropriate types
      const transactionData: Omit<InvestmentTransaction, "id"> = {
        account_id: accountId,
        transaction_date: values.transaction_date,
        transaction_type: values.transaction_type,
        ticker_symbol: values.ticker_symbol || undefined,
        quantity: values.quantity ? parseFloat(values.quantity) : undefined,
        price_per_unit: values.price_per_unit ? parseFloat(values.price_per_unit) : undefined,
        amount: parseFloat(values.amount),
        fee: values.fee ? parseFloat(values.fee) : undefined,
        currency: values.currency,
      };

      console.log("Prepared transaction data:", transactionData);

      const supabase = createClient();
      console.log("About to insert transaction into Supabase");

      // Insert the transaction
      const { data, error } = await supabase.from("investment_transactions").insert(transactionData).select("*").single();

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      // Refresh accounts to update balances
      console.log("Refreshing accounts...");
      await refreshAccounts();

      // Call the onTransactionAdd callback with the new transaction if provided
      if (onTransactionAdd) {
        console.log("Calling onTransactionAdd with:", data);
        onTransactionAdd([data as InvestmentTransaction]);
      } else {
        console.log("onTransactionAdd not provided, skipping callback");
      }

      // Show success toast
      toast({
        title: "Success",
        description: "Investment transaction has been added successfully",
      });

      // Reset form and close dialog
      console.log("Resetting form and closing dialog");
      form.reset({
        transaction_type: "contribution",
        transaction_date: format(new Date(), "yyyy-MM-dd"),
        ticker_symbol: "",
        quantity: "",
        price_per_unit: "",
        amount: "",
        fee: "",
        currency: "CAD",
      });

      // Ensure isSubmitting is set to false before closing dialog
      setIsSubmitting(false);
      // Close dialog after a short delay to ensure state updates
      setTimeout(() => {
        setOpen(false);
      }, 100);
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Ensure isSubmitting is definitely reset
      loadingToast.dismiss();
      setIsSubmitting(false);
      console.log("Form submission process completed, isSubmitting:", isSubmitting);

      // Force a re-render to ensure UI is updated
      setTimeout(() => {
        setIsSubmitting(false);
      }, 0);
    }
  }

  // Dynamic field visibility based on transaction type
  const showTradeFields = form.watch("transaction_type") === "buy" || form.watch("transaction_type") === "sell";

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Ensure isSubmitting is reset when dialog closes
        if (!newOpen) {
          setIsSubmitting(false);
        }
        setOpen(newOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Investment Transaction</DialogTitle>
          <DialogDescription>Enter the details of your investment transaction below</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transaction_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transaction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                        <SelectItem value="dividend">Dividend</SelectItem>
                        <SelectItem value="contribution">Contribution</SelectItem>
                        <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transaction_date"
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
            </div>

            {showTradeFields && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ticker_symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticker Symbol</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., AAPL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" min="0" placeholder="Number of shares/units" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {showTradeFields && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price_per_unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Unit</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" min="0" placeholder="Price per share/unit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" min="0" placeholder="Transaction fee" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="Total amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} onClick={() => console.log("Submit button clicked, isSubmitting state:", isSubmitting)}>
                {(() => {
                  console.log("Rendering button text, isSubmitting state:", isSubmitting);
                  return isSubmitting ? "Adding..." : "Add";
                })()}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
