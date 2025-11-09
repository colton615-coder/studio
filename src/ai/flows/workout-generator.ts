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
import { PlaceHolderImages } from '@/lib/placeholder-images';


const WorkoutGeneratorInputSchema = z.object({
  prompt: z
    .string()
    .describe('A user-provided prompt describing the kind of workout they want. E.g., "20 minute core workout", "upper body strength for 45 mins".'),
});
export type WorkoutGeneratorInput = z.infer<typeof WorkoutGeneratorInputSchema>;

const ExerciseSchema = z.object({
  name: z.string().describe("The name of the exercise."),
  description: z.string().describe("A short, clear description of how to perform the exercise."),
  duration: z.number().describe("The duration of the exercise in seconds."),
  reps: z.number().optional().describe("Number of repetitions, if applicable. Time-based exercises won't have this."),
  category: z.enum(['Warm-up', 'Work', 'Cool-down', 'Rest']).describe("The category of the exercise."),
  videoUrl: z.string().url().describe("A placeholder URL for a video of the exercise."),
});

const WorkoutPlanSchema = z.object({
  name: z.string().describe('A catchy and descriptive name for the generated workout plan. e.g. "Core Crusher"'),
  focus: z.string().describe("The main focus of the workout, e.g., 'Upper Body', 'Core', 'Full Body Cardio'."),
  exercises: z.array(ExerciseSchema).describe("An array of exercises that make up the workout plan."),
});
export type WorkoutPlan = z.infer<typeof WorkoutPlanSchema>;

export async function generateWorkoutPlan(input: WorkoutGeneratorInput): Promise<WorkoutPlan> {
  return workoutGeneratorFlow(input);
}

const videoUrls = PlaceHolderImages.filter(img => img.id.startsWith("exercise-")).map(img => img.imageUrl);

const prompt = ai.definePrompt({
  name: 'workoutGeneratorPrompt',
  input: {schema: WorkoutGeneratorInputSchema},
  output: {schema: WorkoutPlanSchema},
  prompt: `You are a world-class fitness coach. Your task is to create a complete, structured workout plan based on the user's request. The plan must be logical and include a warm-up, the main work, and a cool-down.

  The plan must have a descriptive name and a clear focus (e.g., 'Upper Body Strength').
  
  The 'exercises' array should contain a series of exercises. Each exercise must include:
  - A 'name' (e.g., "Jumping Jacks", "Push-ups", "Rest").
  - A brief 'description' of how to perform it.
  - A 'duration' in seconds (e.g., 30, 45, 60). For 'Rest' periods, use a reasonable duration like 15-30 seconds.
  - A 'category': 'Warm-up', 'Work', 'Cool-down', or 'Rest'.
  - A 'videoUrl': You must assign one of the following placeholder video URLs to each exercise. Distribute them logically.
    {{#each videoUrls}}
    - {{this}}
    {{/each}}
  
  Generate a workout based on the following prompt:
  "{{{prompt}}}"

  Structure the output as a valid JSON object. Ensure the workout flows logically from warm-up to cool-down.`,
});


const workoutGeneratorFlow = ai.defineFlow(
  {
    name: 'workoutGeneratorFlow',
    inputSchema: WorkoutGeneratorInputSchema,
    outputSchema: WorkoutPlanSchema,
  },
  async input => {
    const {output} = await prompt({ ...input, videoUrls });
    return output!;
  }
);

    