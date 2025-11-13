import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import { useBrainStore } from "@/store/useBrainStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ITask } from "@/types/models";
import { DataService } from "@/services/DataService";

export default function TaskModule() {
    const inputRef = useRef<HTMLInputElement>(null);
  const tasks = useBrainStore((state) => state.pendingTasks);
  const setTasks = useBrainStore((state) => state.setPendingTasks);
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState<ITask["priority"]>("medium");

  // Load tasks from IndexedDB on mount
  useEffect(() => {
    DataService.getAll("tasks").then((dbTasks: ITask[]) => {
      if (dbTasks && dbTasks.length > 0) {
        setTasks(dbTasks);
      }
    });
  }, [setTasks]);

  // Persist tasks to IndexedDB whenever they change
  useEffect(() => {
    tasks.forEach((task) => {
      DataService.set("tasks", task);
    });
  }, [tasks]);

  // Completion rate calculation
  const completed = tasks.filter((t) => t.isCompleted).length;
  const total = tasks.length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  // Priority summary
  const prioritySummary = {
    low: tasks.filter((t) => t.priority === "low").length,
    medium: tasks.filter((t) => t.priority === "medium").length,
    high: tasks.filter((t) => t.priority === "high").length,
  };

  // Add new task
  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    const task: ITask = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      content: newTask,
      isCompleted: false,
      priority,
    };
    await DataService.set("tasks", task);
    setTasks([...tasks, task]);
    setNewTask("");
    setPriority("medium");
    inputRef.current?.focus();
  };

  // Toggle complete
  const handleToggleComplete = async (id: string) => {
    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, isCompleted: !t.isCompleted, updatedAt: Date.now() } : t
    );
    setTasks(updatedTasks);
    const updatedTask = updatedTasks.find((t) => t.id === id);
    if (updatedTask) await DataService.set("tasks", updatedTask);
  };

  // Delete task
  const handleDeleteTask = async (id: string) => {
    await DataService.delete("tasks", id);
    setTasks(tasks.filter((t) => t.id !== id));
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <Card className="mb-2">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-accent-info">Task Completion</span>
            <span className="text-xs text-muted">{completionRate}%</span>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-accent-success">High: {prioritySummary.high}</span>
            <span className="text-accent-data">Medium: {prioritySummary.medium}</span>
            <span className="text-accent-info">Low: {prioritySummary.low}</span>
          </div>
        </div>
      </Card>
      <Card>
        <form
          className="flex gap-2 items-center"
          onSubmit={e => { e.preventDefault(); handleAddTask(); }}
          aria-label="Add new task"
        >
          <input
            ref={inputRef}
            className="flex-1 bg-background-primary text-foreground px-2 py-1 rounded border border-border text-sm focus:ring-2 focus:ring-accent"
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            aria-label="Task description"
            autoComplete="off"
          />
          <select
            className="bg-background-secondary text-xs rounded border border-border px-2 py-1 focus:ring-2 focus:ring-accent"
            value={priority}
            onChange={(e) => setPriority(e.target.value as ITask["priority"])}
            aria-label="Task priority"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <Button size="sm" type="submit" aria-label="Add task">
            Add
          </Button>
        </form>
      </Card>
      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="text-xs text-muted text-center py-8">
                No tasks yet. Add one above!
              </Card>
            </motion.div>
          ) : (
            tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className={`flex flex-col gap-1 ${task.isCompleted ? "opacity-60" : ""}`}
                  tabIndex={0}
                  aria-label={`Task: ${task.content}`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm ${task.isCompleted ? "line-through" : ""}`}
                    >
                      {task.content}
                    </span>
                    <div className="flex gap-2 items-center">
                      <Button
                        size="sm"
                        variant={task.isCompleted ? "outline" : "default"}
                        onClick={() => handleToggleComplete(task.id)}
                        aria-label={task.isCompleted ? "Undo task" : "Mark task done"}
                      >
                        {task.isCompleted ? "Undo" : "Done"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteTask(task.id)}
                        aria-label="Delete task"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs text-muted">
                    <span>Priority: {task.priority}</span>
                    <span>
                      Created: {new Date(task.createdAt).toLocaleDateString()} {new Date(task.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
