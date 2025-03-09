"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { FC } from "react";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

interface NetWorthDataPoint {
  date: Date;
  netWorth: number;
}

interface NetworthGraphProps {
  data: NetWorthDataPoint[];
}

const chartConfig = {
  netWorth: {
    label: "Net Worth",
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
  return `$${value.toFixed(0)}`;
};

const formatAxisDate = (date: Date, data: NetWorthDataPoint[]) => {
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

const NetworthGraph: FC<NetworthGraphProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No data available to display the graph.
      </div>
    );
  }

  const minNetWorth = Math.min(...data.map((d) => d.netWorth));
  const maxNetWorth = Math.max(...data.map((d) => d.netWorth));
  const zeroOffset = (maxNetWorth / (maxNetWorth - minNetWorth)) * 100;

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 80, bottom: 0 }}
        >
          <defs>
            <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.8} />
              <stop offset={`${zeroOffset}%`} stopColor="hsl(var(--background))" stopOpacity={0.8} />
              <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={true}
            tickMargin={8}
            tickFormatter={(date: Date) => formatAxisDate(date, data)}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatLargeNumber}
            domain={["auto", "auto"]}
            tickCount={8}
            width={80}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
          />
          <ChartTooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const dataPoint = payload[0].payload;
              
              // Format the date for display
              const formattedDate = dataPoint.date.toLocaleString("default", {
                month: "long",
                year: "numeric",
                day: "numeric",
              });
              
              // Format the net worth value
              const formattedNetWorth = formatLargeNumber(dataPoint.netWorth);
              
              // Determine the color based on whether the value is positive or negative
              const valueColor = dataPoint.netWorth >= 0 ? 'text-success' : 'text-destructive';
              
              return (
                <div className="rounded-lg border bg-background p-3 shadow-md">
                  <div className="text-sm font-medium mb-1">{formattedDate}</div>
                  <div className="flex items-center">
                    <span className="text-muted-foreground mr-2">Net Worth:</span>
                    <span className={`font-bold ${valueColor}`}>{formattedNetWorth}</span>
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
  );
};

export default NetworthGraph; 