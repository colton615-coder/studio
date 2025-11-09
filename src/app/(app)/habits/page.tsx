'use client';
import { useState, useEffect, useTransition, useMemo } from 'react';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  addDocumentNonBlocking,
  useDoc,
} from '@/firebase';
import { collection, doc, serverTimestamp, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { format, isToday, subDays } from 'date-fns';
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
import type { HabitCoachInput } from '@/ai/flows/habit-coach';

type Habit = {
  id: string;
  name: string;
  createdAt: any;
  userProfileId: string;
  lastCompleted?: any;
  streak: number;
};

// This represents the structure of a document in the 'habitLogs' collection.
// The document ID is the date string 'YYYY-MM-DD'.
type HabitCompletionLog = {
  [habitId: string]: boolean;
};

type DailyLog = {
  id: string; // YYYY-MM-DD
  log: HabitCompletionLog;
};

export default function HabitsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [feedback, setFeedback] = useState('Analyzing your weekly performance...');
  const [isAnalyzing, startTransition] = useTransition();

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const habitsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'habits');
  }, [user, firestore]);

  const habitLogsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'habitLogs');
  }, [user, firestore]);

  // This hook fetches the user's habits.
  const { data: habits, isLoading: isLoadingHabits } = useCollection<Habit>(habitsCollection);
  
  // This state stores the completion history for the last 7 days.
  const [habitHistory, setHabitHistory] = useState<DailyLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  // This state stores only today's log for quick UI updates.
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [isLoadingLog, setIsLoadingLog] = useState(true);

  // Effect to fetch last 7 days of history, including today.
  useEffect(() => {
    if (!habitLogsCollection) return;

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      setIsLoadingLog(true);
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const q = query(habitLogsCollection, where('__name__', '>=', sevenDaysAgo));
      
      try {
        const querySnapshot = await getDocs(q);
        const history: DailyLog[] = [];
        querySnapshot.forEach((doc) => {
          history.push({ id: doc.id, log: doc.data().log });
          if(doc.id === todayStr) {
            setTodayLog({ id: doc.id, log: doc.data().log });
          }
        });
        setHabitHistory(history);
      } catch (e) {
        console.error("Error fetching habit history:", e);
      } finally {
        setIsLoadingHistory(false);
        setIsLoadingLog(false);
      }
    };

    fetchHistory();
  }, [habitLogsCollection, todayStr]);


  const combinedHabits = habits?.map(habit => ({
    ...habit,
    done: todayLog?.log?.[habit.id] ?? false
  }));

  // Effect to fetch AI feedback. This runs when habits or their history change.
  useEffect(() => {
    if (habits && !isLoadingHistory) {
      startTransition(async () => {
        const coachInput: HabitCoachInput = {
          habits: habits.map(h => ({ id: h.id, name: h.name, streak: h.streak })),
          history: habitHistory.map(l => ({ date: l.id, completions: l.log })),
        };
        const result = await getHabitFeedback(coachInput);
        if ('error' in result) {
          setFeedback(result.error);
        } else {
          setFeedback(result.feedback);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, habitHistory, isLoadingHistory]);


  const handleHabitToggle = async (habit: Habit & {done: boolean}) => {
    if (!user || !firestore) return;
    
    const habitRef = doc(firestore, 'users', user.uid, 'habits', habit.id);
    const logRef = doc(firestore, 'users', user.uid, 'habitLogs', todayStr);

    const newDoneState = !habit.done;
    let newStreak = habit.streak;
    
    // Optimistically update the UI for a faster user experience.
    const newTodayLog = {...(todayLog?.log || {}), [habit.id]: newDoneState };
    setTodayLog({id: todayStr, log: newTodayLog });

    // Update streak logic.
    if (newDoneState) {
      const lastCompletedDate = habit.lastCompleted?.toDate();
      if (!lastCompletedDate || !isToday(lastCompletedDate)) {
        newStreak = newStreak + 1;
      }
      // Update the habit document with the new streak and completion date.
      setDocumentNonBlocking(habitRef, { streak: newStreak, lastCompleted: serverTimestamp() }, { merge: true });
    } else {
      const lastCompletedDate = habit.lastCompleted?.toDate();
      if(lastCompletedDate && isToday(lastCompletedDate)) {
        newStreak = Math.max(0, newStreak - 1);
        // Only update the streak, don't touch the lastCompleted date.
        setDocumentNonBlocking(habitRef, { streak: newStreak }, { merge: true });
      }
    }

    // Update the daily log document.
    const logUpdate = { log: { [habit.id]: newDoneState } };
    setDocumentNonBlocking(logRef, logUpdate, { merge: true });
  };


  const handleAddHabit = () => {
    if (newHabitName.trim() && habitsCollection && user) {
      return addDocumentNonBlocking(habitsCollection, {
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
    return deleteDocumentNonBlocking(docRef);
    // Note: This doesn't clean up historical logs, which is acceptable for now.
  };
  
  const isLoading = isLoadingHabits || isLoadingLog;

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
            AI Coach Weekly Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAnalyzing || isLoadingHistory ? (
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
          <CardDescription>Complete your habits for today to build your streak.</CardDescription>
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
