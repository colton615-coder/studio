'use client';
import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dumbbell, PlayCircle, Clock, Loader2, Wand2, ArrowLeft } from 'lucide-react';
import { getWorkoutPlan } from './actions';
import type { WorkoutPlan } from '@/ai/flows/workout-generator';
import { useToast } from '@/hooks/use-toast';
import { ActiveWorkout } from './ActiveWorkout';
import { WorkoutSummary } from './WorkoutSummary';
import Image from 'next/image';

type WorkoutScreen = 'generator' | 'lobby' | 'active' | 'summary';

export default function WorkoutsPage() {
  const [prompt, setPrompt] = useState('');
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [screen, setScreen] = useState<WorkoutScreen>('generator');
  const [completedExercises, setCompletedExercises] = useState(0);

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
        setScreen('lobby');
      }
    });
  };

  const handleFinishWorkout = (completed: boolean) => {
    setCompletedExercises(completed ? workout?.exercises.length ?? 0 : 0); // Simplified for now
    setScreen('summary');
  };
  
  const resetWorkout = () => {
    setWorkout(null);
    setPrompt('');
    setScreen('generator');
  }

  const calculateTotalTime = (exercises: WorkoutPlan['exercises'] | undefined) => {
    if (!exercises) return 0;
    const totalSeconds = exercises.reduce((acc, ex) => acc + ex.duration, 0);
    return Math.ceil(totalSeconds / 60);
  };
  
  if (screen === 'active' && workout) {
    return <ActiveWorkout workout={workout} onFinish={handleFinishWorkout} />;
  }

  if (screen === 'summary' && workout) {
    return <WorkoutSummary workout={workout} completedCount={completedExercises} onDone={resetWorkout} />;
  }

  // Generator & Lobby Screen
  return (
    <div className="flex flex-col gap-8">
      {screen === 'lobby' && (
         <Button variant="ghost" onClick={resetWorkout} className="self-start -ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Generator
         </Button>
      )}

      <header>
        <h1 className="text-4xl font-bold font-headline text-foreground">AI Workout Generator</h1>
        <p className="text-muted-foreground mt-2">Describe the workout you want, and let AI build the perfect plan for you.</p>
      </header>

      {screen === 'generator' && (
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
      )}
      
      {isPending && (
         <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-accent" />
         </div>
      )}

      {screen === 'lobby' && workout && (
        <Card className="shadow-neumorphic-outset flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Dumbbell className="text-accent h-8 w-8"/>
              <div className="flex flex-col">
                <span>{workout.name}</span>
                <span className="text-sm text-muted-foreground font-normal">{workout.focus}</span>
              </div>
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5 pt-1">
              <Clock size={14}/>
              Approx. {calculateTotalTime(workout.exercises)} minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="space-y-4">
              {workout.exercises.map((ex, index) => (
                <Card key={`${ex.name}-${index}`} className="flex items-center gap-4 p-3 bg-background shadow-neumorphic-inset">
                  <Image
                      src={ex.videoUrl}
                      alt={ex.name}
                      width={80}
                      height={80}
                      className="rounded-md object-cover aspect-square bg-muted"
                      data-ai-hint="exercise video"
                    />
                  <div className="flex-grow">
                    <p className="font-semibold">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">{ex.category}</p>
                  </div>
                  <span className="text-lg font-semibold text-muted-foreground">
                    {ex.reps ? `${ex.reps} reps` : `${ex.duration}s`}
                  </span>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setScreen('active')} className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset bg-accent/20 hover:bg-accent/30 text-accent-foreground text-lg h-12">
              <PlayCircle className="mr-2 h-5 w-5" />
              Start Workout
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

    