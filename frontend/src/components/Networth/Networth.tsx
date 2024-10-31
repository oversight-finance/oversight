"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from "recharts"
import CSVUploader from "@/app/csvParser"
import { defaultNetWorthData, transformCSVToNetWorthData, type NetWorthDataPoint, type ParsedData } from "@/utils/dataTransformers"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  netWorth: {
    label: "Net Worth",
    color: "hsl(var(--chart-1))",
  },
}

interface NetworthProps {
  data: NetWorthDataPoint[]
}

export default function Networth({ data }: NetworthProps) {
  const minNetWorth = Math.min(...data.map(d => d.netWorth))
  const maxNetWorth = Math.max(...data.map(d => d.netWorth))
  const zeroOffset = maxNetWorth / (maxNetWorth - minNetWorth) * 100

  const latestNetWorth = data[data.length - 1].netWorth
  const previousNetWorth = data[data.length - 2].netWorth
  const netWorthChange = ((latestNetWorth - previousNetWorth) / Math.abs(previousNetWorth)) * 100

  const formatDate = (date: Date) => {
    return date.toLocaleString('default', { month: 'short' })
  }

  const startDate = data[0].date
  const endDate = data[data.length - 1].date
  const dateRange = `${startDate.toLocaleString('default', { month: 'long' })} - ${endDate.toLocaleString('default', { month: 'long' })} ${endDate.getFullYear()}`

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Net Worth Over Time</CardTitle>
          <CardDescription>
            Tracking your financial progress month by month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.8}/>
                    <stop offset={`${zeroOffset}%`} stopColor="hsl(var(--background))" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickLine={false}
                  axisLine={true}
                  tickMargin={8}
                  tickFormatter={formatDate}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value}`}
                  domain={['auto', 'auto']}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="text-sm text-muted-foreground">
                          {data.date.toLocaleString('default', { month: 'long', year: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })}
                        </div>
                        <div className="font-bold">
                          Net Worth: ${data.netWorth.toLocaleString()}
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
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 font-medium leading-none">
                {netWorthChange >= 0 ? (
                  <>Net worth up by {netWorthChange.toFixed(1)}% this month <TrendingUp className="h-4 w-4 text-success" /></>
                ) : (
                  <>Net worth down by {Math.abs(netWorthChange).toFixed(1)}% this month <TrendingDown className="h-4 w-4 text-destructive" /></>
                )}
              </div>
              <div className="flex items-center gap-2 leading-none text-muted-foreground">
                {dateRange}
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}