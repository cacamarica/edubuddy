export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_recommendations: {
        Row: {
          acted_on: boolean | null
          created_at: string
          id: string
          read: boolean | null
          recommendation: string
          recommendation_type: string
          student_id: string
        }
        Insert: {
          acted_on?: boolean | null
          created_at?: string
          id?: string
          read?: boolean | null
          recommendation: string
          recommendation_type: string
          student_id: string
        }
        Update: {
          acted_on?: boolean | null
          created_at?: string
          id?: string
          read?: boolean | null
          recommendation?: string
          recommendation_type?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      learning_activities: {
        Row: {
          activity_type: string
          completed: boolean | null
          completed_at: string | null
          id: string
          last_interaction_at: string
          progress: number | null
          stars_earned: number | null
          started_at: string
          student_id: string
          subject: string
          topic: string
        }
        Insert: {
          activity_type: string
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          last_interaction_at?: string
          progress?: number | null
          stars_earned?: number | null
          started_at?: string
          student_id: string
          subject: string
          topic: string
        }
        Update: {
          activity_type?: string
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          last_interaction_at?: string
          progress?: number | null
          stars_earned?: number | null
          started_at?: string
          student_id?: string
          subject?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_activities_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_materials: {
        Row: {
          activity: Json | null
          chapters: Json
          conclusion: string | null
          created_at: string
          fun_facts: Json | null
          grade_level: string
          id: string
          introduction: string
          subject: string
          summary: string | null
          title: string
          topic: string
          updated_at: string
        }
        Insert: {
          activity?: Json | null
          chapters: Json
          conclusion?: string | null
          created_at?: string
          fun_facts?: Json | null
          grade_level: string
          id?: string
          introduction: string
          subject: string
          summary?: string | null
          title: string
          topic: string
          updated_at?: string
        }
        Update: {
          activity?: Json | null
          chapters?: Json
          conclusion?: string | null
          created_at?: string
          fun_facts?: Json | null
          grade_level?: string
          id?: string
          introduction?: string
          subject?: string
          summary?: string | null
          title?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          created_at: string
          current_chapter: number
          id: string
          is_completed: boolean
          last_read_at: string
          lesson_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          current_chapter?: number
          id?: string
          is_completed?: boolean
          last_read_at?: string
          lesson_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          current_chapter?: number
          id?: string
          is_completed?: boolean
          last_read_at?: string
          lesson_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_teacher: boolean | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_teacher?: boolean | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_teacher?: boolean | null
        }
        Relationships: []
      }
      quiz_progress: {
        Row: {
          correct_answers: number[] | null
          created_at: string
          current_question: number
          grade_level: string
          id: string
          is_completed: boolean
          last_attempt_at: string
          questions_answered: number[] | null
          student_id: string
          subject: string
          topic: string
        }
        Insert: {
          correct_answers?: number[] | null
          created_at?: string
          current_question?: number
          grade_level: string
          id?: string
          is_completed?: boolean
          last_attempt_at?: string
          questions_answered?: number[] | null
          student_id: string
          subject: string
          topic: string
        }
        Update: {
          correct_answers?: number[] | null
          created_at?: string
          current_question?: number
          grade_level?: string
          id?: string
          is_completed?: boolean
          last_attempt_at?: string
          questions_answered?: number[] | null
          student_id?: string
          subject?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: number
          created_at: string
          difficulty_level: string | null
          explanation: string | null
          grade_level: string
          id: string
          options: Json
          question: string
          subject: string
          topic: string
          updated_at: string
        }
        Insert: {
          correct_answer: number
          created_at?: string
          difficulty_level?: string | null
          explanation?: string | null
          grade_level: string
          id?: string
          options: Json
          question: string
          subject: string
          topic: string
          updated_at?: string
        }
        Update: {
          correct_answer?: number
          created_at?: string
          difficulty_level?: string | null
          explanation?: string | null
          grade_level?: string
          id?: string
          options?: Json
          question?: string
          subject?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_scores: {
        Row: {
          completed_at: string
          id: string
          max_score: number
          percentage: number
          score: number
          student_id: string
          subject: string
          topic: string
        }
        Insert: {
          completed_at?: string
          id?: string
          max_score: number
          percentage: number
          score: number
          student_id: string
          subject: string
          topic: string
        }
        Update: {
          completed_at?: string
          id?: string
          max_score?: number
          percentage?: number
          score?: number
          student_id?: string
          subject?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          student_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          student_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          age: number | null
          created_at: string
          grade_level: string
          id: string
          name: string
          parent_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          grade_level: string
          id?: string
          name: string
          parent_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          grade_level?: string
          id?: string
          name?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_progress: {
        Row: {
          id: string
          last_updated_at: string
          progress: number
          student_id: string
          subject: string
        }
        Insert: {
          id?: string
          last_updated_at?: string
          progress?: number
          student_id: string
          subject: string
        }
        Update: {
          id?: string
          last_updated_at?: string
          progress?: number
          student_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_parent_of_student: {
        Args: { student_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
