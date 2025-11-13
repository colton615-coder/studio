
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import { MotionDiv } from '@/lib/motion';

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  // Don't render anything while checking auth - the AuthGate in FirebaseClientProvider
  // will show the splash screen
  if (isUserLoading) {
    return null;
  }

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
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to access your personalized dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">Authentication is currently being configured.</p>
              <p>Please check back soon or contact your administrator for access.</p>
            </div>
          </CardContent>
        </Card>
      </MotionDiv>
    </main>
  );
}
