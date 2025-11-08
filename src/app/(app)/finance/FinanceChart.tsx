'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartTooltipContent } from '@/components/ui/chart';

const data = [
  { month: 'Jan', spending: 1800 },
  { month: 'Feb', spending: 1650 },
  { month: 'Mar', spending: 2100 },
  { month: 'Apr', spending: 1900 },
  { month: 'May', spending: 2300 },
  { month: 'Jun', spending: 2050 },
];

export function FinanceChart() {
  return (
    <Card className="shadow-neumorphic-outset">
      <CardHeader>
        <CardTitle>Monthly Spending</CardTitle>
        <CardDescription>A look at your spending over the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
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
              <Bar dataKey="spending" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
