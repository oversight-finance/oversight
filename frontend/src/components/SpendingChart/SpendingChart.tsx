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
import { useAccounts } from "@/contexts/AccountsContext";
import { AccountType } from "@/types/Account";

interface SpendingChartProps {
  timeRange?: "3M" | "6M" | "1Y" | "2Y" | "ALL";
}

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

// Helper function to filter transactions by time range
const filterTransactionsByTimeRange = (
  transactions: any[],
  timeRange: "3M" | "6M" | "1Y" | "2Y" | "ALL"
) => {
  if (timeRange === "ALL") return transactions;

  // Get current date
  const now = new Date();
  const monthsToInclude =
    timeRange === "3M"
      ? 3
      : timeRange === "6M"
      ? 6
      : timeRange === "1Y"
      ? 12
      : 24;

  // Calculate cutoff date
  const cutoffDate = new Date(now);
  cutoffDate.setMonth(now.getMonth() - monthsToInclude);

  // Filter transactions for dates after cutoff
  return transactions.filter((t) => {
    return new Date(t.transaction_date) >= cutoffDate;
  });
};

export default function SpendingChart({
  timeRange = "1Y",
}: SpendingChartProps) {
  const { getAllTransactions } = useAccounts();

  // Get all bank transactions and filter out positive amounts (income)
  let allTransactions = getAllTransactions(AccountType.BANK).filter(
    (t) => t.amount < 0
  );

  // Apply time range filtering
  allTransactions = filterTransactionsByTimeRange(allTransactions, timeRange);

  // Group transactions by category and calculate total spending
  const spendingByCategory = allTransactions.reduce((acc, transaction) => {
    // Use only for bank transactions which have categories
    if ("category" in transaction) {
      const category = transaction.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
    } else {
      // For other transaction types
      const category = "Other";
      acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
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
