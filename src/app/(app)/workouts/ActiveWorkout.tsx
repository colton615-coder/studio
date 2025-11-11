'use client';
import { useState, useEffect } from 'react';
import type { WorkoutPlan, ClientExercise } from '@/ai/flows/workout-generator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PauseCircle, PlayCircle, SkipForward, XCircle, Info, Check, Trophy } from 'lucide-react';
import { ExerciseImage } from '@/components/ui/ExerciseImage';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useUser } from '@/firebase';
import { checkAndSavePersonalRecord } from './actions';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

interface ActiveWorkoutProps {
  workout: WorkoutPlan;
  onFinish: (completed: boolean) => void;
}

export function ActiveWorkout({ workout, onFinish }: ActiveWorkoutProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isInstructionsSheetOpen, setIsInstructionsSheetOpen] = useState(false);
  
  const currentExercise = workout.exercises[currentExerciseIndex];
  const [timeLeft, setTimeLeft] = useState(currentExercise.duration || 0);
  const nextExercise = workout.exercises[currentExerciseIndex + 1];

  // Main timer effect for TIME-BASED exercises
  useEffect(() => {
    if (isPaused || isPauseModalOpen || currentExercise.type !== 'time') return;

    if (timeLeft <= 0) {
        goToNextExercise();
        return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
   
  }, [timeLeft, isPaused, isPauseModalOpen, currentExercise.type, currentExerciseIndex]);

  // When exercise changes, reset the state for the new one.
  useEffect(() => {
    setTimeLeft(workout.exercises[currentExerciseIndex].duration || 0);
  }, [currentExerciseIndex, workout.exercises]);


  const goToNextExercise = () => {
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      onFinish(true); // Workout completed
    }
  }

  const handleSkip = () => {
    goToNextExercise();
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
  
  const handleCompleteSet = () => {
      checkForPR(); // Check for personal record
      goToNextExercise(); // For rep-based exercises
  }

  const timerProgress = currentExercise.duration ? (timeLeft / currentExercise.duration) * 100 : 0;
  const workoutProgress = ((currentExerciseIndex + 1) / workout.exercises.length) * 100;
  
  const isRepBased = currentExercise.type === 'reps';
  const { user } = useUser();

  // Check for PR on rep-based exercises
  const checkForPR = async () => {
    if (!user || !isRepBased || !currentExercise.reps) return;
    
    try {
      const result = await checkAndSavePersonalRecord(
        user.uid,
        currentExercise.id,
        currentExercise.name,
        undefined, // weight not tracked yet
        currentExercise.reps,
        undefined
      );

      if (result.isNewPR) {
        // Celebrate personal record!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF6347'],
        });
      }
    } catch (error) {
      console.error('Failed to check PR:', error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 w-full h-full">
        <ExerciseImage
            asset={currentExercise.asset}
            name={currentExercise.name}
            alt={currentExercise.name}
            className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-between h-full py-8 text-center">
        <header className="flex flex-col items-center w-full px-4 space-y-4">
          {/* Workout Progress Ring */}
          <div className="flex items-center justify-center gap-2">
            <CircularProgress 
              value={workoutProgress} 
              size={50} 
              strokeWidth={4}
              className="text-blue-500"
            >
              <span className="text-xs font-bold">{currentExerciseIndex + 1}/{workout.exercises.length}</span>
            </CircularProgress>
          </div>

          <div className="flex justify-between items-center w-full max-w-md">
            <div className="flex-1 text-left">
                 <p className="font-semibold text-accent text-shadow">{currentExercise.category}</p>
                 {isRepBased && currentExercise.sets && <p className="text-sm font-bold text-muted-foreground text-shadow">Set {currentExercise.sets}</p>}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-headline text-shadow-lg text-center flex-shrink-0 mx-4">{currentExercise.name}</h1>
            <div className="flex-1 text-right">
                <Button variant="ghost" size="icon" onClick={() => setIsInstructionsSheetOpen(true)}>
                    <Info className="text-accent"/>
                </Button>
            </div>
          </div>
        </header>

        {isRepBased ? (
            <div className="relative flex flex-col items-center justify-center my-8">
                <div className="font-mono text-9xl font-bold text-shadow-lg">
                    {currentExercise.reps}
                </div>
                 <span className="text-5xl ml-2 text-muted-foreground font-bold text-shadow-lg">Reps</span>
            </div>
        ) : (
            <div className="relative flex items-center justify-center my-8">
                <svg className="w-72 h-72 sm:w-96 sm:h-96 transform -rotate-90">
                    <circle cx="50%" cy="50%" r="140" stroke="hsl(var(--muted) / 0.2)" strokeWidth="12" fill="transparent" className="sm:r-[180px]" />
                    <circle cx="50%" cy="50%" r="140" stroke="hsl(var(--accent))" strokeWidth="12" fill="transparent"
                        strokeDasharray={2 * Math.PI * 140} strokeDashoffset={(2 * Math.PI * 140) * (1 - (timerProgress / 100))}
                        className="transition-all duration-1000 ease-linear sm:r-[180px]" style={{ strokeLinecap: 'round' }} />
                </svg>
                <div className="absolute font-mono text-9xl font-bold text-shadow-lg">{timeLeft}</div>
            </div>
        )}

        <div className="w-full max-w-md px-4 space-y-4">
          <Card className="bg-background/50 backdrop-blur-sm shadow-neumorphic-outset">
            <CardHeader className="flex-row items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0 shadow-neumorphic-inset">
                  {nextExercise ? (
                     <ExerciseImage asset={nextExercise.asset} name={nextExercise.name} alt={nextExercise.name} className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full bg-background flex items-center justify-center text-accent font-bold">END</div>
                  )}
                </div>
                <div>
                    <CardTitle className="text-sm text-left text-muted-foreground text-shadow">Next Up</CardTitle>
                    <CardDescription className="text-lg text-left font-semibold text-foreground text-shadow">
                        {nextExercise ? nextExercise.name : 'Final Exercise!'}
                    </CardDescription>
                </div>
              </div>
               {nextExercise && <span className="text-2xl font-semibold text-muted-foreground text-shadow">{nextExercise.duration ? `${nextExercise.duration}s` : `${nextExercise.reps} reps`}</span>}
            </CardHeader>
          </Card>
          
          {isRepBased ? (
              <Button onClick={handleCompleteSet} size="lg" className="shadow-neumorphic-outset active:shadow-neumorphic-inset w-full h-16 text-lg bg-green-500/80 hover:bg-green-500 text-white">
                <Check />
                <span className="ml-2">Complete Set</span>
              </Button>
          ) : (
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
          )}
        </div>
      </div>
      
       <Dialog open={isPauseModalOpen} onOpenChange={(open) => !open && handleResume()}>
        <DialogContent open={isPauseModalOpen} className="shadow-neumorphic-outset bg-background border-transparent" hideCloseButton>
          <DialogHeader className="items-center text-center"><DialogTitle className="text-2xl">Workout Paused</DialogTitle><DialogDescription>Take a breather. Ready to get back to it?</DialogDescription></DialogHeader>
          <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
            <Button onClick={handleResume} className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground"><PlayCircle className="mr-2 h-4 w-4" />Resume Workout</Button>
            <Button onClick={handleEndWorkout} variant="destructive" className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset"><XCircle className="mr-2 h-4 w-4" />End Workout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Sheet open={isInstructionsSheetOpen} onOpenChange={setIsInstructionsSheetOpen}>
        <SheetContent side="bottom" className="h-4/5 rounded-t-lg bg-background/95 backdrop-blur-lg border-t border-border">
            <SheetHeader>
                <SheetTitle className="text-3xl text-center mb-4">{currentExercise.name}</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-y-auto px-2 pb-8">
                <div className="rounded-lg overflow-hidden h-64 md:h-auto aspect-square self-center">
                     <ExerciseImage asset={currentExercise.asset} name={currentExercise.name} alt={currentExercise.name} className="w-full h-full object-cover"/>
                </div>
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-xl text-accent mb-2">Instructions</h3>
                        <p className="text-base text-foreground/90 whitespace-pre-line">{currentExercise.instructions.summary}</p>
                    </div>
                    <Separator />
                    <div>
                       <h3 className="font-semibold text-xl text-accent mb-3">Key Points</h3>
                       <ul className="space-y-3">
                        {currentExercise.instructions.keyPoints.map((point, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <div className="w-5 h-5 flex-shrink-0 rounded-full bg-accent/20 text-accent flex items-center justify-center mt-0.5">
                                    <Check size={14}/>
                                </div>
                                <span className="text-foreground/90">{point}</span>
                            </li>
                        ))}
                       </ul>
                    </div>
                </div>
            </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

    