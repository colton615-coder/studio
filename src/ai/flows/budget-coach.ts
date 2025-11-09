'use server';
/**
 * @fileOverview AI-powered financial coaching.
 *
 * - getBudgetCoaching - Analyzes spending and suggests budgets.
 * - BudgetCoachInput - Input type for the coaching function.
 * - BudgetCoachOutput - Return type for the coaching function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ExpenseSchema = z.object({
  description: z.string(),
  amount: z.number(),
  category: z.string(),
  date: z.string(),
});

const BudgetCoachInputSchema = z.object({
  expenses: z.array(ExpenseSchema).describe("An array of the user's recent expenses."),
  existingBudgets: z.array(z.string()).describe("An array of the user's current budget categories to avoid duplicates."),
});
export type BudgetCoachInput = z.infer<typeof BudgetCoachInputSchema>;


const BudgetSuggestionSchema = z.object({
  name: z.string().describe("A clear, actionable name for the budget (e.g., 'Monthly Groceries')."),
  amount: z.number().describe('A sensible, rounded budget amount based on spending.'),
  category: z.string().describe("A simple, one-word category for the budget (e.g., 'food', 'transport', 'bills')."),
  period: z.enum(['monthly', 'weekly', 'yearly']).describe('The recommended period for this budget.'),
});

const BudgetCoachOutputSchema = z.object({
  feedback: z.string().describe("A concise, insightful piece of feedback on the user's spending patterns."),
  suggestions: z.array(BudgetSuggestionSchema).describe('An array of 1-3 actionable budget suggestions.'),
});
export type BudgetCoachOutput = z.infer<typeof BudgetCoachOutputSchema>;


export async function getBudgetCoaching(
  input: BudgetCoachInput
): Promise<BudgetCoachOutput> {
  return budgetCoachFlow(input);
}

const prompt = ai.definePrompt({
  name: 'budgetCoachPrompt',
  input: { schema: BudgetCoachInputSchema },
  output: { schema: BudgetCoachOutputSchema },
  prompt: `You are a "no-nonsense" financial coach. Your task is to analyze a user's recent spending to identify patterns and suggest actionable monthly budgets.

Analyze the user's expense data. Look for trends, high-spending areas, and opportunities for financial discipline.
- Group expenses by category to understand where money is going.
- Calculate total spending for potential budget categories.
- Do not suggest budgets for categories that already exist.

Based on the JSON data below, provide:
1.  A single, direct sentence of 'feedback' on their spending habits. Be blunt but helpful.
2.  An array of 1-3 'suggestions' for new monthly budgets. The amounts should be intelligently rounded (e.g., to the nearest $25 or $50) based on their spending.

Existing Budget Categories (to avoid suggesting):
{{{json existingBudgets}}}

Recent Expenses:
{{{json expenses}}}

Generate your response as a valid JSON object.`,
});

const budgetCoachFlow = ai.defineFlow(
  {
    name: 'budgetCoachFlow',
    inputSchema: BudgetCoachInputSchema,
    outputSchema: BudgetCoachOutputSchema,
  },
  async (input) => {
    if (input.expenses.length === 0) {
      return {
        feedback: "You haven't logged any expenses. I can't analyze what isn't there. Start tracking your spending.",
        suggestions: [],
      };
    }
    const { output } = await prompt(input);
    return output!;
  }
);

    