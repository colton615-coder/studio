'use server';
/**
 * @fileOverview AI-powered workout plan generator.
 *
 * - generateWorkoutPlan - A function that creates a workout based on a user's prompt.
 * - WorkoutGeneratorInput - The input type for the workout generator.
 * - WorkoutPlan - The output type (the workout plan itself).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WorkoutGeneratorInputSchema = z.object({
  prompt: z
    .string()
    .describe('A user-provided prompt describing the kind of workout they want. E.g., "20 minute core workout", "upper body strength for 45 mins".'),
});
export type WorkoutGeneratorInput = z.infer<typeof WorkoutGeneratorInputSchema>;

const WorkoutPlanSchema = z.object({
  name: z.string().describe('A catchy and descriptive name for the generated workout plan. e.g. "Core Crusher"'),
  exercises: z.array(z.object({
      name: z.string().describe("The name of the exercise."),
      description: z.string().describe("A short, clear description of how to perform the exercise."),
      duration: z.number().describe("The duration of the exercise in seconds."),
  })).describe("An array of exercises that make up the workout plan."),
});
export type WorkoutPlan = z.infer<typeof WorkoutPlanSchema>;

export async function generateWorkoutPlan(input: WorkoutGeneratorInput): Promise<WorkoutPlan> {
  return workoutGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'workoutGeneratorPrompt',
  input: {schema: WorkoutGeneratorInputSchema},
  output: {schema: WorkoutPlanSchema},
  prompt: `You are a world-class fitness coach. Your task is to create a workout plan based on the user's request.

  The plan should have a descriptive name and a list of exercises. Each exercise must include a name, a brief description of how to perform it, and a duration in seconds.

  Generate a workout based on the following prompt:
  "{{{prompt}}}"

  Structure the output as a valid JSON object following the defined schema. Ensure durations are reasonable for a workout session. Include a mix of exercises that target the requested muscles or workout type.`,
});

const workoutGeneratorFlow = ai.defineFlow(
  {
    name: 'workoutGeneratorFlow',
    inputSchema: WorkoutGeneratorInputSchema,
    outputSchema: WorkoutPlanSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
