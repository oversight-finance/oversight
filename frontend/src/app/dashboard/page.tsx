"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import CSVUploader from "../csvParser";
import Networth from "@/components/Networth/Networth";
import TransactionTable from "@/components/TransactionTable/TransactionTable";
import SpendingChart from "@/components/SpendingChart/SpendingChart";
import {
  type ParsedData,
  type NetWorthDataPoint,
  defaultNetWorthData,
} from "@/utils/dataTransformers";
import { AccountsProvider, useAccounts } from "@/contexts/AccountsContext";
import CreateAccount from "@/components/LinkedAccounts/CreateAccount";
import CreateAssetMessage from "@/components/CreateAssetMessage/CreateAssetMessage";
import MonthlyGraph from "@/components/MonthlyGraph/MonthlyGraph";

export default function Dashboard() {
  const { accounts } = useAccounts();
  const [networthData, setNetworthData] = useState<NetWorthDataPoint[]>([]);

  // Calculate networth data from all accounts
  const calculateNetworth = () => {
    // Get all transactions from all accounts
    const allTransactions = accounts.flatMap(account =>
      account.transactions.map(transaction => ({
        date: new Date(transaction.date),
        amount: transaction.amount
      }))
    );

    // Sort transactions by date (ascending)
    const sortedTransactions = allTransactions.sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    // Calculate running total for networth
    let runningTotal = 0;
    const networthPoints: NetWorthDataPoint[] = sortedTransactions.map(
      (transaction) => {
        runningTotal += transaction.amount;
        return {
          date: transaction.date,
          netWorth: runningTotal,
        };
      }
    );
    console.log(networthPoints, accounts)
    setNetworthData(networthPoints);
  };

  // Use useEffect to recalculate networth when accounts change
  useEffect(() => {
    calculateNetworth();
  }, [accounts]);

  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 p-4 md:p-6 overflow-hidden w-full">
        <div className="flex flex-col gap-4 md:gap-6 max-w-[1000px]">
          <div className="mb-6">
            <CreateAssetMessage />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 md:gap-6">
            <div className="w-full min-w-0 lg:col-span-4">
              <Networth data={networthData} />
            </div>
            <div className="w-full min-w-0 lg:col-span-2">
              <SpendingChart />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <MonthlyGraph type="income" />
            <MonthlyGraph type="spending" />
          </div>
        </div>
      </div>
    </div>
  );
}
