'use client';
import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dumbbell, PlayCircle, Clock, Loader2, Wand2 } from 'lucide-react';
import { getWorkoutPlan } from './actions';
import type { WorkoutPlan } from '@/ai/flows/workout-generator';
import { useToast } from '@/hooks/use-toast';

export default function WorkoutsPage() {
  const [prompt, setPrompt] = useState('');
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    startTransition(async () => {
      setWorkout(null);
      const result = await getWorkoutPlan(prompt);
      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: 'Error Generating Workout',
          description: result.error,
        });
      } else {
        setWorkout(result);
      }
    });
  };

  const calculateTotalTime = (exercises: WorkoutPlan['exercises']) => {
    const totalSeconds = exercises.reduce((acc, ex) => acc + ex.duration, 0);
    return Math.ceil(totalSeconds / 60);
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-4xl font-bold font-headline text-foreground">AI Workout Generator</h1>
        <p className="text-muted-foreground mt-2">Describe the workout you want, and let AI build it for you.</p>
      </header>

      <Card className="shadow-neumorphic-outset">
        <CardHeader>
          <CardTitle>Workout Prompt</CardTitle>
          <CardDescription>
            Examples: "A 20 minute core workout", "Full body strength, 45 minutes", "A quick 10 minute cardio session"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateWorkout} className="flex flex-col sm:flex-row items-center gap-4">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tell the AI what workout you need..."
              className="flex-grow"
            />
            <Button type="submit" className="w-full sm:w-auto shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate Workout
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {isPending && (
         <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-accent" />
         </div>
      )}

      {workout && (
        <Card className="shadow-neumorphic-outset flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="text-accent"/>
              {workout.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5 pt-1">
              <Clock size={14}/>
              Approx. {calculateTotalTime(workout.exercises)} minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2">
              {workout.exercises.map(ex => (
                <li key={ex.name} className="text-sm p-3 rounded-md bg-background shadow-neumorphic-inset flex justify-between">
                  <div>
                    <p className="font-semibold">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">{ex.description}</p>
                  </div>
                  <span className="text-muted-foreground font-medium">{ex.duration}s</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset bg-accent/20 hover:bg-accent/30 text-accent-foreground">
              <PlayCircle className="mr-2 h-4 w-4" />
              Start Workout
            </Button>
          </CardFooter>
        </Card>
      )}

    </div>
  );
}
