'use server';
/**
 * @fileOverview AI-powered workout plan generator.
 * This flow has been refactored to support sets, reps, and a fixed exercise library.
 * It now "unrolls" sets into a flat array for the client.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { exerciseLibrary, Exercise } from '@/lib/exerciseDatabase';


// The input schema remains the same from the client's perspective.
const WorkoutGeneratorInputSchema = z.object({
  prompt: z
    .string()
    .describe('A user-provided prompt describing the kind of workout they want. E.g., "20 minute core workout with 3 sets of crunches", "upper body strength for 45 mins".'),
});
export type WorkoutGeneratorInput = z.infer<typeof WorkoutGeneratorInputSchema>;


// This is the new schema the AI will output. It's more structured.
// The AI's job is to decide the exercise, its type (time/reps), and the parameters.
const AIExerciseSchema = z.object({
    exerciseId: z.string().describe("The unique ID of the exercise from the provided library (e.g., 'push-ups', 'rest')."),
    type: z.enum(['time', 'reps']).describe("The type of the exercise for this specific step in the plan."),
    duration: z.number().optional().describe("For 'time' type: the duration in seconds."),
    reps: z.number().optional().describe("For 'reps' type: the number of repetitions."),
    sets: z.number().optional().describe("The total number of sets for this exercise block."),
});


const AIWorkoutPlanSchema = z.object({
  name: z.string().describe('A catchy and descriptive name for the generated workout plan. e.g. "Core Crusher"'),
  focus: z.string().describe("The main focus of the workout, e.g., 'Upper Body', 'Core', 'Full Body Cardio'."),
  // The AI now returns a plan that might include sets.
  exercises: z.array(AIExerciseSchema).describe("An array of exercises that make up the workout plan, referencing the exercise library. Include warm-ups, cool-downs, and rest periods."),
});

// This is the "unrolled" rich object we will send to the client.
// It includes the full exercise data plus the specific parameters for this step.
export type ClientExercise = Omit<Exercise, 'category'> & {
  type: 'time' | 'reps';
  duration?: number;
  reps?: number;
  sets?: string; // e.g., '1/3', '2/3'. Null if not part of a set block.
  category: 'Warm-up' | 'Work' | 'Cool-down' | 'Rest';
};

// This type is what the flow will ultimately return.
export type WorkoutPlan = {
  name: string;
  focus: string;
  exercises: ClientExercise[];
};

export async function generateWorkoutPlan(input: WorkoutGeneratorInput): Promise<WorkoutPlan> {
  return workoutGeneratorFlow(input);
}

// We provide the library of available exercises to the AI as a constraint.
const availableExercises = Object.values(exerciseLibrary).map(ex => ({
    id: ex.id,
    name: ex.name,
    defaultType: ex.defaultType
}));

const prompt = ai.definePrompt({
  name: 'workoutGeneratorPrompt',
  input: {schema: z.object({ prompt: WorkoutGeneratorInputSchema.shape.prompt, availableExercises: z.any() })},
  output: {schema: AIWorkoutPlanSchema},
  prompt: `You are a world-class fitness coach. Your task is to create a complete, structured workout plan based on the user's request. The plan must be logical and include a warm-up, the main work, and a cool-down.

  You MUST select exercises exclusively from the following library of available exercise IDs. Do not invent new exercises. For each exercise, decide if it should be time-based or rep-based. If the user specifies sets, you must include 'rest' periods between each work set.
  
  Available Exercises:
  {{json availableExercises}}
  
  Generate a workout based on the following prompt:
  "{{{prompt}}}"

  Structure the output as a valid JSON object. For 'reps' based exercises, specify reps and sets. For 'time' based, specify duration.`,
});


// This is the core logic for "unrolling" the sets.
const workoutGeneratorFlow = ai.defineFlow(
  {
    name: 'workoutGeneratorFlow',
    inputSchema: WorkoutGeneratorInputSchema,
    outputSchema: z.custom<WorkoutPlan>(),
  },
  async (input): Promise<WorkoutPlan> => {
    // 1. Get the structured plan from the AI (which may include sets).
    const { output: aiPlan } = await prompt({ ...input, availableExercises });
    if (!aiPlan) {
        throw new Error("AI failed to generate a workout plan.");
    }

    // 2. Unroll the AI-generated plan into a simple, flat array for the client.
    const unrolledExercises: ClientExercise[] = [];
    aiPlan.exercises.forEach(aiExercise => {
      const baseExerciseData = exerciseLibrary[aiExercise.exerciseId];
      if (!baseExerciseData) {
        // Unknown exerciseId; skip this exercise
        return;
      }
      
      const category = (baseExerciseData.id === 'rest') ? 'Rest' : aiExercise.reps ? 'Work' : 'Warm-up';

      // If it's a rep-based exercise with sets, unroll it.
      if (aiExercise.type === 'reps' && aiExercise.sets && aiExercise.sets > 1) {
        for (let i = 1; i <= aiExercise.sets; i++) {
          // Add the work set
          unrolledExercises.push({
            ...baseExerciseData,
            type: 'reps',
            reps: aiExercise.reps,
            sets: `${i}/${aiExercise.sets}`,
            category: 'Work'
          });

          // Add a rest period after each set, except the last one.
          if (i < aiExercise.sets) {
            unrolledExercises.push({
              ...exerciseLibrary.rest,
              type: 'time',
              duration: exerciseLibrary.rest.defaultDuration, // Use default rest duration
              sets: undefined,
              category: 'Rest'
            });
          }
        }
      } else {
        // It's a single time-based exercise or a single set of reps.
        unrolledExercises.push({
          ...baseExerciseData,
          type: aiExercise.type,
          duration: aiExercise.duration || baseExerciseData.defaultDuration,
          reps: aiExercise.reps || baseExerciseData.defaultReps,
          sets: aiExercise.sets === 1 ? '1/1' : undefined,
          category: category
        });
      }
    });

    return {
      name: aiPlan.name,
      focus: aiPlan.focus,
      exercises: unrolledExercises,
    };
  }
);
