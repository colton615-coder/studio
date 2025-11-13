'use server';
import {
  getHabitCoaching,
  HabitCoachInput,
  HabitCoachOutput,
} from '@/ai/flows/habit-coach';
import {
  getProactiveSuggestions,
  ProactiveSuggestionsInput,
  ProactiveSuggestionsOutput,
} from '@/ai/flows/proactive-habit-suggestions';
import {
  getInteractiveSuggestion,
  InteractiveSuggestionInput,
  InteractiveSuggestionOutput,
} from '@/ai/flows/interactive-habit-suggestion';

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
  } catch {
    return { error: 'AI coach is unavailable. Focus on your habits for now.' };
  }
}


/**
 * Server action for the proactive AI coach. Fetches recent journal entries
 * and calls the Genkit flow to get personalized habit suggestions.
 */
export async function fetchProactiveSuggestions(
  input: ProactiveSuggestionsInput
): Promise<ProactiveSuggestionsOutput> {
  // This function is designed to fail silently on the client-side,
  // so we return an empty array on error. The AI feature is an
  // enhancement, not a dependency.
  try {
    const result = await getProactiveSuggestions(input);
    return result;
  } catch {
    return { suggestions: [] };
  }
}

/**
 * Server action for the interactive AI coach. Takes the user's
 * current input and calls the Genkit flow to get a refined suggestion.
 */
export async function fetchInteractiveSuggestion(
  input: InteractiveSuggestionInput
): Promise<InteractiveSuggestionOutput> {
  try {
    const result = await getInteractiveSuggestion(input);
    return result;
  } catch {
    return { suggestion: undefined };
  }
}
