// This component has been significantly refactored for Step 3 to include
// the Proactive and Interactive AI Coach features.
//
// Key Architectural Changes:
// 1.  State Management: New state variables `proactiveSuggestions`, `interactiveSuggestion`,
//     and `isAiLoading` are introduced to manage the AI-generated data and loading states.
// 2.  AI Integration Hooks:
//     - A `useEffect` hook is added to the `Dialog` component's `onOpenChange` handler. When the
//       modal opens, it triggers `handleProactiveSuggestions` to fetch suggestions based on the
//       user's journal.
//     - The `useDebouncedCallback` hook from `use-debounce` is used to trigger
//       `handleInteractiveSuggestion` as the user types, providing real-time refinement.
// 3.  Component Logic:
//     - `handleProactiveSuggestions`: Fetches recent journal entries from Firestore, calls the
//       `fetchProactiveSuggestions` server action, and populates the state.
//     - `handleInteractiveSuggestion`: Takes the current input value, calls the
//       `fetchInteractiveSuggestion` server action, and updates the state.
//     - `handleSuggestionClick`: A new handler that takes a suggested habit object and uses
//       the form's `setValue` function to pre-fill the entire "Add Habit" form, connecting
//       the AI suggestion directly to the user's workflow.
// 4.  UI Enhancements in Modal:
//     - A dedicated section for "AI Suggestions" is added.
//     - It displays a loading skeleton (`AiLoadingSkeleton`) while the proactive suggestions are being fetched.
//     - Proactive suggestions are rendered as clickable `SuggestionPill` components.
//     - The interactive suggestion is rendered as a `SuggestionPill` directly below the input field.
// 5.  Silent Error Handling: All AI-related fetch calls are wrapped in try/catch blocks that
//     fail silently (by not setting state or showing an error toast), ensuring the user can
//     always add a habit manually even if the AI is unavailable.

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
import { collection, doc, serverTimestamp, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { format, isToday, subDays } from 'date-fns';
import { getHabitFeedback, fetchProactiveSuggestions, fetchInteractiveSuggestion } from './actions';
import * as LucideIcons from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { useDebouncedCallback } from 'use-debounce';


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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';


const { Flame, Target, PlusCircle, Trash2, Loader2, BrainCircuit, BookOpen, GlassWater, Dumbbell, Bed, Apple, DollarSign, ClipboardCheck, Sparkles, Wand2 } = LucideIcons;
const habitIcons = { BookOpen, GlassWater, Dumbbell, Bed, Apple, DollarSign, ClipboardCheck, BrainCircuit };
type IconName = keyof typeof habitIcons;

const habitColors = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7'
];

type Frequency = {
  type: 'daily' | 'weekly';
  days: number[];
};

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

// This type represents the AI-suggested habit object.
// It's a partial habit, as it doesn't have an ID, userId, etc.
type HabitSuggestion = Omit<Habit, 'id' | 'userId' | 'streak' | 'lastCompleted' | 'createdAt'>;

type JournalEntry = {
  id: string;
  content: string;
}

type HabitCompletionLog = {
  [habitId: string]: boolean;
};

type DailyLog = {
  id: string; // YYYY-MM-DD
  log: HabitCompletionLog;
};

// Type for the form data
type HabitFormData = {
  name: string;
  icon: IconName;
  color: string;
  frequency: Frequency;
};

export default function HabitsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [feedback, setFeedback] = useState('Analyzing your weekly performance...');
  const [isAnalyzing, startTransition] = useTransition();

  // State for AI suggestions
  const [proactiveSuggestions, setProactiveSuggestions] = useState<HabitSuggestion[]>([]);
  const [interactiveSuggestion, setInteractiveSuggestion] = useState<HabitSuggestion | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);


  const { control, handleSubmit, watch, setValue, reset } = useForm<HabitFormData>({
    defaultValues: {
      name: '',
      icon: 'BrainCircuit',
      color: habitColors[0],
      frequency: { type: 'daily', days: [] }
    }
  });

  const watchName = watch('name');
  const watchFrequency = watch('frequency');


  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const habitsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'habits');
  }, [user, firestore]);

  const habitLogsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'habitLogs');
  }, [user, firestore]);

  const journalEntriesCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'journalEntries');
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


  // --- AI Suggestion Logic ---
  
  // 1. Proactive suggestions based on journal entries
  const handleProactiveSuggestions = async () => {
    if (!journalEntriesCollection || !habits) return;
    setIsAiLoading(true);
    setProactiveSuggestions([]);
    try {
      // Fetch the last 5 journal entries
      const q = query(journalEntriesCollection, orderBy('createdAt', 'desc'), limit(5));
      const querySnapshot = await getDocs(q);
      const journalEntries = querySnapshot.docs.map(doc => doc.data().content as string);
      
      if (journalEntries.length > 0) {
        const existingHabits = habits.map(h => h.name);
        const result = await fetchProactiveSuggestions({ journalEntries, existingHabits });
        setProactiveSuggestions(result.suggestions);
      }
    } catch (error) {
      console.error("Proactive AI suggestion failed:", error);
      // Fails silently as per requirements
    } finally {
      setIsAiLoading(false);
    }
  };

  // 2. Interactive suggestion based on user input (debounced)
  const handleInteractiveSuggestion = useDebouncedCallback(async (name: string) => {
    if (!name.trim() || name.length < 5) {
      setInteractiveSuggestion(null);
      return;
    }
    try {
      const result = await fetchInteractiveSuggestion({ userInput: name });
      if (result.suggestion) {
        setInteractiveSuggestion(result.suggestion);
      } else {
        setInteractiveSuggestion(null);
      }
    } catch (error) {
      console.error("Interactive AI suggestion failed:", error);
      setInteractiveSuggestion(null); // Fail silently
    }
  }, 750);

  useEffect(() => {
    handleInteractiveSuggestion(watchName);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchName]);


  // 3. Handler to pre-fill the form when a suggestion is clicked
  const handleSuggestionClick = (suggestion: HabitSuggestion) => {
    setValue('name', suggestion.name);
    // Ensure the icon exists in our list, otherwise default.
    if (Object.keys(habitIcons).includes(suggestion.icon)) {
      setValue('icon', suggestion.icon as IconName);
    }
    // Simple color validation
    if (suggestion.color.startsWith('#')) {
       setValue('color', suggestion.color);
    }
    setValue('frequency', suggestion.frequency);
    setInteractiveSuggestion(null); // Clear interactive suggestion after applying
  };


  const onOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      handleProactiveSuggestions(); // Trigger proactive suggestions when modal opens
    } else {
      reset(); // Reset form on close
      setProactiveSuggestions([]);
      setInteractiveSuggestion(null);
    }
  };

  const onSubmit = async (data: HabitFormData) => {
    if (!habitsCollection || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save habit. User not found.",
      });
      return;
    }
    setIsSaving(true);
    try {
      await addDocumentNonBlocking(habitsCollection, {
        ...data,
        streak: 0,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Habit Created!",
        description: `${data.name} has been added to your list.`
      })
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add habit:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save habit. Please try again.",
      });
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

  const isLoading = isLoadingHabits || isLoadingLog;

  const Icon = ({name, ...props}: {name: IconName} & React.ComponentProps<"svg">) => {
    const LucideIcon = habitIcons[name];
    return LucideIcon ? <LucideIcon {...props} /> : <BrainCircuit {...props} />;
  }

  const SuggestionPill = ({ suggestion, onClick }: { suggestion: HabitSuggestion, onClick: () => void }) => (
    <button onClick={onClick} className="flex items-center gap-2 p-2 rounded-full bg-background shadow-neumorphic-outset hover:shadow-neumorphic-inset transition-all text-sm text-foreground">
        <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${suggestion.color}33`, color: suggestion.color }}>
            <Icon name={suggestion.icon as IconName} className="h-4 w-4" />
        </div>
        <span>{suggestion.name}</span>
    </button>
  );

  const AiLoadingSkeleton = () => (
    <div className="flex flex-wrap gap-2">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-40 rounded-full" />
      ))}
    </div>
  )

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
        <DialogContent className="shadow-neumorphic-outset bg-background border-transparent max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create a New Habit</DialogTitle>
            <DialogDescription>Personalize your new habit. Get suggestions from your AI Coach.</DialogDescription>
          </DialogHeader>
          
          <Separator />

          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-accent"><Sparkles size={16}/>AI Coach Suggestions</Label>
            <div className="min-h-[40px]">
              {isAiLoading ? <AiLoadingSkeleton/> : (
                proactiveSuggestions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {proactiveSuggestions.map((suggestion, i) => (
                      <SuggestionPill key={i} suggestion={suggestion} onClick={() => handleSuggestionClick(suggestion)}/>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">Write in your journal to get personalized suggestions.</p>
              )}
            </div>
          </div>

          <Separator />
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="habit-name-input">Habit Name</Label>
              <Controller
                name="name"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Input 
                    id="habit-name-input"
                    name="habit-name"
                    placeholder="e.g. Read for 20 minutes" 
                    disabled={isSaving}
                    autoComplete="off"
                    autoCapitalize="sentences"
                    spellCheck="true"
                    autoCorrect="true"
                    {...field} 
                  />
                )}
              />
               {interactiveSuggestion && (
                  <div className="pt-2">
                    <SuggestionPill suggestion={interactiveSuggestion} onClick={() => handleSuggestionClick(interactiveSuggestion)} />
                  </div>
                )}
            </div>
            
            <div className="space-y-2">
               <Label>Icon</Label>
                <Controller
                    name="icon"
                    control={control}
                    render={({ field }) => (
                        <div className="grid grid-cols-8 gap-2">
                        {Object.keys(habitIcons).map((iconName) => (
                            <Button key={iconName} type="button" variant="outline" size="icon" className={cn("h-10 w-10", field.value === iconName && "ring-2 ring-ring bg-accent/20")} onClick={() => field.onChange(iconName as IconName)} disabled={isSaving}>
                               <Icon name={iconName as IconName} className="h-5 w-5"/>
                            </Button>
                        ))}
                        </div>
                    )}
                />
            </div>
             
            <div className="space-y-2">
                <Label>Color</Label>
                <Controller
                    name="color"
                    control={control}
                    render={({ field }) => (
                        <div className="flex flex-wrap gap-2">
                        {habitColors.map((color) => (
                            <Button key={color} type="button" style={{backgroundColor: color}} className={cn("h-8 w-8 rounded-full border-2 border-transparent", field.value === color && "border-ring")} onClick={() => field.onChange(color)} disabled={isSaving}></Button>
                        ))}
                        </div>
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Controller
                        name="frequency.type"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                {watchFrequency.type === 'weekly' && (
                  <div className="space-y-2">
                    <Label>Repeat on</Label>
                     <Controller
                        name="frequency.days"
                        control={control}
                        render={({ field }) => (
                             <ToggleGroup type="multiple" variant="outline" value={field.value.map(String)} onValueChange={(days) => field.onChange(days.map(Number))} className="justify-start gap-1" disabled={isSaving}>
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                                <ToggleGroupItem key={index} value={String(index)} aria-label={`Toggle ${day}`} className="h-9 w-9 rounded-full">{day}</ToggleGroupItem>
                              ))}
                            </ToggleGroup>
                        )}
                     />
                  </div>
                )}
            </div>

            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary" className="shadow-neumorphic-outset active:shadow-neumorphic-inset" disabled={isSaving}>Cancel</Button></DialogClose>
                <Button type="submit" className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground" disabled={isSaving || !watchName}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4"/>}
                  {isSaving ? 'Saving...' : 'Save Habit'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
