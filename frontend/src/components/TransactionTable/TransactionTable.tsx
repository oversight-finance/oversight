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
import { Pencil, Trash2, X, Check } from "lucide-react"
import { Transaction } from "@/types/Account"
import AddTransaction from "@/components/AddTransaction/AddTransaction"
import { formatCurrency } from "@/lib/utils"

interface TransactionTableProps {
  transactions: Transaction[]
  onDelete: (index: number) => void
  onEdit: (index: number, transaction: Transaction) => void
  onTransactionAdd: (transactions: Transaction[]) => void
}

export default function TransactionTable({
  transactions,
  onDelete,
  onEdit,
  onTransactionAdd
}: TransactionTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

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

  const handleEditChange = (field: keyof Transaction, value: string) => {
    if (!editingTransaction) return

    const updates: Partial<Transaction> = {}

    switch (field) {
      case 'transactionDate':
        updates.transactionDate = new Date(value).toISOString()
        break
      case 'amount':
        updates.amount = parseFloat(value)
        break
      case 'merchant':
        updates.merchant = value
        break
      case 'category':
        updates.category = value
        break
      case 'description':
        updates.description = value
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
        <AddTransaction
          onTransactionAdd={(parsedData) => onTransactionAdd(parsedData as Transaction[])}
        />
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <div className="max-h-[500px] overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-background border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Merchant</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions?.map((row, index) => (
                    <tr key={row.id} className="border-b last:border-b-0">
                      <td className="px-4 py-2">
                        {editingIndex === index ? (
                          <Input
                            type="date"
                            value={editingTransaction?.transactionDate.split('T')[0]}
                            onChange={(e) => handleEditChange('transactionDate', e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          new Date(row.transactionDate).toLocaleDateString()
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
                      <td className="px-4 py-2">
                        {editingIndex === index ? (
                          <Input
                            type="text"
                            value={editingTransaction?.category}
                            onChange={(e) => handleEditChange('category', e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          row.category
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {editingIndex === index ? (
                          <Input
                            type="text"
                            value={editingTransaction?.description}
                            onChange={(e) => handleEditChange('description', e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          row.description
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
                          formatCurrency(row.amount)
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
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 