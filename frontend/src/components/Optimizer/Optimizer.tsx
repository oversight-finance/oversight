"use client"

import { useState, useEffect } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Loader2 } from "lucide-react"

// Generate fake optimization data
const generateOptimizationData = (currentNetWorth: number, months: number) => {
  const data = []
  let currentValue = currentNetWorth
  let optimizedValue = currentNetWorth

  for (let i = 0; i < months; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() + i)

    // Current trajectory: 3% monthly growth
    currentValue = currentValue * 1.03

    // Optimized trajectory: 5% monthly growth
    optimizedValue = optimizedValue * 1.05

    data.push({
      date,
      current: Math.round(currentValue),
      optimized: Math.round(optimizedValue)
    })
  }

  return data
}

const chartConfig = {
  current: {
    label: "Current Trajectory",
    color: "hsl(var(--chart-1))",
  },
  optimized: {
    label: "Optimized Path",
    color: "hsl(var(--chart-2))",
  },
}

const formatLargeNumber = (value: number) => {
  const absValue = Math.abs(value)
  if (absValue >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (absValue >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value}`
}

const formatAxisDate = (date: Date) => {
  return date.toLocaleString('default', { month: 'short', year: 'numeric' })
}

export default function Optimizer() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [optimizationData, setOptimizationData] = useState<any[]>([])

  useEffect(() => {
    if (open && isLoading) {
      // Simulate optimization calculation
      const timer = setTimeout(() => {
        setOptimizationData(generateOptimizationData(50000, 24))
        setIsLoading(false)
      }, 2000) // 2 second delay

      return () => clearTimeout(timer)
    }
  }, [open, isLoading])

  // Reset loading state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setIsLoading(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <span>Optimizer</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Financial Optimization</DialogTitle>
          <DialogDescription>
            See how optimizing your finances could improve your net worth over time
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            <Card className="p-4">
              <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-lg font-medium">Optimizing your finances...</span>
                </div>
                <div className="text-sm text-muted-foreground animate-pulse">
                  Analyzing spending patterns and investment opportunities
                </div>
              </div>
            </Card>
          ) : (
            <>
              <Card className="p-4">
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={optimizationData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatAxisDate}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tickFormatter={formatLargeNumber}
                        width={80}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="current"
                        name="Current Path"
                        stroke="hsl(var(--chart-1))"
                        fill="hsl(var(--chart-1))"
                        fillOpacity={0.2}
                      />
                      <Area
                        type="monotone"
                        dataKey="optimized"
                        name="Optimized Path"
                        stroke="hsl(var(--chart-2))"
                        fill="hsl(var(--chart-2))"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </Card>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Optimization Opportunities</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Refinance high-interest debt</li>
                    <li>• Optimize investment allocations</li>
                    <li>• Reduce unnecessary expenses</li>
                    <li>• Automate savings and investments</li>
                  </ul>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Potential Impact</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• 24% higher net worth in 2 years</li>
                    <li>• $15,000 additional savings</li>
                    <li>• Reduced interest payments</li>
                    <li>• Improved investment returns</li>
                  </ul>
                </Card>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 