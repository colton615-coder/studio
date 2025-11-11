'use client'
import { useRouter } from 'next/navigation';
import type { WorkoutPlan } from '@/ai/flows/workout-generator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CalendarPlus, BookHeart, PartyPopper, Clock, Flame, Zap, Trophy, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, serverTimestamp } from 'firebase/firestore';
import { saveWorkoutHistory } from './actions';
import { useEffect, useState } from 'react';

interface WorkoutSummaryProps {
  workout: WorkoutPlan;
  completedCount: number;
  onDone: () => void;
}

export function WorkoutSummary({ workout, completedCount, onDone }: WorkoutSummaryProps) {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [historySaved, setHistorySaved] = useState(false);

  const totalExercises = workout.exercises.length;
  const totalTime = workout.exercises.reduce((acc, ex) => acc + (ex.duration ?? 0), 0);
  const estimatedCalories = Math.round((totalTime / 60) * 8); // Simple estimation

  const { toast } = useToast();

  // Save workout history on mount
  useEffect(() => {
    if (user && !historySaved) {
      saveWorkoutHistory(
        user.uid,
        workout.name,
        workout.focus,
        workout.exercises,
        totalTime
      )
        .then((id) => {
          console.log('Workout history saved with ID:', id);
          setHistorySaved(true);
        })
        .catch((error) => {
          console.error('Failed to save workout history:', error);
        });
    }
  }, [user, historySaved, workout, totalTime]);

  const handleAddToCalendar = async () => {
    if (!user || !firestore) {
      toast({
        title: "Error",
        description: "You must be logged in to add events to calendar",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const eventsCollection = collection(firestore, 'users', user.uid, 'calendarEvents');
      await addDocumentNonBlocking(eventsCollection, {
        userProfileId: user.uid,
        title: `Workout: ${workout.name}`,
        description: `Completed ${completedCount}/${totalExercises} exercises.`,
        startDate: new Date(),
        endDate: new Date(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      toast({
        title: "Success",
        description: "Workout added to calendar"
      });
      
      router.push('/calendar');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add workout to calendar",
        variant: "destructive"
      });
    }
  };

  const handleJournal = () => {
    const workoutSummary = {
      name: workout.name,
      completed: completedCount,
      total: totalExercises,
      duration: totalTime,
      calories: estimatedCalories,
      date: new Date().toISOString()
    };
    router.push(`/ai-knox?context=${encodeURIComponent(JSON.stringify(workoutSummary))}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 text-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-600/20 flex items-center justify-center mb-4 shadow-neumorphic-outset border-2 border-green-500/30"
            >
              <PartyPopper size={48} className="text-green-500" />
            </motion.div>
            <h1 className="text-5xl font-bold font-headline bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">Workout Complete!</h1>
            <p className="text-muted-foreground max-w-sm text-lg">
                Great job finishing the <span className="font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">{workout.name}</span> workout.
            </p>
        </motion.div>

      {/* Animated Gradient Stat Cards */}
      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-neumorphic-outset hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2 justify-center">
                <Clock className="h-4 w-4 text-purple-500" />
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex flex-col items-center gap-1">
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
                  {Math.ceil(totalTime / 60)}
                </p>
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-neumorphic-outset hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2 justify-center">
                <Trophy className="h-4 w-4 text-blue-500" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex flex-col items-center gap-1">
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                  {completedCount}<span className="text-2xl">/{totalExercises}</span>
                </p>
                <span className="text-sm text-muted-foreground">exercises</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-neumorphic-outset hover:scale-105 transition-all duration-300 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2 justify-center">
                <Zap className="h-4 w-4 text-green-500" />
                Burned
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex flex-col items-center gap-1">
                <p className="text-4xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                  {estimatedCalories}
                </p>
                <span className="text-sm text-muted-foreground">calories</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

       <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.6 }}
         className="w-full max-w-2xl space-y-3"
       >
            <p className="text-sm font-semibold text-muted-foreground mb-3">What's next?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={handleAddToCalendar} 
                variant="outline" 
                className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset hover:scale-105 transition-all bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20 hover:border-blue-500/40"
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                Add to Calendar
              </Button>
              <Button 
                onClick={handleJournal} 
                variant="outline" 
                className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset hover:scale-105 transition-all bg-gradient-to-r from-purple-500/5 to-pink-500/5 border-purple-500/20 hover:border-purple-500/40"
              >
                <BookHeart className="mr-2 h-4 w-4" />
                How do you feel? (Journal)
              </Button>
            </div>
       </motion.div>
      
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.7 }}
         className="w-full max-w-2xl"
       >
         <Button 
           onClick={onDone} 
           className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset hover:scale-105 transition-all bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg h-12"
         >
              Done
         </Button>
       </motion.div>
    </div>
  );
}

    