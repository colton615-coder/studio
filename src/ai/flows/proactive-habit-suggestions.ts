// This file is part of the Step 3 Habit Tracker refactor.
// It provides the "proactive" AI coaching feature, which is the "wow" factor.
// When the user opens the "Add New Habit" modal, this flow is triggered.
// It analyzes the user's most recent private journal entries to understand their
// current thoughts, struggles, and goals. Based on this deep context, it suggests
// three fully-formed, personalized habits that are truly relevant to the user's life.
// This proactive assistance helps the user feel understood and guided.

'use server';
/**
 * @fileOverview Proactive AI habit suggestions based on journal entries.
 *
 * - getProactiveSuggestions - A function that generates habit suggestions from journal content.
 * - ProactiveSuggestionsInput - The input type for the function.
 * - ProactiveSuggestionsOutput - The return type for the function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// This is the schema for a single, partial habit object.
// The AI will generate an array of these.
const HabitSuggestionSchema = z.object({
  name: z.string().describe('A clear, actionable name for the habit.'),
  icon: z.string().describe('The most appropriate lucide-react icon name (e.g., "BookOpen", "Dumbbell").'),
  color: z.string().describe('A fitting Tailwind CSS background color class (e.g., "bg-blue-500", "bg-green-500").'),
  frequency: z.object({
    type: z.enum(['daily', 'weekly']).describe("The frequency of the habit, either 'daily' or 'weekly'."),
    days: z.array(z.number()).describe('For weekly habits, an array of days (0=Sun, 1=Mon...). Empty for daily habits.'),
  }),
});

// The input schema takes an array of journal entries and an array of existing habit names
// to avoid suggesting duplicates.
const ProactiveSuggestionsInputSchema = z.object({
  journalEntries: z.array(z.string()).describe("An array of the user's 5-10 most recent journal entries."),
  existingHabits: z.array(z.string()).describe("An array of the user's current habit names to avoid duplicates."),
});
export type ProactiveSuggestionsInput = z.infer<typeof ProactiveSuggestionsInputSchema>;

// The output will be an array of up to 3 suggested habit objects.
const ProactiveSuggestionsOutputSchema = z.object({
  suggestions: z.array(HabitSuggestionSchema),
});
export type ProactiveSuggestionsOutput = z.infer<typeof ProactiveSuggestionsOutputSchema>;

export async function getProactiveSuggestions(input: ProactiveSuggestionsInput): Promise<ProactiveSuggestionsOutput> {
  // If there are no journal entries, we can't make suggestions, so we return an empty array.
  if (input.journalEntries.length === 0) {
    return { suggestions: [] };
  }
  return proactiveHabitSuggestionFlow(input);
}

// Define the AI prompt. This is the core of the feature.
// It is instructed to act as a life coach, analyze the provided journal entries, and generate
// three unique, actionable habits in the specified JSON format.
const prompt = ai.definePrompt({
  name: 'proactiveHabitSuggestionPrompt',
  input: { schema: ProactiveSuggestionsInputSchema },
  output: { schema: ProactiveSuggestionsOutputSchema },
  prompt: `You are a world-class life coach. Your task is to analyze a user's recent, private journal entries to identify underlying themes, struggles, or goals. Based on this analysis, you will suggest 3 actionable, personalized habits to help them improve their life.

Do not suggest habits that are already in the user's existing habit list.

Return *only* a JSON object containing a 'suggestions' field, which is an array of 3 complete habit objects. Each object must have a name, a lucide-react icon name, a Tailwind background color class, and a frequency object.

Existing Habits (to avoid suggesting):
{{#each existingHabits}}
- {{this}}
{{/each}}

User's Recent Journal Entries:
---
{{#each journalEntries}}
Entry:
{{this}}
---
{{/each}}
`,
});


const proactiveHabitSuggestionFlow = ai.defineFlow(
  {
    name: 'proactiveHabitSuggestionFlow',
    inputSchema: ProactiveSuggestionsInputSchema,
    outputSchema: ProactiveSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
