'use client';
import { useCallback, useState, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { navLinks } from '@/lib/nav-links';
import { TodayOverview } from '@/components/dashboard/TodayOverview';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh-indicator';
import { NetworkStatusIndicator } from '@/components/ui/network-status-indicator';
import { ErrorBoundary } from '@/components/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';

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

// Loading fallback components
function QuickStatsLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
  );
}

function TodayOverviewLoading() {
  return (
    <Card className="shadow-neumorphic-outset">
      <CardHeader>
        <CardTitle>Today's Progress</CardTitle>
      </CardHeader>
      <div className="p-6 space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </Card>
  );
}

function QuickActionsLoading() {
  return (
    <Card className="shadow-neumorphic-outset">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </Card>
  );
}

function ModuleGridLoading() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-4">All Modules</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const features = navLinks.filter(link => link.href !== '/dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(async () => {
    // Trigger re-render by updating key
    setRefreshKey(prev => prev + 1);
    // Wait for data to refresh (simulate API call)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    enabled: true,
  });

  return (
    <div className="flex flex-col gap-6">
      <PullToRefreshIndicator {...pullToRefresh} />
      <NetworkStatusIndicator onRetry={handleRefresh} />

      {/* QuickStats with Error Boundary and Suspense */}
      <ErrorBoundary>
        <Suspense fallback={<QuickStatsLoading />}>
          <QuickStats key={`stats-${refreshKey}`} />
        </Suspense>
      </ErrorBoundary>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TodayOverview with Error Boundary and Suspense */}
        <ErrorBoundary>
          <Suspense fallback={<TodayOverviewLoading />}>
            <TodayOverview key={`overview-${refreshKey}`} />
          </Suspense>
        </ErrorBoundary>

        {/* QuickActions with Error Boundary and Suspense */}
        <ErrorBoundary>
          <Suspense fallback={<QuickActionsLoading />}>
            <QuickActions />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Module Grid with Error Boundary and Suspense */}
      <ErrorBoundary>
        <Suspense fallback={<ModuleGridLoading />}>
          <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">All Modules</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              aria-label={`Open ${link.label} module`}
              className="block focus:outline focus:outline-2 focus:outline-accent"
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
            </Link>
          ))}
        </div>
      </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
