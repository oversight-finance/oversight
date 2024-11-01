"use client"

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import CSVUploader from "../csvParser"
import Networth from "@/components/Networth/Networth"
import TransactionTable from "@/components/TransactionTable/TransactionTable"
import { type ParsedData, type NetWorthDataPoint, transformCSVToNetWorthData, defaultNetWorthData } from "@/utils/dataTransformers"
import AddTransaction from "@/components/AddTransaction/AddTransaction"

// Helper function to sort transactions by date (most recent first)
const sortTransactionsByDate = (transactions: ParsedData[]): ParsedData[] => {
  return [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime())
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<ParsedData[]>([])
  const [networthData, setNetworthData] = useState<NetWorthDataPoint[]>(defaultNetWorthData)

  const handleDataUpdate = (data: ParsedData[]) => {
    const sortedTransactions = sortTransactionsByDate(data)
    setTransactions(sortedTransactions)
    updateNetworth(data)
  }

  const handleTransactionAdd = (newTransactions: ParsedData[]) => {
    const updatedTransactions = sortTransactionsByDate([...transactions, ...newTransactions])
    setTransactions(updatedTransactions)
    updateNetworth([...updatedTransactions].reverse())
  }

  const updateNetworth = (data: ParsedData[]) => {
    const ascendingData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime())
    let runningTotal = 0
    const networthPoints: NetWorthDataPoint[] = ascendingData.map(transaction => {
      runningTotal += transaction.amount
      return {
        date: transaction.date,
        netWorth: runningTotal
      }
    })

    setNetworthData(networthPoints)
  }

  const handleTransactionDelete = (index: number) => {
    const updatedTransactions = sortTransactionsByDate(
      transactions.filter((_, i) => i !== index)
    )
    setTransactions(updatedTransactions)
    updateNetworth([...updatedTransactions].reverse())
  }

  const handleTransactionEdit = (index: number, updatedTransaction: ParsedData) => {
    const updatedTransactions = sortTransactionsByDate([
      ...transactions.slice(0, index),
      updatedTransaction,
      ...transactions.slice(index + 1)
    ])
    setTransactions(updatedTransactions)
    updateNetworth([...updatedTransactions].reverse())
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4 lg:gap-6">
            <div className="space-y-4 md:space-y-6 w-full lg:flex-1">
              <Networth data={networthData} />            
              <TransactionTable 
                transactions={transactions} 
                onDelete={handleTransactionDelete}
                onEdit={handleTransactionEdit}
                onTransactionAdd={handleTransactionAdd}
              />
            </div>
            
            <div className="w-full lg:w-96">
              <CSVUploader onDataUpdate={handleDataUpdate} />
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}
