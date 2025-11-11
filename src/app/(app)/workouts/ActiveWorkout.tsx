'use client';
import { useState, useEffect } from 'react';
import type { WorkoutPlan, ClientExercise } from '@/ai/flows/workout-generator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PauseCircle, PlayCircle, SkipForward, XCircle, Info, Check, Trophy, Flame, Target, Wind, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
      setTimeLeft((prev: number) => prev - 1);
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

  const getCategoryColor = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('warm')) return { gradient: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/20', text: 'text-orange-500', color: 'rgb(249, 115, 22)', icon: Flame };
    if (lowerCategory.includes('cool') || lowerCategory.includes('stretch')) return { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/20', text: 'text-blue-500', color: 'rgb(59, 130, 246)', icon: Wind };
    if (lowerCategory.includes('rest')) return { gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-500/20', text: 'text-purple-500', color: 'rgb(168, 85, 247)', icon: Clock };
    return { gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-500/20', text: 'text-green-500', color: 'rgb(34, 197, 94)', icon: Target };
  };

  const categoryStyle = getCategoryColor(currentExercise.category);
  const CategoryIcon = categoryStyle.icon;

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
          {/* Workout Progress Ring with Gradient */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex items-center justify-center gap-2"
          >
            <div className="relative">
              <div className="relative inline-flex items-center justify-center">
                <CircularProgress 
                  value={workoutProgress} 
                  size={50} 
                  strokeWidth={4}
                  color={categoryStyle.color}
                />
                <span className="absolute text-xs font-bold">{currentExerciseIndex + 1}/{workout.exercises.length}</span>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-between items-center w-full max-w-md">
            <div className="flex-1 text-left">
                 <Badge className={cn("shadow-lg", categoryStyle.bg, categoryStyle.text, "border border-current/30")}>
                   <CategoryIcon className="h-3 w-3 mr-1" />
                   {currentExercise.category}
                 </Badge>
                 {isRepBased && currentExercise.sets && <p className="text-xs font-bold text-muted-foreground text-shadow mt-1">Set {currentExercise.sets}</p>}
            </div>
            <motion.h1 
              key={currentExerciseIndex}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("text-4xl sm:text-5xl font-bold font-headline text-shadow-lg text-center flex-shrink-0 mx-4 bg-gradient-to-r bg-clip-text text-transparent", categoryStyle.gradient)}
            >
              {currentExercise.name}
            </motion.h1>
            <div className="flex-1 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Show exercise instructions"
                  tabIndex={0}
                  onClick={() => setIsInstructionsSheetOpen(true)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setIsInstructionsSheetOpen(true); }}
                  className="hover:scale-110 transition-transform"
                >
                  <Info className={cn(categoryStyle.text)}/>
                </Button>
            </div>
          </div>
        </header>

        {isRepBased ? (
            <motion.div 
              key={currentExerciseIndex}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative flex flex-col items-center justify-center my-8"
            >
                <div className={cn("font-mono text-9xl font-bold text-shadow-lg bg-gradient-to-r bg-clip-text text-transparent", categoryStyle.gradient)}>
                    {currentExercise.reps}
                </div>
                 <span className="text-5xl ml-2 text-muted-foreground font-bold text-shadow-lg">Reps</span>
            </motion.div>
        ) : (
            <div className="relative flex items-center justify-center my-8">
                <svg className="w-72 h-72 sm:w-96 sm:h-96 transform -rotate-90">
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" className={categoryStyle.gradient.split(' ')[0].replace('from-', '')} stopColor="currentColor" />
                        <stop offset="100%" className={categoryStyle.gradient.split(' ')[2].replace('to-', '')} stopColor="currentColor" />
                      </linearGradient>
                    </defs>
                    <circle cx="50%" cy="50%" r="140" stroke="hsl(var(--muted) / 0.2)" strokeWidth="12" fill="transparent" className="sm:r-[180px]" />
                    <circle cx="50%" cy="50%" r="140" stroke="url(#progressGradient)" strokeWidth="12" fill="transparent"
                        strokeDasharray={2 * Math.PI * 140} strokeDashoffset={(2 * Math.PI * 140) * (1 - (timerProgress / 100))}
                        className={cn("transition-all duration-1000 ease-linear sm:r-[180px] stroke-current", categoryStyle.text)} style={{ strokeLinecap: 'round' }} />
                </svg>
                <motion.div 
                  key={timeLeft}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className={cn("absolute font-mono text-9xl font-bold text-shadow-lg bg-gradient-to-r bg-clip-text text-transparent", categoryStyle.gradient)}
                >
                  {timeLeft}
                </motion.div>
            </div>
        )}

        <div className="w-full max-w-md px-4 space-y-4">
          <motion.div
            key={`next-${currentExerciseIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-background/60 backdrop-blur-sm shadow-neumorphic-outset border-2 border-current/20" style={{ borderColor: nextExercise ? getCategoryColor(nextExercise.category).text.replace('text-', '') : 'transparent' }}>
              <CardHeader className="flex-row items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0 shadow-lg">
                    {nextExercise ? (
                       <ExerciseImage asset={nextExercise.asset} name={nextExercise.name} alt={nextExercise.name} className="w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs" role="status" aria-label="End of workout">END</div>
                    )}
                  </div>
                  <div>
                      <CardTitle className="text-xs text-left text-muted-foreground text-shadow">Next Up</CardTitle>
                      <CardDescription className="text-base text-left font-semibold text-foreground text-shadow">
                          {nextExercise ? nextExercise.name : 'Final Exercise!'}
                      </CardDescription>
                      {nextExercise && (
                        <Badge className={cn("mt-1 text-xs", getCategoryColor(nextExercise.category).bg, getCategoryColor(nextExercise.category).text)}>
                          {nextExercise.category}
                        </Badge>
                      )}
                  </div>
                </div>
                 {nextExercise && <span className={cn("text-xl font-bold text-shadow", getCategoryColor(nextExercise.category).text)}>{nextExercise.duration ? `${nextExercise.duration}s` : `${nextExercise.reps}`}</span>}
              </CardHeader>
            </Card>
          </motion.div>
          
          {isRepBased ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleCompleteSet}
                  size="lg"
                  aria-label="Complete set"
                  tabIndex={0}
                  className={cn("shadow-neumorphic-outset active:shadow-neumorphic-inset w-full h-16 text-lg text-white focus:outline focus:outline-2 transition-all bg-gradient-to-r", categoryStyle.gradient, "hover:shadow-lg")}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleCompleteSet(); }}
                >
                  <Check />
                  <span className="ml-2">Complete Set</span>
                </Button>
              </motion.div>
          ) : (
            <div className="flex justify-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handlePause}
                    size="lg"
                    aria-label="Pause workout"
                    tabIndex={0}
                    className="shadow-neumorphic-outset active:shadow-neumorphic-inset w-32 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 text-foreground border border-yellow-500/30 focus:outline focus:outline-2 focus:outline-accent transition-all"
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handlePause(); }}
                  >
                    <PauseCircle />
                    <span className="ml-2">Pause</span>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleSkip}
                    size="lg"
                    variant="outline"
                    aria-label="Skip exercise"
                    tabIndex={0}
                    className="shadow-neumorphic-outset active:shadow-neumorphic-inset w-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 hover:border-blue-500/50 focus:outline focus:outline-2 focus:outline-accent transition-all"
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleSkip(); }}
                  >
                    <SkipForward />
                    <span className="ml-2">Skip</span>
                  </Button>
                </motion.div>
            </div>
          )}
        </div>
      </div>
      
       <Dialog open={isPauseModalOpen} onOpenChange={(open) => !open && handleResume()}>
        <DialogContent
          open={isPauseModalOpen}
          className="shadow-neumorphic-outset bg-background border-transparent"
          hideCloseButton
          role="dialog"
          aria-modal="true"
          aria-label="Workout paused dialog"
          tabIndex={-1}
        >
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-2xl">Workout Paused</DialogTitle>
            <DialogDescription>Take a breather. Ready to get back to it?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
            <Button
              onClick={handleResume}
              aria-label="Resume workout"
              tabIndex={0}
              className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground focus:outline focus:outline-2 focus:outline-accent"
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleResume(); }}
            >
              <PlayCircle className="mr-2 h-4 w-4" />Resume Workout
            </Button>
            <Button
              onClick={handleEndWorkout}
              variant="destructive"
              aria-label="End workout"
              tabIndex={0}
              className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset focus:outline focus:outline-2 focus:outline-accent"
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleEndWorkout(); }}
            >
              <XCircle className="mr-2 h-4 w-4" />End Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Sheet open={isInstructionsSheetOpen} onOpenChange={setIsInstructionsSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-4/5 rounded-t-lg bg-background/95 backdrop-blur-lg border-t border-border"
          role="dialog"
          aria-modal="true"
          aria-label="Exercise instructions sheet"
          tabIndex={-1}
        >
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
                        {currentExercise.instructions.keyPoints.map((point: string, index: number) => (
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

    