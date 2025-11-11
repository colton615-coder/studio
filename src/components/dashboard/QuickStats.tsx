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

  // CRITICAL FIX: Changed mode from 'once' to 'realtime' to prevent crashes
  const { data: expenses, isLoading: expensesLoading, error: expensesError } = useCollection<Expense>(expensesCollection, { mode: 'realtime' });
  const { data: budgets, isLoading: budgetsLoading, error: budgetsError } = useCollection<Budget>(budgetsCollection, { mode: 'realtime' });
  const { data: habits, isLoading: habitsLoading, error: habitsError } = useCollection<Habit>(habitsCollection, { mode: 'realtime' });

  const monthlySpend = useMemo(() => {
    try {
      if (!expenses || !Array.isArray(expenses)) return 0;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return expenses
        .filter(e => {
          try {
            const expenseDate = e.date?.toDate ? e.date.toDate() : new Date(e.date);
            return expenseDate >= monthStart;
          } catch (error) {
            console.error('Error parsing expense date:', error);
            return false;
          }
        })
        .reduce((sum, e) => sum + (e.amount || 0), 0);
    } catch (error) {
      console.error('Error calculating monthly spend:', error);
      return 0;
    }
  }, [expenses]);

  const totalBudget = useMemo(() => {
    try {
      if (!budgets || !Array.isArray(budgets)) return 0;
      return budgets.reduce((sum, b) => sum + (b.limit || 0), 0);
    } catch (error) {
      console.error('Error calculating total budget:', error);
      return 0;
    }
  }, [budgets]);

  const longestStreak = useMemo(() => {
    try {
      if (!habits || !Array.isArray(habits) || habits.length === 0) return 0;
      return Math.max(...habits.map(h => h.streak || 0));
    } catch (error) {
      console.error('Error calculating longest streak:', error);
      return 0;
    }
  }, [habits]);

  const isLoading = expensesLoading || budgetsLoading || habitsLoading;
  const hasError = expensesError || budgetsError || habitsError;

  // CRITICAL FIX: Show error state instead of crashing
  if (hasError) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="shadow-neumorphic-outset">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Unable to load stats</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <Card interactive className="relative overflow-hidden shadow-neumorphic-outset group">
          <div className="absolute inset-0 bg-gradient-to-br from-success/25 via-success/15 to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle size="sm" className="font-medium text-muted-foreground">This Month</CardTitle>
            <DollarSign className="text-success group-hover:scale-110 transition-transform duration-300" size={20} />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-foreground">${monthlySpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of ${totalBudget.toFixed(2)} budget
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/habits">
        <Card interactive className="relative overflow-hidden shadow-neumorphic-outset group">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/25 via-warning/15 to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle size="sm" className="font-medium text-muted-foreground">Best Streak</CardTitle>
            <Flame className="text-warning group-hover:scale-110 group-hover:animate-bounce-subtle transition-transform duration-300" size={20} />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-foreground">{longestStreak} days</div>
            <p className="text-xs text-muted-foreground mt-1">
              Keep it going!
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/workouts">
        <Card interactive className="relative overflow-hidden shadow-neumorphic-outset group">
          <div className="absolute inset-0 bg-gradient-to-br from-info/25 via-info/15 to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle size="sm" className="font-medium text-muted-foreground">Your Stats</CardTitle>
            <TrendingUp className="text-info group-hover:scale-110 transition-transform duration-300" size={20} />
          </CardHeader>
          <CardContent className="relative z-10">
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
