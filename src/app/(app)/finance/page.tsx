import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, PiggyBank, Receipt } from 'lucide-react';
import { FinanceChart } from './FinanceChart';

export default function FinancePage() {
  const budget = 3000;
  const spent = 2050;
  const remaining = budget - spent;
  const progress = (spent / budget) * 100;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-4xl font-bold font-headline text-foreground">Finance</h1>
        <p className="text-muted-foreground mt-2">Manage your budgets and visualize your spending habits.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="shadow-neumorphic-outset">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <PiggyBank className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${budget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">for this month</p>
          </CardContent>
        </Card>
        <Card className="shadow-neumorphic-outset">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Amount Spent</CardTitle>
            <Receipt className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${spent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-neumorphic-outset">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${remaining.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">to stay on budget</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-neumorphic-outset">
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-4 bg-background shadow-neumorphic-inset" indicatorClassName="bg-accent" />
          <div className="flex justify-between text-sm mt-2 text-muted-foreground">
            <span>${spent.toLocaleString()} spent</span>
            <span>${budget.toLocaleString()} total</span>
          </div>
        </CardContent>
      </Card>
      
      <FinanceChart />
    </div>
  );
}
