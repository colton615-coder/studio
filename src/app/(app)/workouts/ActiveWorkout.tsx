'use client';
import { useState, useEffect } from 'react';
import type { WorkoutPlan } from '@/ai/flows/workout-generator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PauseCircle, PlayCircle, SkipForward, XCircle } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ActiveWorkoutProps {
  workout: WorkoutPlan;
  onFinish: (completed: boolean) => void;
}

export function ActiveWorkout({ workout, onFinish }: ActiveWorkoutProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  
  const currentExercise = workout.exercises[currentExerciseIndex];
  const [timeLeft, setTimeLeft] = useState(currentExercise.duration);
  const nextExercise = workout.exercises[currentExerciseIndex + 1];

  useEffect(() => {
    if (isPaused || isPauseModalOpen) return;

    if (timeLeft <= 0) {
      if (currentExerciseIndex < workout.exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
      } else {
        onFinish(true); // Workout completed
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isPaused, isPauseModalOpen, currentExerciseIndex, workout.exercises.length, onFinish]);

  // When exercise changes, reset the timer for the new one
  useEffect(() => {
    setTimeLeft(workout.exercises[currentExerciseIndex].duration);
  }, [currentExerciseIndex, workout.exercises]);


  const handleSkip = () => {
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      onFinish(true); // Skipped last exercise, treat as completed
    }
  };
  
  const handlePause = () => {
    setIsPaused(true);
    setIsPauseModalOpen(true);
  }

  const handleResume = () => {
    setIsPauseModalOpen(false);
    setIsPaused(false);
  }

  const handleEndWorkout = () => {
    setIsPauseModalOpen(false);
    onFinish(false); // Workout not completed
  }

  const timerProgress = (timeLeft / currentExercise.duration) * 100;

  return (
    <>
      <div className="fixed inset-0 w-full h-full">
        <Image
          src={currentExercise.videoUrl}
          alt={currentExercise.name}
          layout="fill"
          objectFit="cover"
          className="opacity-20"
          data-ai-hint="exercise video"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-between h-full py-8 text-center">
        <header className="flex flex-col items-center">
          <p className="font-semibold text-accent">{currentExercise.category}</p>
          <h1 className="text-4xl font-bold font-headline">{currentExercise.name}</h1>
        </header>

        <div className="relative flex items-center justify-center">
          <svg className="w-64 h-64 transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="hsl(var(--muted))"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="hsl(var(--accent))"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={(2 * Math.PI * 120) * (1 - (timerProgress / 100))}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute font-mono text-7xl font-bold">
            {timeLeft}
          </div>
        </div>

        <div className="w-full max-w-md px-4">
          <Card className="bg-background/50 backdrop-blur-sm shadow-neumorphic-outset">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Next Up</CardTitle>
            </CardHeader>
            <CardContent>
              {nextExercise ? (
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{nextExercise.name}</span>
                  <span className="text-muted-foreground">{nextExercise.duration}s</span>
                </div>
              ) : (
                <p className="font-semibold text-center">Final Exercise!</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-4">
          <Button onClick={handlePause} size="lg" className="shadow-neumorphic-outset active:shadow-neumorphic-inset w-32 bg-primary/20 hover:bg-primary/30 text-primary-foreground">
            <PauseCircle />
            <span className="ml-2">Pause</span>
          </Button>
          <Button onClick={handleSkip} size="lg" variant="outline" className="shadow-neumorphic-outset active:shadow-neumorphic-inset w-32">
            <SkipForward />
            <span className="ml-2">Skip</span>
          </Button>
        </div>
      </div>
      
       <Dialog open={isPauseModalOpen} onOpenChange={(open) => !open && handleResume()}>
        <DialogContent className="shadow-neumorphic-outset bg-background border-transparent" hideCloseButton>
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-2xl">Workout Paused</DialogTitle>
             <DialogDescription>
              Take a breather. Ready to get back to it?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
            <Button onClick={handleResume} className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">
              <PlayCircle className="mr-2 h-4 w-4" />
              Resume Workout
            </Button>
            <Button onClick={handleEndWorkout} variant="destructive" className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset">
               <XCircle className="mr-2 h-4 w-4" />
              End Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    