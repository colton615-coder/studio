'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dumbbell, PlusCircle, PlayCircle, Clock } from 'lucide-react';

type Exercise = {
  name: string;
  duration: number; // in seconds
};

type WorkoutTemplate = {
  id: string;
  name: string;
  exercises: Exercise[];
};

const initialTemplates: WorkoutTemplate[] = [
  {
    id: 'full-body',
    name: 'Full Body Blast',
    exercises: [
      { name: 'Jumping Jacks', duration: 60 },
      { name: 'Push-ups', duration: 45 },
      { name: 'Squats', duration: 60 },
      { name: 'Plank', duration: 60 },
    ],
  },
  {
    id: 'upper-body',
    name: 'Upper Body Strength',
    exercises: [
      { name: 'Bicep Curls', duration: 45 },
      { name: 'Tricep Dips', duration: 45 },
      { name: 'Shoulder Press', duration: 60 },
    ],
  },
    {
    id: 'core-crusher',
    name: 'Core Crusher',
    exercises: [
      { name: 'Crunches', duration: 60 },
      { name: 'Leg Raises', duration: 60 },
      { name: 'Russian Twists', duration: 45 },
    ],
  },
];

export default function WorkoutsPage() {
  const [templates, setTemplates] = useState(initialTemplates);

  const calculateTotalTime = (exercises: Exercise[]) => {
    const totalSeconds = exercises.reduce((acc, ex) => acc + ex.duration, 0);
    return Math.ceil(totalSeconds / 60);
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold font-headline text-foreground">Workouts</h1>
          <p className="text-muted-foreground mt-2">Construct and start your workout sessions.</p>
        </div>
        <Button className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <Card key={template.id} className="shadow-neumorphic-outset flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="text-accent"/>
                {template.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 pt-1">
                <Clock size={14}/>
                Approx. {calculateTotalTime(template.exercises)} minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {template.exercises.map(ex => (
                  <li key={ex.name} className="text-sm p-2 rounded-md bg-background shadow-neumorphic-inset flex justify-between">
                    <span>{ex.name}</span>
                    <span className="text-muted-foreground">{ex.duration}s</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset bg-accent/20 hover:bg-accent/30 text-accent-foreground">
                <PlayCircle className="mr-2 h-4 w-4" />
                Start Workout
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
