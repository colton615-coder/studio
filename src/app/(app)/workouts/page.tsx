'use client';
import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, PlayCircle, Clock, Loader2, Wand2, ArrowLeft, BarChart3, Flame, Target, Wind } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { getWorkoutPlan } from './actions';
import type { WorkoutPlan } from '@/ai/flows/workout-generator';
import { useToast } from '@/hooks/use-toast';
import { ActiveWorkout } from './ActiveWorkout';
import { WorkoutSummary } from './WorkoutSummary';
import { ExerciseImage } from '@/components/ui/ExerciseImage';
import { AICoPilotThinking } from '@/components/ui/ai-copilot-thinking';

type WorkoutScreen = 'generator' | 'lobby' | 'active' | 'summary';

const AI_WORKOUT_STEPS = [
  "Analyzing your request...",
  "Selecting optimal warm-up exercises...",
  "Constructing main workout sets...",
  "Integrating rest periods...",
  "Choosing cool-down stretches...",
  "Finalizing your personalized plan..."
];

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
      const result = await getWorkoutPlan(prompt);
      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: 'Error Generating Workout',
          description: result.error,
        });
        setWorkout(null);
      } else {
        setWorkout(result);
      }
    });
  };

  const handleAiComplete = () => {
      if (workout) {
          setScreen('lobby');
      }
  }

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
    // We filter out rep-based exercises from the total time calculation
    const totalSeconds = exercises.reduce((acc, ex) => acc + (ex.type === 'time' ? ex.duration || 0 : 0), 0);
    return Math.ceil(totalSeconds / 60);
  };

  const getCategoryColor = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('warm')) return { bg: 'from-orange-500/20 to-amber-500/10', border: 'border-orange-500/30', text: 'text-orange-500', icon: Flame };
    if (lowerCategory.includes('cool') || lowerCategory.includes('stretch')) return { bg: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/30', text: 'text-blue-500', icon: Wind };
    if (lowerCategory.includes('rest')) return { bg: 'from-purple-500/20 to-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500', icon: Clock };
    return { bg: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/30', text: 'text-green-500', icon: Target };
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

      <header className="flex items-start justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-bold font-headline bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">AI Workout Generator</h1>
          <p className="text-muted-foreground mt-2 text-lg">Describe the workout you want, and let AI build the perfect plan for you.</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/workouts/stats">
            <Button variant="outline" className="shadow-neumorphic-outset hover:scale-105 transition-all bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 hover:border-blue-500/50">
              <BarChart3 className="mr-2 h-4 w-4" />
              Stats
            </Button>
          </Link>
        </motion.div>
      </header>

      {screen === 'generator' && (
        <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-neumorphic-outset bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-blue-500" />
                Workout Prompt
              </CardTitle>
              <CardDescription className="text-base">
                Examples: "A 20 minute core workout", "Full body strength, 45 minutes", "A quick 10 minute cardio session"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateWorkout} className="flex flex-col sm:flex-row items-center gap-4">
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Tell the AI what workout you need..."
                  className="flex-grow shadow-neumorphic-inset"
                  disabled={isPending}
                />
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto shadow-neumorphic-outset active:shadow-neumorphic-inset bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all hover:scale-105" 
                  disabled={isPending || !prompt.trim()}
                >
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
        </motion.div>
        
        {isPending && (
            <AICoPilotThinking steps={AI_WORKOUT_STEPS} onComplete={handleAiComplete} durationPerStep={1500}/>
        )}
        </>
      )}
      
      {screen === 'lobby' && workout && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="shadow-neumorphic-outset flex flex-col bg-gradient-to-br from-blue-500/5 to-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Dumbbell className="text-white h-6 w-6"/>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">{workout.name}</span>
                  <span className="text-sm text-muted-foreground font-normal">{workout.focus}</span>
                </div>
              </CardTitle>
              <CardDescription className="flex items-center gap-2 pt-2">
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                  <Clock className="h-3 w-3 mr-1"/>
                  {calculateTotalTime(workout.exercises)} min
                </Badge>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                  {workout.exercises.length} exercises
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
               <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {workout.exercises.map((ex, index) => {
                  const categoryStyle = getCategoryColor(ex.category);
                  const CategoryIcon = categoryStyle.icon;
                  return (
                    <motion.div
                      key={`${ex.id}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                    >
                      <Card className={cn("flex items-center gap-4 p-3 bg-gradient-to-r shadow-neumorphic-inset hover:shadow-neumorphic-outset transition-all", categoryStyle.bg, categoryStyle.border, "border")}>
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0 shadow-lg">
                          <ExerciseImage
                            asset={ex.asset}
                            name={ex.name}
                            alt={ex.name}
                            className="w-full h-full"
                          />
                        </div>
                        <div className="flex-grow">
                          <p className="font-semibold text-foreground">{ex.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className={cn("text-xs", categoryStyle.bg, categoryStyle.text)}>
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {ex.category}
                            </Badge>
                            {ex.sets && <span className="text-xs text-muted-foreground">Set {ex.sets}</span>}
                          </div>
                        </div>
                        <span className={cn("text-xl font-bold", categoryStyle.text)}>
                          {ex.type === 'time' ? `${ex.duration}s` : `${ex.reps}`}
                        </span>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => setScreen('active')} 
                className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg h-14 transition-all hover:scale-105"
              >
                <PlayCircle className="mr-2 h-6 w-6" />
                Start Workout
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
