'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/firebase';
import { getWorkoutHistory } from '../actions';
import type { WorkoutHistory } from '@/types/workout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, TrendingUp, Dumbbell, Calendar, 
  Flame, Target, Trophy, Zap, Activity, Clock, ArrowLeft, Check
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function WorkoutStatsPage() {
  const { user } = useUser();
  const [workouts, setWorkouts] = useState<WorkoutHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (user) {
      getWorkoutHistory(user.uid, 100)
        .then(setWorkouts)
        .catch(() => {
          // Failed to load history
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  // Calculate stats based on timeframe
  const stats = useMemo(() => {
    const now = new Date();
    let filteredWorkouts = workouts;

    if (timeframe === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredWorkouts = workouts.filter(w => w.completedAt >= weekAgo);
    } else if (timeframe === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredWorkouts = workouts.filter(w => w.completedAt >= monthAgo);
    }

    const totalWorkouts = filteredWorkouts.length;
    const totalDuration = filteredWorkouts.reduce((sum, w) => sum + w.totalDuration, 0);
    const avgDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;
    const totalExercises = filteredWorkouts.reduce((sum, w) => sum + w.exercises.length, 0);
    const totalCalories = Math.round(totalDuration / 60 * 8);

    // Calculate current streak
    const sortedWorkouts = [...workouts].sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.completedAt);
      workoutDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((checkDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0 || diffDays === 1) {
        currentStreak++;
        checkDate = workoutDate;
      } else {
        break;
      }
    }

    // Muscle group distribution
    const muscleGroupCounts: Record<string, number> = {};
    filteredWorkouts.forEach(workout => {
      workout.exercises.forEach(ex => {
        ex.muscleGroups.primary.forEach(muscle => {
          muscleGroupCounts[muscle] = (muscleGroupCounts[muscle] || 0) + 1;
        });
      });
    });

    const topMuscles = Object.entries(muscleGroupCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Personal records (placeholder)
    const personalRecords = [
      { exercise: 'Push-ups', record: 50, date: new Date() },
      { exercise: 'Plank Hold', record: 120, date: new Date() },
      { exercise: 'Squats', record: 75, date: new Date() },
    ];

    // Achievement badges
    const achievements = [
      { id: 'first', title: 'First Workout', earned: workouts.length >= 1, icon: Trophy },
      { id: 'consistent', title: '7 Day Streak', earned: currentStreak >= 7, icon: Flame },
      { id: 'dedicated', title: '10 Workouts', earned: workouts.length >= 10, icon: Target },
      { id: 'warrior', title: '25 Workouts', earned: workouts.length >= 25, icon: Zap },
    ];

    return {
      totalWorkouts,
      totalDuration,
      avgDuration,
      totalExercises,
      totalCalories,
      currentStreak,
      topMuscles,
      personalRecords,
      achievements,
      filteredWorkouts,
    };
  }, [workouts, timeframe]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/workouts">
            <Button variant="ghost" size="icon" className="shadow-neumorphic-outset">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold font-headline bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Workout Stats
            </h1>
            <p className="text-muted-foreground">Track your fitness journey</p>
          </div>
        </div>
        <BarChart3 className="h-10 w-10 text-blue-500" />
      </div>

      {/* Timeframe Selector */}
      <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 shadow-neumorphic-inset">
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Hero Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-neumorphic-outset hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-blue-500" />
                Total Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                  {stats.totalWorkouts}
                </p>
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-neumorphic-outset hover:scale-105 transition-all duration-300 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                  {stats.currentStreak}
                </p>
                <span className="text-lg text-muted-foreground">days</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-neumorphic-outset hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                Avg Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
                  {Math.round(stats.avgDuration / 60)}
                </p>
                <span className="text-lg text-muted-foreground">min</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-neumorphic-outset hover:scale-105 transition-all duration-300 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                Calories Burned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                  {stats.totalCalories}
                </p>
                <span className="text-lg text-muted-foreground">kcal</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Achievements Section */}
      <Card className="shadow-neumorphic-outset bg-gradient-to-br from-yellow-500/5 to-amber-600/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Achievements
          </CardTitle>
          <CardDescription>Unlock badges as you progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.achievements.map((achievement, idx) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * idx }}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                  achievement.earned
                    ? 'bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border-yellow-500/30 shadow-lg shadow-yellow-500/10'
                    : 'bg-muted/20 border-muted/30 opacity-50 grayscale'
                )}
              >
                <achievement.icon className={cn('h-8 w-8', achievement.earned ? 'text-yellow-500' : 'text-muted-foreground')} />
                <p className="text-xs font-medium text-center">{achievement.title}</p>
                {achievement.earned && (
                  <Badge variant="secondary" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Earned
                  </Badge>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Body Part Heatmap */}
        <Card className="shadow-neumorphic-outset">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Muscle Group Focus
            </CardTitle>
            <CardDescription>Your training distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topMuscles.length > 0 ? (
              stats.topMuscles.map(([muscle, count], idx) => {
                const percentage = (count / stats.totalExercises) * 100;
                const colors = [
                  'from-blue-500 to-blue-600',
                  'from-purple-500 to-purple-600',
                  'from-pink-500 to-pink-600',
                  'from-red-500 to-red-600',
                  'from-orange-500 to-orange-600',
                  'from-yellow-500 to-yellow-600',
                  'from-green-500 to-green-600',
                  'from-teal-500 to-teal-600',
                ];
                return (
                  <motion.div
                    key={muscle}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{muscle}</span>
                      <span className="text-muted-foreground">{count} exercises</span>
                    </div>
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden shadow-neumorphic-inset">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.1 * idx, ease: 'easeOut' }}
                        className={cn('h-full bg-gradient-to-r', colors[idx % colors.length])}
                      />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Complete workouts to see muscle group data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Records */}
        <Card className="shadow-neumorphic-outset">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Personal Records
            </CardTitle>
            <CardDescription>Your best performances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.personalRecords.length > 0 ? (
              stats.personalRecords.map((record, idx) => (
                <motion.div
                  key={record.exercise}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-600/5 border border-yellow-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-semibold">{record.exercise}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.date.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-500">{record.record}</p>
                    <p className="text-xs text-muted-foreground">reps/secs</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Complete exercises to set records</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Workouts */}
      <Card className="shadow-neumorphic-outset">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Recent Workouts
          </CardTitle>
          <CardDescription>Your training history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.filteredWorkouts.length > 0 ? (
            stats.filteredWorkouts.slice(0, 10).map((workout, idx) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * idx }}
                className="flex items-center justify-between p-4 bg-muted rounded-lg shadow-neumorphic-inset hover:bg-muted/80 transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Dumbbell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-blue-500 transition">{workout.workoutName}</p>
                    <p className="text-sm text-muted-foreground">{workout.workoutFocus}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{Math.round(workout.totalDuration / 60)} min</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(workout.completedAt).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Dumbbell className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2">No workouts yet</p>
              <p className="text-sm">Complete your first workout to see it here!</p>
              <Link href="/workouts">
                <Button className="mt-4">
                  Start Your First Workout
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
