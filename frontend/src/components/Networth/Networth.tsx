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
  timeRange?: "1M" | "3M" | "6M" | "1Y" | "2Y" | "ALL";
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

const formatAxisDate = (
  date: Date,
  data: NetWorthDataPoint[],
  timeRange: string
) => {
  // For 1M and 3M time ranges, always show month abbreviation and day number
  if (timeRange === "1M" || timeRange === "3M") {
    return date.toLocaleString("default", { month: "short", day: "numeric" });
  }

  // For longer periods, calculate whether to show year
  const firstDate = data[0].date;
  const lastDate = data[data.length - 1].date;
  const monthsDiff =
    (lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
    lastDate.getMonth() -
    firstDate.getMonth();

  if (monthsDiff > 12) {
    // For periods longer than a year, show "Jan 2023" format with year
    return date.toLocaleString("default", { month: "short", year: "numeric" });
  } else {
    // For medium periods, show month abbreviation and day
    return date.toLocaleString("default", { month: "short", day: "numeric" });
  }
};

export default function Networth({ data, timeRange = "1Y" }: NetworthProps) {
  // Clean the data by converting extremely small values to zero
  // This fixes floating point precision issues where values like e-12 appear
  const cleanedData = data.map((point) => ({
    ...point,
    netWorth: Math.abs(point.netWorth) < 0.01 ? 0 : point.netWorth,
  }));

  if (cleanedData.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Net Worth Over Time</CardTitle>
            <CardDescription>
              Tracking your financial progress{" "}
              {timeRange === "1M" || timeRange === "3M"
                ? "week by week"
                : "month by month"}
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

  const minNetWorth = Math.min(...cleanedData.map((d) => d.netWorth));
  const maxNetWorth = Math.max(...cleanedData.map((d) => d.netWorth));
  const zeroOffset = (maxNetWorth / (maxNetWorth - minNetWorth)) * 100;

  const formatDate = (date: Date) => {
    return date.toLocaleString("default", { month: "short" });
  };

  const startDate = cleanedData[0].date;
  const endDate = cleanedData[cleanedData.length - 1].date;

  // Calculate time span in days for determining axis interval
  const daysDiff = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const dateRange = `${startDate.toLocaleString("default", {
    month: "long",
  })} - ${endDate.toLocaleString("default", {
    month: "long",
  })} ${endDate.getFullYear()}`;

  const calculateNetWorthChange = (periodData: NetWorthDataPoint[]) => {
    if (periodData.length < 2) return 0;

    const latestNetWorth = periodData[periodData.length - 1].netWorth;

    // Find a valid starting point - ignore zero values at the beginning
    let startIndex = 0;
    let startingNetWorth = periodData[0].netWorth;

    // Find the first significant non-zero value for calculating percentage change
    if (startingNetWorth === 0) {
      for (let i = 1; i < periodData.length - 1; i++) {
        if (periodData[i].netWorth !== 0) {
          startIndex = i;
          startingNetWorth = periodData[i].netWorth;
          break;
        }
      }
    }

    // If all values are zero except the last one, use a reasonable default
    if (startingNetWorth === 0 && latestNetWorth !== 0) {
      return latestNetWorth > 0 ? 100 : -100;
    }

    // If starting value is zero, we can't calculate a percentage change
    if (startingNetWorth === 0) {
      return 0;
    }

    // Calculate proper percentage change
    return (
      ((latestNetWorth - startingNetWorth) / Math.abs(startingNetWorth)) * 100
    );
  };

  const netWorthChange = calculateNetWorthChange(cleanedData);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium">Net Worth</CardTitle>
          <span
            className={`text-sm font-medium ${
              cleanedData[cleanedData.length - 1].netWorth >= 0
                ? "text-success"
                : "text-destructive"
            }`}
          >
            {formatTotalAmount(cleanedData[cleanedData.length - 1].netWorth)}
          </span>
        </div>
        <CardDescription>
          Tracking your financial progress{" "}
          {timeRange === "1M" || timeRange === "3M"
            ? "week by week"
            : "month by month"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-4">
          <div className="px-6">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cleanedData}
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
                    tickFormatter={(date) =>
                      formatAxisDate(date, cleanedData, timeRange)
                    }
                    interval="preserveStartEnd"
                    minTickGap={
                      timeRange === "1M" || timeRange === "3M" ? 25 : 15
                    }
                    stroke="hsl(var(--border))"
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
                            Net Worth: $
                            {data.netWorth.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
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
              {cleanedData.length > 1 ? (
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
                  Initial net worth:{" "}
                  {formatTotalAmount(cleanedData[0]?.netWorth ?? 0)}
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
