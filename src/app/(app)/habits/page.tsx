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
import { useToast } from '@/hooks/use-toast';

type Habit = {
  id: string;
  name: string;
  createdAt: any;
  userProfileId: string;
  lastCompleted?: any;
  streak: number;
};

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
  const { toast } = useToast();

  // --- Modal Control State ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // --- Local State for the "Add New Habit" Modal ---
  // This state is now fully controlled by the modal itself.
  const [newHabitName, setNewHabitName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // --- AI Coach State ---
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

  // This hook fetches the user's habits and updates reactively from Firestore.
  // This is now the single source of truth for the habit list.
  const { data: habits, isLoading: isLoadingHabits } = useCollection<Habit>(habitsCollection);
  
  const [habitHistory, setHabitHistory] = useState<DailyLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
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
        let foundToday = false;
        querySnapshot.forEach((doc) => {
          history.push({ id: doc.id, log: doc.data().log });
          if(doc.id === todayStr) {
            setTodayLog({ id: doc.id, log: doc.data().log });
            foundToday = true;
          }
        });
        if (!foundToday) {
            setTodayLog(null); // Reset if no log for today is found
        }
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


  const combinedHabits = useMemo(() => habits?.map(habit => ({
    ...habit,
    done: todayLog?.log?.[habit.id] ?? false
  })), [habits, todayLog]);

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
      setDocumentNonBlocking(habitRef, { streak: newStreak, lastCompleted: serverTimestamp() }, { merge: true });
    } else {
      const lastCompletedDate = habit.lastCompleted?.toDate();
      if(lastCompletedDate && isToday(lastCompletedDate)) {
        newStreak = Math.max(0, newStreak - 1);
        setDocumentNonBlocking(habitRef, { streak: newStreak }, { merge: true });
      }
    }

    const logUpdate = { log: { [habit.id]: newDoneState } };
    setDocumentNonBlocking(logRef, logUpdate, { merge: true });
  };


  /**
   * Task 2: Re-architect Modal State & Save Logic
   * This function now implements a robust, non-optimistic save flow.
   * 1. Sets a loading state (`isSaving`).
   * 2. Disables the form to prevent multiple submissions.
   * 3. Calls Firestore and waits for the operation to complete.
   * 4. On success, it closes the modal and resets the form. The UI will update via the real-time listener.
   * 5. On failure, it shows an error message inside the modal and keeps it open.
   * 6. `finally` block ensures the form is always re-enabled.
   */
  const handleAddHabit = async () => {
    if (newHabitName.trim() === '' || !habitsCollection || !user) {
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      // The `addDocumentNonBlocking` function returns a promise which we now properly await.
      await addDocumentNonBlocking(habitsCollection, {
        name: newHabitName,
        streak: 0,
        userProfileId: user.uid,
        createdAt: serverTimestamp(),
      });
      
      // On success, reset state and close the modal.
      setNewHabitName('');
      setIsDialogOpen(false);

    } catch (error) {
      console.error("Failed to add habit:", error);
      setModalError("Could not save habit. Please try again.");
    } finally {
      // Always re-enable the form.
      setIsSaving(false);
    }
  };


  const handleDeleteHabit = (id: string) => {
    if (!habitsCollection) return;
    const docRef = doc(habitsCollection, id);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Habit Removed",
        description: "The habit has been deleted from your list."
    })
  };

  // Resets modal state when it's opened or closed
  const onOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
        setNewHabitName('');
        setModalError(null);
        setIsSaving(false);
    }
  }
  
  const isLoading = isLoadingHabits || isLoadingLog;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline text-foreground">Habit Tracker</h1>
          <p className="text-muted-foreground mt-2">Log your daily habits and watch your streaks grow.</p>
        </div>
        <Button onClick={() => onOpenChange(true)} className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">
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
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No habits yet. Add one to get started!</p>
                <Button onClick={() => onOpenChange(true)} variant="outline" className="shadow-neumorphic-outset active:shadow-neumorphic-inset">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create First Habit
                </Button>
              </div>
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

      {/* --- Add Habit Dialog --- */}
      {/* The open and onOpenChange props now fully control the dialog's visibility */}
      <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
        <DialogContent className="shadow-neumorphic-outset bg-background border-transparent">
          <DialogHeader>
            <DialogTitle>Add a New Habit</DialogTitle>
            <DialogDescription>
              What new habit do you want to start tracking?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              {/* Task 1 Fix: Label now points to the semantic ID 'new-habit-name' */}
              <Label htmlFor="new-habit-name" className="text-right">
                Habit
              </Label>
              {/* Task 1 Fix: `id`, `name`, and `autoComplete` attributes are set to prevent autofill bug. */}
              <Input
                id="new-habit-name"
                name="new-habit-name"
                autoComplete="off"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Read for 20 minutes"
                disabled={isSaving}
              />
            </div>
            {modalError && (
                <p className="text-destructive text-sm text-center col-span-4">{modalError}</p>
            )}
          </div>
          <DialogFooter>
            {/* Task 2 Fix: Cancel button is disabled during save operation */}
            <DialogClose asChild>
                <Button type="button" variant="secondary" className="shadow-neumorphic-outset active:shadow-neumorphic-inset" disabled={isSaving}>Cancel</Button>
            </DialogClose>
            {/* Task 2 Fix: Save button is disabled during save and shows a loading state */}
            <Button 
                onClick={handleAddHabit} 
                className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground"
                disabled={isSaving || newHabitName.trim() === ''}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSaving ? 'Saving...' : 'Save Habit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    