-- Task Scheduler Database Schema
--
-- Overview:
-- This migration creates the core database structure for a personal task scheduler app
-- that supports recurring tasks, completion tracking, and notification reminders.
--
-- New Tables:
--
-- 1. tasks - Main table storing all task information with recurring schedule support
--    - id (uuid, primary key) - Unique identifier for each task
--    - user_id (uuid) - Reference to auth.users (for future multi-user support)
--    - title (text) - Task name/description
--    - scheduled_time (time) - Time of day when task should be completed (HH:MM format)
--    - repeat_type (text) - Frequency: 'daily', 'weekly', 'monthly', 'once'
--    - repeat_days (jsonb) - For weekly: array of day numbers [0-6] where 0=Sunday
--    - category (text) - Optional task category (work, personal, health, etc.)
--    - priority (text) - Priority level: 'high', 'medium', 'low'
--    - is_active (boolean) - Whether task is currently active
--    - reminder_offset (integer) - Minutes after scheduled time to send reminder (default 60)
--    - created_at (timestamptz) - When task was created
--    - updated_at (timestamptz) - Last modification time
--
-- 2. task_completions - Tracks each completion of a task for history and statistics
--    - id (uuid, primary key) - Unique identifier
--    - task_id (uuid, foreign key) - Reference to tasks table
--    - completed_at (timestamptz) - When task was marked complete
--    - scheduled_for (date) - Which date this completion was for
--    - completed_on_time (boolean) - Whether completed before reminder time
--    - notes (text) - Optional completion notes
--
-- Security:
-- - Enable RLS on all tables
-- - Add policies for authenticated users to manage their own tasks
-- - Users can only access their own task data

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  scheduled_time time NOT NULL,
  repeat_type text NOT NULL DEFAULT 'once' CHECK (repeat_type IN ('once', 'daily', 'weekly', 'monthly')),
  repeat_days jsonb DEFAULT '[]'::jsonb,
  category text DEFAULT 'personal',
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_active boolean DEFAULT true,
  reminder_offset integer DEFAULT 60,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_completions table
CREATE TABLE IF NOT EXISTS task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamptz DEFAULT now(),
  scheduled_for date NOT NULL,
  completed_on_time boolean DEFAULT true,
  notes text
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_time ON tasks(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_tasks_is_active ON tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_scheduled_for ON task_completions(scheduled_for);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks table
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for task_completions table
CREATE POLICY "Users can view own task completions"
  ON task_completions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_completions.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own task completions"
  ON task_completions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_completions.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own task completions"
  ON task_completions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_completions.task_id
      AND tasks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_completions.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own task completions"
  ON task_completions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_completions.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();