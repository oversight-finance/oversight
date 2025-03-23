"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { useAccounts, Transaction } from "@/contexts/AccountsContext";
import { formatTotalAmount } from "@/lib/utils";

interface DataPoint {
  date: Date;
  value: number;
}

interface MonthlyGraphProps {
  type: "income" | "spending";
}

const CHART_CONFIGS = {
  income: {
    label: "Income",
    color: "hsl(var(--success))",
    title: "Income",
    emptyMessage: "No income data available.",
    filterFn: (transaction: Transaction) => transaction.amount > 0,
    transformAmount: (amount: number) => amount,
  },
  spending: {
    label: "Spending",
    color: "hsl(var(--destructive))",
    title: "Spending",
    emptyMessage: "No spending data available.",
    filterFn: (transaction: Transaction) => transaction.amount < 0,
    transformAmount: (amount: number) => Math.abs(amount),
  },
};

const formatAxisDate = (date: Date) => {
  return date.toLocaleString("default", { month: "short" });
};

export default function MonthlyGraph({ type }: MonthlyGraphProps) {
  const { accounts } = useAccounts();
  const config = CHART_CONFIGS[type];

  // Get filtered transactions
  const allTransactions = accounts.flatMap((account) =>
    ((account as any).transactions || []).filter(config.filterFn).map((transaction: Transaction) => ({
      date: new Date(transaction.transaction_date),
      amount: config.transformAmount(transaction.amount),
    }))
  );

  // Calculate total
  const total = allTransactions.reduce((sum, t) => sum + t.amount, 0);
  const displayTotal = type === "spending" ? -total : total;

  // Group transactions by month
  const monthlyData = allTransactions.reduce((acc, transaction) => {
    const monthKey = transaction.date.toISOString().slice(0, 7);
    if (!acc[monthKey]) {
      acc[monthKey] = { value: 0, date: transaction.date };
    }
    acc[monthKey].value += transaction.amount;
    return acc;
  }, {} as Record<string, DataPoint>);

  // Convert to array and sort by date
  const chartData = (Object.values(monthlyData) as DataPoint[]).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  if (chartData.length === 0) {
    return (
      <Card className="min-w-0 w-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-medium">
              {config.title}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {formatTotalAmount(0)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
            {config.emptyMessage}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium">
            {config.title}
          </CardTitle>
          <span
            className={`text-sm font-medium text-${
              type === "income" ? "success" : "destructive"
            }`}
          >
            {formatTotalAmount(displayTotal)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full h-[180px] flex items-center justify-center">
          <div className="w-full h-[160px] px-6 py-4">
            <ChartContainer
              config={{ [type]: config }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient
                      id={`gradient-${type}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={config.color}
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="100%"
                        stopColor={config.color}
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={false}
                    height={0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={false}
                    width={0}
                    domain={type === "spending" ? ["auto", 0] : [0, "auto"]}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload as DataPoint;
                      const value =
                        type === "spending" ? -data.value : data.value;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="text-xs text-muted-foreground">
                            {data.date.toLocaleString("default", {
                              month: "long",
                              year: "numeric",
                            })}
                          </div>
                          <div
                            className={`text-sm font-bold text-${
                              type === "income" ? "success" : "destructive"
                            }`}
                          >
                            {config.label}: {formatTotalAmount(value)}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={config.color}
                    fill={`url(#gradient-${type})`}
                    fillOpacity={1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
