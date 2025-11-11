'use client';
import React, { useState, useEffect, useTransition, useMemo, useRef, useCallback } from 'react';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  addDocumentNonBlocking,
} from '@/firebase';
import { collection, doc, serverTimestamp, query, limit, orderBy } from 'firebase/firestore';
import { format, isToday } from 'date-fns';
import { getHabitFeedback, fetchProactiveSuggestions, fetchInteractiveSuggestion } from './actions';
import * as LucideIcons from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { useDebouncedCallback } from 'use-debounce';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { haptics } from '@/lib/haptics';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh-indicator';
import { NetworkStatusIndicator } from '@/components/ui/network-status-indicator';


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
import { EmptyStateCTA } from '@/components/ui/empty-state-cta';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { celebrateHabitCompletion, celebrateStreak, celebrateAllHabitsComplete } from '@/lib/celebrations';


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
  userProfileId: string;
  icon: IconName;
  color: string;
  frequency: Frequency;
  streak: number;
  lastCompleted?: any;
  createdAt: any;
  isOptimistic?: boolean;
};

// This type represents the AI-suggested habit object.
// It's a partial habit, as it doesn't have an ID, userId, etc.
type HabitSuggestion = Omit<Habit, 'id' | 'userProfileId' | 'streak' | 'lastCompleted' | 'createdAt'>;

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
  const [refreshKey, setRefreshKey] = useState(0);

  const [feedback, setFeedback] = useState('Analyzing your weekly performance...');
  const [isAnalyzing, startTransition] = useTransition();

  const handleRefresh = useCallback(async () => {
    setRefreshKey(prev => prev + 1);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    enabled: true,
  });

  // State for AI suggestions
  const [proactiveSuggestions, setProactiveSuggestions] = useState<HabitSuggestion[]>([]);
  const [interactiveSuggestion, setInteractiveSuggestion] = useState<HabitSuggestion | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Ref for the habit name input for programmatic focus
  const habitNameInputRef = useRef<HTMLInputElement>(null);

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

  const journalEntriesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'journalEntries'), orderBy('createdAt', 'desc'), limit(5));
  }, [user, firestore]);

  const { data: habits, isLoading: isLoadingHabits, setData: setHabits } = useCollection<Habit>(habitsCollection, { mode: 'realtime' });
  const { data: recentJournalEntries } = useCollection<JournalEntry>(journalEntriesQuery, { mode: 'once' });
  
  const { data: habitHistory, isLoading: isLoadingHistory } = useCollection<DailyLog>(habitLogsCollection, { mode: 'realtime' });
  
  const todayLog = useMemo(() => habitHistory?.find(log => log.id === todayStr) ?? null, [habitHistory, todayStr]);
  const isLoadingLog = isLoadingHistory;


  const combinedHabits = useMemo(() => {
    const sortedHabits = habits?.sort((a,b) => (a.createdAt?.toDate?.() || 0) > (b.createdAt?.toDate?.() || 0) ? 1 : -1)
    return sortedHabits?.map(habit => ({
      ...habit,
      done: todayLog?.log?.[habit.id] ?? false
    }))
  }, [habits, todayLog]);

  useEffect(() => {
    if (habits && habitHistory) {
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
  }, [habits, habitHistory]);


  // --- AI Suggestion Logic ---
  
  // 1. Proactive suggestions based on journal entries
  const handleProactiveSuggestions = async () => {
    if (!recentJournalEntries || !habits) return;
    setIsAiLoading(true);
    setProactiveSuggestions([]);
    try {
      const journalEntries = recentJournalEntries.map(entry => entry.content);
      const existingHabits = habits.map(h => h.name);
      
      const result = await fetchProactiveSuggestions({ journalEntries, existingHabits });
      // Normalize suggestion icons to our IconName union (fallback to BrainCircuit)
      const normalized = result.suggestions.map((s: any) => ({
        ...s,
        icon: Object.keys(habitIcons).includes(s.icon) ? (s.icon as IconName) : ('BrainCircuit' as IconName),
      }));
      setProactiveSuggestions(normalized);
      
    } catch (_error) {
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
        const s = result.suggestion as any;
        setInteractiveSuggestion({
          ...s,
          icon: Object.keys(habitIcons).includes(s.icon) ? (s.icon as IconName) : ('BrainCircuit' as IconName),
        });
      } else {
        setInteractiveSuggestion(null);
      }
    } catch (_error) {
      setInteractiveSuggestion(null); // Fail silently
    }
  }, 750);

  useEffect(() => {
    handleInteractiveSuggestion(watchName);
   
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

  useEffect(() => {
    if (isDialogOpen) {
      handleProactiveSuggestions(); // Trigger proactive suggestions when modal opens
    } else {
      // Use a timeout to avoid clearing the form while the dialog is closing
      setTimeout(() => {
        reset(); 
        setProactiveSuggestions([]);
        setInteractiveSuggestion(null);
      }, 300);
    }
  }, [isDialogOpen, reset]);

  // Effect for "graceful" programmatic focus
  useEffect(() => {
    if (isDialogOpen) {
      // CASE 2: AI is done loading AND there are no suggestions.
      if (!isAiLoading && proactiveSuggestions.length === 0) {
        // Set a timeout to allow the modal animation to finish
        const timer = setTimeout(() => {
          habitNameInputRef.current?.focus();
        }, 400); // 400ms delay, adjust as needed for modal animation
        
        return () => clearTimeout(timer);
      }
    }
    // CASE 1 (implicit): If AI is loading or there are suggestions, do nothing.
  }, [isDialogOpen, isAiLoading, proactiveSuggestions]);


  const onSubmit = async (data: HabitFormData) => {
    if (!habitsCollection || !user || !habits || !setHabits) {
      toast({ variant: "destructive", title: "Error", description: "Could not save habit. User or data source not found." });
      return;
    }
    setIsSaving(true);
    setIsDialogOpen(false);

    const optimisticId = uuidv4();
    const newHabit: Habit = {
      ...data,
      id: optimisticId,
      streak: 0,
      userProfileId: user.uid,
      createdAt: new Date(), 
      isOptimistic: true,
    };
    
    // 1. Optimistically update local state
    setHabits([...habits, newHabit]);

    try {
      // 2. Asynchronously write to Firestore
      // Note: The original implementation used addDocumentNonBlocking here, which would
      // cause a mismatch with the client-generated ID. Switched to setDocumentNonBlocking.
      const docRef = doc(habitsCollection, optimisticId);
      await setDocumentNonBlocking(docRef, {
        ...data,
        id: optimisticId,
        streak: 0,
        userProfileId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Habit Created!", description: `"${data.name}" has been added.` });
    } catch (error) {
      // 3. Rollback on failure
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save habit. Please try again." });
      setHabits(habits.filter(h => h.id !== optimisticId));
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
    
    // Immediately write to Firestore (non-blocking) so the checkbox updates quickly
    const logUpdate = { log: { [habit.id]: newDoneState } };
    setDocumentNonBlocking(logRef, logUpdate, { merge: true });

    if (newDoneState) {
      const lastCompletedDate = habit.lastCompleted?.toDate();
      if (!lastCompletedDate || !isToday(lastCompletedDate)) {
        newStreak = newStreak + 1;
        // Celebrate streak increase with strong haptic
        haptics.success();
        celebrateStreak(newStreak);
      } else {
        // Simple celebration for checking habit with medium haptic
        haptics.medium();
        celebrateHabitCompletion();
      }
      setDocumentNonBlocking(habitRef, { streak: newStreak, lastCompleted: serverTimestamp() }, { merge: true });
      
      // Check if all habits are now complete
      const allComplete = combinedHabits?.every((h: Habit & {done: boolean}) => h.id === habit.id ? true : h.done);
      if (allComplete && combinedHabits && combinedHabits.length > 1) {
        setTimeout(() => {
          haptics.pattern([100, 75, 100, 75]);
          celebrateAllHabitsComplete();
        }, 300);
      }
    } else {
      const lastCompletedDate = habit.lastCompleted?.toDate();
      if(lastCompletedDate && isToday(lastCompletedDate)) {
        newStreak = Math.max(0, newStreak - 1);
        setDocumentNonBlocking(habitRef, { streak: newStreak }, { merge: true });
      }
    }
  };

  const handleDeleteHabit = (habitToDelete: Habit) => {
    if (!habitsCollection || !habits || !setHabits) return;
    
    const originalHabits = [...habits];

    // 1. Optimistically remove from local state
    setHabits(originalHabits.filter(h => h.id !== habitToDelete.id));

    // 2. Asynchronously delete from Firestore
    try {
      const docRef = doc(habitsCollection, habitToDelete.id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: "Habit Removed", description: `"${habitToDelete.name}" has been deleted.` });
    } catch (error) {
      // 3. Rollback on failure
      toast({ variant: "destructive", title: "Delete Failed", description: "Could not remove habit." });
      setHabits(originalHabits); // Restore the original list
    }
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
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-2 rounded-full bg-background shadow-neumorphic-outset hover:shadow-neumorphic-inset transition-all text-sm text-foreground"
      tabIndex={0}
      aria-label={`Suggestion: ${suggestion.name}`}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      <div
        className="h-6 w-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${suggestion.color}80`, color: suggestion.color }}
        aria-label={`Icon for ${suggestion.name}`}
      >
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

  const HabitCardSkeleton = () => (
    <div className="flex items-center justify-between p-4 rounded-lg bg-background shadow-neumorphic-inset">
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-6 rounded-sm" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <PullToRefreshIndicator {...pullToRefresh} />
      <NetworkStatusIndicator onRetry={handleRefresh} />
      <header>
        <h1 className="text-4xl font-bold font-headline text-foreground">Habit Tracker</h1>
        <p className="text-muted-foreground mt-2">Log your daily habits and watch your streaks grow.</p>
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
          <CardTitle>Add New Habit</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setIsDialogOpen(true)} 
            className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Habit
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-neumorphic-outset">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="text-accent" />Today's Habits</CardTitle>
          <CardDescription>Complete your habits for today to build your streak.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              [...Array(3)].map((_, i) => <HabitCardSkeleton key={i} />)
            ) : !combinedHabits || combinedHabits.length === 0 ? (
              <EmptyStateCTA
                icon={<Target size={32} />}
                title="Define Your Discipline"
                message="No habits yet. Add one to start building the new you."
                ctaElement={
                  <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="shadow-neumorphic-outset active:shadow-neumorphic-inset">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Habit
                  </Button>
                }
              />
            ) : (
              <AnimatePresence>
              {combinedHabits.map((habit) => (
                <motion.div 
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className={cn(habit.isOptimistic && "opacity-50 pointer-events-none")}
                >
                  <div className="flex items-center justify-between p-4 rounded-lg bg-background shadow-neumorphic-inset">
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
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                        <Flame className={cn(
                          "h-5 w-5 text-orange-400",
                          habit.streak > 0 && "animate-pulse-glow"
                        )} />
                        <span className="font-semibold text-lg text-orange-400">{habit.streak}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteHabit(habit)}>
                        <Trash2 size={16}/>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
              </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          open={isDialogOpen} 
          className="shadow-neumorphic-outset bg-background border-transparent max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Create a New Habit</DialogTitle>
            <DialogDescription>Build positive routines and track your progress.</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="habit-name-input">Habit Name</Label>
              <Controller
                name="name"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Input 
                    {...field}
                    ref={habitNameInputRef}
                    id="habit-name-input"
                    placeholder="e.g. Read for 20 minutes" 
                    disabled={isSaving}
                    autoComplete="off"
                    autoCapitalize="on"
                    spellCheck="true"
                    autoCorrect="on"
                    enterKeyHint="done"
                  />
                )}
              />
               {interactiveSuggestion && (
                  <div className="pt-2" role="region" aria-live="polite" aria-label="Interactive habit suggestion">
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
                <DialogClose asChild>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="shadow-neumorphic-outset active:shadow-neumorphic-inset" 
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground" 
                  disabled={isSaving || !watchName || (watchFrequency.type === 'weekly' && watchFrequency.days.length === 0)}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4"/>
                      Create Habit
                    </>
                  )}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
