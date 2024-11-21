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

type TimeRange = "3M" | "6M" | "1Y" | "2Y" | "ALL";

export default function Networth({ data }: NetworthProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("1Y");
  const [startIndex, setStartIndex] = useState(0);

  // Calculate the number of months to show based on selected range
  const getRangeMonths = (range: TimeRange) => {
    switch (range) {
      case "3M":
        return 3;
      case "6M":
        return 6;
      case "1Y":
        return 12;
      case "2Y":
        return 24;
      case "ALL":
        return data.length;
    }
  };

  // Filter data based on selected range and start index
  const getFilteredData = () => {
    if (selectedRange === "ALL") return data;

    const months = getRangeMonths(selectedRange);
    const startIdx = startIndex;
    const endIdx = Math.min(startIndex + months, data.length);

    // Return the slice of data for the current window
    return data.slice(startIdx, endIdx);
  };

  const filteredData = getFilteredData();

  // Update the slide checks
  const canSlideLeft = startIndex > 0;
  const canSlideRight =
    startIndex + getRangeMonths(selectedRange) < data.length;

  const handleSlide = (direction: "left" | "right") => {
    if (direction === "left" && canSlideLeft) {
      // Move window towards more recent data (left)
      setStartIndex((prev) => Math.max(0, prev - 1));
    } else if (direction === "right" && canSlideRight) {
      // Move window towards older data (right)
      setStartIndex((prev) => prev + 1);
    }
  };

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

  const getPeriodDateRange = (periodData: NetWorthDataPoint[]) => {
    if (periodData.length === 0) return "";

    const startDate = periodData[0].date;
    const endDate = periodData[periodData.length - 1].date;

    return `${startDate.toLocaleString("default", {
      month: "long",
    })} - ${endDate.toLocaleString("default", {
      month: "long",
    })} ${endDate.getFullYear()}`;
  };

  const netWorthChange = calculateNetWorthChange(filteredData);
  const periodDateRange = getPeriodDateRange(filteredData);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>Net Worth Over Time</CardTitle>
        <CardDescription>
          Tracking your financial progress month by month
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-4">
          <div className="px-6">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredData}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
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

          <div className="px-6 py-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSlide("left")}
                  disabled={!canSlideLeft}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSlide("right")}
                  disabled={!canSlideRight}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center rounded-md border ">
                {(["3M", "6M", "1Y", "2Y", "ALL"] as TimeRange[]).map(
                  (range) => (
                    <Button
                      key={range}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRange(range);
                        setStartIndex(0);
                      }}
                      className={cn(
                        "h-8 rounded-none px-2 text-xs md:px-3 md:text-sm first:rounded-l-md last:rounded-r-md",
                        selectedRange === range && "bg-muted font-medium"
                      )}
                    >
                      {range}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <div className="flex w-full items-start gap-2 text-xs md:text-sm pt-2">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              {filteredData.length > 1 ? (
                netWorthChange >= 0 ? (
                  <>
                    Net worth up by {netWorthChange.toFixed(1)}% in{" "}
                    {selectedRange}{" "}
                    <TrendingUp className="h-4 w-4 text-success" />
                  </>
                ) : (
                  <>
                    Net worth down by {Math.abs(netWorthChange).toFixed(1)}% in{" "}
                    {selectedRange}{" "}
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  </>
                )
              ) : (
                <>
                  Initial net worth:{" "}
                  {formatLargeNumber(filteredData[0]?.netWorth ?? 0)}
                </>
              )}
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {periodDateRange}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
