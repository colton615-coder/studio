'use client';
import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, Dot, Loader2, Trash2 } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';

type CalendarEvent = {
  id: string;
  userProfileId: string;
  title: string;
  description: string;
  startDate: any;
  endDate: any;
};

export default function CalendarPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');

  const eventsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'calendarEvents');
  }, [user, firestore]);

  const { data: events, isLoading } = useCollection<CalendarEvent>(eventsCollection);

  const selectedDayEvents = useMemo(() => {
    if (!date || !events) return [];
    return events.filter(
      (event) => format(event.startDate.toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  }, [date, events]);

  const handleAddEvent = () => {
    if (newEventTitle && date && user && eventsCollection) {
      addDocumentNonBlocking(eventsCollection, {
        userProfileId: user.uid,
        title: newEventTitle,
        description: newEventDescription,
        startDate: date,
        endDate: date, // Simplified for now
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewEventTitle('');
      setNewEventDescription('');
      setIsAddDialogOpen(false);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!eventsCollection || !eventId) return;
    const docRef = doc(eventsCollection, eventId);
    deleteDocumentNonBlocking(docRef);
    setIsDetailDialogOpen(false);
    setSelectedEvent(null);
  };

  const openEventDetails = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-4xl font-bold font-headline text-foreground">Calendar</h1>
        <p className="text-muted-foreground mt-2">Log events and plans throughout the year.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="shadow-neumorphic-outset md:col-span-2">
          <CardContent className="p-2 sm:p-4">
            {isLoading ? (
               <div className="p-4">
                 <Skeleton className="h-[300px] w-full" />
               </div>
            ) : (
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
                   const isEventDay = events?.some(event => format(event.startDate.toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
                   return (
                      <div className="relative">
                         <span>{date.getDate()}</span>
                         {isEventDay && <Dot className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-accent" />}
                      </div>
                   )
                }
              }}
            />
            )}
          </CardContent>
        </Card>
        <Card className="shadow-neumorphic-outset">
          <CardHeader>
            <CardTitle>{date ? format(date, 'MMMM d, yyyy') : 'Select a date'}</CardTitle>
            <CardDescription>Events for the selected day.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full mb-4 shadow-neumorphic-outset active:shadow-neumorphic-inset bg-accent/20 hover:bg-accent/30 text-accent-foreground">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Event
            </Button>
            <div className="space-y-4">
              {isLoading ? (
                 <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                 </div>
              ): selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((event) => (
                  <div key={event.id} onClick={() => openEventDetails(event)} className="p-3 rounded-md bg-background shadow-neumorphic-inset cursor-pointer hover:bg-accent/10 transition-colors">
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

      {/* Add Event Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="shadow-neumorphic-outset bg-background border-transparent">
          <DialogHeader>
            <DialogTitle>Add Event for {date ? format(date, 'MMMM d') : ''}</DialogTitle>
            <DialogDescription>
              Enter details for your new event.
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
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-desc" className="text-right">
                Description
              </Label>
              <Input
                id="event-desc"
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
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
      
      {/* Event Detail Dialog */}
       <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="shadow-neumorphic-outset bg-background border-transparent">
          {selectedEvent && (
            <>
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
              <DialogDescription>
                {format(selectedEvent.startDate.toDate(), 'MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>
            <p>{selectedEvent.description}</p>
            <DialogFooter className="sm:justify-between">
               <Button variant="destructive" onClick={() => handleDeleteEvent(selectedEvent.id)} className="shadow-neumorphic-outset active:shadow-neumorphic-inset">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Event
               </Button>
               <DialogClose asChild>
                <Button type="button" variant="secondary" className="shadow-neumorphic-outset active:shadow-neumorphic-inset">Close</Button>
               </DialogClose>
            </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
