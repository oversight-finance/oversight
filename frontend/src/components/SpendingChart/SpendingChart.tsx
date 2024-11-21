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
import { ChartContainer } from "@/components/ui/chart";

// Sample data - replace with real data in production
const spendingData = [
  { name: "Housing", value: 2100, color: "hsl(var(--chart-1))" },
  { name: "Transportation", value: 400, color: "hsl(var(--chart-2))" },
  { name: "Food", value: 800, color: "hsl(var(--chart-3))" },
  { name: "Utilities", value: 300, color: "hsl(var(--chart-4))" },
  { name: "Entertainment", value: 400, color: "hsl(var(--chart-5))" },
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

export default function SpendingChart() {
  const total = spendingData.reduce((sum, item) => sum + item.value, 0);

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
