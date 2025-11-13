
export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface ITask extends BaseEntity {
  content: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface IHabit extends BaseEntity {
  name: string;
  missedDays: number;
  lastCompleted: number;
}
