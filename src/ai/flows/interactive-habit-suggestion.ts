// This file is part of the Step 3 Habit Tracker refactor.
// It provides the "interactive" AI coaching feature.
// As the user types the name of a new habit, this flow is triggered via a debounce hook.
// It takes the user's partial input and suggests a single, fully-formed habit object,
// complete with an appropriate icon, color, and frequency. This creates a collaborative
// experience where the AI helps the user refine their idea in real-time.

'use server';
/**
 * @fileOverview AI-powered interactive habit suggestion.
 *
 * - suggestInteractiveHabit - A function that refines a user's typed input into a complete habit object.
 * - InteractiveSuggestionInput - The input type for the function.
 * - InteractiveSuggestionOutput - The return type for the function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// This is the schema for a single, partial habit object.
// The AI's job is to take user input and complete this object.
const HabitSuggestionSchema = z.object({
  name: z.string().describe('A clear, actionable name for the habit.'),
  icon: z.string().describe('The most appropriate lucide-react icon name (e.g., "BookOpen", "Dumbbell").'),
  color: z.string().describe('A fitting Tailwind CSS background color class (e.g., "bg-blue-500", "bg-green-500").'),
  frequency: z.object({
    type: z.enum(['daily', 'weekly']).describe("The frequency of the habit, either 'daily' or 'weekly'."),
    days: z.array(z.number()).describe('For weekly habits, an array of days (0=Sun, 1=Mon...). Empty for daily habits.'),
  }),
});

// The input is just the user's current text from the input field.
const InteractiveSuggestionInputSchema = z.object({
  userInput: z.string().describe("The user's current typed input for a new habit."),
});
export type InteractiveSuggestionInput = z.infer<typeof InteractiveSuggestionInputSchema>;

// The output is an array containing exactly one fully-formed habit suggestion.
// We use an array to keep the schema consistent with the proactive suggestion flow.
const InteractiveSuggestionOutputSchema = z.object({
  suggestion: HabitSuggestionSchema.optional(),
});
export type InteractiveSuggestionOutput = z.infer<typeof InteractiveSuggestionOutputSchema>;


export async function getInteractiveSuggestion(input: InteractiveSuggestionInput): Promise<InteractiveSuggestionOutput> {
  // If input is empty, don't call the AI.
  if (!input.userInput.trim()) {
    return { suggestion: undefined };
  }
  return interactiveHabitSuggestionFlow(input);
}

// Define the AI prompt. It's instructed to act as a coach and return a single,
// refined habit object in JSON format.
const prompt = ai.definePrompt({
  name: 'interactiveHabitSuggestionPrompt',
  input: { schema: InteractiveSuggestionInputSchema },
  output: { schema: InteractiveSuggestionOutputSchema },
  prompt: `You are an expert life coach. A user is typing a new habit. Your task is to take their input and refine it into a single, complete, and actionable habit object.

User Input: "{{userInput}}"

Based on this input, create one suggested habit.
- The name should be clear and specific (e.g., "Go for a 15-minute walk" instead of "walk").
- Choose the best lucide-react icon.
- Pick a suitable Tailwind CSS color.
- Decide if it's a daily or weekly habit and set the frequency accordingly.

Return a single JSON object with your refined suggestion for the 'suggestion' field.`,
});

// Define the Genkit flow.
const interactiveHabitSuggestionFlow = ai.defineFlow(
  {
    name: 'interactiveHabitSuggestionFlow',
    inputSchema: InteractiveSuggestionInputSchema,
    outputSchema: InteractiveSuggestionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
