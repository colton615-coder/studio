'use client';
import { useState, useEffect, useTransition } from 'react';
import { getDailyPrompt, getJournalAnalysis } from './actions';
import type { MoodAnalysisOutput } from '@/ai/flows/mood-analysis-from-journal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, Activity, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function JournalClient() {
  const [prompt, setPrompt] = useState<string>('Loading your daily prompt...');
  const [entry, setEntry] = useState('');
  const [analysis, setAnalysis] = useState<MoodAnalysisOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    getDailyPrompt().then((res) => setPrompt(res.prompt));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAnalysis(null);
    startTransition(async () => {
      const result = await getJournalAnalysis(entry);
      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        setAnalysis(result);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-4xl font-bold font-headline text-foreground">AI Journal</h1>
          <p className="text-muted-foreground mt-2">Reflect on your day and get AI-powered insights.</p>
        </header>
        <Card className="shadow-neumorphic-outset">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="text-accent" />
              Today's Prompt
            </CardTitle>
            <CardDescription>{prompt}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Textarea
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="Write your thoughts here..."
                rows={10}
                className="bg-background"
              />
              <Button type="submit" disabled={isPending || !entry.trim()} className="mt-4 w-full shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">
                {isPending ? <Loader2 className="animate-spin" /> : 'Analyze My Journal'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:sticky lg:top-8">
        <Card className="shadow-neumorphic-outset min-h-[300px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="text-accent" />
              Your Insights
            </CardTitle>
            <CardDescription>
              {isPending ? "Analyzing your entry..." : (analysis ? "Here's what I've gathered from your writing." : "Submit your journal entry to see your insights.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPending && (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-12 h-12 text-accent animate-spin" />
              </div>
            )}
            {analysis && (
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-background shadow-neumorphic-inset">
                  <h3 className="font-semibold text-accent flex items-center gap-2"><Activity />Mood</h3>
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
