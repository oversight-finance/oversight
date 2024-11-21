"use client";

import { useState } from "react";
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
import { AccountsProvider } from "@/contexts/AccountsContext";
import LinkedAccounts from "@/components/LinkedAccounts/LinkedAccounts";

// Helper function to sort transactions by date (most recent first)
const sortTransactionsByDate = (transactions: ParsedData[]): ParsedData[] => {
  return [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());
};

export default function Dashboard() {
  const [transactions, setTransactions] = useState<ParsedData[]>([]);
  const [assets, setAssets] = useState<ParsedData[]>([]);
  const [networthData, setNetworthData] =
    useState<NetWorthDataPoint[]>(defaultNetWorthData);

  const handleDataUpdate = (data: ParsedData[]) => {
    const sortedTransactions = sortTransactionsByDate(data);
    setTransactions(sortedTransactions);
    updateNetworth(data);
  };

  const handleTransactionAdd = (newTransactions: ParsedData[]) => {
    const updatedTransactions = sortTransactionsByDate([
      ...transactions,
      ...newTransactions,
    ]);
    setTransactions(updatedTransactions);
    updateNetworth([...updatedTransactions].reverse());
  };

  const updateNetworth = (data: ParsedData[]) => {
    const ascendingData = [...data].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    let runningTotal = 0;
    const networthPoints: NetWorthDataPoint[] = ascendingData.map(
      (transaction) => {
        runningTotal += transaction.amount;
        return {
          date: transaction.date,
          netWorth: runningTotal,
        };
      }
    );

    setNetworthData(networthPoints);
  };

  const handleTransactionDelete = (index: number) => {
    const updatedTransactions = sortTransactionsByDate(
      transactions.filter((_, i) => i !== index)
    );
    setTransactions(updatedTransactions);
    updateNetworth([...updatedTransactions].reverse());
  };

  const handleTransactionEdit = (
    index: number,
    updatedTransaction: ParsedData
  ) => {
    const updatedTransactions = sortTransactionsByDate([
      ...transactions.slice(0, index),
      updatedTransaction,
      ...transactions.slice(index + 1),
    ]);
    setTransactions(updatedTransactions);
    updateNetworth([...updatedTransactions].reverse());
  };

  return (
    <AccountsProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <div className="flex-1 p-4 md:p-6 overflow-hidden w-full">
            <div className="flex flex-col gap-4 md:gap-6 max-w-[1000px]">
              <LinkedAccounts />
              {/* Top Section with Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 md:gap-6">
                <div className="w-full min-w-0 lg:col-span-4">
                  {/* min-w-0 prevents flex child overflow */}
                  <Networth data={networthData} />
                </div>
                <div className="w-full min-w-0 lg:col-span-2">
                  <SpendingChart />
                </div>
              </div>

              {/* Bottom Section */}
              <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
                {/* Transactions Table */}
                <div className="flex-1 min-w-0">
                  {/* min-w-0 prevents flex child overflow */}
                  <TransactionTable
                    transactions={transactions}
                    onDelete={handleTransactionDelete}
                    onEdit={handleTransactionEdit}
                    onTransactionAdd={handleTransactionAdd}
                  />
                </div>
                {/* CSV Uploader */}
                <div className="w-full xl:w-80 shrink-0">
                  <CSVUploader onDataUpdate={handleDataUpdate} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </AccountsProvider>
  );
}
