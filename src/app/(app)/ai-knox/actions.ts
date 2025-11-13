'use server';

import { aiKnoxTherapy, AiKnoxTherapyOutput } from '@/ai/flows/ai-knox-therapy';
import {
  generateJournalPrompt,
  JournalPromptOutput,
} from '@/ai/flows/journal-insight-prompt';
import { logError } from '@/lib/logger';


export async function getDailyPrompt(): Promise<JournalPromptOutput> {
  try {
    const result = await generateJournalPrompt({});
    return result;
  } catch {
    return { prompt: 'What are you grateful for today?' };
  }
}

export async function getAiKnoxResponse(
  userInput: string
): Promise<AiKnoxTherapyOutput | { error: string }> {
  if (!userInput.trim()) {
    return { error: 'Input cannot be empty.' };
  }
  
  // Check if API key is configured
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    return { error: 'AI Knox is not configured. Please contact support.' };
  }
  
  try {
    const result = await aiKnoxTherapy({ userInput });
    return result;
  } catch (error) {
    logError('AI Knox error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: `AI Knox error: ${errorMessage}` };
  }
}
