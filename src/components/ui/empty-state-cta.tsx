import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface EmptyStateCTAProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  ctaElement: React.ReactNode;
}

export function EmptyStateCTA({ icon, title, message, ctaElement }: EmptyStateCTAProps) {
  return (
    <Card className="shadow-neumorphic-outset text-center py-12">
      <CardHeader className="items-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-accent mb-4 shadow-neumorphic-inset">
          {icon}
        </div>
        <h2 className="text-2xl font-bold font-headline text-foreground">{title}</h2>
        <p className="text-muted-foreground">{message}</p>
      </CardHeader>
      <CardContent>
        {ctaElement}
      </CardContent>
    </Card>
  );
}
