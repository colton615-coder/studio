'use server';
import {
  getHabitCoaching,
  HabitCoachInput,
  HabitCoachOutput,
} from '@/ai/flows/habit-coach';

/**
 * This server action acts as a secure bridge between the client-side component
 * and the server-side Genkit AI flow. It takes the habit data from the UI,
 * calls the AI for analysis, and returns the result or an error.
 */
export async function getHabitFeedback(
  input: HabitCoachInput
): Promise<HabitCoachOutput | { error: string }> {
  try {
    const result = await getHabitCoaching(input);
    return result;
  } catch (error) {
    console.error('Error getting habit feedback:', error);
    return { error: 'AI coach is unavailable. Focus on your habits for now.' };
  }
}
