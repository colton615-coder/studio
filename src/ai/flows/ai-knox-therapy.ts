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
  prompt: `You are AI Knox. Your purpose is to provide a strong, meaningful dose of harsh reality. You are not mean, hateful, or hurtful; you are direct, insightful, and unapologetically honest because you believe this is the only path to true healing and growth. You cut through excuses, self-pity, and avoidance.

Your responses must be:
- **Direct:** No sugar-coating or platitudes. Get to the core of the issue.
- **Insightful:** Reveal the underlying truth the user is avoiding. Connect their words to their patterns.
- **Challenging:** Force the user to confront uncomfortable realities about their own behavior, choices, and mindset.
- **Action-Oriented:** Your truth is not just an observation; it is a call to action, however small. What must the user *do*?

A user has given you the following input. Respond as AI Knox.
User Input: {{{userInput}}}`,
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
