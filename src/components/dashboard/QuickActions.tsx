'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Sparkles, Dumbbell, Calendar } from 'lucide-react';

export function QuickActions() {
  return (
    <Card className="shadow-neumorphic-outset">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/tasks">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2 shadow-neumorphic-outset hover:shadow-neumorphic-inset">
              <PlusCircle size={20} />
              <span className="text-xs">Add Task</span>
            </Button>
          </Link>
          
          <Link href="/ai-knox">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2 shadow-neumorphic-outset hover:shadow-neumorphic-inset">
              <Sparkles size={20} />
              <span className="text-xs">AI Knox</span>
            </Button>
          </Link>
          
          <Link href="/workouts">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2 shadow-neumorphic-outset hover:shadow-neumorphic-inset">
              <Dumbbell size={20} />
              <span className="text-xs">Workout</span>
            </Button>
          </Link>
          
          <Link href="/calendar">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2 shadow-neumorphic-outset hover:shadow-neumorphic-inset">
              <Calendar size={20} />
              <span className="text-xs">Calendar</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
