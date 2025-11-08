'use client';
import { useState, useEffect, useTransition } from 'react';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  addDocumentNonBlocking,
} from '@/firebase';
import { collection, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { format, isToday } from 'date-fns';
import { getHabitFeedback } from './actions';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Flame, Target, PlusCircle, Trash2, Loader2, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Matches the Habit entity, but 'id' will be added by the useCollection hook
type Habit = {
  id: string;
  name: string;
  createdAt: any; // Firestore Timestamp
  userProfileId: string;
  // Last completion date to check for streaks
  lastCompleted?: any; // Firestore Timestamp
  streak: number;
};

type HabitCompletionLog = {
  [date: string]: boolean;
};

// Represents the daily log document for all habits
type DailyLog = {
  id?: string; // Will be 'completions'
  log: HabitCompletionLog;
};

export default function HabitsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [feedback, setFeedback] = useState('Analyzing your performance...');
  const [isAnalyzing, startTransition] = useTransition();

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const habitsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'habits');
  }, [user, firestore]);
  
  const habitLogDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'habitLogs', todayStr);
  }, [user, firestore, todayStr]);

  const { data: habits, isLoading: isLoadingHabits } = useCollection<Habit>(habitsCollection);
  const { data: dailyLog, isLoading: isLoadingLog } = useDoc<DailyLog>(habitLogDocRef);

  const isLoading = isLoadingHabits || isLoadingLog;

  const combinedHabits = habits?.map(habit => ({
    ...habit,
    done: dailyLog?.log?.[habit.id] ?? false
  }));

  // Effect to fetch AI feedback
  useEffect(() => {
    if (combinedHabits) {
      startTransition(async () => {
        const result = await getHabitFeedback(combinedHabits);
        if ('error' in result) {
          setFeedback(result.error);
        } else {
          setFeedback(result.feedback);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, dailyLog]);


  const handleHabitToggle = async (habit: Habit & {done: boolean}) => {
    if (!user || !firestore) return;
    
    const habitRef = doc(firestore, 'users', user.uid, 'habits', habit.id);
    const todayLogRef = doc(firestore, 'users', user.uid, 'habitLogs', todayStr);

    const newDoneState = !habit.done;
    let newStreak = habit.streak;

    if (newDoneState) { // If completing the habit
      const lastCompletedDate = habit.lastCompleted?.toDate();
      if (!lastCompletedDate || !isToday(lastCompletedDate)) {
        newStreak = newStreak + 1;
      }
      // Update the habit doc with new streak and completion date
       setDocumentNonBlocking(habitRef, { streak: newStreak, lastCompleted: serverTimestamp() }, { merge: true });
    } else { // If un-completing the habit
      const lastCompletedDate = habit.lastCompleted?.toDate();
      // Only decrement streak if it was completed today
      if(lastCompletedDate && isToday(lastCompletedDate)) {
        newStreak = Math.max(0, newStreak - 1);
        // We can't know the "previous" lastCompleted date, so we'll leave it.
        // A more complex system would store history.
        setDocumentNonBlocking(habitRef, { streak: newStreak }, { merge: true });
      }
    }

    // Update the daily log
    const logUpdate = { [`log.${habit.id}`]: newDoneState };
    // We use set with merge to create the doc if it doesn't exist
    setDocumentNonBlocking(todayLogRef, logUpdate, { merge: true });
  };


  const handleAddHabit = () => {
    if (newHabitName.trim() && habitsCollection && user) {
      addDocumentNonBlocking(habitsCollection, {
        name: newHabitName,
        streak: 0,
        userProfileId: user.uid,
        createdAt: serverTimestamp(),
      });
      setNewHabitName('');
      setIsDialogOpen(false);
    }
  };

  const handleDeleteHabit = (id: string) => {
    if (!habitsCollection) return;
    const docRef = doc(habitsCollection, id);
    deleteDocumentNonBlocking(docRef);
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline text-foreground">Habit Tracker</h1>
          <p className="text-muted-foreground mt-2">Log your daily habits and watch your streaks grow.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Habit
        </Button>
      </header>

      <Card className="shadow-neumorphic-outset">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-accent">
            <BrainCircuit />
            AI Coach
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAnalyzing ? (
             <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin"/>
              {feedback}
            </div>
          ) : (
            <p className="text-foreground font-medium italic">"{feedback}"</p>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-neumorphic-outset">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="text-accent" />
            Today's Habits
          </CardTitle>
          <CardDescription>Last reset your habits streaks will be reset.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading && (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            )}
            {!isLoading && combinedHabits?.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No habits yet. Add one to get started!</p>
            )}
            {combinedHabits?.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between p-4 rounded-lg bg-background shadow-neumorphic-inset"
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    id={habit.id}
                    checked={habit.done}
                    onCheckedChange={() => handleHabitToggle(habit)}
                    className="h-6 w-6 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground border-accent"
                  />
                  <label
                    htmlFor={habit.id}
                    className="text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {habit.name}
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-accent">
                    <Flame className="h-5 w-5" />
                    <span className="font-semibold text-lg">{habit.streak}</span>
                  </div>
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteHabit(habit.id)}>
                      <Trash2 size={16}/>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="shadow-neumorphic-outset bg-background border-transparent">
          <DialogHeader>
            <DialogTitle>Add a New Habit</DialogTitle>
            <DialogDescription>
              What new habit do you want to start tracking?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="habit-name" className="text-right">
                Habit
              </Label>
              <Input
                id="habit-name"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Read for 20 minutes"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary" className="shadow-neumorphic-outset active:shadow-neumorphic-inset">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddHabit} className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">Save Habit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
