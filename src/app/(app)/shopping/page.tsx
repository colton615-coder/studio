'use client';
import { useState, useMemo, FormEvent } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingCart, PlusCircle, Trash2, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { EmptyStateCTA } from '@/components/ui/empty-state-cta';

type ShoppingListItem = {
  id: string;
  userProfileId: string;
  description: string;
  quantity: number;
  purchased: boolean;
  isOptimistic?: boolean;
};

export default function ShoppingListPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newItemDescription, setNewItemDescription] = useState('');

  const shoppingListCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'shoppingListItems');
  }, [user, firestore]);

  const { data: items, isLoading, setData: setItems } = useCollection<ShoppingListItem>(shoppingListCollection);

  const { neededItems, purchasedItems } = useMemo(() => {
    const needed: ShoppingListItem[] = [];
    const purchased: ShoppingListItem[] = [];
    items?.forEach(item => {
      if (item.purchased) {
        purchased.push(item);
      } else {
        needed.push(item);
      }
    });
    return { neededItems: needed, purchasedItems: purchased };
  }, [items]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newItemDescription.trim() || !user || !shoppingListCollection || !items || !setItems) return;
    
    const description = newItemDescription;
    setNewItemDescription('');

    const optimisticId = uuidv4();
    const optimisticItem: ShoppingListItem = {
      id: optimisticId,
      userProfileId: user.uid,
      description: description,
      quantity: 1,
      purchased: false,
      isOptimistic: true,
    };

    // 1. Optimistic UI update
    setItems([...items, optimisticItem]);

    try {
      // 2. Background Firestore write
      const docRef = doc(shoppingListCollection, optimisticId);
      setDocumentNonBlocking(docRef, {
        id: optimisticId,
        userProfileId: user.uid,
        description: description,
        quantity: 1,
        purchased: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Item Added', description: `"${description}" was added to your list.` });
    } catch (error) {
      // 3. Rollback on failure
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add item to your list.' });
      setItems(items.filter(item => item.id !== optimisticId));
    }
  };

  const toggleItem = (item: ShoppingListItem) => {
    if (!shoppingListCollection) return;
    const docRef = doc(shoppingListCollection, item.id);
    updateDocumentNonBlocking(docRef, { purchased: !item.purchased });
  };
  
  const deleteItem = (itemToDelete: ShoppingListItem) => {
    if (!shoppingListCollection || !items || !setItems) return;

    const originalItems = [...items];
    // 1. Optimistic UI Update
    setItems(originalItems.filter(item => item.id !== itemToDelete.id));

    try {
      // 2. Background Firestore delete
      const docRef = doc(shoppingListCollection, itemToDelete.id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: 'Item Removed', description: `"${itemToDelete.description}" was removed from your list.` });
    } catch (error) {
       // 3. Rollback on failure
       toast({ variant: 'destructive', title: 'Error', description: 'Could not remove item from your list.' });
       setItems(originalItems);
    }
  };

  const ListItemSkeleton = () => (
    <div className="flex items-center justify-between p-4 rounded-lg bg-background shadow-neumorphic-inset">
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-5 rounded-sm" />
        <Skeleton className="h-5 w-40" />
      </div>
      <Skeleton className="h-8 w-8" />
    </div>
  );

  const renderShoppingList = (title: string, list: ShoppingListItem[], icon: React.ReactNode, type: 'needed' | 'purchased') => (
     <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold text-muted-foreground mb-4">
            {icon}
            {title}
        </h3>
        <div className="space-y-4">
            <AnimatePresence>
            {list.map(item => (
            <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3 }}
                className={cn(item.isOptimistic && 'opacity-50 pointer-events-none')}
            >
                <div className="flex items-center justify-between p-4 rounded-lg bg-background shadow-neumorphic-inset">
                  <div className="flex items-center gap-4">
                  <Checkbox
                      id={`item-${item.id}`}
                      checked={item.purchased}
                      onCheckedChange={() => toggleItem(item)}
                      className="h-5 w-5 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground border-accent"
                  />
                  <label
                      htmlFor={`item-${item.id}`}
                      className={cn(
                      'text-md font-medium',
                      item.purchased && 'line-through text-muted-foreground'
                      )}
                  >
                      {item.description}
                  </label>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => deleteItem(item)}>
                  <Trash2 size={16} />
                  </Button>
              </div>
            </motion.div>
            ))}
            </AnimatePresence>
            {list.length === 0 && (
                type === 'needed' ? (
                    <p className="text-muted-foreground text-center py-4 text-sm">Your list is empty. Add an item above to get started!</p>
                ) : (
                    <p className="text-muted-foreground text-center py-4 text-sm">Move items here by checking them off your list.</p>
                )
            )}
        </div>
     </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-4xl font-bold font-headline text-foreground">Shopping List</h1>
        <p className="text-muted-foreground mt-2">Track groceries and other essentials to restock.</p>
      </header>
      {isLoading ? (
        <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
        </>
      ) : items && items.length > 0 ? (
        <>
          <Card className="shadow-neumorphic-outset">
            <CardHeader>
              <CardTitle>Add New Item</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex items-center gap-4">
                <Input
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  placeholder="e.g., Organic milk"
                  className="flex-grow"
                />
                <Button type="submit" className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic-outset">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="text-accent" />
                Your List
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                {renderShoppingList('Needed', neededItems, <ShoppingCart size={20} />, 'needed')}
                {purchasedItems.length > 0 && <Separator />}
                {renderShoppingList('In Cart', purchasedItems, <Tags size={20} />, 'purchased')}
                </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyStateCTA
            icon={<ShoppingCart size={32} />}
            title="Start Your Shopping List"
            message="Add your first item to keep track of what you need."
            ctaElement={
                <form onSubmit={handleSubmit} className="flex items-center gap-4 w-full max-w-sm mx-auto">
                    <Input
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="e.g., Organic milk"
                    className="flex-grow"
                    />
                    <Button type="submit" className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add
                    </Button>
                </form>
            }
        />
      )}
    </div>
  );
}
