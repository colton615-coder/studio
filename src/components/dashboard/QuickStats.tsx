'use client';
import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Flame } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

type Expense = {
  id: string;
  amount: number;
  category: string;
  date: any;
};

type Budget = {
  id: string;
  category: string;
  limit: number;
};

type Habit = {
  id: string;
  name: string;
  streak: number;
};

export function QuickStats() {
  const { user } = useUser();
  const firestore = useFirestore();

  const expensesCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'expenses');
  }, [user, firestore]);

  const budgetsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'budgets');
  }, [user, firestore]);

  const habitsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'habits');
  }, [user, firestore]);

  const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesCollection);
  const { data: budgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsCollection);
  const { data: habits, isLoading: habitsLoading } = useCollection<Habit>(habitsCollection);

  const monthlySpend = useMemo(() => {
    if (!expenses) return 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return expenses
      .filter(e => {
        const expenseDate = e.date?.toDate ? e.date.toDate() : new Date(e.date);
        return expenseDate >= monthStart;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalBudget = useMemo(() => {
    if (!budgets) return 0;
    return budgets.reduce((sum, b) => sum + b.limit, 0);
  }, [budgets]);

  const longestStreak = useMemo(() => {
    if (!habits || habits.length === 0) return 0;
    return Math.max(...habits.map(h => h.streak || 0));
  }, [habits]);

  const isLoading = expensesLoading || budgetsLoading || habitsLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <Link href="/finance">
        <Card className="shadow-neumorphic-outset hover:shadow-neumorphic-inset transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <DollarSign className="text-green-400" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${monthlySpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of ${totalBudget.toFixed(2)} budget
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/habits">
        <Card className="shadow-neumorphic-outset hover:shadow-neumorphic-inset transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Best Streak</CardTitle>
            <Flame className="text-orange-400" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{longestStreak} days</div>
            <p className="text-xs text-muted-foreground mt-1">
              Keep it going!
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/workouts">
        <Card className="shadow-neumorphic-outset hover:shadow-neumorphic-inset transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Your Stats</CardTitle>
            <TrendingUp className="text-accent" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">All Systems</div>
            <p className="text-xs text-muted-foreground mt-1">
              Go! 🚀
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
