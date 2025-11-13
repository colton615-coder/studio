'use server';

import {
  generateWorkoutPlan,
  WorkoutPlan,
} from '@/ai/flows/workout-generator';
import type { ClientExercise } from '@/ai/flows/workout-generator';
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { getApps } from 'firebase/app';
import type { WorkoutHistory, CompletedExercise, PersonalRecord } from '@/types/workout';

export async function getWorkoutPlan(
  prompt: string
): Promise<WorkoutPlan | { error: string }> {
  if (!prompt.trim()) {
    return { error: 'Workout prompt cannot be empty.' };
  }
  try {
    const result = await generateWorkoutPlan({ prompt });
    return result;
  } catch {
    return { error: 'AI workout generator is unavailable right now. Please try again later.' };
  }
}

/**
 * Save a completed workout to Firestore
 */
export async function saveWorkoutHistory(
  userId: string,
  workoutName: string,
  workoutFocus: string,
  exercises: ClientExercise[],
  totalDuration: number
): Promise<string> {
  if (getApps().length === 0) {
    throw new Error('Firebase not initialized');
  }

  const db = getFirestore();
  const now = new Date();

  // Transform ClientExercise to CompletedExercise
  // Map category values from ClientExercise ('Warm-up', 'Work', 'Cool-down', 'Rest') 
  // to CompletedExercise expected lowercase values ('warmup', 'cooldown', 'rest', 'strength', 'cardio', 'flexibility')
  const completedExercises: CompletedExercise[] = exercises
    .filter(ex => ex.id !== 'rest') // Exclude rest periods from history
    .map(ex => {
      // Normalize category to match CompletedExercise type
      let normalizedCategory: CompletedExercise['category'] = 'strength'; // default
      if (ex.category === 'Warm-up') normalizedCategory = 'warmup';
      else if (ex.category === 'Cool-down') normalizedCategory = 'cooldown';
      else if (ex.category === 'Rest') normalizedCategory = 'rest';
      else if (ex.category === 'Work') {
        // Infer based on exercise metadata or default to 'strength'
        normalizedCategory = 'strength';
      }
      
      return {
        exerciseId: ex.id,
        name: ex.name,
        type: ex.type,
        duration: ex.duration,
        reps: ex.reps,
        sets: ex.sets,
        muscleGroups: ex.muscleGroups,
        difficulty: ex.difficulty,
        category: normalizedCategory,
        completedAt: now,
      };
    });

  const workoutData: Omit<WorkoutHistory, 'id'> = {
    workoutName,
    workoutFocus,
    exercises: completedExercises,
    totalDuration,
    completedAt: now,
    createdAt: now,
    userId,
  };

  // Save to users/{userId}/workoutHistory
  const historyRef = collection(db, `users/${userId}/workoutHistory`);
  const docRef = await addDoc(historyRef, {
    ...workoutData,
    completedAt: Timestamp.fromDate(now),
    createdAt: Timestamp.fromDate(now),
  });

  return docRef.id;
}

/**
 * Get recent workout history for a user
 */
export async function getWorkoutHistory(userId: string, limitCount = 10): Promise<WorkoutHistory[]> {
  if (getApps().length === 0) {
    throw new Error('Firebase not initialized');
  }

  const db = getFirestore();
  const historyRef = collection(db, `users/${userId}/workoutHistory`);
  const q = query(historyRef, orderBy('completedAt', 'desc'), limit(limitCount));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      completedAt: data.completedAt.toDate(),
      createdAt: data.createdAt.toDate(),
      exercises: data.exercises.map((ex: any) => ({
        ...ex,
        completedAt: ex.completedAt.toDate ? ex.completedAt.toDate() : ex.completedAt,
      })),
    } as WorkoutHistory;
  });
}

/**
 * Check and save personal record
 */
export async function checkAndSavePersonalRecord(
  userId: string,
  exerciseId: string,
  exerciseName: string,
  weight?: number,
  reps?: number,
  duration?: number
): Promise<{ isNewPR: boolean; previousPR?: PersonalRecord }> {
  if (getApps().length === 0) {
    throw new Error('Firebase not initialized');
  }

  const db = getFirestore();
  const prRef = doc(db, `users/${userId}/personalRecords/${exerciseId}`);
  const prSnap = await getDoc(prRef);

  const now = new Date();
  let isNewPR = false;
  let previousPR: PersonalRecord | undefined;

  if (prSnap.exists()) {
    const existing = prSnap.data() as PersonalRecord;
    previousPR = existing;

    // Check if new record beats existing
    if (weight && (!existing.maxWeight || weight > existing.maxWeight)) {
      isNewPR = true;
    } else if (reps && (!existing.maxReps || reps > existing.maxReps)) {
      isNewPR = true;
    } else if (duration && (!existing.maxDuration || duration > existing.maxDuration)) {
      isNewPR = true;
    }

    if (isNewPR) {
      await setDoc(prRef, {
        exerciseId,
        exerciseName,
        maxWeight: weight && weight > (existing.maxWeight || 0) ? weight : existing.maxWeight,
        maxReps: reps && reps > (existing.maxReps || 0) ? reps : existing.maxReps,
        maxDuration: duration && duration > (existing.maxDuration || 0) ? duration : existing.maxDuration,
        achievedAt: Timestamp.fromDate(now),
      });
    }
  } else {
    // First time doing this exercise
    isNewPR = true;
    await setDoc(prRef, {
      exerciseId,
      exerciseName,
      maxWeight: weight,
      maxReps: reps,
      maxDuration: duration,
      achievedAt: Timestamp.fromDate(now),
    });
  }

  return { isNewPR, previousPR };
}

/**
 * Get all personal records for a user
 */
export async function getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
  if (getApps().length === 0) {
    throw new Error('Firebase not initialized');
  }

  const db = getFirestore();
  const prRef = collection(db, `users/${userId}/personalRecords`);
  const snapshot = await getDocs(prRef);

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      achievedAt: data.achievedAt.toDate(),
    } as PersonalRecord;
  });
}
