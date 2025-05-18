
import { supabase } from "@/integrations/supabase/client";

export interface SubjectProgress {
  student_id: string;
  subject: string;
  progress: number;
  last_studied: string;
}

export interface FunctionInvokeOptions {
  head?: boolean;
  body?: { [key: string]: any } | FormData;
  headers?: { [key: string]: string };
  retries?: number;
  signal?: AbortSignal; // Added back the signal property
}

export interface AISummaryReport {
  studentId: string;
  overallSummary: string;
  subjectSummaries: { [subject: string]: string };
  recommendations: string[];
  reportDate: string;
  // Added missing properties that are referenced in components
  strengths?: string[];
  areasForImprovement?: string[];
  activityAnalysis?: string;
  knowledgeGrowthChartData?: Array<{ date: string; score: number }>;
  generatedAt?: string;
  studentName?: string;
  gradeLevel?: string;
  quizReview?: QuizReviewDetail[];
}

// Added missing interfaces
export interface AIRecommendation {
  id: string | number;
  student_id: string;
  recommendation_type: string;
  recommendation: string;
  created_at: string;
  read: boolean;
  acted_on: boolean;
}

export interface QuizReviewDetail {
  quizId: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedDate: string;
  questions: Array<{
    questionText: string;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

export interface LearningActivity {
  id: string;
  student_id: string;
  activity_type: string;
  subject: string;
  topic: string;
  completed: boolean;
  progress: number;
  stars_earned: number;
  started_at: string;
  completed_at?: string;
  last_interaction_at: string;
  summary?: string;
  recommendation_id?: string;
}

export const studentProgressService = {
  async getSubjectProgress(studentId: string): Promise<SubjectProgress[]> {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId);

      if (error) {
        console.error("Error fetching subject progress:", error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      console.error("Error in getSubjectProgress:", error);
      throw new Error(error.message);
    }
  },

  async getAISummaryReport(studentId: string, gradeLevel: string, studentName: string, forceRefresh: boolean = false): Promise<AISummaryReport> {
    try {
      const options: FunctionInvokeOptions = {
        body: {
          student_id: studentId,
          grade_level: gradeLevel,
          student_name: studentName,
          force_refresh: forceRefresh
        },
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const { data, error } = await supabase.functions.invoke('ai-student-report', options);

      if (error) {
        console.error("Error invoking AI student report function:", error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error("No data received from AI student report function");
      }

      return data as AISummaryReport;
    } catch (error: any) {
      console.error("Error in getAISummaryReport:", error);
      throw new Error(error.message);
    }
  },
  
  generateFallbackReport(studentName: string, gradeLevel: string): AISummaryReport {
    const today = new Date();
    const formattedDate = today.toLocaleDateString();

    return {
      studentId: 'fallback',
      overallSummary: `A summary is not available for ${studentName} at this time. Please check back later.`,
      subjectSummaries: {},
      recommendations: [`Please ensure all learning activities for ${gradeLevel} are completed.`],
      reportDate: formattedDate,
      studentName: studentName,
      gradeLevel: gradeLevel,
      strengths: ["Completing assigned activities"],
      areasForImprovement: ["More practice needed in various subjects"],
      activityAnalysis: "Not enough learning data available to provide a detailed analysis.",
      generatedAt: today.toISOString(),
      knowledgeGrowthChartData: [
        { date: new Date(today.setDate(today.getDate() - 30)).toISOString(), score: 50 },
        { date: new Date(today.setDate(today.getDate() + 15)).toISOString(), score: 60 },
        { date: today.toISOString(), score: 70 }
      ]
    };
  },

  // Added missing methods referenced in components
  async getAIRecommendations(studentId: string, limit: number = 5): Promise<AIRecommendation[]> {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching AI recommendations:", error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      console.error("Error in getAIRecommendations:", error);
      return [];
    }
  },

  async markRecommendationAsRead(recommendationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ read: true })
        .eq('id', recommendationId);

      if (error) {
        console.error("Error marking recommendation as read:", error);
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error("Error in markRecommendationAsRead:", error);
    }
  },

  async markRecommendationAsActedOn(recommendationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ acted_on: true })
        .eq('id', recommendationId);

      if (error) {
        console.error("Error marking recommendation as acted on:", error);
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error("Error in markRecommendationAsActedOn:", error);
    }
  },

  async recordActivity(activityData: {
    student_id: string;
    activity_type: string;
    subject: string;
    topic: string;
    completed?: boolean;
    progress?: number;
    stars_earned?: number;
    recommendation_id?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('learning_activities')
        .insert([{
          student_id: activityData.student_id,
          activity_type: activityData.activity_type,
          subject: activityData.subject,
          topic: activityData.topic,
          completed: activityData.completed || false,
          progress: activityData.progress || 0,
          stars_earned: activityData.stars_earned || 0,
          recommendation_id: activityData.recommendation_id
        }]);

      if (error) {
        console.error("Error recording learning activity:", error);
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error("Error in recordActivity:", error);
    }
  }
};
