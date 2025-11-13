'use client';

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Receipt } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type Budget = {
  id: string;
  userProfileId: string;
  name: string;
  amount: number;
  category: string;
  period: 'monthly' | 'weekly' | 'yearly';
  createdAt: any;
};

type Expense = {
  id: string;
  budgetId: string;
  description: string;
  amount: number;
  category: string;
  date: any;
};

export default function BudgetDetailPage() {
  const { budgetId } = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const budgetDocRef = useMemoFirebase(() => {
    if (!user || !firestore || !budgetId) return null;
    return doc(firestore, 'users', user.uid, 'budgets', budgetId as string);
  }, [user, firestore, budgetId]);

  const { data: budget, isLoading: isLoadingBudget } = useDoc<Budget>(budgetDocRef, { mode: 'once' });

  const expensesQuery = useMemoFirebase(() => {
    if (!user || !firestore || !budgetId) return null;
    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      where('budgetId', '==', budgetId)
    );
  }, [user, firestore, budgetId]);

  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery, { mode: 'realtime' });

  const totalSpent = useMemo(() => {
    return expenses?.reduce((acc, e) => acc + e.amount, 0) ?? 0;
  }, [expenses]);

  const progress = budget ? (totalSpent / budget.amount) * 100 : 0;
  const remaining = budget ? budget.amount - totalSpent : 0;

  if (!budget && !isLoadingBudget && !isLoadingExpenses) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" onClick={() => router.back()} className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Finance
        </Button>
        <Card className="shadow-neumorphic-outset">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Budget not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {budget ? (
        <>
          <header>
            <h1 className="text-4xl font-bold font-headline text-foreground">{budget.name}</h1>
            <p className="text-muted-foreground mt-2">
              ${budget.amount.toLocaleString()} / {budget.period}
            </p>
          </header>

          <Card className="shadow-neumorphic-outset">
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progress} indicatorClassName="bg-accent" className="mb-4" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="text-2xl font-bold">${budget.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Spent</p>
                  <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-2xl font-bold">${remaining.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic-outset">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-accent" />
                Expenses
              </CardTitle>
              <CardDescription>
                {expenses?.length ?? 0} expense{expenses?.length !== 1 ? 's' : ''} recorded
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingExpenses ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : expenses && expenses.length > 0 ? (
                <div className="space-y-3">
                  {expenses.map(expense => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-background shadow-neumorphic-inset"
                    >
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.date?.toDate
                            ? format(expense.date.toDate(), 'MMM d, yyyy')
                            : 'Recent'}
                        </p>
                      </div>
                      <p className="text-lg font-semibold">${expense.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No expenses yet for this budget.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </>
      )}
    </div>
  );
}
