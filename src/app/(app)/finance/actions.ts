'use server';

import { 
  getBudgetCoaching,
  BudgetCoachInput,
  BudgetCoachOutput
} from '@/ai/flows/budget-coach';
import { error } from 'console';

export async function getBudgetSuggestions(
  input: BudgetCoachInput
): Promise<BudgetCoachOutput | { error: string }> {
  try {
    const result = await getBudgetCoaching(input);
    return result;
  } catch(e: any) {
    console.error("Error getting budget suggestions:", e);
    return { error: 'AI Financial Coach is unavailable right now. Please try again later.' };
  }
}

    