'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const data = [
  { month: 'Jan', spending: 1800 },
  { month: 'Feb', spending: 1650 },
  { month: 'Mar', spending: 2100 },
  { month: 'Apr', spending: 1900 },
  { month: 'May', spending: 2300 },
  { month: 'Jun', spending: 2050 },
];

const chartConfig = {
  spending: {
    label: 'Spending',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;


export function FinanceChart() {
  return (
    <Card className="shadow-neumorphic-outset">
      <CardHeader>
        <CardTitle>Monthly Spending</CardTitle>
        <CardDescription>A look at your spending over the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer>
            <BarChart data={data}>
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="spending" fill="var(--color-spending)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
