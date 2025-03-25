"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Account } from "@/types/Account";
import {
  useAccounts,
  Transaction,
  AccountWithTransactions,
} from "@/contexts/AccountsContext";
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
import { useEffect, useState } from "react";

interface AccountBalanceProps {
  account: AccountWithTransactions;
}

interface BalanceDataPoint {
  date: Date;
  balance: number;
}

const chartConfig = {
  balance: {
    label: "Balance",
    color: "hsl(var(--chart-1))",
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

const formatAxisDate = (date: Date, data: BalanceDataPoint[]) => {
  if (!data || data.length === 0) return "";
  const firstDate = data[0].date;
  const lastDate = data[data.length - 1].date;
  const monthsDiff =
    (lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
    lastDate.getMonth() -
    firstDate.getMonth();

  if (monthsDiff > 12) {
    return date.toLocaleString("default", { month: "short", year: "numeric" });
  } else {
    return date.toLocaleString("default", { month: "short" });
  }
};

export default function AccountBalance({ account }: AccountBalanceProps) {
  const { getTransactions } = useAccounts();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balancePoints, setBalancePoints] = useState<BalanceDataPoint[]>([]);

  // Calculate balance points when account transactions change
  useEffect(() => {
    if (account.transactions && account.transactions.length > 0) {
      const sortedTxs = [...account.transactions].sort((a, b) => {
        const dateA = new Date(a.transaction_date).getTime();
        const dateB = new Date(b.transaction_date).getTime();
        return dateA - dateB;
      });

      let runningBalance = 0;
      const points = sortedTxs.map((transaction) => {
        const amount = "amount" in transaction ? transaction.amount : 0;
        runningBalance += amount;

        return {
          date: new Date(transaction.transaction_date),
          balance: runningBalance,
        };
      });

      setBalancePoints(points);
    }
  }, [account.transactions]);

  if (!account.transactions || account.transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Balance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No transactions available to display the graph.
          </div>
        </CardContent>
      </Card>
    );
  }

  const minBalance = Math.min(...balancePoints.map((d) => d.balance));
  const maxBalance = Math.max(...balancePoints.map((d) => d.balance));
  const zeroOffset = (maxBalance / (maxBalance - minBalance)) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Balance History</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={balancePoints}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`balanceGradient-${account.id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--success))"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset={`${zeroOffset}%`}
                    stopColor="hsl(var(--background))"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--destructive))"
                    stopOpacity={0.8}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={true}
                tickMargin={8}
                tickFormatter={(date) => formatAxisDate(date, balancePoints)}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={formatLargeNumber}
                tickCount={8}
                width={80}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const dataPoint = payload[0].payload as BalanceDataPoint;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="text-sm text-muted-foreground">
                        {dataPoint.date.toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                          day: "numeric",
                        })}
                      </div>
                      <div className="font-bold">
                        Balance: {formatLargeNumber(dataPoint.balance)}
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--chart-2))"
                fill={`url(#balanceGradient-${account.id})`}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
