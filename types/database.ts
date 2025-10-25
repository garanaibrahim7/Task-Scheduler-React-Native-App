export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          user_id: string | null
          title: string
          scheduled_time: string
          repeat_type: 'once' | 'daily' | 'weekly' | 'monthly'
          repeat_days: Json
          category: string
          priority: 'low' | 'medium' | 'high'
          is_active: boolean
          reminder_offset: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          scheduled_time: string
          repeat_type?: 'once' | 'daily' | 'weekly' | 'monthly'
          repeat_days?: Json
          category?: string
          priority?: 'low' | 'medium' | 'high'
          is_active?: boolean
          reminder_offset?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          scheduled_time?: string
          repeat_type?: 'once' | 'daily' | 'weekly' | 'monthly'
          repeat_days?: Json
          category?: string
          priority?: 'low' | 'medium' | 'high'
          is_active?: boolean
          reminder_offset?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          id: string
          task_id: string
          completed_at: string
          scheduled_for: string
          completed_on_time: boolean
          notes: string | null
        }
        Insert: {
          id?: string
          task_id: string
          completed_at?: string
          scheduled_for: string
          completed_on_time?: boolean
          notes?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          completed_at?: string
          scheduled_for?: string
          completed_on_time?: boolean
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'task_completions_task_id_fkey'
            columns: ['task_id']
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export type TaskCompletion = Database['public']['Tables']['task_completions']['Row']
export type TaskCompletionInsert = Database['public']['Tables']['task_completions']['Insert']
