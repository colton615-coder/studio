'use server';
/**
 * @fileOverview AI-powered habit coaching.
 *
 * - getHabitCoaching - A function that provides coaching feedback on user habits based on a 7-day history.
 * - HabitCoachInput - The input type for the habit coaching function.
 * - HabitCoachOutput - The return type for the habit coaching function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// This new schema defines the structure for a single day's log of habit completions.
const DailyLogSchema = z.object({
  date: z.string().describe('The date of the log in YYYY-MM-DD format.'),
  completions: z.record(z.boolean()).describe('A map where keys are habit IDs and values are their completion status.'),
});

// The input schema is updated to accept an array of habits and a 7-day history of logs.
const HabitCoachInputSchema = z.object({
  habits: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        streak: z.number(),
      })
    )
    .describe("An array of the user's defined habits."),
  history: z
    .array(DailyLogSchema)
    .describe("The user's habit completion history for the last 7 days."),
});
export type HabitCoachInput = z.infer<typeof HabitCoachInputSchema>;

const HabitCoachOutputSchema = z.object({
  feedback: z
    .string()
    .describe('A single, concise, and insightful piece of feedback based on the user\'s weekly habit data. Adopt a tough-love, no-excuses coaching persona (like "Knox"). Focus on trends, consistency, and patterns.'),
});
export type HabitCoachOutput = z.infer<typeof HabitCoachOutputSchema>;

export async function getHabitCoaching(
  input: HabitCoachInput
): Promise<HabitCoachOutput> {
  return habitCoachFlow(input);
}

// The AI prompt is now much more sophisticated.
// It instructs the AI to act as a "Weekly Strategist," analyzing trends and patterns
// from the historical data provided, rather than just reacting to a single day.
const prompt = ai.definePrompt({
  name: 'habitCoachPrompt',
  input: { schema: HabitCoachInputSchema },
  output: { schema: HabitCoachOutputSchema },
  prompt: `You are "Knox," a tough-love life coach. Your task is to provide one single, direct, and powerfully motivating piece of feedback based on the user's habit performance over the last week. Do not be soft. Do not offer generic praise. Cut to the truth. Find the pattern in the data.

Analyze the user's habits and their 7-day history. Look for trends, inconsistencies, and opportunities for real improvement.
- Which habits are they consistent with?
- Where are they failing? Are there patterns to the failure (e.g., weekends)?
- A high streak is good, but what if they are failing on all other habits? Don't let them get complacent.
- Acknowledge their defined goals (the habit names) and call them out on whether their actions align with those goals.

Based on the JSON data below, give them one piece of harsh reality or strategic advice to get them to improve.

Habit Definitions:
{{{json habits}}}

7-Day Completion History:
{{{json history}}}

Generate a single, impactful sentence for the 'feedback' field that reflects a weekly analysis.`,
});

const habitCoachFlow = ai.defineFlow(
  {
    name: 'habitCoachFlow',
    inputSchema: HabitCoachInputSchema,
    outputSchema: HabitCoachOutputSchema,
  },
  async (input) => {
    // This logic handles edge cases where the user has no habits or no history,
    // providing specific, actionable feedback for those scenarios.
    if (!input.habits || input.habits.length === 0) {
      return {
        feedback:
          "You can't build discipline if you don't even define the battlefield. Add a habit.",
      };
    }
     if (!input.history || input.history.length === 0) {
      return {
        feedback:
          "First day? Don't mess it up. I'll be watching your performance this week.",
      };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
