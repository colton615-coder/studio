'use server';
/**
 * @fileOverview AI-powered insights on user's mood, thoughts, and behaviors based on journal entries.
 *
 * - analyzeJournalEntry - A function that analyzes the journal entry.
 * - MoodAnalysisInput - The input type for the analyzeJournalEntry function.
 * - MoodAnalysisOutput - The return type for the analyzeJournalEntry function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MoodAnalysisInputSchema = z.object({
  journalEntry: z
    .string()
    .describe('The journal entry to be analyzed.'),
});
export type MoodAnalysisInput = z.infer<typeof MoodAnalysisInputSchema>;

const MoodAnalysisOutputSchema = z.object({
  mood: z.string().describe('The overall mood expressed in the journal entry.'),
  thoughtPatterns: z
    .string()
    .describe('Identified recurring thought patterns in the journal entry.'),
  behavioralInsights: z
    .string()
    .describe('Insights into behaviors reflected in the journal entry.'),
});
export type MoodAnalysisOutput = z.infer<typeof MoodAnalysisOutputSchema>;

export async function analyzeJournalEntry(input: MoodAnalysisInput): Promise<MoodAnalysisOutput> {
  return moodAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moodAnalysisPrompt',
  input: {schema: MoodAnalysisInputSchema},
  output: {schema: MoodAnalysisOutputSchema},
  prompt: `Analyze the following journal entry and provide insights into the user's mood, thought patterns, and behaviors.\n\nJournal Entry: {{{journalEntry}}}\n\nFocus on identifying the primary mood expressed, any recurring thought patterns, and behavioral insights that can be derived from the text. Be concise and specific in your analysis. Return the mood, thoughtPatterns, and behavioralInsights in a JSON format.\n`,
});

const moodAnalysisFlow = ai.defineFlow(
  {
    name: 'moodAnalysisFlow',
    inputSchema: MoodAnalysisInputSchema,
    outputSchema: MoodAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
