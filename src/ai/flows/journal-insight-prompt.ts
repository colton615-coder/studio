'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating daily journaling prompts.
 *
 * The flow uses a large language model to create prompts designed to inspire deeper self-reflection in users.
 * It exports the following:
 * - `generateJournalPrompt` -  A function that triggers the flow and returns a journaling prompt.
 * - `JournalPromptInput` - The input type for the generateJournalPrompt function.
 * - `JournalPromptOutput` - The output type for the generateJournalPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JournalPromptInputSchema = z.object({
  userContext: z
    .string()
    .optional()
    .describe(
      'Optional context about the user, e.g. their current mood, recent events, or personal goals.'
    ),
});
export type JournalPromptInput = z.infer<typeof JournalPromptInputSchema>;

const JournalPromptOutputSchema = z.object({
  prompt: z.string().describe('A daily journaling prompt for self-reflection.'),
});
export type JournalPromptOutput = z.infer<typeof JournalPromptOutputSchema>;

export async function generateJournalPrompt(input: JournalPromptInput): Promise<JournalPromptOutput> {
  return journalPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'journalPrompt',
  input: {schema: JournalPromptInputSchema},
  output: {schema: JournalPromptOutputSchema},
  prompt: `You are an AI assistant designed to provide users with daily journaling prompts for self-reflection.

  Consider the user's context (if provided) to create a prompt that encourages deep thought and introspection.

  User Context: {{{userContext}}}

  Here is a journaling prompt for today:
  `, 
});

const journalPromptFlow = ai.defineFlow(
  {
    name: 'journalPromptFlow',
    inputSchema: JournalPromptInputSchema,
    outputSchema: JournalPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
