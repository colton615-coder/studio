'use client';
import { useState, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingCart, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ShoppingItem = {
  id: number;
  name: string;
  checked: boolean;
};

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingItem[]>([
    { id: 1, name: 'Milk', checked: false },
    { id: 2, name: 'Bread', checked: true },
    { id: 3, name: 'Eggs', checked: false },
    { id: 4, name: 'Coffee Beans', checked: false },
  ]);
  const [newItem, setNewItem] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const item: ShoppingItem = {
      id: Date.now(),
      name: newItem,
      checked: false,
    };
    setItems([item, ...items]);
    setNewItem('');
  };

  const toggleItem = (id: number) => {
    setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };
  
  const deleteItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

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
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="e.g., Apples"
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
          <div className="space-y-4">
            {items.length > 0 ? items.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg bg-background shadow-neumorphic-inset"
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={item.checked}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="h-5 w-5 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground border-accent"
                  />
                  <label
                    htmlFor={`item-${item.id}`}
                    className={cn(
                      'text-md font-medium',
                      item.checked && 'line-through text-muted-foreground'
                    )}
                  >
                    {item.name}
                  </label>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => deleteItem(item.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            )) : <p className="text-muted-foreground text-center py-4">Your shopping list is empty.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
