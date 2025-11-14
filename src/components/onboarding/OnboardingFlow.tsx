'use client';
import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Target, Brain, Dumbbell, Wallet, ListTodo, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type OnboardingStep = 'welcome' | 'modules' | 'ai-intro' | 'complete';

const MODULE_OPTIONS = [
  { id: 'habits', name: 'Habit Tracker', icon: Target, description: 'Build daily routines and streaks' },
  { id: 'finance', name: 'Finance', icon: Wallet, description: 'Track budgets and expenses' },
  { id: 'tasks', name: 'Tasks', icon: ListTodo, description: 'Manage your to-dos' },
  { id: 'workouts', name: 'Workouts', icon: Dumbbell, description: 'AI-powered fitness plans' },
];

interface OnboardingFlowProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingFlow({ open, onComplete }: OnboardingFlowProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleComplete = async () => {
    if (!user || !firestore) return;
    
    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        onboardingCompleted: true,
        preferredModules: selectedModules.length ? selectedModules : [],
        onboardingCompletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onComplete();
    } catch {
      onComplete();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-3xl font-headline">Welcome to LiFE-iN-SYNC! 🎉</DialogTitle>
              <DialogDescription className="text-base mt-4">
                Your all-in-one personal life management system. Let's get you set up in just a few steps.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="text-green-400 mt-1" size={24} />
                <div>
                  <p className="font-semibold text-foreground">Track Everything</p>
                  <p className="text-sm text-muted-foreground">Habits, tasks, budgets, workouts, and more—all in one place.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Brain className="text-purple-400 mt-1" size={24} />
                <div>
                  <p className="font-semibold text-foreground">AI-Powered Insights</p>
                  <p className="text-sm text-muted-foreground">Get personalized suggestions and coaching from AI Knox.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Sparkles className="text-accent mt-1" size={24} />
                <div>
                  <p className="font-semibold text-foreground">Your Data, Your Control</p>
                  <p className="text-sm text-muted-foreground">Secure Firebase storage with complete privacy.</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-8">
              <Button onClick={() => setStep('modules')} className="shadow-neumorphic-outset active:shadow-neumorphic-inset">
                Get Started
                <ChevronRight className="ml-2" size={16} />
              </Button>
            </div>
          </>
        );

      case 'modules':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Choose Your Starting Modules</DialogTitle>
              <DialogDescription className="mt-2">
                Select the features you'd like to explore first. You can always access all modules later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {MODULE_OPTIONS.map(module => (
                <Card 
                  key={module.id}
                  className={cn(
                    'cursor-pointer transition-all shadow-neumorphic-outset hover:shadow-neumorphic-inset',
                    selectedModules.includes(module.id) && 'ring-2 ring-accent'
                  )}
                  onClick={() => toggleModule(module.id)}
                >
                  <CardContent className="flex flex-col items-center text-center p-6">
                    <module.icon className={cn('mb-3', selectedModules.includes(module.id) ? 'text-accent' : 'text-muted-foreground')} size={32} />
                    <p className="font-semibold text-foreground mb-1">{module.name}</p>
                    <p className="text-xs text-muted-foreground">{module.description}</p>
                    {selectedModules.includes(module.id) && (
                      <CheckCircle2 className="text-accent mt-2" size={20} />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setStep('welcome')}>
                Back
              </Button>
              <Button onClick={() => setStep('ai-intro')} className="shadow-neumorphic-outset active:shadow-neumorphic-inset">
                Continue
                <ChevronRight className="ml-2" size={16} />
              </Button>
            </div>
          </>
        );

      case 'ai-intro':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Brain className="text-purple-400" size={28} />
                Meet AI Knox
              </DialogTitle>
              <DialogDescription className="mt-2">
                Your straight-talking AI companion for honest advice and insights.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-6">
              <Card className="shadow-neumorphic-inset bg-accent/5 border-accent/20">
                <CardContent className="p-4">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">AI Knox</span> is here to help you stay on track with:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="text-green-400 mt-0.5" size={16} />
                      <span><strong>Habit Coaching:</strong> Personalized suggestions to build better routines</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="text-green-400 mt-0.5" size={16} />
                      <span><strong>Budget Analysis:</strong> Smart spending insights and recommendations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="text-green-400 mt-0.5" size={16} />
                      <span><strong>Workout Plans:</strong> Custom fitness routines tailored to your goals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="text-green-400 mt-0.5" size={16} />
                      <span><strong>Journal Prompts:</strong> Daily reflections and mental clarity</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <p className="text-sm text-muted-foreground text-center">
                Pro tip: Look for the <Sparkles className="inline text-accent" size={14} /> icon throughout the app for AI-powered features!
              </p>
            </div>
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setStep('modules')}>
                Back
              </Button>
              <Button onClick={() => setStep('complete')} className="shadow-neumorphic-outset active:shadow-neumorphic-inset">
                Continue
                <ChevronRight className="ml-2" size={16} />
              </Button>
            </div>
          </>
        );

      case 'complete':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-3xl font-headline text-center">You're All Set! 🚀</DialogTitle>
              <DialogDescription className="text-base mt-4 text-center">
                Your personalized dashboard is ready. Start exploring your modules and make life a little more in sync.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 p-6 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm text-foreground text-center">
                <strong>Quick Tip:</strong> Check your dashboard daily to see progress across all your modules at a glance.
              </p>
            </div>
            <div className="flex justify-center mt-8">
              <Button onClick={handleComplete} size="lg" className="shadow-neumorphic-outset active:shadow-neumorphic-inset">
                Go to Dashboard
              </Button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
