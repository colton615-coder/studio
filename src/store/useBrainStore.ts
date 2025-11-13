
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { IHabit, ITask } from '../types/models';

interface BrainState {
  userHabits: IHabit[];
  pendingTasks: ITask[];
  setPendingTasks: (tasks: ITask[]) => void;
  golfStats: Record<string, any>; // Replace 'any' with a proper GolfStats interface later
}

export const useBrainStore = create<BrainState>()(
  devtools(
    persist(
      (set) => ({
        userHabits: [],
        pendingTasks: [],
        setPendingTasks: (tasks: ITask[]) => set({ pendingTasks: tasks }),
        golfStats: {},
      }),
      {
        name: 'lifesync-brain-storage',
      }
    )
  )
);
