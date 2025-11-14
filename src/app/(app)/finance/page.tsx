'use client';
import { useState, useMemo, useTransition, FormEvent, useCallback, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, query, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getBudgetSuggestions } from './actions';
import { motion, AnimatePresence } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh-indicator';
import { NetworkStatusIndicator } from '@/components/ui/network-status-indicator';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, PiggyBank, Receipt, PlusCircle, Loader2, Wand2, BrainCircuit, Lightbulb, MoreVertical, Trash2 } from 'lucide-react';

// Lazy load FinanceChart to reduce initial bundle size by ~200KB
const FinanceChart = lazy(() => import('./FinanceChart').then(mod => ({ default: mod.FinanceChart })));
import { Button } from '@/components/ui/button';
import { EmeraldPrismButton } from '@/components/ui/EmeraldPrismButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyStateCTA } from '@/components/ui/empty-state-cta';
import { AICoPilotThinking } from '@/components/ui/ai-copilot-thinking';
import { InfoTooltip } from '@/components/ui/info-tooltip';

const SPENDING_CATEGORIES = [
  'food', 'transport', 'housing', 'bills', 'entertainment', 'shopping', 'health', 'other'
];

type Budget = {
  id: string;
  userProfileId: string;
  name: string;
  amount: number;
  category: string;
  period: 'monthly' | 'weekly' | 'yearly';
  createdAt: any;
};

type Expense = {
  id: string;
  budgetId: string;
  description: string;
  amount: number;
  category: string;
  date: any;
};

type BudgetWithSpending = Budget & {
  spent: number;
  progress: number;
  remaining: number;
};

type AISuggestion = {
  name: string;
  amount: number;
  category: string;
  period: 'monthly' | 'weekly' | 'yearly';
}

const AI_ANALYSIS_STEPS = [
    "Analyzing spending patterns...",
    "Identifying high-spending areas...",
    "Cross-referencing existing budgets...",
    "Formulating actionable suggestions...",
];

export default function FinancePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Dialog states
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [budgetCreateSuccess, setBudgetCreateSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    enabled: true,
  });

  // Budget form states
  const [newBudgetName, setNewBudgetName] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [newBudgetCategory, setNewBudgetCategory] = useState<string>('');
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Expense form states
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseDescription, setNewExpenseDescription] = useState('');
  const [targetBudgetId, setTargetBudgetId] = useState('');
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  const [aiFeedback, setAiFeedback] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isAnalyzing, startAiTransition] = useTransition();
  const [showAiThinking, setShowAiThinking] = useState(false);

  const budgetsCollection = useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'budgets');
  }, [user, firestore, refreshKey]);

  const { data: budgets, isLoading: isLoadingBudgets } = useCollection<Budget>(budgetsCollection, { mode: 'realtime' });

  const expensesQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      orderBy('date', 'desc'),
      limit(50) // Only fetch recent 50 expenses for performance
    );
  }, [user, firestore, refreshKey]);

  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery, { mode: 'realtime' });


  const budgetsWithSpending: BudgetWithSpending[] = useMemo(() => {
    return budgets?.map(budget => {
      const budgetExpenses = expenses?.filter(e => e.budgetId === budget.id) ?? [];
      const spent = budgetExpenses.reduce((acc, expense) => acc + expense.amount, 0);
      const remaining = budget.amount - spent;
      const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      return { ...budget, spent, remaining, progress };
    }) ?? [];
  }, [budgets, expenses]);
  
  const totalBudget = useMemo(() => budgets?.reduce((acc, b) => acc + b.amount, 0) ?? 0, [budgets]);
  const totalSpent = useMemo(() => expenses?.reduce((acc, e) => acc + e.amount, 0) ?? 0, [expenses]);
  const totalRemaining = totalBudget - totalSpent;
  

  const handleAddBudget = async (budgetData: { name: string; amount: number; category: string; period: 'monthly' | 'weekly' | 'yearly' }) => {
    if (!user || !budgetsCollection) {
      toast({
        variant: 'destructive',
        title: 'Cannot Add Budget',
        description: 'Please ensure you are logged in and try again.',
      });
      return;
    }
     try {
      await addDocumentNonBlocking(budgetsCollection, {
        userProfileId: user.uid, 
        name: budgetData.name,
        amount: budgetData.amount,
        category: budgetData.category,
        period: budgetData.period,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Removing suggestion from list provides sufficient feedback
      setAiSuggestions(s => s.filter(s => s.category !== budgetData.category));
     } catch {
       toast({ variant: 'destructive', title: "Creation Failed", description: "Could not save the AI suggested budget." });
     }
  };
  
  const handleManualAddBudget = async () => {
    if(!newBudgetName.trim() || !newBudgetAmount || !newBudgetCategory || !user || !budgetsCollection) return;

    setIsSavingBudget(true);
    try {
        await addDocumentNonBlocking(budgetsCollection, {
            userProfileId: user.uid,
            name: newBudgetName,
            amount: parseFloat(newBudgetAmount),
            category: newBudgetCategory,
            period: 'monthly',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        setRefreshKey(k => k + 1);
        setBudgetCreateSuccess(true);
        setTimeout(() => {
          setBudgetCreateSuccess(false);
        }, 1200);

        setIsBudgetDialogOpen(false);
        setNewBudgetName('');
        setNewBudgetAmount('');
        setNewBudgetCategory('');

    } catch {
        toast({ variant: 'destructive', title: "Save Failed", description: "Could not save your budget. Please try again." });
    } finally {
        setIsSavingBudget(false);
    }
  };
  
  const handleAddExpense = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!newExpenseDescription.trim() || !newExpenseAmount || !targetBudgetId || !user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Cannot Add Expense',
        description: 'Please fill in all required fields.',
      });
      return;
    }
    
    const targetBudget = budgets?.find(b => b.id === targetBudgetId);
    if (!targetBudget) {
      toast({
        variant: 'destructive',
        title: 'Invalid Budget',
        description: 'The selected budget could not be found. Please try again.',
      });
      return;
    }

    setIsSavingExpense(true);
    try {
      const mainExpensesCollection = collection(firestore, 'users', user.uid, 'expenses');
      await addDocumentNonBlocking(mainExpensesCollection, {
        id: uuidv4(),
        userProfileId: user.uid,
        budgetId: targetBudget.id,
        description: newExpenseDescription,
        amount: parseFloat(newExpenseAmount),
        category: targetBudget.category, // Inherit category from parent budget
        date: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewExpenseDescription('');
      setNewExpenseAmount('');
      setTargetBudgetId('');
      setIsExpenseDialogOpen(false);
      // Dialog closing provides sufficient feedback
    } catch {
      toast({ variant: 'destructive', title: "Save Failed", description: "Could not log your expense. Please try again." });
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleDeleteBudget = (budgetId: string) => {
    if (!firestore || !user) return;
    try {
      const docRef = doc(firestore, 'users', user.uid, 'budgets', budgetId);
      deleteDocumentNonBlocking(docRef);
      toast({
          title: "Budget Deleted",
          description: "The budget has been successfully removed.",
      });
    } catch {
      toast({ variant: 'destructive', title: "Delete Failed", description: "Could not delete the budget." });
    }
  };

  const handleAiAnalysis = () => {
    setShowAiThinking(true);
    setAiFeedback('');
    setAiSuggestions([]);

    startAiTransition(async () => {
      const formattedExpenses = expenses?.map(e => ({
        description: e.description,
        amount: e.amount,
        category: e.category,
        date: e.date?.toDate ? format(e.date.toDate(), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      })) ?? [];

      const existingCategories = budgets?.map(b => b.category) ?? [];

      const result = await getBudgetSuggestions({
        expenses: formattedExpenses,
        existingBudgets: existingCategories,
      });
      
      if ('error' in result) {
        toast({ variant: 'destructive', title: 'AI Analysis Failed', description: result.error });
        setShowAiThinking(false);
      } else {
        setAiFeedback(result.feedback);
        setAiSuggestions(result.suggestions);
        // The onComplete callback in AICoPilotThinking will handle hiding the animation
      }
    });
  };
  
  const isLoading = isLoadingBudgets || isLoadingExpenses;

  const monthlySpending = useMemo(() => {
    const spendingByMonth: {[key: string]: number} = {};
    expenses?.forEach(expense => {
      if (expense.date?.toDate) {
        const month = format(expense.date.toDate(), 'MMM');
        spendingByMonth[month] = (spendingByMonth[month] || 0) + expense.amount;
      }
    });
    return Object.keys(spendingByMonth).map(month => ({ month, spending: spendingByMonth[month] }));
  }, [expenses]);


  return (
    <div className="flex flex-col gap-6">
      <PullToRefreshIndicator {...pullToRefresh} />
      <NetworkStatusIndicator onRetry={handleRefresh} />
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline text-foreground">Finance</h1>
          <p className="text-muted-foreground mt-2">Money won't solve everything, but it's a decent start.</p>
        </div>
        {/* Only show action buttons when budgets exist (populated state) */}
        {!isLoadingBudgets && budgets && budgets.length > 0 && (
          <div className="flex gap-2 w-full md:w-auto">
             <EmeraldPrismButton onClick={() => setIsBudgetDialogOpen(true)} success={budgetCreateSuccess} className="flex-1 md:flex-none" />
              <Button onClick={() => setIsExpenseDialogOpen(true)} className="flex-1 md:flex-none shadow-neumorphic-outset active:shadow-neumorphic-inset hover:shadow-glow-purple hover:scale-105 bg-accent/20 hover:bg-accent/30 text-accent-foreground transition-all duration-300">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
          </div>
        )}
      </header>
      
      {isLoadingBudgets ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-neumorphic-outset">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <PiggyBank className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-1/3 mt-2" />
            </CardContent>
          </Card>
           <Card className="shadow-neumorphic-outset">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <Receipt className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
               <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-1/3 mt-2" />
            </CardContent>
          </Card>
           <Card className="shadow-neumorphic-outset">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Remaining</CardTitle>
              <DollarSign className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-1/3 mt-2" />
            </CardContent>
          </Card>
        </div>
      ) : !budgets || budgets.length === 0 ? (
         <EmptyStateCTA
            icon={<PiggyBank size={32}/>}
            title="No Budgets Set"
            message="Tracking won't make you rich, but at least you'll know where it all went."
            ctaElement={
              <EmeraldPrismButton onClick={() => setIsBudgetDialogOpen(true)} success={budgetCreateSuccess}>Create Your First Budget</EmeraldPrismButton>
            }
         />
      ) : (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-neumorphic-outset">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <PiggyBank className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">across {budgets.length} budget(s)</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic-outset">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <Receipt className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">this period</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic-outset">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Remaining</CardTitle>
              <DollarSign className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRemaining.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">to stay on budget</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-neumorphic-outset">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="text-accent" /> 
                  AI Financial Coach
                  <InfoTooltip content="AI analyzes your spending patterns, budget allocation, and financial habits to provide personalized recommendations and budget suggestions." />
                </CardTitle>
                <CardDescription>Analyze your spending and get personalized budget suggestions.</CardDescription>
            </CardHeader>
            <CardContent>
                {showAiThinking ? (
                    <AICoPilotThinking 
                        steps={AI_ANALYSIS_STEPS}
                        onComplete={() => setShowAiThinking(false)} 
                        durationPerStep={1200}
                    />
                ) : aiFeedback ? (
                    <div className="space-y-4">
                        <p className="text-foreground italic "><Lightbulb className="inline-block mr-2 h-4 w-4 text-accent"/>{aiFeedback}</p>
                        {aiSuggestions.length > 0 && <Separator />}
                        <div className="flex flex-wrap gap-2">
                            {aiSuggestions.map(suggestion => (
                                <Button key={suggestion.category} variant="outline" className="shadow-neumorphic-outset active:shadow-neumorphic-inset" onClick={() => handleAddBudget(suggestion)}>
                                    <PlusCircle className="mr-2 h-4 w-4"/> Create '{suggestion.name}' (${suggestion.amount})
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : null}
            </CardContent>
            <CardFooter>
                 <Button onClick={handleAiAnalysis} variant="ghost" className="text-accent" disabled={isAnalyzing || isLoadingExpenses}>
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                    {isAnalyzing ? 'Analyzing...' : 'Analyze & Suggest Budgets'}
                 </Button>
            </CardFooter>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                {isLoading ? (
                    [...Array(2)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)
                ) : (
                    <AnimatePresence>
                    {budgetsWithSpending.map(budget => (
                        <motion.div 
                          key={budget.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.3 }}
                        >
                        <Card className="shadow-neumorphic-outset hover:shadow-glow-blue transition-shadow cursor-pointer">
                            <Link href={`/finance/${budget.id}`}>
                              <CardHeader>
                                  <CardTitle className="flex justify-between items-start">
                                      <span>{budget.name}</span>
                                       <DropdownMenu>
                                          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                                              <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                                                  <MoreVertical size={16} />
                                              </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                              <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleDeleteBudget(budget.id); }} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                  <Trash2 className="mr-2" />
                                                  Delete
                                              </DropdownMenuItem>
                                          </DropdownMenuContent>
                                      </DropdownMenu>
                                  </CardTitle>
                                  <CardDescription>
                                      ${budget.amount.toLocaleString()} / {budget.period}
                                  </CardDescription>
                              </CardHeader>
                              <CardContent>
                                  <Progress value={budget.progress} indicatorClassName="bg-accent" />
                                  <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                                      <span>Spent: ${budget.spent.toLocaleString()}</span>
                                      <span>Remaining: ${budget.remaining.toLocaleString()}</span>
                                  </div>
                              </CardContent>
                            </Link>
                        </Card>
                        </motion.div>
                    ))}
                    </AnimatePresence>
                )}
            </div>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <FinanceChart data={monthlySpending} />
            </Suspense>
        </div>
      </>
      )}



      {/* Budget Dialog */}
      <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
        <DialogContent open={isBudgetDialogOpen} className="shadow-neumorphic-outset bg-background border-transparent">
          <DialogHeader>
            <DialogTitle>Create a New Budget</DialogTitle>
            <DialogDescription>
              Define a new budget to track your spending.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleManualAddBudget(); }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="budget-name" className="text-right">Name</Label>
                <Input 
                  id="budget-name" 
                  value={newBudgetName} 
                  onChange={(e) => setNewBudgetName(e.target.value)} 
                  className="col-span-3" 
                  placeholder="e.g., Monthly Groceries" 
                  disabled={isSavingBudget}
                  required
                  enterKeyHint="next"
                  autoComplete="off"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="budget-amount" className="text-right">Amount ($)</Label>
                <Input 
                  id="budget-amount" 
                  type="number" 
                  inputMode="decimal"
                  value={newBudgetAmount} 
                  onChange={(e) => setNewBudgetAmount(e.target.value)} 
                  className="col-span-3" 
                  placeholder="e.g., 500" 
                  disabled={isSavingBudget}
                  required
                  enterKeyHint="next"
                  autoComplete="off"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="budget-category" className="text-right">Category</Label>
                <Select 
                  onValueChange={setNewBudgetCategory} 
                  value={newBudgetCategory} 
                  disabled={isSavingBudget}
                  required
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SPENDING_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="shadow-neumorphic-outset active:shadow-neumorphic-inset" 
                  disabled={isSavingBudget}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground" 
                disabled={isSavingBudget || !newBudgetName || !newBudgetAmount || !newBudgetCategory}
              >
                {isSavingBudget ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Save Budget
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent open={isExpenseDialogOpen} className="shadow-neumorphic-outset bg-background border-transparent">
          <DialogHeader>
            <DialogTitle>Add a New Expense</DialogTitle>
            <DialogDescription>
              Log a new expense against one of your budgets.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddExpense}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expense-budget" className="text-right">Budget</Label>
                <Select 
                  onValueChange={setTargetBudgetId} 
                  value={targetBudgetId} 
                  required
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a budget..." />
                  </SelectTrigger>
                  <SelectContent>
                    {budgets?.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expense-desc" className="text-right">Description</Label>
                <Input 
                  id="expense-desc" 
                  value={newExpenseDescription} 
                  onChange={(e) => setNewExpenseDescription(e.target.value)} 
                  className="col-span-3" 
                  placeholder="e.g., Coffee shop" 
                  required
                  enterKeyHint="next"
                  autoComplete="off"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expense-amount" className="text-right">Amount ($)</Label>
                <Input 
                  id="expense-amount" 
                  type="number" 
                  inputMode="decimal"
                  value={newExpenseAmount} 
                  onChange={(e) => setNewExpenseAmount(e.target.value)} 
                  className="col-span-3" 
                  placeholder="e.g., 5.50" 
                  required
                  enterKeyHint="done"
                  autoComplete="off"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="shadow-neumorphic-outset active:shadow-neumorphic-inset" 
                  disabled={isSavingExpense}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                className="shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground" 
                disabled={isSavingExpense || !targetBudgetId || !newExpenseAmount || !newExpenseDescription}
              >
                {isSavingExpense ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Save Expense
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
