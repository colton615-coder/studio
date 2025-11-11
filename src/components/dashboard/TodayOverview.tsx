'use client';
import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, CheckCircle2, Circle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CircularProgress } from '@/components/ui/circular-progress';
import Link from 'next/link';

type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  streak: number;
};

type HabitLog = {
  id: string;
  log: Record<string, boolean>;
};

type Task = {
  id: string;
  description: string;
  completed: boolean;
  priority: 'Low' | 'Medium' | 'High';
};

export function TodayOverview() {
  const { user } = useUser();
  const firestore = useFirestore();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const habitsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'habits');
  }, [user, firestore]);

  const habitLogsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'habitLogs');
  }, [user, firestore]);

  const tasksCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'tasks');
  }, [user, firestore]);

  const { data: habits, isLoading: habitsLoading } = useCollection<Habit>(habitsCollection, { mode: 'once' });
  const { data: habitHistory, isLoading: logsLoading } = useCollection<HabitLog>(habitLogsCollection, { mode: 'once' });
  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksCollection, { mode: 'once' });

  const todayLog = useMemo(() => habitHistory?.find(log => log.id === todayStr) ?? null, [habitHistory, todayStr]);

  const habitStats = useMemo(() => {
    if (!habits || !todayLog) return { completed: 0, total: 0 };
    const completed = habits.filter(h => todayLog.log?.[h.id] === true).length;
    return { completed, total: habits.length };
  }, [habits, todayLog]);

  const taskStats = useMemo(() => {
    if (!tasks) return { completed: 0, pending: 0 };
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed).length;
    return { completed, pending };
  }, [tasks]);

  const isLoading = habitsLoading || logsLoading || tasksLoading;

  if (isLoading) {
    return (
      <Card className="shadow-neumorphic-outset">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="text-accent" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-neumorphic-outset">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="text-accent animate-pulse-glow" />
          Today's Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link href="/habits" className="block group">
          <div className="relative overflow-hidden flex items-center justify-between p-4 rounded-lg bg-background shadow-neumorphic-green hover:shadow-glow-green hover:scale-[1.02] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-green-400/10 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-4 relative z-10">
              <CircularProgress 
                value={habitStats.total > 0 ? Math.round((habitStats.completed / habitStats.total) * 100) : 0}
                size={60}
                strokeWidth={6}
                color="rgb(74, 222, 128)"
                label={`${habitStats.completed}/${habitStats.total}`}
              />
              <div>
                <p className="font-semibold text-foreground">Habits</p>
                <p className="text-sm text-muted-foreground">
                  {habitStats.total > 0 ? Math.round((habitStats.completed / habitStats.total) * 100) : 0}% complete today
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/tasks" className="block group">
          <div className="relative overflow-hidden flex items-center justify-between p-4 rounded-lg bg-background shadow-neumorphic-blue hover:shadow-glow-blue hover:scale-[1.02] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-blue-400/10 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center gap-3 relative z-10">
              <Circle className="text-blue-400 group-hover:scale-110 transition-transform duration-300" size={24} />
              <div>
                <p className="font-semibold text-foreground">Tasks</p>
                <p className="text-sm text-muted-foreground">
                  {taskStats.pending} pending, {taskStats.completed} done
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold text-accent relative z-10 group-hover:scale-110 transition-transform duration-300">
              {taskStats.pending}
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
