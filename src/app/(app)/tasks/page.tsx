'use client';
import { useState, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ListTodo, PlusCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Priority = 'Low' | 'Medium' | 'High';

type Task = {
  id: number;
  text: string;
  done: boolean;
  priority: Priority;
};

const priorityColors: Record<Priority, string> = {
  Low: 'bg-green-500/20 text-green-400 border-green-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  High: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: 'Finalize Q3 report', done: false, priority: 'High' },
    { id: 2, text: 'Book dentist appointment', done: true, priority: 'Medium' },
    { id: 3, text: 'Water the plants', done: false, priority: 'Low' },
  ]);
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('Medium');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const task: Task = {
      id: Date.now(),
      text: newTask,
      done: false,
      priority: newPriority,
    };
    setTasks([task, ...tasks]);
    setNewTask('');
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, done: !task.done } : task));
  };
  
  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-4xl font-bold font-headline text-foreground">Tasks</h1>
        <p className="text-muted-foreground mt-2">Log daily objectives and set priorities.</p>
      </header>

      <Card className="shadow-neumorphic-outset">
        <CardHeader>
          <CardTitle>Add New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
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
          <div className="space-y-4">
            {tasks.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 rounded-lg bg-background shadow-neumorphic-inset"
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.done}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="h-5 w-5 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground border-accent"
                  />
                  <label
                    htmlFor={`task-${task.id}`}
                    className={cn(
                      'text-md font-medium',
                      task.done && 'line-through text-muted-foreground'
                    )}
                  >
                    {task.text}
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={cn('border', priorityColors[task.priority])}>
                    {task.priority}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => deleteTask(task.id)}>
                      <Trash2 size={16}/>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
