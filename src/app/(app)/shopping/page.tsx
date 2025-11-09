'use client';
import { useState, useMemo, FormEvent } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingCart, PlusCircle, Trash2, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

type ShoppingListItem = {
  id: string;
  userProfileId: string;
  description: string;
  quantity: number;
  purchased: boolean;
};

export default function ShoppingListPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [newItemDescription, setNewItemDescription] = useState('');

  const shoppingListCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'shoppingListItems');
  }, [user, firestore]);

  const { data: items, isLoading } = useCollection<ShoppingListItem>(shoppingListCollection);

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
    if (!newItemDescription.trim() || !user || !shoppingListCollection) return;
    
    addDocumentNonBlocking(shoppingListCollection, {
      userProfileId: user.uid,
      description: newItemDescription,
      quantity: 1, // Default quantity
      purchased: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setNewItemDescription('');
  };

  const toggleItem = (item: ShoppingListItem) => {
    if (!shoppingListCollection) return;
    const docRef = doc(shoppingListCollection, item.id);
    updateDocumentNonBlocking(docRef, { purchased: !item.purchased });
  };
  
  const deleteItem = (id: string) => {
    if (!shoppingListCollection) return;
    const docRef = doc(shoppingListCollection, id);
    deleteDocumentNonBlocking(docRef);
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

  const renderShoppingList = (title: string, list: ShoppingListItem[], icon: React.ReactNode) => (
     <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold text-muted-foreground mb-4">
            {icon}
            {title}
        </h3>
        <div className="space-y-4">
            {list.length > 0 ? list.map(item => (
            <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg bg-background shadow-neumorphic-inset"
            >
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
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => deleteItem(item.id)}>
                <Trash2 size={16} />
                </Button>
            </div>
            )) : <p className="text-muted-foreground text-center py-4 text-sm">Nothing here!</p>}
        </div>
     </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-4xl font-bold font-headline text-foreground">Shopping List</h1>
        <p className="text-muted-foreground mt-2">Track groceries and other essentials to restock.</p>
      </header>

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
          {isLoading ? (
            <div className="space-y-8">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-muted-foreground mb-4">
                  <ShoppingCart size={20} />
                  Needed
                </h3>
                <div className="space-y-4">
                  <ListItemSkeleton />
                  <ListItemSkeleton />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-muted-foreground mb-4">
                  <Tags size={20} />
                  In Cart
                </h3>
                 <div className="space-y-4">
                  <ListItemSkeleton />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {renderShoppingList('Needed', neededItems, <ShoppingCart size={20} />)}
              {purchasedItems.length > 0 && <Separator />}
              {renderShoppingList('In Cart', purchasedItems, <Tags size={20} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
