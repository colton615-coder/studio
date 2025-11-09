'use client';
import { useState, useTransition, useRef, useEffect } from 'react';
import { getAiKnoxResponse, getDailyPrompt } from './actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, User, Bot, Loader2, Lightbulb, MessageSquareQuote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

type Message = {
  sender: 'user' | 'ai';
  text: string;
};

export function AiKnoxClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // State for Journaling
  const [prompt, setPrompt] = useState<string>('Loading your daily prompt...');
  const [journalContent, setJournalContent] = useState('');


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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);
  
  const handleDiscussEntry = () => {
    if (!journalContent.trim()) {
       toast({
          variant: 'destructive',
          title: 'Journal is Empty',
          description: "You can't discuss an empty journal entry. Write something first.",
        });
      return;
    }
    const messageWithContext = `My journal entry today is: "${journalContent}". Let's talk about that.`;
    sendMessage(messageWithContext);
  };


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
            />
        </CardContent>
        <CardFooter>
           <Button onClick={handleDiscussEntry} disabled={isPending} className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-accent/20 hover:bg-accent/30 text-accent-foreground">
              <MessageSquareQuote className="mr-2 h-4 w-4" />
              Discuss this Entry with Knox
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
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Or start a new conversation..."
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={isPending} className="shadow-neumorphic-outset active:shadow-neumorphic-inset aspect-square bg-primary/80 hover:bg-primary">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
