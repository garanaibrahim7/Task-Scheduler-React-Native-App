import { Task } from './database';

export interface TaskWithCompletion extends Task {
  isCompletedToday: boolean;
  completionId?: string;
  lastCompletedAt?: string;
}

export type RepeatType = 'once' | 'daily' | 'weekly' | 'monthly';

export type TaskCategory = 'personal' | 'work' | 'health' | 'shopping' | 'other';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskFormData {
  title: string;
  scheduledTime: Date;
  repeatType: RepeatType;
  repeatDays: number[];
  category: TaskCategory;
  priority: TaskPriority;
  reminderOffset: number;
}

export interface TaskStats {
  totalTasks: number;
  completedToday: number;
  completionRate: number;
  currentStreak: number;
  overdueCount: number;
}
