'use client';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  useUser,
  useFirestore,
  useCollection,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { format, isToday } from 'date-fns';
import { fetchInteractiveSuggestion } from './actions';
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
import { EmberPrismButton } from '@/components/ui/EmberPrismButton';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyStateCTA } from '@/components/ui/empty-state-cta';
import { celebrateHabitCompletion, celebrateStreak, celebrateAllHabitsComplete } from '@/lib/celebrations';


const { Flame, Target, Trash2, Loader2, BrainCircuit, BookOpen, GlassWater, Dumbbell, Bed, Apple, DollarSign, ClipboardCheck, Sparkles } = LucideIcons;
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

type HabitSuggestion = Omit<Habit, 'id' | 'userProfileId' | 'streak' | 'lastCompleted' | 'createdAt'>;

type HabitCompletionLog = {
  [habitId: string]: boolean;
};

type DailyLog = {
  id: string;
  log: HabitCompletionLog;
};

type HabitFormData = {
  name: string;
  icon: IconName;
  color: string;
  frequency: Frequency;
};

const Icon = ({ name, className, style }: { name: IconName; className?: string; style?: React.CSSProperties }) => {
  const IconComponent = habitIcons[name];
  return <IconComponent className={className} style={style} />;
};

const SuggestionPill = ({ suggestion, onClick }: { suggestion: HabitSuggestion; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 hover:bg-accent/20 border border-accent/20 transition-colors text-sm"
  >
    <Sparkles className="h-3.5 w-3.5 text-accent" />
    <span>{suggestion.name}</span>
  </button>
);

export default function HabitsPageNew() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [habitCreateSuccess, setHabitCreateSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [interactiveSuggestion, setInteractiveSuggestion] = useState<HabitSuggestion | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const habitNameInputRef = useRef<HTMLInputElement>(null);

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    enabled: true,
  });

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

  const habitsCollection = useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'habits');
  }, [user, firestore, refreshKey]);

  const habitLogsCollection = useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'habitLogs');
  }, [user, firestore, refreshKey]);

  const { data: habits, isLoading: isLoadingHabits, setData: setHabits } = useCollection<Habit>(habitsCollection, { mode: 'realtime' });
  const { data: habitHistory, isLoading: isLoadingHistory } = useCollection<DailyLog>(habitLogsCollection, { mode: 'realtime' });
  
  const todayLog = useMemo(() => habitHistory?.find(log => log.id === todayStr) ?? null, [habitHistory, todayStr]);

  const combinedHabits = useMemo(() => {
    const sortedHabits = habits?.sort((a,b) => (a.createdAt?.toDate?.() || 0) > (b.createdAt?.toDate?.() || 0) ? 1 : -1)
    return sortedHabits?.map(habit => ({
      ...habit,
      done: todayLog?.log?.[habit.id] ?? false
    })) ?? [];
  }, [habits, todayLog]);

  const handleSuggestionClick = (suggestion: HabitSuggestion) => {
    setValue('name', suggestion.name);
    setValue('icon', suggestion.icon);
    setValue('color', suggestion.color);
    setValue('frequency', suggestion.frequency);
    setInteractiveSuggestion(null);
    habitNameInputRef.current?.focus();
  };

  const debouncedFetchSuggestion = useDebouncedCallback(async (name: string) => {
    if (name.length < 3) {
      setInteractiveSuggestion(null);
      return;
    }
    try {
      const result = await fetchInteractiveSuggestion({ userInput: name });
      if (result?.suggestion && result.suggestion.name !== name) {
        setInteractiveSuggestion(result.suggestion as HabitSuggestion);
      }
    } catch {
      // Suggestion failure is non-critical
    }
  }, 500);

  useEffect(() => {
    debouncedFetchSuggestion(watchName);
  }, [watchName, debouncedFetchSuggestion]);

  const onSubmit = async (data: HabitFormData) => {
    if (!user || !habitsCollection) return;

    setIsSaving(true);
    const newHabitId = uuidv4();

    try {
      const docRef = doc(habitsCollection, newHabitId);
      await setDocumentNonBlocking(docRef, {
        id: newHabitId,
        userProfileId: user.uid,
        name: data.name,
        icon: data.icon,
        color: data.color,
        frequency: data.frequency,
        streak: 0,
        createdAt: serverTimestamp(),
      });

      setRefreshKey(k => k + 1);
      setHabitCreateSuccess(true);
      setTimeout(() => setHabitCreateSuccess(false), 1200);
      
      setIsDialogOpen(false);
      reset();
      setInteractiveSuggestion(null);

    } catch (error) {
      console.error("Error creating habit:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create habit. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleHabit = async (habit: Habit & {done: boolean}) => {
    if (!user || !habitLogsCollection) return;

    const logRef = doc(habitLogsCollection, todayStr);
    const newDoneState = !habit.done;
    const habitRef = doc(habitsCollection!, habit.id);

    let newStreak = habit.streak;
    const originalDone = habit.done;
    const originalStreak = habit.streak;

    if (setHabits && combinedHabits) {
      const updatedHabits = combinedHabits.map(h => 
        h.id === habit.id ? { ...h, done: newDoneState, streak: newStreak } : h
      );
      setHabits(updatedHabits);
    }

    try {
      if (newDoneState) {
        const lastCompletedDate = habit.lastCompleted?.toDate();
        
        if (!lastCompletedDate || !isToday(lastCompletedDate)) {
          newStreak = newStreak + 1;
          
          if (setHabits && combinedHabits) {
            const updatedHabits = combinedHabits.map(h => 
              h.id === habit.id ? { ...h, done: newDoneState, streak: newStreak } : h
            );
            setHabits(updatedHabits);
          }
        }

        try {
          if (newStreak > originalStreak) {
            haptics.success();
          } else {
            haptics.medium();
          }
        } catch {
          // Haptic feedback is optional
        }

        try {
          if (newStreak > originalStreak) {
            celebrateStreak(newStreak);
          } else {
            celebrateHabitCompletion();
          }
        } catch {
          // Confetti animation is optional
        }

        try {
          const logUpdate = { log: { [habit.id]: newDoneState } };
          await setDocumentNonBlocking(logRef, logUpdate, { merge: true });
          
          await setDocumentNonBlocking(habitRef, { 
            streak: newStreak, 
            lastCompleted: serverTimestamp() 
          }, { merge: true });
        } catch {
          // Firebase error handled by toast below
          
          if (setHabits && combinedHabits) {
            const rollbackHabits = combinedHabits.map(h => 
              h.id === habit.id ? { ...h, done: originalDone, streak: originalStreak } : h
            );
            setHabits(rollbackHabits);
          }
          
          toast({ 
            variant: 'destructive', 
            title: 'Sync Failed', 
            description: 'Could not save habit completion. Please try again.' 
          });
          
          return;
        }

        try {
          const allComplete = combinedHabits?.every((h: Habit & {done: boolean}) => 
            h.id === habit.id ? newDoneState : h.done
          );
          if (allComplete && combinedHabits && combinedHabits.length > 1) {
            setTimeout(() => {
              try {
                haptics.pattern([100, 75, 100, 75]);
                celebrateAllHabitsComplete();
              } catch {
                // Celebration is optional
              }
            }, 300);
          }
        } catch {
          // All-complete check is non-critical
        }
      } else {
        try {
          const logUpdate = { log: { [habit.id]: newDoneState } };
          await setDocumentNonBlocking(logRef, logUpdate, { merge: true });
        } catch {
          // Firebase error handled by rollback and toast below
          
          if (setHabits && combinedHabits) {
            const rollbackHabits = combinedHabits.map(h => 
              h.id === habit.id ? { ...h, done: originalDone } : h
            );
            setHabits(rollbackHabits);
          }
          
          toast({ 
            variant: 'destructive', 
            title: 'Sync Failed', 
            description: 'Could not update habit status. Please try again.' 
          });
        }
      }
    } catch {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'An unexpected error occurred. Please try again.' 
      });
    }
  };

  const deleteHabit = async (habit: Habit) => {
    if (!habitsCollection || !habits || !setHabits) return;

    const originalHabits = [...habits];
    setHabits(originalHabits.filter(h => h.id !== habit.id));

    try {
      const docRef = doc(habitsCollection, habit.id);
      await deleteDocumentNonBlocking(docRef);
      toast({ title: 'Habit Deleted', description: `"${habit.name}" has been removed.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete habit.' });
      setHabits(originalHabits);
    }
  };

  // Swipe navigation logic
  const router = require('next/navigation').useRouter();
  const MotionDiv = require('@/lib/motion').MotionDiv;
  const moduleOrder = ['/dashboard', '/habits', '/tasks', '/finance', '/ai-knox'];
  const currentIndex = moduleOrder.indexOf('/habits');
  const handleSwipe = (_event: MouseEvent, info: { offset: { x: number } }) => {
    if (info.offset.x < -80 && currentIndex < moduleOrder.length - 1) {
      router.push(moduleOrder[currentIndex + 1]);
    } else if (info.offset.x > 80 && currentIndex > 0) {
      router.push(moduleOrder[currentIndex - 1]);
    }
  };

  const isLoading = isLoadingHabits || isLoadingHistory;

  return (
    <MotionDiv
      className="flex flex-col gap-6"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleSwipe}
    >
      <PullToRefreshIndicator {...pullToRefresh} />
      <NetworkStatusIndicator onRetry={handleRefresh} />
      
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold font-headline text-foreground">Habit Tracker</h1>
          <p className="text-muted-foreground mt-2">Repetition builds character. Or at least that's the theory.</p>
        </div>
        {/* Only show action buttons when habits exist (populated state) */}
        {!isLoading && combinedHabits && combinedHabits.length > 0 && (
          <>
            <EmberPrismButton onClick={() => setIsDialogOpen(true)} success={habitCreateSuccess} className="hidden md:inline-flex" />
            <EmberPrismButton onClick={() => setIsDialogOpen(true)} success={habitCreateSuccess} className="md:hidden w-auto px-4 py-2">New Habit</EmberPrismButton>
          </>
        )}
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : combinedHabits && combinedHabits.length > 0 ? (
        <Card className="shadow-neumorphic-outset">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="text-accent h-6 w-6" />
              Today's Habits
            </CardTitle>
            <CardDescription>Track your daily progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatePresence>
                {combinedHabits.map((habit) => (
                  <motion.div
                    key={habit.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className={cn(
                      "group flex items-center gap-4 p-4 rounded-lg transition-all",
                      habit.done ? "bg-accent/10" : "bg-background shadow-neumorphic-inset"
                    )}
                  >
                    <Checkbox
                      checked={habit.done}
                      onCheckedChange={() => toggleHabit(habit)}
                      className="h-6 w-6"
                      style={{ borderColor: habit.color }}
                    />
                    <div 
                      className="flex h-12 w-12 items-center justify-center rounded-lg shadow-neumorphic-outset"
                      style={{ backgroundColor: `${habit.color}20` }}
                    >
                      <Icon name={habit.icon} className="h-6 w-6" style={{ color: habit.color }} />
                    </div>
                    <div className="flex-1">
                      <p className={cn("font-semibold", habit.done && "line-through opacity-60")}>
                        {habit.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {habit.streak > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Flame className="h-4 w-4 text-orange-500" />
                            {habit.streak} day streak
                          </span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteHabit(habit)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyStateCTA
          icon={<Target size={32} />}
          title="No Habits Yet"
          message="Might as well start somewhere. Today's as good as any."
          ctaElement={
            <EmberPrismButton onClick={() => setIsDialogOpen(true)} success={habitCreateSuccess}>Create Habit</EmberPrismButton>
          }
        />
      )}

      {/* NEW 2.0 MODAL */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="shadow-neumorphic-outset bg-background border-transparent max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col"
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Header - Fixed */}
          <div className="flex-shrink-0 p-6 pb-4 space-y-1">
            <DialogTitle className="text-2xl font-bold">Create New Habit</DialogTitle>
            <DialogDescription className="text-base">Build a positive routine to track your progress</DialogDescription>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col min-h-0 flex-1">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
              
              {/* Step 1: Name */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-semibold">1</div>
                  <Label htmlFor="habit-name-input" className="text-base font-semibold">What's your habit?</Label>
                </div>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Input 
                      {...field}
                      ref={habitNameInputRef}
                      id="habit-name-input"
                      placeholder="e.g. Read for 20 minutes, Drink 8 glasses of water..." 
                      disabled={isSaving}
                      autoComplete="off"
                      className="h-12 text-base"
                    />
                  )}
                />
                {interactiveSuggestion && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <SuggestionPill suggestion={interactiveSuggestion} onClick={() => handleSuggestionClick(interactiveSuggestion)} />
                  </motion.div>
                )}
              </div>

              <Separator />
            
              {/* Step 2: Visual Identity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-semibold">2</div>
                  <Label className="text-base font-semibold">Choose icon & color</Label>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">Icon</Label>
                    <Controller
                      name="icon"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-4 gap-2">
                          {Object.keys(habitIcons).map((iconName) => (
                            <Button 
                              key={iconName} 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className={cn(
                                "h-14 w-14 transition-all",
                                field.value === iconName && "ring-2 ring-accent bg-accent/10 scale-105"
                              )} 
                              onClick={() => field.onChange(iconName as IconName)} 
                              disabled={isSaving}
                            >
                              <Icon name={iconName as IconName} className="h-6 w-6"/>
                            </Button>
                          ))}
                        </div>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">Color</Label>
                    <Controller
                      name="color"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-3 gap-3">
                          {habitColors.map((color) => (
                            <Button 
                              key={color} 
                              type="button" 
                              style={{backgroundColor: color}} 
                              className={cn(
                                "h-14 rounded-xl border-2 transition-all hover:scale-105",
                                field.value === color ? "border-foreground scale-105 shadow-lg" : "border-transparent"
                              )} 
                              onClick={() => field.onChange(color)} 
                              disabled={isSaving}
                            />
                          ))}
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Step 3: Frequency */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-semibold">3</div>
                  <Label className="text-base font-semibold">How often?</Label>
                </div>
                
                <Controller
                  name="frequency.type"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={field.value === 'daily' ? 'default' : 'outline'}
                        className={cn(
                          "h-16 text-base font-semibold",
                          field.value === 'daily' && "bg-accent hover:bg-accent/90"
                        )}
                        onClick={() => field.onChange('daily')}
                        disabled={isSaving}
                      >
                        <Target className="mr-2 h-5 w-5" />
                        Every Day
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'weekly' ? 'default' : 'outline'}
                        className={cn(
                          "h-16 text-base font-semibold",
                          field.value === 'weekly' && "bg-accent hover:bg-accent/90"
                        )}
                        onClick={() => field.onChange('weekly')}
                        disabled={isSaving}
                      >
                        <Target className="mr-2 h-5 w-5" />
                        Specific Days
                      </Button>
                    </div>
                  )}
                />
                
                {watchFrequency.type === 'weekly' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3 pt-2"
                  >
                    <Label className="text-sm text-muted-foreground">Select days</Label>
                    <Controller
                      name="frequency.days"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-7 gap-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                            <Button
                              key={index}
                              type="button"
                              variant={field.value.includes(index) ? 'default' : 'outline'}
                              className={cn(
                                "h-14 flex-col gap-1 text-xs font-semibold",
                                field.value.includes(index) && "bg-accent hover:bg-accent/90"
                              )}
                              onClick={() => {
                                const newDays = field.value.includes(index)
                                  ? field.value.filter(d => d !== index)
                                  : [...field.value, index].sort();
                                field.onChange(newDays);
                              }}
                              disabled={isSaving}
                            >
                              <span className="text-lg">{day[0]}</span>
                              <span className="opacity-70">{day.slice(1)}</span>
                            </Button>
                          ))}
                        </div>
                      )}
                    />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="flex-shrink-0 p-6 pt-4 border-t bg-background/95 backdrop-blur-sm">
              <div className="flex gap-3 justify-end">
                <DialogClose asChild>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="min-w-24" 
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  className="min-w-32 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg" 
                  disabled={isSaving || !watchName || (watchFrequency.type === 'weekly' && watchFrequency.days.length === 0)}
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4"/>
                      Create Habit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </MotionDiv>
  );
}
