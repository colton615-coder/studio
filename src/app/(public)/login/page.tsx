
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Lock } from 'lucide-react';
import { MotionDiv } from '@/lib/motion';
import { Button } from '@/components/ui/button';

/**
 * Login page - NO AUTHENTICATION REQUIRED
 * The app is open to all users without login
 * Only "The Vault" requires a 4-digit PIN
 */
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect immediately to dashboard since no auth is needed
    router.push('/dashboard');
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <MotionDiv
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4 mb-8"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-neumorphic-outset">
          <Bot className="h-10 w-10 text-accent" />
        </div>
        <h1 className="text-5xl font-bold font-headline text-accent">LiFE-iN-SYNC</h1>
      </MotionDiv>

      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="w-full max-w-sm shadow-neumorphic-outset">
          <CardHeader className="text-center">
            <CardTitle>Welcome to LiFE-iN-SYNC</CardTitle>
            <CardDescription>Your all-in-one life management dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground space-y-3">
              <p>No login required! Access your dashboard freely.</p>
              <div className="flex items-center justify-center gap-2 text-accent">
                <Lock className="h-4 w-4" />
                <p className="font-medium">Only "The Vault" requires a 4-digit PIN</p>
              </div>
            </div>
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="w-full shadow-neumorphic-outset"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </MotionDiv>
    </main>
  );
}
