'use server';

import {
  aiKnoxTherapy,
  AiKnoxTherapyOutput,
} from '@/ai/flows/ai-knox-therapy';
import {
  generateJournalPrompt,
  JournalPromptOutput,
} from '@/ai/flows/journal-insight-prompt';


export async function getDailyPrompt(): Promise<JournalPromptOutput> {
  try {
    const result = await generateJournalPrompt({});
    return result;
  } catch (error) {
    console.error('Error generating journal prompt:', error);
    return { prompt: 'What are you grateful for today?' };
  }
}

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
