'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { navLinks } from '@/lib/nav-links';
import { TodayOverview } from '@/components/dashboard/TodayOverview';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { QuickActions } from '@/components/dashboard/QuickActions';

const featureDescriptions: Record<string, string> = {
  "/habits": "Log daily habits and build streaks.",
  "/journal": "Get AI-powered insights from your journal.",
  "/finance": "Track your budgets and spending.",
  "/ai-knox": "Get no-nonsense advice from an AI therapist.",
  "/workouts": "Create and follow workout templates.",
  "/tasks": "Manage your daily to-dos and priorities.",
  "/shopping": "Keep track of your shopping needs.",
  "/calendar": "Organize your events and plans.",
};

export default function DashboardPage() {
  const features = navLinks.filter(link => link.href !== '/dashboard');

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-4xl font-bold font-headline text-foreground">Welcome to LiFE-iN-SYNC</h1>
        <p className="text-muted-foreground mt-2">Your personalized life management dashboard.</p>
      </header>

      <QuickStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayOverview />
        <QuickActions />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">All Modules</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((link) => (
            <Link href={link.href} key={link.href} passHref legacyBehavior>
              <a
                role="button"
                tabIndex={0}
                aria-label={`Open ${link.label} module`}
                className="block focus:outline focus:outline-2 focus:outline-accent"
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    window.location.href = link.href;
                  }
                }}
              >
                <Card className="h-full shadow-neumorphic-outset hover:shadow-neumorphic-inset transition-shadow duration-200 ease-in-out cursor-pointer group">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="p-3 rounded-lg bg-background shadow-neumorphic-inset">
                      <link.icon className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                        {link.label}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">{featureDescriptions[link.href]}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
