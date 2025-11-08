'use server';

import {
  aiKnoxTherapy,
  AiKnoxTherapyOutput,
} from '@/ai/flows/ai-knox-therapy';

export async function getAiKnoxResponse(
  userInput: string
): Promise<AiKnoxTherapyOutput | { error: string }> {
  if (!userInput.trim()) {
    return { error: 'Input cannot be empty.' };
  }
  try {
    const result = await aiKnoxTherapy({ userInput });
    return result;
  } catch (error) {
    console.error('Error getting AI Knox response:', error);
    return { error: 'AI Knox is unavailable right now. Please try again later.' };
  }
}
