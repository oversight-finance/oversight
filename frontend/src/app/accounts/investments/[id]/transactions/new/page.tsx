"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { InvestmentTransaction } from "@/types/Investment";
import { format } from "date-fns";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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

export default function AddInvestmentTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!accountId) {
      router.push("/accounts/investments");
    }
  }, [accountId, router]);

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

  // Dynamic field visibility based on transaction type
  const showTradeFields = form.watch("transaction_type") === "buy" || form.watch("transaction_type") === "sell";

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!accountId) {
      toast({
        title: "Error",
        description: "Account ID is missing",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

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

      const supabase = createClient();

      // Insert the transaction
      const { data, error } = await supabase.from("investment_transactions").insert(transactionData).select("*").single();

      if (error) {
        throw error;
      }

      // Show success toast
      toast({
        title: "Transaction Added",
        description: "Investment transaction has been added successfully",
      });

      // Redirect back to investment account page
      router.push(`/accounts/investments/${accountId}`);
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" className="mb-6" asChild>
        <Link href={`/accounts/investments/${accountId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Investment Account
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add New Investment Transaction</CardTitle>
        </CardHeader>
        <CardContent>
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
                <Button variant="outline" type="button" onClick={() => router.push(`/accounts/investments/${accountId}`)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Transaction"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
