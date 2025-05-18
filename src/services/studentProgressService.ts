
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LearningActivityType } from "@/types/learning";

// Types for student data
export interface StudentProgress {
  id?: string;
  student_id: string;
  subject: string;
  progress: number;
  last_updated_at?: string;
}

export interface QuizScore {
  id?: string;
  student_id: string;
  subject: string;
  topic: string;
  score: number;
  max_score: number;
  percentage: number;
  completed_at?: string;
}

export interface LearningActivity {
  id?: string;
  student_id: string;
  activity_type: LearningActivityType; // Use the more specific type
  subject: string;
  topic: string;
  completed?: boolean;
  progress?: number;
  stars_earned?: number;
  started_at?: string;
  completed_at?: string | null;
  last_interaction_at?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  type?: string;
  created_at?: string;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  badge?: Badge;
  earned_at: string;
}

export interface AIRecommendation {
  id?: string;
  student_id: string;
  recommendation_type: string;
  recommendation: string;
  created_at?: string;
  read?: boolean;
  acted_on?: boolean;
}

export interface AISummaryReport {
  overallSummary: string;
  strengths: string[];
  areasForImprovement: string[];
  activityAnalysis: string;
  quizReview?: QuizReviewDetail[];
  knowledgeGrowthChartData?: { date: string; score: number }[];
  gradeLevel?: string;
  studentName?: string;
  generatedAt?: string;
  reportId?: string;
}

export interface QuizQuestionReview {
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}
export interface QuizReviewDetail {
  quizId: string;
  quizTitle: string;
  completedDate: string;
  score: number;
  maxScore: number;
  percentage: number;
  questions: QuizQuestionReview[];
}

// Interface for the detailed quiz history page data
export interface TopicQuizHistory {
  topicId: string;
  topicName: string;
  attempts: DetailedQuizAttempt[];
}

export interface DetailedQuizAttempt {
  question_text: string;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  attempted_at: string;
  quiz_title?: string;
  topic_name?: string;
}

// Service functions for student progress
export const studentProgressService = {
  // Get all subjects progress for a student
  async getSubjectProgress(studentId: string): Promise<StudentProgress[]> {
    try {
      const { data, error } = await supabase
        .from('subject_progress')
        .select('*')
        .eq('student_id', studentId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching subject progress:', error);
      toast.error('Failed to load subject progress');
      return [];
    }
  },

  // Get quiz scores for a student
  async getQuizScores(studentId: string, limit = 10): Promise<QuizScore[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_scores')
        .select('*')
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching quiz scores:', error);
      toast.error('Failed to load quiz scores');
      return [];
    }
  },

  // Get all learning activities for a student
  async getLearningActivities(studentId: string, limit = 20): Promise<LearningActivity[]> {
    try {
      const { data, error } = await supabase
        .from('learning_activities')
        .select('*')
        .eq('student_id', studentId)
        .order('last_interaction_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Cast the activity_type to our specific type
      return (data || []).map(item => ({
        ...item,
        activity_type: item.activity_type as LearningActivityType
      }));
    } catch (error) {
      console.error('Error fetching learning activities:', error);
      toast.error('Failed to load learning activities');
      return [];
    }
  },

  // Record a new learning activity
  async recordActivity(activity: LearningActivity): Promise<LearningActivity | null> {
    try {
      const { data, error } = await supabase
        .from('learning_activities')
        .insert([{
          ...activity,
          activity_type: activity.activity_type // Make sure this is properly typed
        }])
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        activity_type: data.activity_type as LearningActivityType
      };
    } catch (error) {
      console.error('Error recording activity:', error);
      toast.error('Failed to record learning activity');
      return null;
    }
  },

  // Update an existing learning activity
  async updateActivity(id: string, updates: Partial<LearningActivity>): Promise<LearningActivity | null> {
    try {
      const { data, error } = await supabase
        .from('learning_activities')
        .update({
          ...updates,
          last_interaction_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        activity_type: data.activity_type as LearningActivityType
      };
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error('Failed to update learning activity');
      return null;
    }
  },

  // Record a quiz score
  async recordQuizScore(score: QuizScore): Promise<QuizScore | null> {
    try {
      const { data, error } = await supabase
        .from('quiz_scores')
        .insert([score])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording quiz score:', error);
      toast.error('Failed to record quiz score');
      return null;
    }
  },

  // Get badges earned by a student
  async getStudentBadges(studentId: string): Promise<StudentBadge[]> {
    try {
      const { data, error } = await supabase
        .from('student_badges')
        .select(`
          id,
          student_id,
          badge_id,
          earned_at,
          badges (
            id,
            name,
            description,
            image_url
          )
        `)
        .eq('student_id', studentId);

      if (error) throw error;
      
      // Transform the data to match the StudentBadge interface
      return (data || []).map((item: any) => ({
        id: item.id,
        student_id: item.student_id,
        badge_id: item.badge_id,
        badge: item.badges,
        earned_at: item.earned_at
      }));
    } catch (error) {
      console.error('Error fetching student badges:', error);
      toast.error('Failed to load badges');
      return [];
    }
  },

  // Get AI recommendations for a student
  async getAIRecommendations(studentId: string, limit = 5): Promise<AIRecommendation[]> {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      toast.error('Failed to load recommendations');
      return [];
    }
  },

  // Record a new AI recommendation
  async recordAIRecommendation(recommendation: {
    student_id: string;
    recommendation_type: string;
    recommendation: string;
    read?: boolean;
    acted_on?: boolean;
  }): Promise<AIRecommendation | null> {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .insert([recommendation])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording AI recommendation:', error);
      toast.error('Failed to record AI recommendation');
      return null;
    }
  },

  // Mark recommendation as read
  async markRecommendationAsRead(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking recommendation as read:', error);
      return false;
    }
  },

  // Mark recommendation as acted on
  async markRecommendationAsActedOn(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ acted_on: true })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking recommendation as acted on:', error);
      return false;
    }
  },

  // Get AI Summary Report from Edge Function
  async getAISummaryReport(studentId: string, gradeLevel: string, studentName: string, forceRefresh = false): Promise<AISummaryReport | null> {
    try {
      const { data, error } = await supabase.functions.invoke('get-student-ai-summary-report', {
        body: { studentId, gradeLevel, studentName, forceRefresh },
      });

      if (error) throw error;
      return data as AISummaryReport;
    } catch (error) {
      console.error('Error fetching AI summary report from function:', error);
      toast.error('Failed to load AI summary report');
      return null;
    }
  },

  // Get Detailed Quiz History by Topic from Edge Function
  async getDetailedQuizHistoryByTopic(studentId: string, topicId: string): Promise<TopicQuizHistory | null> {
    try {
      const { data, error } = await supabase.functions.invoke('get-student-quiz-history-by-topic', {
        body: { studentId, topicId },
      });

      if (error) throw error;
      return data as TopicQuizHistory;
    } catch (error) {
      console.error('Error fetching detailed quiz history from function:', error);
      toast.error('Failed to load detailed quiz history');
      return null;
    }
  },
};
