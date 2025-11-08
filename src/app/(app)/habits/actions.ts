'use server';
import {
  getHabitCoaching,
  HabitCoachInput,
  HabitCoachOutput,
} from '@/ai/flows/habit-coach';

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
