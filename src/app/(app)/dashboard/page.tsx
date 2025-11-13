"use client";

import { useCallback, useState, Suspense } from "react";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { TodayOverview } from "@/components/dashboard/TodayOverview";
import { ErrorBoundary } from "@/components/error-boundary";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh-indicator";
import { NetworkStatusIndicator } from "@/components/ui/network-status-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { MotionDiv } from "@/lib/motion";

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
	const moduleOrder = ['/dashboard', '/habits', '/tasks', '/finance', '/ai-knox'];

	const handleRefresh = useCallback(async () => {
		setRefreshKey((prev) => prev + 1);
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}, []);

	const pullToRefresh = usePullToRefresh({
		onRefresh: handleRefresh,
		threshold: 80,
		enabled: true,
	});

	// Swipe navigation logic
	const router = useRouter();
	const currentIndex = moduleOrder.indexOf('/dashboard');
	const handleSwipe = (_event: MouseEvent, info: { offset: { x: number } }) => {
		if (info.offset.x < -80 && currentIndex < moduleOrder.length - 1) {
			router.push(moduleOrder[currentIndex + 1]);
		} else if (info.offset.x > 80 && currentIndex > 0) {
			router.push(moduleOrder[currentIndex - 1]);
		}
	};

	return (
		<MotionDiv
			className="flex flex-col gap-6"
			drag="x"
			dragConstraints={{ left: 0, right: 0 }}
			onDragEnd={handleSwipe}
		>
			<PullToRefreshIndicator {...pullToRefresh} />
			<NetworkStatusIndicator onRetry={handleRefresh} />

			<header className="space-y-2">
				<h1 className="text-4xl font-bold font-headline text-foreground">Dashboard</h1>
				<p className="text-muted-foreground">Your time on earth is limited. Let's at least do something with it.</p>
			</header>

			<ErrorBoundary>
				<Suspense fallback={<QuickStatsFallback />}>
					<QuickStats key={`stats-${refreshKey}`} />
				</Suspense>
			</ErrorBoundary>

			<ErrorBoundary>
				<Suspense fallback={<TodayOverviewFallback />}>
					<TodayOverview key={`overview-${refreshKey}`} />
				</Suspense>
			</ErrorBoundary>
		</MotionDiv>
	);
}
