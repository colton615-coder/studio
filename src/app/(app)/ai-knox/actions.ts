'use server';

import {
  aiKnoxTherapy,
  AiKnoxTherapyOutput,
} from '@/ai/flows/ai-knox-therapy';
import {
  generateJournalPrompt,
  JournalPromptOutput,
} from '@/ai/flows/journal-insight-prompt';
import { addDoc, collection, serverTimestamp, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { v4 as uuidv4 } from 'uuid';


function getFirebaseServices() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  const app = getApp();
  const firestore = getFirestore(app);
  return { firestore };
}


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
  const { firestore } = getFirebaseServices();

  const journalEntriesCollection = collection(firestore, 'users', input.userId, 'journalEntries');
  
  const docData = {
    id: uuidv4(),
    userProfileId: input.userId,
    content: input.content,
    date: new Date().toISOString(),
    aiInsight: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await addDoc(journalEntriesCollection, docData);
  } catch (error) {
    console.error('Server Action: Failed to save journal entry.', error);
    // Re-throw the error to be caught by the client-side try/catch block
    throw error;
  }
}

    