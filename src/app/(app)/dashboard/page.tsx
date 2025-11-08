import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { navLinks } from '@/lib/nav-links';
import { LayoutDashboard } from 'lucide-react';

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
        <p className="text-muted-foreground mt-2">Your all-in-one life management dashboard. Pick a module to get started.</p>
      </header>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((link) => (
          <Link href={link.href} key={link.href}>
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
          </Link>
        ))}
      </div>
    </div>
  );
}
