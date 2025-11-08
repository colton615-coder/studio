'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Flame, Target, PlusCircle } from 'lucide-react';
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


type Habit = {
  id: string;
  name: string;
  done: boolean;
  streak: number;
};

const initialHabits: Habit[] = [
  { id: 'workout', name: 'Complete a workout', done: false, streak: 12 },
  { id: 'read', name: 'Read for 20 minutes', done: true, streak: 5 },
  { id: 'meditate', name: 'Meditate for 10 minutes', done: false, streak: 33 },
  { id: 'journal', name: 'Write a journal entry', done: false, streak: 2 },
  { id: 'no-sugar', name: 'Avoid sugary snacks', done: true, streak: 8 },
  { id: 'hydrate', name: 'Drink 8 glasses of water', done: true, streak: 21 },
];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  const handleHabitToggle = (id: string) => {
    setHabits(
      habits.map((habit) =>
        habit.id === id ? { ...habit, done: !habit.done, streak: habit.done ? habit.streak -1 : habit.streak + 1 } : habit
      )
    );
  };
  
  const handleAddHabit = () => {
    if (newHabitName.trim()) {
      const newHabit: Habit = {
        id: Date.now().toString(),
        name: newHabitName,
        done: false,
        streak: 0,
      };
      setHabits([newHabit, ...habits]);
      setNewHabitName('');
      setIsDialogOpen(false);
    }
  };


  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold font-headline text-foreground">Habit Tracker</h1>
          <p className="text-muted-foreground mt-2">Log your daily habits and watch your streaks grow.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-accent/80 hover:bg-accent text-accent-foreground">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Habit
        </Button>
      </header>
      
      <Card className="shadow-neumorphic-outset">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="text-accent" />
            Today's Habits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between p-4 rounded-lg bg-background shadow-neumorphic-inset"
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    id={habit.id}
                    checked={habit.done}
                    onCheckedChange={() => handleHabitToggle(habit.id)}
                    className="h-6 w-6 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground border-accent"
                  />
                  <label
                    htmlFor={habit.id}
                    className="text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {habit.name}
                  </label>
                </div>
                <div className="flex items-center gap-2 text-accent">
                  <Flame className="h-5 w-5" />
                  <span className="font-semibold text-lg">{habit.streak}</span>
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
