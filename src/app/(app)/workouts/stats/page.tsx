'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { getWorkoutHistory } from '../actions';
import type { WorkoutHistory } from '@/types/workout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TrendingUp, Dumbbell, Calendar, Award } from 'lucide-react';
import { CircularProgress } from '@/components/ui/circular-progress';

export default function WorkoutStatsPage() {
  const { user } = useUser();
  const [workouts, setWorkouts] = useState<WorkoutHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getWorkoutHistory(user.uid, 50)
        .then(setWorkouts)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalWorkouts = workouts.length;
  const totalDuration = workouts.reduce((sum, w) => sum + w.totalDuration, 0);
  const avgDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;
  const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0);

  // Muscle group distribution
  const muscleGroupCounts: Record<string, number> = {};
  workouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      ex.muscleGroups.primary.forEach(muscle => {
        muscleGroupCounts[muscle] = (muscleGroupCounts[muscle] || 0) + 1;
      });
    });
  });

  const topMuscles = Object.entries(muscleGroupCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Weekly frequency (last 4 weeks)
  const now = new Date();
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const recentWorkouts = workouts.filter(w => w.completedAt >= fourWeeksAgo);
  const weeklyAvg = recentWorkouts.length / 4;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold font-headline">Workout Stats</h1>
        <BarChart3 className="h-8 w-8 text-blue-500" />
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-neumorphic-outset hover:scale-105 transition-transform">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Total Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalWorkouts}</p>
          </CardContent>
        </Card>

        <Card className="shadow-neumorphic-outset hover:scale-105 transition-transform">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Avg Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Math.round(avgDuration / 60)}<span className="text-lg text-muted-foreground ml-1">min</span></p>
          </CardContent>
        </Card>

        <Card className="shadow-neumorphic-outset hover:scale-105 transition-transform">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Weekly Avg
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{weeklyAvg.toFixed(1)}<span className="text-lg text-muted-foreground ml-1">workouts</span></p>
          </CardContent>
        </Card>

        <Card className="shadow-neumorphic-outset hover:scale-105 transition-transform">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Total Exercises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalExercises}</p>
          </CardContent>
        </Card>
      </div>

      {/* Muscle Group Distribution */}
      <Card className="shadow-neumorphic-outset">
        <CardHeader>
          <CardTitle>Muscle Group Focus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topMuscles.length > 0 ? (
            topMuscles.map(([muscle, count]) => {
              const percentage = (count / totalExercises) * 100;
              return (
                <div key={muscle} className="flex items-center gap-4">
                  <span className="w-32 text-sm font-medium">{muscle}</span>
                  <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden shadow-neumorphic-inset">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm text-muted-foreground">{count}</span>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground text-center">Complete workouts to see muscle group data</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Workouts */}
      <Card className="shadow-neumorphic-outset">
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {workouts.slice(0, 10).map((workout) => (
            <div
              key={workout.id}
              className="flex items-center justify-between p-4 bg-muted rounded-lg shadow-neumorphic-inset hover:bg-muted/80 transition"
            >
              <div>
                <p className="font-semibold">{workout.workoutName}</p>
                <p className="text-sm text-muted-foreground">{workout.workoutFocus}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{Math.round(workout.totalDuration / 60)} min</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(workout.completedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {workouts.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              No workouts completed yet. Start your first workout!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
