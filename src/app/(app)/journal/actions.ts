'use server';
import {
  generateJournalPrompt,
  JournalPromptOutput,
} from '@/ai/flows/journal-insight-prompt';
import {
  analyzeJournalEntry,
  MoodAnalysisOutput,
} from '@/ai/flows/mood-analysis-from-journal';

export async function getDailyPrompt(): Promise<JournalPromptOutput> {
  try {
    const result = await generateJournalPrompt({});
    return result;
  } catch (error) {
    console.error('Error generating journal prompt:', error);
    return { prompt: 'What are you grateful for today?' };
  }
}

export async function getJournalAnalysis(
  entry: string
): Promise<MoodAnalysisOutput | { error: string }> {
  if (!entry.trim()) {
    return { error: 'Journal entry cannot be empty.' };
  }
  try {
    const result = await analyzeJournalEntry({ journalEntry: entry });
    return result;
  } catch (error) {
    console.error('Error analyzing journal entry:', error);
    return { error: 'Failed to analyze journal entry. Please try again.' };
  }
}
