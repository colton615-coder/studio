
'use client';
import React, { useState, useEffect, useTransition, useMemo } from 'react';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  addDocumentNonBlocking,
} from '@/firebase';
import { collection, doc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { format, isToday, subDays } from 'date-fns';
import { getHabitFeedback } from './actions';
import * as LucideIcons from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";


const { Flame, Target, PlusCircle, Trash2, Loader2, BrainCircuit, BookOpen, GlassWater, Dumbbell, Bed, Apple, DollarSign, ClipboardCheck } = LucideIcons;
const habitIcons = { BookOpen, GlassWater, Dumbbell, Bed, Apple, DollarSign, ClipboardCheck, BrainCircuit };
type IconName = keyof typeof habitIcons;

const habitColors = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7'
];

type Frequency = {
  type: 'daily' | 'weekly';
  days: number[]; // 0-6 for Sun-Sat
}

type Habit = {
  id: string;
  name: string;
  userId: string;
  icon: IconName;
  color: string;
  frequency: Frequency;
  streak: number;
  lastCompleted?: any;
  createdAt: any;
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

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<IconName | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<Frequency>({ type: 'daily', days: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

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

  const { data: habits, isLoading: isLoadingHabits } = useCollection<Habit>(habitsCollection);
  
  const [habitHistory, setHabitHistory] = useState<DailyLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [isLoadingLog, setIsLoadingLog] = useState(true);

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
        if (!foundToday) setTodayLog(null);
        setHabitHistory(history);
      } catch (e) { console.error("Error fetching habit history:", e); }
      finally {
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

  useEffect(() => {
    if (habits && !isLoadingHistory) {
      startTransition(async () => {
        const coachInput = {
          habits: habits.map(h => ({ id: h.id, name: h.name, streak: h.streak })),
          history: habitHistory.map(l => ({ date: l.id, completions: l.log })),
        };
        const result = await getHabitFeedback(coachInput);
        if ('error' in result) setFeedback(result.error);
        else setFeedback(result.feedback);
      });
    }
  }, [habits, habitHistory, isLoadingHistory]);

  const resetModalState = () => {
    setNewHabitName('');
    setSelectedIcon(null);
    setSelectedColor(null);
    setFrequency({ type: 'daily', days: [] });
    setModalError(null);
    setIsSaving(false);
  };

  const onOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) resetModalState();
  };

  const handleAddHabit = async () => {
    if (!newHabitName.trim() || !selectedIcon || !selectedColor || !habitsCollection || !user) {
      setModalError("Please fill out all fields.");
      return;
    }
    setIsSaving(true);
    setModalError(null);
    try {
      await addDocumentNonBlocking(habitsCollection, {
        name: newHabitName,
        icon: selectedIcon,
        color: selectedColor,
        frequency,
        streak: 0,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add habit:", error);
      setModalError("Could not save habit. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleHabitToggle = async (habit: Habit & {done: boolean}) => {
    if (!user || !firestore) return;
    const habitRef = doc(firestore, 'users', user.uid, 'habits', habit.id);
    const logRef = doc(firestore, 'users', user.uid, 'habitLogs', todayStr);
    const newDoneState = !habit.done;
    let newStreak = habit.streak;
    
    const newTodayLog = {...(todayLog?.log || {}), [habit.id]: newDoneState };
    setTodayLog({id: todayStr, log: newTodayLog });

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

  const handleDeleteHabit = (id: string) => {
    if (!habitsCollection) return;
    const docRef = doc(habitsCollection, id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Habit Removed", description: "The habit has been deleted from your list." });
  };

  const getFrequencyText = (freq: Frequency) => {
    if (freq.type === 'daily') return 'Daily';
    if (freq.days.length >= 7) return 'Daily';
    if (freq.days.length === 0) return 'Weekly';
    return `${freq.days.length}x a week`;
  };

  const isSaveDisabled = isSaving || !newHabitName.trim() || !selectedIcon || !selectedColor;
  const isLoading = isLoadingHabits || isLoadingLog;

  const Icon = ({name, ...props}: {name: IconName} & React.ComponentProps<"svg">) => {
    const LucideIcon = habitIcons[name];
    return LucideIcon ? <LucideIcon {...props} /> : null;
  }

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
          <CardTitle className="flex items-center gap-2 text-accent"><BrainCircuit />AI Coach Weekly Review</CardTitle>
        </CardHeader>
        <CardContent>
          {isAnalyzing || isLoadingHistory ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>{feedback}</div>
          ) : ( <p className="text-foreground font-medium italic">"{feedback}"</p> )}
        </CardContent>
      </Card>
      <Card className="shadow-neumorphic-outset">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="text-accent" />Today's Habits</CardTitle>
          <CardDescription>Complete your habits for today to build your streak.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading && <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>}
            {!isLoading && combinedHabits?.length === 0 && (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No habits yet. Add one to get started!</p>
                <Button onClick={() => onOpenChange(true)} variant="outline" className="shadow-neumorphic-outset active:shadow-neumorphic-inset">
                  <PlusCircle className="mr-2 h-4 w-4" />Create First Habit
                </Button>
              </div>
            )}
            {combinedHabits?.map((habit) => (
              <div key={habit.id} className="flex items-center justify-between p-4 rounded-lg bg-background shadow-neumorphic-inset">
                <div className="flex items-center gap-4">
                  <Checkbox id={habit.id} checked={habit.done} onCheckedChange={() => handleHabitToggle(habit)} className="h-6 w-6 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground border-accent"/>
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${habit.color}33`, color: habit.color, border: `1px solid ${habit.color}50` }}>
                        <Icon name={habit.icon} className="h-6 w-6" />
                     </div>
                     <div>
                        <label htmlFor={habit.id} className="text-md font-medium leading-none">{habit.name}</label>
                        <p className="text-sm text-muted-foreground">{getFrequencyText(habit.frequency)}</p>
                      </div>
                  </div>
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

      <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
        <DialogContent className="shadow-neumorphic-outset bg-background border-transparent">
          <DialogHeader>
            <DialogTitle>Create a New Habit</DialogTitle>
            <DialogDescription>Personalize your new habit to make it yours.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="habit-name">Habit Name</Label>
              <Input id="habit-name" name="habit-name" autoComplete="off" value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} placeholder="e.g. Read for 20 minutes" disabled={isSaving}/>
            </div>
            <div className="space-y-2">
               <Label>Icon</Label>
               <div className="grid grid-cols-8 gap-2">
                  {Object.keys(habitIcons).map((iconName) => (
                    <Button key={iconName} variant="outline" size="icon" className={cn("h-10 w-10", selectedIcon === iconName && "ring-2 ring-ring bg-accent/20")} onClick={() => setSelectedIcon(iconName as IconName)} disabled={isSaving}>
                       <Icon name={iconName as IconName} className="h-5 w-5"/>
                    </Button>
                  ))}
               </div>
            </div>
             <div className="space-y-2">
               <Label>Color</Label>
               <div className="flex flex-wrap gap-2">
                  {habitColors.map((color) => (
                     <Button key={color} style={{backgroundColor: color}} className={cn("h-8 w-8 rounded-full border-2 border-transparent", selectedColor === color && "border-ring")} onClick={() => setSelectedColor(color)} disabled={isSaving}></Button>
                  ))}
               </div>
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select onValueChange={(value: 'daily' | 'weekly') => setFrequency({ ...frequency, type: value, days: [] })} defaultValue={frequency.type} disabled={isSaving}>
                  <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                  <SelectContent>
                     <SelectItem value="daily">Daily</SelectItem>
                     <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            {frequency.type === 'weekly' && (
              <div className="space-y-2">
                <Label>Repeat on</Label>
                <ToggleGroup type="multiple" variant="outline" value={frequency.days.map(String)} onValueChange={(days) => setFrequency({...frequency, days: days.map(Number)})} className="justify-start gap-1" disabled={isSaving}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <ToggleGroupItem key={index} value={String(index)} aria-label={`Toggle ${day}`} className="h-9 w-9 rounded-full">{day}</ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            )}
            {modalError && <p className="text-destructive text-sm text-center">{modalError}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary" className="shadow-neumorphic-outset active:shadow-neumorphic-inset" disabled={isSaving}>Cancel</Button></DialogClose>
            <Button onClick={handleAddHabit} className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground" disabled={isSaveDisabled}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSaving ? 'Saving...' : 'Save Habit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    