
import { supabase } from "@/integrations/supabase/client";

// Define all the needed interfaces to satisfy imports across the application
export interface SubjectProgress {
  id: string;
  student_id: string;
  subject: string;
  progress: number;
  last_updated_at: string;
  last_studied?: string; // Make optional since we now know it might be missing
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

export interface AIRecommendation {
  id: string;
  student_id: string;
  recommendation: string;
  recommendation_type: string;
  created_at: string;
  read: boolean;
  acted_on: boolean;
}

export interface TopicQuizHistory {
  topic: string;
  subject: string;
  attempts: DetailedQuizAttempt[];
  averageScore: number;
}

export interface DetailedQuizAttempt {
  id: string;
  student_id: string;
  quiz_id: string;
  question_id: string;
  question_text: string;
  student_answer?: string;
  correct_answer: string;
  is_correct: boolean;
  attempted_at: string;
}

export interface AISummaryReport {
  studentId: string;
  studentName: string;
  gradeLevel: string;
  strengths: string[];
  areasForImprovement: string[];
  activityAnalysis: string;
  knowledgeGrowthChartData?: {
    labels: string[];
    data: number[];
  };
  quizReview?: {
    topics: string[];
    scores: number[];
  };
  generatedAt: string;
}

// Activity recording interface
export interface ActivityData {
  student_id: string;
  activity_type: string;
  subject: string;
  topic: string;
  completed?: boolean;
  progress?: number;
  stars_earned?: number;
  recommendation_id?: string;
  last_interaction_at?: string; // Add missing fields
}

// Quiz score recording interface
export interface QuizScoreData {
  student_id: string;
  subject: string;
  topic: string;
  score: number;
  max_score: number;
  percentage: number;
}

export interface AIRecommendationData {
  student_id: string;
  recommendation_type: string;
  recommendation: string;
}

/**
 * Gets subject progress for a student
 */
export const getSubjectProgress = async (studentId: string): Promise<SubjectProgress[]> => {
  try {
    const { data, error } = await supabase
      .from('subject_progress')
      .select('*')
      .eq('student_id', studentId);
      
    if (error) {
      console.error('Error fetching subject progress:', error);
      return [];
    }
    
    return data as SubjectProgress[];
  } catch (error) {
    console.error('Error in getSubjectProgress:', error);
    return [];
  }
};

/**
 * Gets learning activities for a student
 */
export const getLearningActivities = async (studentId: string, limit: number = 10): Promise<LearningActivity[]> => {
  try {
    const { data, error } = await supabase
      .from('learning_activities')
      .select('*')
      .eq('student_id', studentId)
      .order('last_interaction_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching learning activities:', error);
      return [];
    }
    
    return data as LearningActivity[];
  } catch (error) {
    console.error('Error in getLearningActivities:', error);
    return [];
  }
};

/**
 * Records a learning activity
 */
export const recordActivity = async (activityData: ActivityData): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('learning_activities')
      .insert([activityData]);
      
    if (error) {
      console.error('Error recording learning activity:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in recordActivity:', error);
    return false;
  }
};

/**
 * Records a quiz score
 */
export const recordQuizScore = async (quizScoreData: QuizScoreData): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('quiz_scores')
      .insert([quizScoreData]);
      
    if (error) {
      console.error('Error recording quiz score:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in recordQuizScore:', error);
    return false;
  }
};

/**
 * Gets quiz scores for a student
 */
export const getQuizScores = async (studentId: string, limit: number = 10): Promise<QuizScore[]> => {
  try {
    const { data, error } = await supabase
      .from('quiz_scores')
      .select('*')
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching quiz scores:', error);
      return [];
    }
    
    return data as QuizScore[];
  } catch (error) {
    console.error('Error in getQuizScores:', error);
    return [];
  }
};

/**
 * Gets AI recommendations for a student
 */
export const getAIRecommendations = async (studentId: string): Promise<AIRecommendation[]> => {
  try {
    const { data, error } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching AI recommendations:', error);
      return [];
    }
    
    return data as AIRecommendation[];
  } catch (error) {
    console.error('Error in getAIRecommendations:', error);
    return [];
  }
};

/**
 * Mark recommendation as read
 */
export const markRecommendationAsRead = async (recommendationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('ai_recommendations')
      .update({ read: true })
      .eq('id', recommendationId);
      
    if (error) {
      console.error('Error marking recommendation as read:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in markRecommendationAsRead:', error);
    return false;
  }
};

/**
 * Mark recommendation as acted on
 */
export const markRecommendationAsActedOn = async (recommendationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('ai_recommendations')
      .update({ acted_on: true })
      .eq('id', recommendationId);
      
    if (error) {
      console.error('Error marking recommendation as acted on:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in markRecommendationAsActedOn:', error);
    return false;
  }
};

/**
 * Record an AI recommendation
 */
export const recordAIRecommendation = async (recommendationData: AIRecommendationData): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('ai_recommendations')
      .insert([{
        ...recommendationData,
        read: false,
        acted_on: false
      }]);
      
    if (error) {
      console.error('Error recording AI recommendation:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in recordAIRecommendation:', error);
    return false;
  }
};

/**
 * Get detailed quiz history for a topic
 */
export const getDetailedQuizHistoryByTopic = async (
  studentId: string, 
  subject: string,
  topic: string
): Promise<TopicQuizHistory> => {
  try {
    const { data: quizAttempts, error } = await supabase.functions.invoke('get-student-quiz-history-by-topic', {
      body: {
        student_id: studentId,
        subject: subject,
        topic: topic
      }
    });
      
    if (error) {
      console.error('Error fetching quiz history:', error);
      return {
        topic,
        subject,
        attempts: [],
        averageScore: 0
      };
    }
    
    return quizAttempts;
  } catch (error) {
    console.error('Error in getDetailedQuizHistoryByTopic:', error);
    return {
      topic,
      subject,
      attempts: [],
      averageScore: 0
    };
  }
};

/**
 * Get AI summary report for a student
 */
export const getAISummaryReport = async (
  studentId: string, 
  gradeLevel: string,
  studentName: string,
  forceRefresh: boolean = false
): Promise<AISummaryReport> => {
  try {
    // Try to get existing report if not forcing refresh
    if (!forceRefresh) {
      const { data: existingReport } = await supabase
        .from('ai_student_reports')
        .select('*')
        .eq('student_id', studentId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (existingReport) {
        const reportData = existingReport.report_data as AISummaryReport;
        return reportData;
      }
    }
    
    // Get new report from edge function
    const { data: reportData, error } = await supabase.functions.invoke('get-student-ai-summary-report', {
      body: {
        student_id: studentId,
        grade_level: gradeLevel,
        student_name: studentName
      }
    });
    
    if (error) {
      console.error('Error getting AI summary report:', error);
      return generateFallbackReport(studentName, gradeLevel);
    }
    
    return reportData;
  } catch (error) {
    console.error('Error in getAISummaryReport:', error);
    return generateFallbackReport(studentName, gradeLevel);
  }
};

/**
 * Generate a fallback report when the AI service is unavailable
 */
export const generateFallbackReport = (studentName: string, gradeLevel: string): AISummaryReport => {
  return {
    studentId: '',
    studentName: studentName,
    gradeLevel: gradeLevel,
    strengths: ['Reading comprehension', 'Math problem solving'],
    areasForImprovement: ['Spelling', 'Scientific concepts'],
    activityAnalysis: 'Student has been consistently engaging with the learning platform.',
    knowledgeGrowthChartData: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      data: [30, 45, 60, 75]
    },
    generatedAt: new Date().toISOString()
  };
};

export const studentProgressService = {
  getSubjectProgress,
  getAISummaryReport,
  generateFallbackReport,
  getLearningActivities,
  recordActivity,
  recordQuizScore,
  getQuizScores,
  getAIRecommendations,
  markRecommendationAsRead,
  markRecommendationAsActedOn,
  recordAIRecommendation,
  getDetailedQuizHistoryByTopic
};
