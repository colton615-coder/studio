"use client";

import { useCallback, useState, Suspense } from "react";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { TodayOverview } from "@/components/dashboard/TodayOverview";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ErrorBoundary } from "@/components/error-boundary";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh-indicator";
import { NetworkStatusIndicator } from "@/components/ui/network-status-indicator";
import { Skeleton } from "@/components/ui/skeleton";

function QuickStatsFallback() {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
			<Skeleton className="h-32" />
			<Skeleton className="h-32" />
			<Skeleton className="h-32" />
		</div>
	);
}

function TodayOverviewFallback() {
	return (
		<div className="shadow-neumorphic-outset rounded-3xl">
			<div className="p-6 space-y-4">
				<Skeleton className="h-6 w-40" />
				<Skeleton className="h-20 w-full" />
				<Skeleton className="h-12 w-full" />
			</div>
		</div>
	);
}

export default function DashboardPage() {
	const [refreshKey, setRefreshKey] = useState(0);

	const handleRefresh = useCallback(async () => {
		setRefreshKey((prev) => prev + 1);
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}, []);

	const pullToRefresh = usePullToRefresh({
		onRefresh: handleRefresh,
		threshold: 80,
		enabled: true,
	});

	return (
		<div className="flex flex-col gap-6 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
			<PullToRefreshIndicator {...pullToRefresh} />
			<NetworkStatusIndicator onRetry={handleRefresh} />

			<header className="space-y-2">
				<h1 className="text-4xl font-bold font-headline text-foreground">Dashboard</h1>
				<p className="text-muted-foreground">Monitor progress, track habits, and jump into quick tasks.</p>
			</header>

			<ErrorBoundary>
				<Suspense fallback={<QuickStatsFallback />}>
					<QuickStats key={`stats-${refreshKey}`} />
				</Suspense>
			</ErrorBoundary>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<ErrorBoundary>
					<Suspense fallback={<TodayOverviewFallback />}>
						<TodayOverview key={`overview-${refreshKey}`} />
					</Suspense>
				</ErrorBoundary>
				<ErrorBoundary>
					<QuickActions />
				</ErrorBoundary>
			</div>
		</div>
	);
}
