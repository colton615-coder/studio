'use client';
import { useState, useEffect, useTransition, useMemo } from 'react';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { getDailyPrompt, getJournalAnalysis } from './actions';
import type { MoodAnalysisOutput } from '@/ai/flows/mood-analysis-from-journal';
import { format, subDays, addDays } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, BrainCircuit, ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Matches JournalEntry entity. `id` is the date string.
type JournalEntry = {
  content: string;
  analysis?: MoodAnalysisOutput;
  createdAt: any;
  updatedAt: any;
  userProfileId: string;
};

export function JournalClient() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [prompt, setPrompt] = useState<string>('Loading your daily prompt...');
  const [entryContent, setEntryContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [analysis, setAnalysis] = useState<MoodAnalysisOutput | null>(null);
  const [isAnalyzing, startTransition] = useTransition();
  const { toast } = useToast();

  const { user } = useUser();
  const firestore = useFirestore();

  const dateId = format(currentDate, 'yyyy-MM-dd');

  // Memoize the document reference
  const journalDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // The document ID will be the date string, e.g., '2024-07-26'
    return doc(firestore, 'users', user.uid, 'journalEntries', dateId);
  }, [user, firestore, dateId]);

  // Fetch the document for the current date
  const { data: journalEntry, isLoading: isEntryLoading } = useDoc<JournalEntry>(journalDocRef);

  // Effect to load a daily prompt (runs once)
  useEffect(() => {
    getDailyPrompt().then((res) => setPrompt(res.prompt));
  }, []);

  // Effect to update local state when a document is fetched from Firestore
  useEffect(() => {
    if (journalEntry) {
      setEntryContent(journalEntry.content);
      if (journalEntry.analysis) {
        setAnalysis(journalEntry.analysis);
      } else {
        setAnalysis(null);
      }
    } else {
      // No entry for this date, so reset the state
      setEntryContent('');
      setAnalysis(null);
    }
  }, [journalEntry, dateId]);

  // Debounced saving effect
  useEffect(() => {
    // Don't save initial empty content or while loading
    if (isEntryLoading || !journalDocRef) {
      return;
    }
    // Only save if content has actually changed from what's in the DB
    if (entryContent === (journalEntry?.content || '')) {
      return;
    }
    
    setIsSaving(true);
    const handler = setTimeout(() => {
      if (user) {
        const dataToSave = {
          content: entryContent,
          updatedAt: serverTimestamp(),
          // Conditionally add createdAt and userProfileId only for new documents
          ...(!journalEntry && {
            createdAt: serverTimestamp(),
            userProfileId: user.uid
          })
        };
        setDocumentNonBlocking(journalDocRef, dataToSave, { merge: true });
        setIsSaving(false);
      }
    }, 1500); // Save 1.5 seconds after user stops typing

    return () => {
      clearTimeout(handler);
      setIsSaving(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryContent, journalDocRef, user, isEntryLoading]);

  // Handler for AI analysis
  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryContent.trim() || !journalDocRef || !user) return;

    setAnalysis(null);
    startTransition(async () => {
      const result = await getJournalAnalysis(entryContent);
      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        setAnalysis(result);
        // Save the analysis to the document
        updateDocumentNonBlocking(journalDocRef, { analysis: result, updatedAt: serverTimestamp() });
      }
    });
  };
  
  const changeDate = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1);
    setCurrentDate(newDate);
  }

  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-4xl font-bold font-headline text-foreground">AI Journal</h1>
          <p className="text-muted-foreground mt-2">Reflect on your day and get AI-powered insights.</p>
        </header>

        <Card className="shadow-neumorphic-outset">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="text-accent" />
                {format(currentDate, 'MMMM d, yyyy')}
              </CardTitle>
              <div className="flex items-center gap-2">
                 <Button variant="outline" size="icon" onClick={() => changeDate('prev')} className="shadow-neumorphic-outset active:shadow-neumorphic-inset h-8 w-8">
                   <ChevronLeft className="h-4 w-4" />
                 </Button>
                 <Button variant="outline" size="icon" onClick={() => changeDate('next')} disabled={isToday} className="shadow-neumorphic-outset active:shadow-neumorphic-inset h-8 w-8">
                   <ChevronRight className="h-4 w-4" />
                 </Button>
              </div>
            </div>
            <CardDescription className="pt-2 flex items-center gap-2">
               <Lightbulb className="text-accent h-4 w-4"/>
               {isToday ? prompt : "Your entry from " + format(currentDate, 'MMMM d') + "."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze}>
              {isEntryLoading ? (
                 <div className="flex justify-center items-center h-48">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                 </div>
              ) : (
                <Textarea
                  value={entryContent}
                  onChange={(e) => setEntryContent(e.target.value)}
                  placeholder="Write your thoughts here..."
                  rows={10}
                  className="bg-background"
                />
              )}
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-muted-foreground h-6 flex items-center">
                    {isSaving && <><Loader2 className="w-3 h-3 animate-spin mr-2"/> Saving...</>}
                    {!isSaving && journalEntry?.updatedAt && (
                      `Saved at ${format(journalEntry.updatedAt.toDate(), 'h:mm a')}`
                    )}
                </div>
                <Button type="submit" disabled={isAnalyzing || !entryContent.trim()} className="w-48 shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">
                    {isAnalyzing ? <Loader2 className="animate-spin" /> : 'Analyze My Journal'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="md:sticky md:top-8">
        <Card className="shadow-neumorphic-outset min-h-[300px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="text-accent" />
              Your Insights
            </CardTitle>
            <CardDescription>
              {isAnalyzing ? "Analyzing your entry..." : (analysis ? "Here's what I've gathered from your writing." : "Submit your journal entry to see your insights.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(isAnalyzing || isEntryLoading) && !analysis && (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-12 h-12 text-accent animate-spin" />
              </div>
            )}
            {analysis && (
              <div className="space-y-6">
                 <div className="p-4 rounded-lg bg-background shadow-neumorphic-inset">
                   <h3 className="font-semibold text-accent flex items-center gap-2"><Lightbulb />Mood</h3>
                   <p className="mt-1 text-foreground">{analysis.mood}</p>
                 </div>
                 <div className="p-4 rounded-lg bg-background shadow-neumorphic-inset">
                   <h3 className="font-semibold text-accent flex items-center gap-2"><BrainCircuit />Thought Patterns</h3>
                   <p className="mt-1 text-foreground">{analysis.thoughtPatterns}</p>
                 </div>
                 <div className="p-4 rounded-lg bg-background shadow-neumorphic-inset">
                   <h3 className="font-semibold text-accent flex items-center gap-2"><Lightbulb />Behavioral Insights</h3>
                   <p className="mt-1 text-foreground">{analysis.behavioralInsights}</p>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
