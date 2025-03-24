"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import CSVUploader from "@/app/csvParser";
import {
  defaultNetWorthData,
  transformCSVToNetWorthData,
  type NetWorthDataPoint,
  type ParsedData,
} from "@/utils/dataTransformers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatTotalAmount } from "@/lib/utils";

const chartConfig = {
  netWorth: {
    label: "Net Worth",
    color: "hsl(var(--chart-1))",
  },
};

interface NetworthProps {
  data: NetWorthDataPoint[];
}

const formatLargeNumber = (value: number) => {
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (absValue >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
};

const formatAxisDate = (date: Date, data: NetWorthDataPoint[]) => {
  // Calculate the total time span in months
  const firstDate = data[0].date;
  const lastDate = data[data.length - 1].date;
  const monthsDiff =
    (lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
    lastDate.getMonth() -
    firstDate.getMonth();

  if (monthsDiff > 12) {
    // For periods longer than a year, show "Jan 2023" format with 4-digit year
    return date.toLocaleString("default", { month: "short", year: "numeric" });
  } else {
    // For shorter periods, show just "January"
    return date.toLocaleString("default", { month: "short" });
  }
};

export default function Networth({ data }: NetworthProps) {
  if (data.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Net Worth Over Time</CardTitle>
            <CardDescription>
              Tracking your financial progress month by month
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
            No transactions available. Add some transactions to see your net
            worth over time.
          </CardContent>
        </Card>
      </div>
    );
  }

  const minNetWorth = Math.min(...data.map((d) => d.netWorth));
  const maxNetWorth = Math.max(...data.map((d) => d.netWorth));
  const zeroOffset = (maxNetWorth / (maxNetWorth - minNetWorth)) * 100;

  const formatDate = (date: Date) => {
    return date.toLocaleString("default", { month: "short" });
  };

  const startDate = data[0].date;
  const endDate = data[data.length - 1].date;
  const dateRange = `${startDate.toLocaleString("default", {
    month: "long",
  })} - ${endDate.toLocaleString("default", {
    month: "long",
  })} ${endDate.getFullYear()}`;

  const calculateNetWorthChange = (periodData: NetWorthDataPoint[]) => {
    if (periodData.length < 2) return 0;

    const latestNetWorth = periodData[periodData.length - 1].netWorth;
    const startingNetWorth = periodData[0].netWorth;

    return startingNetWorth !== 0
      ? ((latestNetWorth - startingNetWorth) / Math.abs(startingNetWorth)) * 100
      : 0;
  };

  const netWorthChange = calculateNetWorthChange(data);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium">Net Worth</CardTitle>
          <span
            className={`text-sm font-medium ${
              data[data.length - 1].netWorth >= 0
                ? "text-success"
                : "text-destructive"
            }`}
          >
            {formatTotalAmount(data[data.length - 1].netWorth)}
          </span>
        </div>
        <CardDescription>
          Tracking your financial progress month by month
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-4">
          <div className="px-6">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 5, right: 5, left: 20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="negativeGradient"
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
                    tickFormatter={(date) => formatAxisDate(date, data)}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickFormatter={formatLargeNumber}
                    domain={["auto", "auto"]}
                    tickCount={6}
                    width={60}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="text-sm text-muted-foreground">
                            {data.date.toLocaleString("default", {
                              month: "long",
                              year: "numeric",
                              day: "numeric",
                            })}
                          </div>
                          <div className="font-bold">
                            Net Worth: {formatLargeNumber(data.netWorth)}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <Area
                    type="monotone"
                    dataKey="netWorth"
                    stroke="hsl(var(--chart-2))"
                    fill={"url(#negativeGradient)"}
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <div className="flex w-full items-start gap-2 text-xs md:text-sm pt-2">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              {data.length > 1 ? (
                netWorthChange >= 0 ? (
                  <>
                    Net worth up by {netWorthChange.toFixed(1)}%
                    <TrendingUp className="h-4 w-4 text-success" />
                  </>
                ) : (
                  <>
                    Net worth down by {Math.abs(netWorthChange).toFixed(1)}%
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  </>
                )
              ) : (
                <>
                  Initial net worth: {formatTotalAmount(data[0]?.netWorth ?? 0)}
                </>
              )}
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {dateRange}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
