'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Flame, Target, TrendingUp } from 'lucide-react';

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

  const handleHabitToggle = (id: string) => {
    setHabits(
      habits.map((habit) =>
        habit.id === id ? { ...habit, done: !habit.done, streak: habit.done ? habit.streak -1 : habit.streak + 1 } : habit
      )
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-4xl font-bold font-headline text-foreground">Habit Tracker</h1>
        <p className="text-muted-foreground mt-2">Log your daily habits and watch your streaks grow.</p>
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
    </div>
  );
}
