
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleSignIn = () => {
    initiateAnonymousSignIn(auth);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-neumorphic-outset">
          <Bot className="h-10 w-10 text-accent" />
        </div>
        <h1 className="text-5xl font-bold font-headline text-accent">LiFE-iN-SYNC</h1>
      </div>

      <Card className="w-full max-w-sm shadow-neumorphic-outset">
        <CardHeader className="text-center">
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Sign in to continue to your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          {isUserLoading ? (
            <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <Button onClick={handleSignIn} className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">
              Sign In Anonymously
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
