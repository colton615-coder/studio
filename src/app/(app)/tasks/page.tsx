'use client';
import { useState, useMemo, FormEvent } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ListTodo, PlusCircle, Trash2, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { EmptyStateCTA } from '@/components/ui/empty-state-cta';
import { celebrateTaskComplete } from '@/lib/celebrations';

type Priority = 'Low' | 'Medium' | 'High';

type Task = {
  id: string;
  userProfileId: string;
  description: string;
  completed: boolean;
  priority: Priority;
  isOptimistic?: boolean;
};

const priorityColors: Record<Priority, string> = {
  Low: 'bg-green-500/20 text-green-400 border-green-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  High: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function TasksPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('Medium');

  const tasksCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'tasks');
  }, [user, firestore]);

  const { data: tasks, isLoading, setData: setTasks } = useCollection<Task>(tasksCollection);
  
  const { pendingTasks, completedTasks } = useMemo(() => {
    const pending: Task[] = [];
    const completed: Task[] = [];
    tasks?.forEach(task => {
        if (task.completed) {
            completed.push(task);
        } else {
            pending.push(task);
        }
    });
    // Sort pending tasks by priority: High, Medium, Low
    const priorityOrder: Record<Priority, number> = { High: 1, Medium: 2, Low: 3 };
    pending.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    return { pendingTasks: pending, completedTasks: completed };
  }, [tasks]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskDescription.trim() || !user || !tasksCollection || !tasks || !setTasks) return;
    
    const description = newTaskDescription;
    const priority = newPriority;
    setNewTaskDescription('');
    setNewPriority('Medium');

    const optimisticId = uuidv4();
    const optimisticTask: Task = {
      id: optimisticId,
      userProfileId: user.uid,
      description: description,
      completed: false,
      priority: priority,
      isOptimistic: true,
    };

    // 1. Optimistic UI update
    setTasks([...tasks, optimisticTask]);

    try {
      // 2. Background Firestore write
      const docRef = doc(tasksCollection, optimisticId);
      setDocumentNonBlocking(docRef, {
        id: optimisticId,
        userProfileId: user.uid,
        description: description,
        completed: false,
        priority: priority,
        dueDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Task Added', description: `"${description}" was added.` });
    } catch (error) {
      // 3. Rollback on failure
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add task.' });
      setTasks(tasks.filter(t => t.id !== optimisticId));
    }
  };

  const toggleTask = (task: Task) => {
    if (!tasksCollection) return;
    const docRef = doc(tasksCollection, task.id);
    const newCompletedState = !task.completed;
    updateDocumentNonBlocking(docRef, { completed: newCompletedState });
    
    // Celebrate when completing a task
    if (newCompletedState) {
      celebrateTaskComplete();
    }
  };
  
  const deleteTask = (taskToDelete: Task) => {
    if (!tasksCollection || !tasks || !setTasks) return;

    const originalTasks = [...tasks];
    // 1. Optimistic UI update
    setTasks(originalTasks.filter(t => t.id !== taskToDelete.id));

    try {
      // 2. Background Firestore delete
      const docRef = doc(tasksCollection, taskToDelete.id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: 'Task Removed', description: `"${taskToDelete.description}" was removed.` });
    } catch (error) {
      // 3. Rollback on failure
      toast({ variant: 'destructive', title: 'Error', description: 'Could not remove task.' });
      setTasks(originalTasks);
    }
  };
  
  const TaskItemSkeleton = () => (
    <div className="flex items-center justify-between p-4 rounded-lg bg-background shadow-neumorphic-inset">
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-5 rounded-sm" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
  
  const renderTaskList = (title: string, list: Task[], icon: React.ReactNode) => (
    <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold text-muted-foreground mb-4">
            {icon}
            {title}
        </h3>
        <div className="space-y-4">
          <AnimatePresence>
            {list.map(task => (
            <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3 }}
                className={cn("flex items-center justify-between p-4 rounded-lg bg-background shadow-neumorphic-inset", task.isOptimistic && "opacity-50 pointer-events-none")}
            >
                <div className="flex items-center gap-4">
                <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task)}
                    className="h-5 w-5 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground border-accent"
                />
                <label
                    htmlFor={`task-${task.id}`}
                    className={cn(
                    'text-md font-medium',
                    task.completed && 'line-through text-muted-foreground'
                    )}
                >
                    {task.description}
                </label>
                </div>
                <div className="flex items-center gap-4">
                <Badge className={cn('border', priorityColors[task.priority])}>
                    {task.priority}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => deleteTask(task)}
                  aria-label={`Delete task: ${task.description}`}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); deleteTask(task); } }}
                >
                    <Trash2 size={16}/>
                </Button>
                </div>
            </motion.div>
            ))}
            </AnimatePresence>
             {list.length === 0 && <p className="text-muted-foreground text-center py-4 text-sm">Nothing here!</p>}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-4xl font-bold font-headline text-foreground">Tasks</h1>
        <p className="text-muted-foreground mt-2">Log daily objectives and set priorities.</p>
      </header>

       {isLoading ? (
        <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
        </>
       ) : tasks && tasks.length > 0 ? (
        <>
            <Card className="shadow-neumorphic-outset">
                <CardHeader>
                <CardTitle>Add New Task</CardTitle>
                </CardHeader>
                <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
                    <Input
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="What needs to be done?"
                    className="flex-grow"
                    />
                    <Select onValueChange={(value: Priority) => setNewPriority(value)} defaultValue={newPriority}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                    </Select>
                    <Button type="submit" className="w-full sm:w-auto shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Add Task
                    </Button>
                </form>
                </CardContent>
            </Card>

            <Card className="shadow-neumorphic-outset">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ListTodo className="text-accent" />
                    Your To-Do List
                </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {renderTaskList('Pending', pendingTasks, <ListTodo size={20} />)}
                        {completedTasks.length > 0 && <Separator />}
                        {renderTaskList('Completed', completedTasks, <Check size={20} />)}
                    </div>
                </CardContent>
            </Card>
        </>
       ) : (
            <EmptyStateCTA
                icon={<ListTodo size={32} />}
                title="Get Organized"
                message="Your to-do list is empty. Add a task to get started."
                ctaElement={
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg mx-auto">
                        <Input
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        placeholder="e.g., Finish Q2 report"
                        className="flex-grow"
                        />
                        <Select onValueChange={(value: Priority) => setNewPriority(value)} defaultValue={newPriority}>
                        <SelectTrigger className="w-full sm:w-[140px]">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                        </Select>
                        <Button type="submit" className="w-full sm:w-auto shadow-neumorphic-outset active:shadow-neumorphic-inset bg-primary/80 hover:bg-primary text-primary-foreground">
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Add
                        </Button>
                    </form>
                }
            />
       )}
    </div>
  );
}
