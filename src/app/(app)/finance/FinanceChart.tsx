'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

type ChartData = {
  month: string;
  spending: number;
}

interface FinanceChartProps {
  data: ChartData[];
}

const chartConfig = {
  spending: {
    label: 'Spending',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;


export function FinanceChart({ data }: FinanceChartProps) {
  return (
    <Card className="shadow-neumorphic-outset">
      <CardHeader>
        <CardTitle>Monthly Spending</CardTitle>
        <CardDescription>A look at your spending over time.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
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
        ) : (
          <div className="flex h-[300px] w-full items-center justify-center">
            <p className="text-muted-foreground">Log an expense to see your spending chart.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    