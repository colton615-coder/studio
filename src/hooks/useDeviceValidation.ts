// src/hooks/useDeviceValidation.ts
"use client";

import { useEffect, useState } from "react";

export function useDeviceValidation() {
  const [isValid, setIsValid] = useState(true);
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    const problems: string[] = [];
    if (!('serviceWorker' in navigator)) problems.push("Service worker not supported");
    if (!('Notification' in window)) problems.push("Notifications not supported");
    if (!('indexedDB' in window)) problems.push("IndexedDB not supported");
    if (!window.matchMedia('(pointer: coarse)').matches) problems.push("Device may not be touch-optimized");
    setIssues(problems);
    setIsValid(problems.length === 0);
  }, []);

  return { isValid, issues };
}
