'use client';
import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, PiggyBank, Receipt, PlusCircle, Loader2 } from 'lucide-react';
import { FinanceChart } from './FinanceChart';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// From backend.json
type Budget = {
  id?: string;
  userProfileId: string;
  name: string;
  amount: number;
  startDate: any;
  endDate: any;
  createdAt: any;
};

type Expense = {
  id?: string;
  userProfileId: string;
  budgetId: string;
  description: string;
  amount: number;
  date: any;
  createdAt: any;
};

export default function FinancePage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [newBudgetName, setNewBudgetName] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [newExpenseDescription, setNewExpenseDescription] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  const budgetsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'budgets');
  }, [user, firestore]);

  const { data: budgets, isLoading: isLoadingBudgets } = useCollection<Budget>(budgetsCollection);

  // Assuming a single budget for now for simplicity
  const activeBudget = useMemo(() => (budgets ? budgets[0] : null), [budgets]);

  const expensesCollection = useMemoFirebase(() => {
    if (!user || !firestore || !activeBudget) return null;
    return collection(firestore, 'users', user.uid, 'budgets', activeBudget.id, 'expenses');
  }, [user, firestore, activeBudget]);

  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesCollection);

  const spent = useMemo(() => {
    return expenses?.reduce((acc, expense) => acc + expense.amount, 0) ?? 0;
  }, [expenses]);
  
  const budgetAmount = activeBudget?.amount ?? 0;
  const remaining = budgetAmount - spent;
  const progress = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

  const handleAddBudget = () => {
    if (newBudgetName.trim() && newBudgetAmount && user && budgetsCollection) {
      addDocumentNonBlocking(budgetsCollection, {
        userProfileId: user.uid,
        name: newBudgetName,
        amount: parseFloat(newBudgetAmount),
        startDate: serverTimestamp(), // Simplified for now
        endDate: serverTimestamp(),   // Simplified for now
        createdAt: serverTimestamp(),
      });
      setNewBudgetName('');
      setNewBudgetAmount('');
      setIsBudgetDialogOpen(false);
    }
  };

  const handleAddExpense = () => {
    if (newExpenseDescription.trim() && newExpenseAmount && user && expensesCollection) {
      addDocumentNonBlocking(expensesCollection, {
        userProfileId: user.uid,
        budgetId: activeBudget!.id,
        description: newExpenseDescription,
        amount: parseFloat(newExpenseAmount),
        date: serverTimestamp(), // Using server timestamp for expense date
        createdAt: serverTimestamp(),
      });
      setNewExpenseDescription('');
      setNewExpenseAmount('');
      setIsExpenseDialogOpen(false);
    }
  };
  
  const isLoading = isLoadingBudgets || (activeBudget && isLoadingExpenses);

  const monthlySpending = useMemo(() => {
    if (!expenses) return [];
    const spendingByMonth: {[key: string]: number} = {};
    expenses.forEach(expense => {
      const month = format(expense.date.toDate(), 'MMM');
      spendingByMonth[month] = (spendingByMonth[month] || 0) + expense.amount;
    });

    // Format for chart
    return Object.keys(spendingByMonth).map(month => ({
      month,
      spending: spendingByMonth[month]
    }));
  }, [expenses]);


  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold font-headline text-foreground">Finance</h1>
          <p className="text-muted-foreground mt-2">Manage your budgets and visualize your spending habits.</p>
        </div>
        <div className="flex gap-2">
           <Button onClick={() => setIsBudgetDialogOpen(true)} className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground" disabled={!!activeBudget}>
             <PlusCircle className="mr-2 h-4 w-4" />
             New Budget
           </Button>
            <Button onClick={() => setIsExpenseDialogOpen(true)} className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-accent/20 hover:bg-accent/30 text-accent-foreground" disabled={!activeBudget}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
        </div>
      </header>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
           <Loader2 className="h-12 w-12 animate-spin text-accent" />
        </div>
      ) : !activeBudget ? (
         <Card className="shadow-neumorphic-outset text-center py-12">
            <CardHeader>
               <CardTitle>No Budget Found</CardTitle>
               <CardDescription>Create a budget to start tracking your finances.</CardDescription>
            </CardHeader>
            <CardContent>
               <Button onClick={() => setIsBudgetDialogOpen(true)} className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Budget
               </Button>
            </CardContent>
         </Card>
      ) : (
      <>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="shadow-neumorphic-outset">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{activeBudget.name}</CardTitle>
              <PiggyBank className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${budgetAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">for this period</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic-outset">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Amount Spent</CardTitle>
              <Receipt className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${spent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">in current period</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic-outset">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <DollarSign className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${remaining.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">to stay on budget</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-neumorphic-outset">
          <CardHeader>
            <CardTitle>Budget Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-4 bg-background shadow-neumorphic-inset" indicatorClassName="bg-accent" />
            <div className="flex justify-between text-sm mt-2 text-muted-foreground">
              <span>${spent.toLocaleString()} spent</span>
              <span>${budgetAmount.toLocaleString()} total</span>
            </div>
          </CardContent>
        </Card>
        
        <FinanceChart data={monthlySpending} />
      </>
      )}
       <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
        <DialogContent className="shadow-neumorphic-outset bg-background border-transparent">
          <DialogHeader>
            <DialogTitle>Create a New Budget</DialogTitle>
            <DialogDescription>
              Define a new budget to track your spending.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="budget-name" className="text-right">
                Name
              </Label>
              <Input
                id="budget-name"
                value={newBudgetName}
                onChange={(e) => setNewBudgetName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Monthly Groceries"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="budget-amount" className="text-right">
                Amount ($)
              </Label>
              <Input
                id="budget-amount"
                type="number"
                value={newBudgetAmount}
                onChange={(e) => setNewBudgetAmount(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 500"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary" className="shadow-neumorphic-outset active:shadow-neumorphic-inset">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddBudget} className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">Save Budget</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent className="shadow-neumorphic-outset bg-background border-transparent">
          <DialogHeader>
            <DialogTitle>Add a New Expense</DialogTitle>
            <DialogDescription>
              Log a new expense for your '{activeBudget?.name}' budget.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expense-desc" className="text-right">
                Description
              </Label>
              <Input
                id="expense-desc"
                value={newExpenseDescription}
                onChange={(e) => setNewExpenseDescription(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Weekly groceries"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expense-amount" className="text-right">
                Amount ($)
              </Label>
              <Input
                id="expense-amount"
                type="number"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 75.50"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary" className="shadow-neumorphic-outset active:shadow-neumorphic-inset">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddExpense} className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">Save Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    