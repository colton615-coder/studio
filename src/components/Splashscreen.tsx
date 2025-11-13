import React, { useEffect, useState } from "react";

export default function Splashscreen() {
  const [affirmation, setAffirmation] = useState<string>("");

  useEffect(() => {
    fetch("/src/data/affirmations.json")
      .then((res) => res.json())
      .then((data: string[]) => {
        const random = data[Math.floor(Math.random() * data.length)];
        setAffirmation(random);
      });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background-primary text-foreground">
      <div className="text-2xl font-bold mb-4">LifeSync</div>
      <div className="text-lg font-medium text-accent-info animate-pulse mb-2">{affirmation}</div>
      <div className="text-xs text-muted">Initializing your data...</div>
    </div>
  );
}
