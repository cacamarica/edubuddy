
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
  signal?: AbortSignal;
}

export interface AISummaryReport {
  studentId: string;
  overallSummary: string;
  subjectSummaries: { [subject: string]: string };
  recommendations: string[];
  reportDate: string;
  strengths?: string[];
  areasForImprovement?: string[];
  activityAnalysis?: string;
  knowledgeGrowthChartData?: Array<{ date: string; score: number }>;
  generatedAt?: string;
  studentName?: string;
  gradeLevel?: string;
  quizReview?: QuizReviewDetail[];
}

export interface AIRecommendation {
  id: string;
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

export interface QuizScore {
  id: string;
  student_id: string;
  subject: string;
  topic: string;
  score: number;
  max_score: number;
  percentage: number;
  completed_at: string;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  created_at: string;
}

export interface TopicQuizHistory {
  topic: string;
  subject: string;
  attempts: number;
  bestScore: number;
  averageScore: number;
  lastAttemptDate: string;
  detailedAttempts: DetailedQuizAttempt[];
}

export interface DetailedQuizAttempt {
  id: string;
  attempted_at: string;
  score: number;
  total_questions: number;
  percentage: number;
  questions: {
    question_text: string;
    student_answer: string;
    correct_answer: string;
    is_correct: boolean;
  }[];
}

export const studentProgressService = {
  async getSubjectProgress(studentId: string): Promise<SubjectProgress[]> {
    try {
      const { data, error } = await supabase
        .from('subject_progress')
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
    last_interaction_at?: string;
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
          recommendation_id: activityData.recommendation_id,
          last_interaction_at: activityData.last_interaction_at || new Date().toISOString()
        }]);

      if (error) {
        console.error("Error recording learning activity:", error);
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error("Error in recordActivity:", error);
    }
  },

  async getLearningActivities(studentId: string, limit: number = 10): Promise<LearningActivity[]> {
    try {
      const { data, error } = await supabase
        .from('learning_activities')
        .select('*')
        .eq('student_id', studentId)
        .order('last_interaction_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching learning activities:", error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      console.error("Error in getLearningActivities:", error);
      return [];
    }
  },

  async getQuizScores(studentId: string, limit: number = 10): Promise<QuizScore[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_scores')
        .select('*')
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching quiz scores:", error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      console.error("Error in getQuizScores:", error);
      return [];
    }
  },

  async getDetailedQuizHistoryByTopic(studentId: string, subject: string, topic: string): Promise<TopicQuizHistory | null> {
    try {
      const { data, error } = await supabase.functions.invoke('get-student-quiz-history-by-topic', {
        body: {
          student_id: studentId,
          subject: subject,
          topic: topic
        }
      });

      if (error) {
        console.error("Error fetching quiz history:", error);
        throw new Error(error.message);
      }

      return data as TopicQuizHistory;
    } catch (error: any) {
      console.error("Error in getDetailedQuizHistoryByTopic:", error);
      return null;
    }
  },

  async recordQuizScore(scoreData: {
    student_id: string;
    subject: string;
    topic: string;
    score: number;
    max_score: number;
    percentage: number;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('quiz_scores')
        .insert([{
          student_id: scoreData.student_id,
          subject: scoreData.subject,
          topic: scoreData.topic,
          score: scoreData.score,
          max_score: scoreData.max_score,
          percentage: scoreData.percentage
        }]);

      if (error) {
        console.error("Error recording quiz score:", error);
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error("Error in recordQuizScore:", error);
    }
  },

  async getStudentBadges(studentId: string): Promise<StudentBadge[]> {
    try {
      const { data, error } = await supabase
        .from('student_badges')
        .select('*, badges(*)')
        .eq('student_id', studentId);

      if (error) {
        console.error("Error fetching student badges:", error);
        throw new Error(error.message);
      }

      // Transform the data to match our StudentBadge interface
      const badges = data?.map(item => ({
        id: item.id,
        student_id: item.student_id,
        badge_id: item.badge_id,
        earned_at: item.earned_at,
        badge: item.badges ? {
          id: item.badges.id,
          name: item.badges.name,
          description: item.badges.description,
          image_url: item.badges.image_url,
          created_at: item.badges.created_at
        } : undefined
      })) || [];

      return badges;
    } catch (error: any) {
      console.error("Error in getStudentBadges:", error);
      return [];
    }
  },

  async recordAIRecommendation(recommendationData: {
    student_id: string;
    recommendation_type: string;
    recommendation: string;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .insert([{
          student_id: recommendationData.student_id,
          recommendation_type: recommendationData.recommendation_type,
          recommendation: recommendationData.recommendation,
          read: false,
          acted_on: false
        }])
        .select('id')
        .single();

      if (error) {
        console.error("Error recording AI recommendation:", error);
        throw new Error(error.message);
      }

      return data?.id || null;
    } catch (error: any) {
      console.error("Error in recordAIRecommendation:", error);
      return null;
    }
  }
};
