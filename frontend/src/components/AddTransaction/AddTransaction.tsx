"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Switch } from "@/components/ui/switch"
import { Transaction, TransactionType } from "@/types/Account"

const formSchema = z.object({
  merchant: z.string().min(1, "Merchant name is required"),
  amount: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Amount must be a valid number",
  }),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  recurringEndDate: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.isRecurring) {
    if (!data.recurringFrequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Frequency is required for recurring transactions",
        path: ["recurringFrequency"],
      });
    }
    if (!data.recurringEndDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date is required for recurring transactions",
        path: ["recurringEndDate"],
      });
    }
  }
});

interface AddTransactionProps {
  onTransactionAdd: (transactions: Transaction[]) => void
}

const categories = [
  "Housing",
  "Transportation",
  "Food",
  "Utilities",
  "Insurance",
  "Healthcare",
  "Savings",
  "Personal",
  "Entertainment",
  "Other"
]

export default function AddTransaction({ onTransactionAdd }: AddTransactionProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      merchant: "",
      amount: "",
      category: "",
      date: format(new Date(), "yyyy-MM-dd"),
      isRecurring: false,
      recurringFrequency: undefined,
      recurringEndDate: undefined,
    },
  })

  const isRecurring = form.watch("isRecurring")

  function onSubmit(values: z.infer<typeof formSchema>) {
    const baseTransaction: Transaction = {
      id: crypto.randomUUID(),
      date: new Date(values.date).toISOString(),
      amount: Number(values.amount),
      currency: "USD",
      merchant: values.merchant,
      category: values.category,
      transactionType: TransactionType.EXTERNAL,
      isRecurring: values.isRecurring,
      recurringFrequency: values.recurringFrequency,
      recurringEndDate: values.recurringEndDate ? new Date(values.recurringEndDate).toISOString() : undefined,
    }

    if (values.isRecurring && values.recurringFrequency && values.recurringEndDate) {
      const transactions = generateRecurringTransactions(baseTransaction)
      console.log("generated transactions:", transactions)
      onTransactionAdd(transactions)
    } else {
      onTransactionAdd([baseTransaction])
    }

    setOpen(false)
    form.reset()
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
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Enter the details of your transaction below
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="merchant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter merchant name" {...field} />
                  </FormControl>
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
                      step="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
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
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Recurring Transaction</FormLabel>
                    <FormDescription>
                      Make this a recurring transaction
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Toggle recurring transaction"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isRecurring && (
              <>
                <FormField
                  control={form.control}
                  name="recurringFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recurringEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <Button type="submit" className="w-full">Add Transaction</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function generateRecurringTransactions(baseTransaction: Transaction): Transaction[] {
  const transactions: Transaction[] = []
  const startDate = baseTransaction.date
  const endDate = baseTransaction.recurringEndDate

  if (!endDate || !baseTransaction.recurringFrequency) return [baseTransaction]

  const currentDate = new Date(startDate)
  const endDateTime = new Date(endDate)
  while (currentDate <= endDateTime) {
    transactions.push({
      ...baseTransaction,
      date: currentDate.toISOString(),
    })
    // Increment date  based on frequency
    switch (baseTransaction.recurringFrequency) {
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7)
        break
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1)
        break
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + 1)
        break
    }
  }

  return transactions
} 