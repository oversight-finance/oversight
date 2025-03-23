"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { useAccounts } from "@/contexts/AccountsContext";
import {
  BankAccountTransaction,
  CryptoWalletTransaction,
  InvestmentTransaction,
  TransactionBase,
  Transaction,
} from "@/types/Transaction";

// Define a type that handles all transaction types
type AnyTransaction = Transaction;

interface SpendingData {
  name: string;
  value: number;
  color: string;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1">
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: payload[0].payload.color }}
            />
            <span className="text-sm font-medium">{payload[0].name}</span>
          </div>
          <div className="text-right text-sm font-medium">
            {formatCurrency(payload[0].value)}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function SpendingChart() {
  const { accounts } = useAccounts();

  // Get all transactions and filter out positive amounts (income)
  const allTransactions = accounts.flatMap((account) =>
    (account.transactions || []).filter((t) => (t as AnyTransaction).amount < 0)
  );

  // Group transactions by category and calculate total spending
  const spendingByCategory = allTransactions.reduce((acc, transaction) => {
    const transactionObj = transaction as AnyTransaction;
    // Use only for bank transactions which have categories
    if ("category" in transactionObj) {
      const category = transactionObj.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + Math.abs(transactionObj.amount);
    } else {
      // For other transaction types
      const category = "Other";
      acc[category] = (acc[category] || 0) + Math.abs(transactionObj.amount);
    }
    return acc;
  }, {} as Record<string, number>);

  // Convert to array and sort by value
  const spendingData: SpendingData[] = Object.entries(spendingByCategory)
    .map(([name, value], index) => ({
      name,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Show top 5 categories

  const total = spendingData.reduce((sum, item) => sum + item.value, 0);

  if (spendingData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle>Spending Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            No spending data available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>Spending Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] md:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={spendingData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {spendingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                align="center"
                verticalAlign="bottom"
                wrapperStyle={{
                  paddingLeft: "10px",
                }}
                formatter={(value, entry: any) => (
                  <span className="text-xs md:text-sm">
                    {value} ({Math.round((entry.payload.value / total) * 100)}%)
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
