'use client';
import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAiKnoxResponse, getDailyPrompt } from './actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Send, User, Bot, Loader2, Lightbulb, Lock, MessageSquareQuote, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useUser as useFirebaseUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

type Message = {
  sender: 'user' | 'ai';
  text: string;
};

export function AiKnoxClient() {
  const { user: firebaseUser } = useFirebaseUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // State for Journaling
  const [prompt, setPrompt] = useState<string>('Loading your daily prompt...');
  const [journalContent, setJournalContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedEntry, setLastSavedEntry] = useState<string | null>(null);

  // State for the confirmation modal
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);


  // Effect to load a daily prompt (runs once)
  useEffect(() => {
    getDailyPrompt().then((res) => setPrompt(res.prompt));
    
    // Initial message from Knox
    startTransition(async () => {
      const result = await getAiKnoxResponse('First message');
       if ('error' in result) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        const aiMessage: Message = { sender: 'ai', text: result.therapyResponse };
        setMessages([aiMessage]);
      }
    });
   
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);
  
  const handleSaveToVault = async () => {
    if (!journalContent.trim() || !firebaseUser || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Save Error',
        description: "Cannot save entry. Missing user or database connection.",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const journalEntriesCollection = collection(firestore, 'users', firebaseUser.uid, 'journalEntries');
      const docData = {
        id: uuidv4(),
        userProfileId: firebaseUser.uid,
        content: journalContent,
        date: new Date().toISOString(),
        aiInsight: '', // Required by schema
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Use non-blocking write from the client
      await addDocumentNonBlocking(journalEntriesCollection, docData);

      setLastSavedEntry(journalContent);
      setJournalContent('');
      setIsConfirmationModalOpen(true);
      toast({
        title: 'Entry Saved',
        description: 'Your journal entry has been secured in your vault.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save entry. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscussWithKnox = () => {
    setIsConfirmationModalOpen(false);
    if (lastSavedEntry) {
      const messageWithContext = `I just wrote this in my journal: "${lastSavedEntry}". Let's talk about that.`;
      sendMessage(messageWithContext);
      setLastSavedEntry(null);
    }
  };

  const handleReturnHome = () => {
    setIsConfirmationModalOpen(false);
    setLastSavedEntry(null);
    router.push('/dashboard');
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;
    sendMessage(input);
    setInput('');
  };

  const sendMessage = (messageText: string) => {
    const userMessage: Message = { sender: 'user', text: messageText };
    setMessages((prev) => [...prev, userMessage]);
    
    startTransition(async () => {
      const result = await getAiKnoxResponse(messageText);
      if ('error' in result) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
        setMessages((prev) => prev.filter((msg) => msg !== userMessage));
      } else {
        const aiMessage: Message = { sender: 'ai', text: result.therapyResponse };
        setMessages((prev) => [...prev, aiMessage]);
      }
    });
  };

  return (
    <>
      <div className="flex flex-col gap-8 h-full">
        <header>
          <h1 className="text-4xl font-bold font-headline text-foreground">AI Companion</h1>
          <p className="text-muted-foreground mt-2">Your private space for reflection and no-nonsense AI coaching.</p>
        </header>

        <Card className="shadow-neumorphic-outset">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="text-accent" />
              Today's Journal Prompt
              <InfoTooltip content="AI generates personalized daily prompts to help you reflect and gain clarity. Your journal is private unless you choose to discuss it with AI Knox." />
            </CardTitle>
            <CardDescription className="pt-1">{prompt}</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                placeholder="Write your private thoughts here. This is not sent to the AI unless you choose to discuss it."
                rows={6}
                className="bg-background"
                disabled={isSaving}
              />
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleSaveToVault} disabled={isSaving || !journalContent.trim()} className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-accent/20 hover:bg-accent/30 text-accent-foreground">
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              {isSaving ? 'Saving...' : 'Save to Vault'}
            </Button>
          </CardFooter>
        </Card>
        
        <Separator />

        <Card className="shadow-neumorphic-outset flex-grow flex flex-col">
          <CardHeader>
              <CardTitle>Session with AI Knox</CardTitle>
              <CardDescription>Honesty and harsh truths for healing and growth.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden">
            <ScrollArea className="h-[400px] pr-4" ref={scrollAreaRef}>
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-start gap-3',
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.sender === 'ai' && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 text-accent flex items-center justify-center shadow-neumorphic-inset">
                        <Bot size={18} />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-md rounded-lg p-3 text-sm shadow-neumorphic-inset',
                        message.sender === 'user'
                          ? 'bg-accent/20 text-foreground'
                          : 'bg-background'
                      )}
                    >
                      {message.text}
                    </div>
                    {message.sender === 'user' && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-accent/20 text-accent-foreground flex items-center justify-center shadow-neumorphic-inset">
                        <User size={18} />
                      </div>
                    )}
                  </div>
                ))}
                {isPending && messages.length > 0 && (
                  <div className="flex items-start gap-3 justify-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 text-accent flex items-center justify-center shadow-neumorphic-inset">
                      <Bot size={18} />
                    </div>
                    <div className="max-w-md rounded-lg p-3 text-sm shadow-neumorphic-inset bg-background flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin text-accent"/>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Or start a new conversation..."
                autoComplete="off"
                rows={1}
              />
              <Button type="submit" size="icon" disabled={isPending} className="shadow-neumorphic-outset active:shadow-neumorphic-inset aspect-square bg-primary/80 hover:bg-primary">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isConfirmationModalOpen} onOpenChange={setIsConfirmationModalOpen}>
        <DialogContent
          open={isConfirmationModalOpen}
          className="sm:max-w-md shadow-neumorphic-outset bg-background border-transparent"
          hideCloseButton
          role="dialog"
          aria-modal="true"
          aria-label="Entry saved confirmation dialog"
          tabIndex={-1}
        >
          <DialogHeader className="items-center text-center">
            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mb-4 shadow-neumorphic-inset">
              <Lock size={32} />
            </div>
            <DialogTitle className="text-2xl">Entry Saved to Vault</DialogTitle>
            <DialogDescription>
              Your private thoughts are now secured.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
            <Button onClick={handleDiscussWithKnox} className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">
              <MessageSquareQuote className="mr-2 h-4 w-4" />
              Discuss with Knox
            </Button>
            <Button onClick={handleReturnHome} variant="secondary" className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset">
               <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
