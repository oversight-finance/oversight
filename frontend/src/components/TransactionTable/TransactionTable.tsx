"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, X, Check, Plus } from "lucide-react"
import { type ParsedData } from "@/utils/dataTransformers"
import AddTransaction from "@/components/AddTransaction/AddTransaction"

interface TransactionTableProps {
  transactions: ParsedData[]
  onDelete: (index: number) => void
  onEdit: (index: number, transaction: ParsedData) => void
  onTransactionAdd: (transactions: ParsedData[]) => void
}

export default function TransactionTable({ 
  transactions, 
  onDelete,
  onEdit,
  onTransactionAdd
}: TransactionTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<ParsedData | null>(null)

  const handleEditClick = (index: number) => {
    setEditingIndex(index)
    setEditingTransaction({ ...transactions[index] })
  }

  const handleEditCancel = () => {
    setEditingIndex(null)
    setEditingTransaction(null)
  }

  const handleEditSave = (index: number) => {
    if (editingTransaction) {
      onEdit(index, editingTransaction)
      setEditingIndex(null)
      setEditingTransaction(null)
    }
  }

  const handleEditChange = (field: keyof ParsedData, value: string) => {
    if (!editingTransaction) return

    const updates: Partial<ParsedData> = {}
    
    switch (field) {
      case 'date':
        updates.date = new Date(value)
        break
      case 'amount':
        updates.amount = parseFloat(value)
        break
      case 'merchant':
        updates.merchant = value
        break
      default:
        return
    }

    setEditingTransaction({ ...editingTransaction, ...updates })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transactions</CardTitle>
        <AddTransaction onTransactionAdd={onTransactionAdd} />
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions?.map((row, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="px-4 py-2">
                      {editingIndex === index ? (
                        <Input
                          type="date"
                          value={editingTransaction?.date.toISOString().split('T')[0]}
                          onChange={(e) => handleEditChange('date', e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        row.date.toLocaleDateString()
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editingIndex === index ? (
                        <Input
                          type="text"
                          value={editingTransaction?.merchant}
                          onChange={(e) => handleEditChange('merchant', e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        row.merchant
                      )}
                    </td>
                    <td className={`px-4 py-2 text-right ${row.amount < 0 ? 'text-destructive' : 'text-success'}`}>
                      {editingIndex === index ? (
                        <Input
                          type="number"
                          value={editingTransaction?.amount}
                          onChange={(e) => handleEditChange('amount', e.target.value)}
                          className="w-full text-right"
                          step="0.01"
                        />
                      ) : (
                        `$${row.amount.toFixed(2)}`
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        {editingIndex === index ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSave(index)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleEditCancel}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(index)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No transactions found. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
} 