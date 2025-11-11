/**
 * Type definitions for workout history and stats
 */

import type { ClientExercise } from '@/ai/flows/workout-generator';

export interface CompletedExercise {
  exerciseId: string;
  name: string;
  type: 'time' | 'reps';
  duration?: number;
  reps?: number;
  sets?: string;
  muscleGroups: {
    primary: string[];
    secondary: string[];
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'strength' | 'cardio' | 'flexibility' | 'warmup' | 'cooldown' | 'rest';
  completedAt: Date;
}

export interface WorkoutHistory {
  id: string;
  workoutName: string;
  workoutFocus: string;
  exercises: CompletedExercise[];
  totalDuration: number; // Total seconds
  completedAt: Date;
  createdAt: Date;
  userId: string;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeight?: number;
  maxReps?: number;
  maxDuration?: number;
  achievedAt: Date;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number; // Total minutes
  avgDuration: number; // Average minutes per workout
  totalExercises: number;
  favoriteExercises: Array<{ exerciseId: string; name: string; count: number }>;
  muscleGroupDistribution: Record<string, number>; // e.g., { "Chest": 45, "Legs": 32 }
  weeklyFrequency: Array<{ week: string; count: number }>;
  recentWorkouts: WorkoutHistory[];
}
