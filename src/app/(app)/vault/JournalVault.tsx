'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Lock } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyStateCTA } from '@/components/ui/empty-state-cta';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type JournalEntry = {
    id: string;
    content: string;
    createdAt: {
        toDate: () => Date;
    }
};

export function JournalVault() {
    const { user } = useUser();
    const firestore = useFirestore();

    const journalEntriesCollection = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        // Query to order entries by creation date, descending
        return query(collection(firestore, 'users', user.uid, 'journalEntries'), orderBy('createdAt', 'desc'));
    }, [user, firestore]);

    const { data: entries, isLoading } = useCollection<JournalEntry>(journalEntriesCollection);

    const VaultSkeleton = () => (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );

    return (
        <div className="flex flex-col gap-8">
            <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-4xl font-bold font-headline text-foreground">Secure Vault</h1>
                    <p className="text-muted-foreground mt-2">Browse your securely saved journal entries.</p>
                </div>
                <Button asChild variant="outline" className="shadow-neumorphic-outset active:shadow-neumorphic-inset mt-4 md:mt-0">
                    <Link href="/vault/settings">Security Settings</Link>
                </Button>
            </header>

            <Card neu>
                <CardHeader>
                    <CardTitle>Past Entries</CardTitle>
                    <CardDescription>Your thoughts, safe and sound.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <VaultSkeleton />
                    ) : !entries || entries.length === 0 ? (
                        <EmptyStateCTA
                            icon={<Lock size={32} />}
                            title="Your Vault is Empty"
                            message="Your private journal entries are saved here after you write them in the AI Companion."
                            ctaElement={
                                <Button asChild variant="outline" className="shadow-neumorphic-outset active:shadow-neumorphic-inset">
                                    <Link href="/ai-knox">Write Your First Entry</Link>
                                </Button>
                            }
                        />
                    ) : (
                        <Accordion type="single" collapsible className="w-full">
                            {entries.map((entry) => (
                                <AccordionItem value={entry.id} key={entry.id}>
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex justify-between items-center w-full pr-4">
                                            <span className="font-semibold text-foreground">
                                                {format(entry.createdAt.toDate(), 'MMMM d, yyyy')}
                                            </span>
                                            <span className="text-sm text-muted-foreground truncate max-w-xs">
                                                {entry.content.substring(0, 50)}...
                                            </span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 bg-background shadow-neumorphic-inset rounded-b-lg">
                                        <p className="whitespace-pre-wrap">{entry.content}</p>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
