'use client';
import { useState, useTransition, useRef, useEffect } from 'react';
import { getAiKnoxResponse } from './actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const currentInput = input;
    const userMessage: Message = { sender: 'user', text: currentInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    startTransition(async () => {
      const result = await getAiKnoxResponse(currentInput);
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
        <h1 className="text-4xl font-bold font-headline text-foreground">AI Knox</h1>
        <p className="text-muted-foreground mt-2">No nonsense, call-it-like-it-is AI therapy.</p>
      </header>
      <Card className="shadow-neumorphic-outset flex-grow flex flex-col">
        <CardHeader>
            <CardTitle>Session with AI Knox</CardTitle>
            <CardDescription>Honesty and harsh truths for healing and growth.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
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
              placeholder="Tell me what's wrong..."
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
