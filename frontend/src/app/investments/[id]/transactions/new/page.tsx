"use client";

import { Metadata } from "next";
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

export default function InvestmentTransactionRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id ? (typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : null) : null;

  useEffect(() => {
    if (id) {
      router.replace(`/accounts/investments/${id}/transactions/new`);
    } else {
      router.replace(`/accounts/investments`);
    }
  }, [id, router]);

  return (
    <div className="container mx-auto p-8 text-center">
      <p>Redirecting...</p>
    </div>
  );
}
