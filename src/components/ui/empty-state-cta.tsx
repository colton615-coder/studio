import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface EmptyStateCTAProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  ctaElement: React.ReactNode;
}

export function EmptyStateCTA({ icon, title, message, ctaElement }: EmptyStateCTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="shadow-neumorphic-outset text-center py-12">
      <CardHeader className="items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2
            }}
            className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-accent mb-4 shadow-neumorphic-inset"
          >
          {icon}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold font-headline text-foreground"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground"
          >
            {message}
          </motion.p>
      </CardHeader>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <CardContent>
        {ctaElement}
          </CardContent>
        </motion.div>
    </Card>
    </motion.div>
  );
}
