import React from "react";
import { Card } from "@/components/ui/Card";

export default function GolfModule() {
  // Stub: Replace with real golf stats, session tracking, and analytics
  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <Card className="mb-2">
        <div className="flex flex-col gap-2">
          <span className="text-lg font-bold text-accent-info">Golf Stats</span>
          <span className="text-xs text-muted">Coming soon: Track your golf sessions, scores, and progress.</span>
        </div>
      </Card>
      <Card>
        <div className="text-center text-muted text-sm py-8">
          Golf module is under construction.<br />
          Soon you'll be able to log sessions, analyze performance, and sync with your dashboard.
        </div>
      </Card>
    </div>
  );
}
