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
import { CryptoWalletTransaction } from "@/types/Transaction";
import { useParams } from "next/navigation";
import { useAccounts } from "@/contexts/AccountsContext";
import { createCryptoWalletTransaction } from "@/database/CryptoWalletTransactions";
import { toast } from "@/hooks/use-toast";
import React from "react";

const formSchema = z.object({
  transaction_type: z.enum([
    "buy",
    "sell",
    "transfer",
    "stake",
    "unstake",
    "swap",
  ]),
  amount: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Amount must be a valid number",
  }),
  price_at_transaction: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Price must be a valid number",
  }),
  fee: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

// List of common transaction types
const transactionTypes = [
  "buy",
  "sell",
  "transfer",
  "stake",
  "unstake",
  "swap",
];

interface AddCryptoWalletTransactionProps {
  onTransactionAdd: (transactions: CryptoWalletTransaction[]) => void;
}

export default function AddCryptoWalletTransaction({
  onTransactionAdd,
}: AddCryptoWalletTransactionProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const params = useParams();
  const accountId = params.id as string;
  const { refreshAccounts } = useAccounts();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transaction_type: "buy",
      amount: "",
      price_at_transaction: "",
      fee: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  // Reset form when dialog is closed
  useEffect(() => {
    if (!open) {
      form.reset({
        transaction_type: "buy",
        amount: "",
        price_at_transaction: "",
        fee: "",
        date: format(new Date(), "yyyy-MM-dd"),
      });
    }
  }, [open, form]);

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
      const priceAtTransaction = Math.abs(Number(values.price_at_transaction));
      const feeValue = values.fee ? Math.abs(Number(values.fee)) : 0;

      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error("Invalid amount value");
      }

      if (isNaN(priceAtTransaction) || priceAtTransaction <= 0) {
        throw new Error("Invalid price value");
      }

      if (isNaN(feeValue)) {
        throw new Error("Invalid fee value");
      }

      const transactionData = {
        account_id: accountId,
        transaction_date: values.date,
        transaction_type: values.transaction_type,
        amount: amountValue,
        price_at_transaction: priceAtTransaction,
        fee: feeValue || undefined,
      };

      const txId = await createCryptoWalletTransaction(transactionData);

      if (txId) {
        // Refresh accounts to update balances
        await refreshAccounts();

        // Create the transaction object with the returned ID
        const createdTransaction = {
          ...transactionData,
          id: txId,
        } as CryptoWalletTransaction;

        // Call the onTransactionAdd function from parent component
        onTransactionAdd([createdTransaction]);

        toast({
          title: "Success",
          description: "Transaction added successfully",
        });
      } else {
        throw new Error("Failed to add transaction");
      }

      // Close the dialog and reset the form
      setOpen(false);
      form.reset({
        transaction_type: "buy",
        amount: "",
        price_at_transaction: "",
        fee: "",
        date: format(new Date(), "yyyy-MM-dd"),
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Crypto Transaction</DialogTitle>
          <DialogDescription>
            Enter the details of your crypto transaction below
          </DialogDescription>
        </DialogHeader>
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
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the quantity of coins in this transaction
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price_at_transaction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price at Transaction</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter price at transaction"
                      type="number"
                      step="any"
                      min="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the price in your base currency at the time of
                    transaction
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
                      placeholder="Enter transaction fee"
                      type="number"
                      step="any"
                      min="0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter any transaction fees paid
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
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Add
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
