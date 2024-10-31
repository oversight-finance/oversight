"use client"

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import CSVUploader from "../csvParser"
import Networth from "@/components/Networth/Networth"
import TransactionTable from "@/components/TransactionTable/TransactionTable"
import { type ParsedData, type NetWorthDataPoint, transformCSVToNetWorthData, defaultNetWorthData } from "@/utils/dataTransformers"
import AddTransaction from "@/components/AddTransaction/AddTransaction"

export default function Dashboard() {
  const [transactions, setTransactions] = useState<ParsedData[]>([])
  const [networthData, setNetworthData] = useState<NetWorthDataPoint[]>(defaultNetWorthData)

  const handleDataUpdate = (data: ParsedData[]) => {
    setTransactions(data)
    updateNetworth([...data])
  }

  const handleTransactionAdd = (newTransaction: ParsedData) => {
    const updatedTransactions = [...transactions, newTransaction]
    setTransactions(updatedTransactions)
    updateNetworth(updatedTransactions)
  }

  const updateNetworth = (data: ParsedData[]) => {
    // Sort transactions by date
    const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime())
    
    // Calculate running total of transactions to get net worth over time
    let runningTotal = 0
    const networthPoints: NetWorthDataPoint[] = sortedData.map(transaction => {
      runningTotal += transaction.amount
      return {
        date: transaction.date,
        netWorth: runningTotal
      }
    })

    setNetworthData(networthPoints)
  }

  const handleTransactionDelete = (index: number) => {
    const updatedTransactions = transactions.filter((_, i) => i !== index)
    setTransactions(updatedTransactions)
    updateNetworth(updatedTransactions)
  }

  const handleTransactionEdit = (index: number, updatedTransaction: ParsedData) => {
    const updatedTransactions = [...transactions]
    updatedTransactions[index] = updatedTransaction
    setTransactions(updatedTransactions)
    updateNetworth(updatedTransactions)
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-4 md:p-6">
          {/* Mobile view: Stack vertically */}
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4 lg:gap-6">
            {/* Main content area */}
            <div className="space-y-4 md:space-y-6 w-full lg:flex-1">
              <Networth data={networthData} />            
              <TransactionTable 
                transactions={transactions} 
                onDelete={handleTransactionDelete}
                onEdit={handleTransactionEdit}
                onTransactionAdd={handleTransactionAdd}
              />
            </div>
            
            {/* CSV Uploader */}
            <div className="w-full lg:w-96">
              <CSVUploader onDataUpdate={handleDataUpdate} />
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}
