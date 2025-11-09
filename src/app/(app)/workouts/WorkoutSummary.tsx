'use client'
import { useRouter } from 'next/navigation';
import type { WorkoutPlan } from '@/ai/flows/workout-generator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CalendarPlus, BookHeart, PartyPopper } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';

interface WorkoutSummaryProps {
  workout: WorkoutPlan;
  completedCount: number;
  onDone: () => void;
}

export function WorkoutSummary({ workout, completedCount, onDone }: WorkoutSummaryProps) {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const totalExercises = workout.exercises.length;
  const totalTime = workout.exercises.reduce((acc, ex) => acc + ex.duration, 0);
  const estimatedCalories = Math.round((totalTime / 60) * 8); // Simple estimation

  const handleAddToCalendar = () => {
    if (!user || !firestore) return;
    const eventsCollection = collection(firestore, 'users', user.uid, 'calendarEvents');
    addDocumentNonBlocking(eventsCollection, {
      userProfileId: user.uid,
      title: `Workout: ${workout.name}`,
      description: `Completed ${completedCount}/${totalExercises} exercises.`,
      startDate: new Date(),
      endDate: new Date(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // Consider adding a toast notification here
    router.push('/calendar');
  };

  const handleJournal = () => {
    // This assumes you have a way to pass a prompt or context to the journal/vault page.
    // For now, we just navigate. A more advanced implementation might use query params.
    router.push('/ai-knox');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 text-center p-4">
        <div className="flex flex-col items-center gap-4">
            <div className="h-24 w-24 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mb-4 shadow-neumorphic-inset">
              <PartyPopper size={48} />
            </div>
            <h1 className="text-4xl font-bold font-headline text-foreground">Workout Complete!</h1>
            <p className="text-muted-foreground max-w-sm">
                Great job finishing the <span className="font-semibold text-accent">{workout.name}</span> workout.
            </p>
        </div>

      <Card className="w-full max-w-md shadow-neumorphic-outset">
        <CardHeader>
          <CardTitle>Your Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col p-4 bg-background rounded-lg shadow-neumorphic-inset">
            <span className="text-2xl font-bold">{Math.ceil(totalTime / 60)}</span>
            <span className="text-xs text-muted-foreground">Minutes</span>
          </div>
           <div className="flex flex-col p-4 bg-background rounded-lg shadow-neumorphic-inset">
            <span className="text-2xl font-bold">{completedCount}/{totalExercises}</span>
            <span className="text-xs text-muted-foreground">Exercises</span>
          </div>
           <div className="flex flex-col p-4 bg-background rounded-lg shadow-neumorphic-inset">
            <span className="text-2xl font-bold">~{estimatedCalories}</span>
            <span className="text-xs text-muted-foreground">Est. Calories</span>
          </div>
        </CardContent>
      </Card>

       <div className="w-full max-w-md space-y-2">
            <p className="text-sm text-muted-foreground">What's next?</p>
            <Button onClick={handleAddToCalendar} variant="outline" className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Add to Calendar
            </Button>
            <Button onClick={handleJournal} variant="outline" className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset">
              <BookHeart className="mr-2 h-4 w-4" />
              How do you feel? (Journal)
            </Button>
       </div>
      
       <Button onClick={onDone} className="w-full max-w-md shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">
            Done
       </Button>
    </div>
  );
}

    