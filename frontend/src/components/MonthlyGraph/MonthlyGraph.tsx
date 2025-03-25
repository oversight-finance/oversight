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
import { AccountType } from "@/types/Account";

interface DataPoint {
  date: Date;
  value: number;
}

interface MonthlyGraphProps {
  type: "income" | "spending";
  timeRange?: "1M" | "3M" | "6M" | "1Y" | "2Y" | "ALL";
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

// Helper function to filter data by time range
const filterDataByTimeRange = (
  data: DataPoint[],
  timeRange: "1M" | "3M" | "6M" | "1Y" | "2Y" | "ALL"
) => {
  if (!data.length || timeRange === "ALL") return data;

  // Get current date
  const now = new Date();
  const monthsToInclude =
    timeRange === "1M"
      ? 1
      : timeRange === "3M"
      ? 3
      : timeRange === "6M"
      ? 6
      : timeRange === "1Y"
      ? 12
      : 24;

  // Calculate cutoff date
  const cutoffDate = new Date(now);
  cutoffDate.setMonth(now.getMonth() - monthsToInclude);

  // Filter data for dates after cutoff
  return data.filter((point) => point.date >= cutoffDate);
};

const formatAxisDate = (date: Date, timeRange: string) => {
  if (
    timeRange === "1M" ||
    timeRange === "3M" ||
    timeRange === "6M" ||
    timeRange === "1Y"
  ) {
    return date.toLocaleString("default", { month: "short", day: "numeric" });
  } else if (timeRange === "2Y" || timeRange === "ALL") {
    return date.toLocaleString("default", { month: "short", year: "2-digit" });
  }
  return date.toLocaleString("default", { month: "short" });
};

// Format currency for Y-axis
const formatYAxisValue = (value: number) => {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value}`;
};

export default function MonthlyGraph({
  type,
  timeRange = "1Y",
}: MonthlyGraphProps) {
  const { getAllTransactions } = useAccounts();
  const config = CHART_CONFIGS[type];

  // Get filtered transactions
  const allTransactions = getAllTransactions(AccountType.BANK)
    .filter(config.filterFn)
    .map((transaction: Transaction) => ({
      date: new Date(transaction.transaction_date),
      amount: config.transformAmount(transaction.amount),
    }));

  // Filter transactions by time range
  const filteredTransactions =
    timeRange === "ALL"
      ? allTransactions
      : allTransactions.filter((transaction) => {
          // Get current date
          const now = new Date();
          const monthsToInclude =
            timeRange === "1M"
              ? 1
              : timeRange === "3M"
              ? 3
              : timeRange === "6M"
              ? 6
              : timeRange === "1Y"
              ? 12
              : 24;

          // Calculate cutoff date
          const cutoffDate = new Date(now);
          cutoffDate.setMonth(now.getMonth() - monthsToInclude);

          return transaction.date >= cutoffDate;
        });

  // Calculate total from filtered transactions only
  const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const displayTotal = type === "spending" ? -total : total;

  // Create data points for each unique date with transactions
  const dateMap = new Map<string, number>();

  // Add each transaction to its specific date
  filteredTransactions.forEach((transaction) => {
    const dateStr = transaction.date.toISOString().split("T")[0]; // YYYY-MM-DD
    const currentValue = dateMap.get(dateStr) || 0;
    dateMap.set(dateStr, currentValue + transaction.amount);
  });

  // Convert map to array of data points
  let chartData: DataPoint[] = Array.from(dateMap.entries()).map(
    ([dateStr, value]) => ({
      date: new Date(dateStr),
      value,
    })
  );

  // Sort by date
  chartData = chartData.sort((a, b) => a.date.getTime() - b.date.getTime());

  // We don't need to filter chartData again since we already filtered the transactions
  // chartData = filterDataByTimeRange(chartData, timeRange);

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

  // Calculate days span for determining axis settings
  const startDate = chartData[0].date;
  const endDate = chartData[chartData.length - 1].date;
  const daysDiff = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

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
          <div className="w-full h-[160px] px-6 py-2 pb-0">
            <ChartContainer
              config={{ [type]: config }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
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
                    axisLine={true}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    height={30}
                    tickFormatter={(date) => formatAxisDate(date, timeRange)}
                    interval={daysDiff <= 90 ? "preserveStartEnd" : 0}
                    minTickGap={15}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    axisLine={true}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    width={40}
                    tickFormatter={formatYAxisValue}
                    domain={type === "spending" ? ["auto", 0] : [0, "auto"]}
                    tickCount={5}
                    stroke="hsl(var(--border))"
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
                              month: "short",
                              day: "numeric",
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
