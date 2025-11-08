'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, Dot } from 'lucide-react';
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

type CalendarEvent = {
  date: Date;
  title: string;
};

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([
    { date: new Date(), title: 'Team Sync-Up' },
    { date: new Date(new Date().setDate(new Date().getDate() + 2)), title: 'Project Deadline' },
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');

  const selectedDayEvents = date
    ? events.filter((event) => format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
    : [];

  const handleAddEvent = () => {
    if (newEventTitle && date) {
      setEvents([...events, { date, title: newEventTitle }]);
      setNewEventTitle('');
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-4xl font-bold font-headline text-foreground">Calendar</h1>
        <p className="text-muted-foreground mt-2">Log events and plans throughout the year.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="shadow-neumorphic-outset md:col-span-2">
          <CardContent className="p-2 sm:p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="w-full"
              classNames={{
                root: "bg-background rounded-lg shadow-neumorphic-inset",
                day_selected: "bg-accent text-accent-foreground hover:bg-accent/90",
                day_today: "bg-primary/50 text-primary-foreground",
              }}
              components={{
                DayContent: ({ date, ...props }) => {
                   const isEventDay = events.some(event => format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
                   return (
                      <div className="relative">
                         <span>{date.getDate()}</span>
                         {isEventDay && <Dot className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-accent" />}
                      </div>
                   )
                }
              }}
            />
          </CardContent>
        </Card>
        <Card className="shadow-neumorphic-outset">
          <CardHeader>
            <CardTitle>{date ? format(date, 'MMMM d, yyyy') : 'Select a date'}</CardTitle>
            <CardDescription>Events for the selected day.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsDialogOpen(true)} className="w-full mb-4 shadow-neumorphic-outset active:shadow-neumorphic-inset bg-accent/20 hover:bg-accent/30 text-accent-foreground">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Event
            </Button>
            <div className="space-y-4">
              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((event, index) => (
                  <div key={index} className="p-3 rounded-md bg-background shadow-neumorphic-inset">
                    <p className="font-medium text-foreground">{event.title}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No events for this day.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="shadow-neumorphic-outset bg-background border-transparent">
          <DialogHeader>
            <DialogTitle>Add Event for {date ? format(date, 'MMMM d') : ''}</DialogTitle>
            <DialogDescription>
              Enter a title for your new event.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-title" className="text-right">
                Title
              </Label>
              <Input
                id="event-title"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary" className="shadow-neumorphic-outset active:shadow-neumorphic-inset">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddEvent} className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
