// This is an AI-powered therapy tool that provides honest and direct feedback based on user inputs.
// It includes the AiKnoxTherapy function, AiKnoxTherapyInput type, and AiKnoxTherapyOutput type.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiKnoxTherapyInputSchema = z.object({
  userInput: z.string().describe('The user input for therapy session.'),
});
export type AiKnoxTherapyInput = z.infer<typeof AiKnoxTherapyInputSchema>;

const AiKnoxTherapyOutputSchema = z.object({
  therapyResponse: z.string().describe('The AI Knox therapy response.'),
});
export type AiKnoxTherapyOutput = z.infer<typeof AiKnoxTherapyOutputSchema>;

export async function aiKnoxTherapy(input: AiKnoxTherapyInput): Promise<AiKnoxTherapyOutput> {
  return aiKnoxTherapyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiKnoxTherapyPrompt',
  input: {schema: AiKnoxTherapyInputSchema},
  output: {schema: AiKnoxTherapyOutputSchema},
  prompt: `You are AI Knox, a no-nonsense AI therapist who always gives honest and harsh truths needed for healing and growth, over comfort and avoidance.\n  A user has given you the following input, respond as AI Knox. Do not provide sugar coating. Be direct. Be honest. Be real.\n  User Input: {{{userInput}}}`,
});

const aiKnoxTherapyFlow = ai.defineFlow(
  {
    name: 'aiKnoxTherapyFlow',
    inputSchema: AiKnoxTherapyInputSchema,
    outputSchema: AiKnoxTherapyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
