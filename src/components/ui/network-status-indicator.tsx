'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, Loader2 } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NetworkStatusIndicatorProps {
  onRetry?: () => Promise<void>;
}

export function NetworkStatusIndicator({ onRetry }: NetworkStatusIndicatorProps) {
  const { isOnline, pendingCount, refreshPendingCount } = useNetworkStatus();
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();

  const handleRetry = async () => {
    if (isRetrying || !onRetry) return;

    setIsRetrying(true);
    try {
      await onRetry();
      await refreshPendingCount();
      
      toast({
        title: 'Sync Complete',
        description: 'All pending operations have been synced.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: 'Some operations could not be synced. Will retry automatically.',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const showIndicator = !isOnline || pendingCount > 0;

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          className={cn(
            'fixed z-50 flex items-center gap-2',
            'top-4 right-4',
            'pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)]'
          )}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 rounded-full bg-background/95 backdrop-blur-sm border border-border shadow-lg px-4 py-2">
            {!isOnline ? (
              <>
                <WifiOff className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Offline</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground">
                  Syncing...
                </span>
              </>
            )}
            
            {pendingCount > 0 && (
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
            
            {isOnline && pendingCount > 0 && onRetry && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
