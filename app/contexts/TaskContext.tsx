import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { Task, TaskInsert, TaskUpdate, TaskCompletionInsert } from '@/types/database';

import { Alert } from 'react-native';
import {
  scheduleAllTaskReminders,
  cancelTaskReminder,
  requestNotificationPermissions,
  scheduleDailyReset,
} from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { TaskStats, TaskWithCompletion } from '@/types/tasks';

interface TaskContextType {
  tasks: TaskWithCompletion[];
  loading: boolean;
  stats: TaskStats;
  fetchTasks: () => Promise<void>;
  addTask: (task: TaskInsert) => Promise<void>;
  updateTask: (id: string, task: TaskUpdate) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string, isCompleted: boolean) => Promise<void>;
  resetDailyTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<TaskWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TaskStats>({
    totalTasks: 0,
    completedToday: 0,
    completionRate: 0,
    currentStreak: 0,
    overdueCount: 0,
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('scheduled_time', { ascending: true });

      if (tasksError) throw tasksError;

      const { data: completionsData, error: completionsError } = await supabase
        .from('task_completions')
        .select('*')
        .eq('scheduled_for', today);

      if (completionsError) throw completionsError;

      const tasksWithCompletion: TaskWithCompletion[] = (tasksData || []).map((task) => {
        const completion = completionsData?.find((c) => c.task_id === task.id);
        return {
          ...task,
          isCompletedToday: !!completion,
          completionId: completion?.id,
          lastCompletedAt: completion?.completed_at,
        };
      });

      setTasks(tasksWithCompletion);
      calculateStats(tasksWithCompletion);

      await scheduleAllTaskReminders(tasksWithCompletion);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tasksData: TaskWithCompletion[]) => {
    const totalTasks = tasksData.length;
    const completedToday = tasksData.filter((t) => t.isCompletedToday).length;
    const completionRate = totalTasks > 0 ? (completedToday / totalTasks) * 100 : 0;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const overdueCount = tasksData.filter((task) => {
      if (task.isCompletedToday) return false;
      const [hours, minutes] = task.scheduled_time.split(':').map(Number);
      const taskTime = hours * 60 + minutes;
      return currentTime > taskTime + task.reminder_offset;
    }).length;

    setStats({
      totalTasks,
      completedToday,
      completionRate: Math.round(completionRate),
      currentStreak: 0,
      overdueCount,
    });
  };

  const addTask = async (task: TaskInsert) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('tasks').insert({
        ...task,
        user_id: user?.id || null,
      });

      if (error) throw error;
      await fetchTasks();
    } catch (error: any) {
      Alert.alert('Error', error.message);
      throw error;
    }
  };

  const updateTask = async (id: string, task: TaskUpdate) => {
    try {
      const { error } = await supabase.from('tasks').update(task).eq('id', id);

      if (error) throw error;
      await fetchTasks();
    } catch (error: any) {
      Alert.alert('Error', error.message);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      // await cancelTaskReminder(id);

      const { error } = await supabase.from('tasks').delete().eq('id', id);

      if (error) throw error;
      await fetchTasks();
    } catch (error: any) {
      Alert.alert('Error', error.message);
      throw error;
    }
  };

  const toggleTaskCompletion = async (taskId: string, isCompleted: boolean) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const task = tasks.find((t) => t.id === taskId);

      if (!task) return;

      if (isCompleted) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [hours, minutes] = task.scheduled_time.split(':').map(Number);
        const taskTime = hours * 60 + minutes;
        const completedOnTime = currentTime <= taskTime + task.reminder_offset;

        const completion: TaskCompletionInsert = {
          task_id: taskId,
          scheduled_for: today,
          completed_on_time: completedOnTime,
        };

        const { error } = await supabase.from('task_completions').insert(completion);
        if (error) throw error;
      } else {
        if (task.completionId) {
          const { error } = await supabase
            .from('task_completions')
            .delete()
            .eq('id', task.completionId);
          if (error) throw error;
        }
      }

      await fetchTasks();
    } catch (error: any) {
      Alert.alert('Error', error.message);
      throw error;
    }
  };

  const resetDailyTasks = async () => {
    await fetchTasks();
  };

  useEffect(() => {
    const initialize = async () => {
      // await requestNotificationPermissions();
      // await scheduleDailyReset();
      await fetchTasks();
    };

    initialize();

    const checkInterval = setInterval(() => {
      calculateStats(tasks);
    }, 60000);

    const midnightCheck = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        fetchTasks();
      }
    }, 60000);

    return () => {
      clearInterval(checkInterval);
      clearInterval(midnightCheck);
    };
  }, []);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        stats,
        fetchTasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompletion,
        resetDailyTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}