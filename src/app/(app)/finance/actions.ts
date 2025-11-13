'use server';

import { 
  getBudgetCoaching,
  BudgetCoachInput,
  BudgetCoachOutput
} from '@/ai/flows/budget-coach';

export async function getBudgetSuggestions(
  input: BudgetCoachInput
): Promise<BudgetCoachOutput | { error: string }> {
  try {
    const result = await getBudgetCoaching(input);
    return result;
  } catch {
    return { error: 'AI Financial Coach is unavailable right now. Please try again later.' };
  }
}

    