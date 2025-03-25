"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { useParams } from "next/navigation";
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
import { InvestmentTransaction } from "@/types/Transaction";
import { toast } from "@/hooks/use-toast";
import React from "react";

const formSchema = z.object({
  transaction_type: z.enum([
    "buy",
    "sell",
    "dividend",
    "contribution",
    "withdrawal",
  ]),
  ticker_symbol: z.string().optional().or(z.literal("")),
  quantity: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || !isNaN(Number(val)), {
      message: "Quantity must be a valid number",
    }),
  price_per_unit: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || !isNaN(Number(val)), {
      message: "Price must be a valid number",
    }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a valid positive number",
  }),
  fee: z.string().optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional().or(z.literal("")),
});

// List of transaction types
const transactionTypes = [
  "buy",
  "sell",
  "dividend",
  "contribution",
  "withdrawal",
];

interface AddInvestmentTransactionProps {
  onAdd: (transactions: InvestmentTransaction[]) => void;
}

export default function AddInvestmentTransaction({
  onAdd,
}: AddInvestmentTransactionProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTickerFields, setShowTickerFields] = useState(true);
  const params = useParams();
  const accountId = params.id as string;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transaction_type: "buy",
      ticker_symbol: "",
      quantity: "",
      price_per_unit: "",
      amount: "",
      fee: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  // Watch transaction type to show/hide relevant fields
  const transactionType = form.watch("transaction_type");

  // Update field visibility based on transaction type
  useEffect(() => {
    const isSecurityTransaction =
      transactionType === "buy" || transactionType === "sell";
    setShowTickerFields(isSecurityTransaction);

    // Reset security-specific fields when switching to non-security transaction types
    if (!isSecurityTransaction) {
      form.setValue("ticker_symbol", "");
      form.setValue("quantity", "");
      form.setValue("price_per_unit", "");
    }
  }, [transactionType, form]);

  // Reset form when dialog is closed
  useEffect(() => {
    if (!open) {
      form.reset({
        transaction_type: "buy",
        ticker_symbol: "",
        quantity: "",
        price_per_unit: "",
        amount: "",
        fee: "",
        date: format(new Date(), "yyyy-MM-dd"),
      });
    }
  }, [open, form]);

  // Auto-calculate amount for buy/sell transactions
  useEffect(() => {
    if (showTickerFields) {
      const quantity = Number(form.getValues("quantity"));
      const price = Number(form.getValues("price_per_unit"));

      if (!isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
        const calculatedAmount = quantity * price;
        form.setValue("amount", calculatedAmount.toString());
      }
    }
  }, [
    form.watch("quantity"),
    form.watch("price_per_unit"),
    showTickerFields,
    form,
  ]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Validate accountId is available
    if (!accountId) {
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
      // Parse and validate numeric values
      const amountValue = Math.abs(Number(values.amount));
      const feeValue = values.fee ? Math.abs(Number(values.fee)) : 0;

      // Only parse these for buy/sell transactions
      const quantityValue = values.quantity
        ? Math.abs(Number(values.quantity))
        : undefined;
      const priceValue = values.price_per_unit
        ? Math.abs(Number(values.price_per_unit))
        : undefined;

      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error("Invalid amount value");
      }

      if (
        values.transaction_type === "buy" ||
        values.transaction_type === "sell"
      ) {
        if (!values.ticker_symbol) {
          throw new Error(
            "Ticker symbol is required for buy/sell transactions"
          );
        }

        if (isNaN(Number(quantityValue)) || !quantityValue) {
          throw new Error(
            "Valid quantity is required for buy/sell transactions"
          );
        }

        if (isNaN(Number(priceValue)) || !priceValue) {
          throw new Error("Valid price is required for buy/sell transactions");
        }
      }

      const transactionData: Partial<InvestmentTransaction> = {
        account_id: accountId,
        transaction_date: values.date,
        transaction_type: values.transaction_type,
        amount: amountValue,
        fee: feeValue || undefined,
      };

      // Add security-specific fields for buy/sell transactions
      if (
        values.transaction_type === "buy" ||
        values.transaction_type === "sell"
      ) {
        transactionData.ticker_symbol = values.ticker_symbol;
        transactionData.quantity = quantityValue;
        transactionData.price_per_unit = priceValue;
      }

      // Call the onAdd function from parent component
      onAdd([transactionData as InvestmentTransaction]);

      toast({
        title: "Success",
        description: "Transaction added successfully",
      });

      // Close the dialog and reset the form
      setOpen(false);
      form.reset({
        transaction_type: "buy",
        ticker_symbol: "",
        quantity: "",
        price_per_unit: "",
        amount: "",
        fee: "",
        date: format(new Date(), "yyyy-MM-dd"),
        description: "",
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add transaction",
        variant: "destructive",
      });
    } finally {
      loadingToast.dismiss();
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Investment Transaction</DialogTitle>
          <DialogDescription>
            Enter the details of your investment transaction below
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="transaction_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transaction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transactionTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showTickerFields && (
                <>
                  <FormField
                    control={form.control}
                    name="ticker_symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ticker Symbol</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., AAPL" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the ticker symbol of the security
                        </FormDescription>
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
                          <Input
                            placeholder="Enter quantity"
                            type="number"
                            step="any"
                            min="0"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of shares or units
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price_per_unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Per Unit</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter price"
                            type="number"
                            step="any"
                            min="0"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Price per share or unit</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

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
                        step="any"
                        min="0"
                        readOnly={showTickerFields}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {showTickerFields
                        ? "Total transaction amount (calculated automatically)"
                        : "Enter the total amount"}
                    </FormDescription>
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
                      <Input
                        placeholder="Enter fee amount"
                        type="number"
                        step="any"
                        min="0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Any commission or transaction fee
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Adding..." : "Add Transaction"}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
