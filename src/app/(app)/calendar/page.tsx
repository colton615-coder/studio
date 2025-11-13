'use client';
import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, Dot, Loader2, Trash2, CalendarDays } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { EmptyStateCTA } from '@/components/ui/empty-state-cta';
import { logError } from '@/lib/logger';

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
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleAddEvent = async () => {
    if (!newEventTitle || !date || !user || !eventsCollection) return;
    
    setIsSaving(true);
    try {
      await addDocumentNonBlocking(eventsCollection, {
        userProfileId: user.uid,
        title: newEventTitle,
        description: newEventDescription,
        startDate: date,
        endDate: date, // Simplified for now
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Event Created', description: `"${newEventTitle}" has been added to your calendar.` });
      setNewEventTitle('');
      setNewEventDescription('');
      setIsAddDialogOpen(false);
    } catch {
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save your event. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!eventsCollection || !eventId) return;
    
    try {
      const docRef = doc(eventsCollection, eventId);
      await deleteDocumentNonBlocking(docRef);
      toast({ title: 'Event Deleted', description: 'The event has been removed from your calendar.' });
      setIsDetailDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      logError('Failed to delete event:', error);
      toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete the event.' });
    }
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
                 DayContent: ({ date }) => {
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
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              aria-label="Add new event"
              tabIndex={0}
              className="w-full mb-4 shadow-neumorphic-outset active:shadow-neumorphic-inset bg-accent/20 hover:bg-accent/30 text-accent-foreground focus:outline focus:outline-2 focus:outline-accent"
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setIsAddDialogOpen(true); }}
            >
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
                 <AnimatePresence>
                    {selectedDayEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => openEventDetails(event)}
                        tabIndex={0}
                        role="button"
                        aria-label={`View details for event ${event.title}`}
                        className="p-3 rounded-md bg-background shadow-neumorphic-inset cursor-pointer hover:bg-accent/10 transition-colors focus:outline focus:outline-2 focus:outline-accent"
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') openEventDetails(event); }}
                      >
                        <p className="font-medium text-foreground">{event.title}</p>
                      </motion.div>
                    ))}
                 </AnimatePresence>
              ) : (
                <EmptyStateCTA
                  icon={<CalendarDays size={32} />}
                  title="No Events Scheduled"
                  message="This day is wide open. Add an event to get started."
                  ctaElement={
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      aria-label="Add new event"
                      tabIndex={0}
                      variant="outline"
                      className="shadow-neumorphic-outset active:shadow-neumorphic-inset focus:outline focus:outline-2 focus:outline-accent"
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setIsAddDialogOpen(true); }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Event
                    </Button>
                  }
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Event Dialog */}
      <Dialog 
        open={isAddDialogOpen} 
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            // Reset form state when dialog closes
            setNewEventTitle('');
            setNewEventDescription('');
          }
        }}
      >
        <DialogContent open={isAddDialogOpen} className="shadow-neumorphic-outset bg-background border-transparent">
          <DialogHeader>
            <DialogTitle>Add Event for {date ? format(date, 'MMMM d') : ''}</DialogTitle>
            <DialogDescription>
              Enter details for your new event.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleAddEvent(); }}>
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
                  disabled={isSaving}
                  required
                  placeholder="Event title"
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
                  disabled={isSaving}
                  placeholder="Optional description"
                />
              </div>
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
                disabled={isSaving || !newEventTitle}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Event
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Event Detail Dialog */}
      <Dialog 
        open={isDetailDialogOpen} 
        onOpenChange={setIsDetailDialogOpen}
      >
        <DialogContent open={isDetailDialogOpen} className="shadow-neumorphic-outset bg-background border-transparent">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                  {format(selectedEvent.startDate.toDate(), 'MMMM d, yyyy')}
                </DialogDescription>
              </DialogHeader>
              {selectedEvent.description && (
                <div className="py-4">
                  <p className="text-muted-foreground">{selectedEvent.description}</p>
                </div>
              )}
              <DialogFooter className="sm:justify-between mt-4">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this event?')) {
                      handleDeleteEvent(selectedEvent.id);
                    }
                  }} 
                  className="shadow-neumorphic-outset active:shadow-neumorphic-inset"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Event
                </Button>
                <DialogClose asChild>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="shadow-neumorphic-outset active:shadow-neumorphic-inset"
                  >
                    Close
                  </Button>
                </DialogClose>
            </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
