'use server';

import {
  aiKnoxTherapy,
  AiKnoxTherapyOutput,
} from '@/ai/flows/ai-knox-therapy';
import {
  generateJournalPrompt,
  JournalPromptOutput,
} from '@/ai/flows/journal-insight-prompt';
import { addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { getSdks } from '@/firebase'; // Assuming getSdks is exported and initializes services


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


type SaveJournalEntryInput = {
  content: string;
  userId: string;
};

export async function saveJournalEntry(input: SaveJournalEntryInput) {
  const { firestore } = getSdks();
  if (!firestore) {
    console.error("Save to Vault Failed: Firestore is not initialized.");
    throw new Error("Firestore is not initialized");
  }

  const journalEntriesCollection = collection(firestore, 'users', input.userId, 'journalEntries');
  console.log("Saving to path:", journalEntriesCollection.path);
  
  return addDocumentNonBlocking(journalEntriesCollection, {
    content: input.content,
    createdAt: serverTimestamp(),
    userProfileId: input.userId, // Maintain schema consistency
    // other fields from schema with default/null values
    id: '',
    date: new Date().toISOString(),
    aiInsight: '',
    updatedAt: serverTimestamp(),
  });
}
