"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { useAccounts } from "@/contexts/AccountsContext";
import {
  BankAccountTransaction,
  CryptoWalletTransaction,
  InvestmentTransaction,
  Transaction,
} from "@/types/Transaction";

// Define a type that handles all transaction types
type AnyTransaction = Transaction;

interface DataPoint {
  date: Date;
  income: number;
  spending: number;
}

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--success))",
  },
  spending: {
    label: "Spending",
    color: "hsl(var(--destructive))",
  },
};

const formatLargeNumber = (value: number) => {
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (absValue >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
};

const formatAxisDate = (date: Date) => {
  return date.toLocaleString("default", { month: "short" });
};

export default function IncomeSpendingGraph() {
  const { accounts } = useAccounts();

  // Get all transactions
  const allTransactions = accounts.flatMap((account) =>
    (account.transactions || []).map((transaction) => ({
      date: new Date((transaction as AnyTransaction).transaction_date),
      amount: (transaction as AnyTransaction).amount,
    }))
  );

  // Group transactions by month and split into income/spending
  const monthlyData = allTransactions.reduce((acc, transaction) => {
    const monthKey = transaction.date.toISOString().slice(0, 7);
    if (!acc[monthKey]) {
      acc[monthKey] = { income: 0, spending: 0, date: transaction.date };
    }
    if (transaction.amount > 0) {
      acc[monthKey].income += transaction.amount;
    } else {
      acc[monthKey].spending += Math.abs(transaction.amount);
    }
    return acc;
  }, {} as Record<string, { income: number; spending: number; date: Date }>);

  // Convert to array and sort by date
  const chartData: DataPoint[] = Object.values(monthlyData).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income & Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No transactions available to display the graph.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income & Spending</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={true}
                tickMargin={8}
                tickFormatter={formatAxisDate}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={formatLargeNumber}
                domain={["auto", "auto"]}
                tickCount={8}
                width={80}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload as DataPoint;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="text-sm text-muted-foreground">
                        {data.date.toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      <div className="font-bold text-success">
                        Income: {formatLargeNumber(data.income)}
                      </div>
                      <div className="font-bold text-destructive">
                        Spending: {formatLargeNumber(data.spending)}
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="hsl(var(--success))"
                fill="hsl(var(--success))"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="spending"
                stroke="hsl(var(--destructive))"
                fill="hsl(var(--destructive))"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
