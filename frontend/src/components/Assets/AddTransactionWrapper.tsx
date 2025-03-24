"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AddInvestmentTransaction from "@/components/TransactionTables/Investment/AddInvestmentTransaction";
import { InvestmentTransaction } from "@/types/Investment";

interface AddTransactionWrapperProps {
  accountId: string;
}

export default function AddTransactionWrapper({ accountId }: AddTransactionWrapperProps) {
  console.log("AddTransactionWrapper initialized with accountId:", accountId);
  const router = useRouter();

  const handleTransactionAdded = (transactions: InvestmentTransaction[]) => {
    console.log("Transaction added successfully, refreshing page:", transactions);

    // Use router.refresh() to refresh the server component data
    router.refresh();
  };

  return <AddInvestmentTransaction accountId={accountId} onTransactionAdd={handleTransactionAdded} />;
}
