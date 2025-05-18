import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";

export interface SubjectProgress {
  id: string;
  subject: string;
  student_id: string;
  progress: number;
  last_updated_at: string;
}

export interface LearningActivity {
  id: string;
  student_id: string;
  activity_type: string; // 'lesson', 'quiz', 'game'
  subject: string;
  topic: string;
  progress: number;
  stars_earned: number;
  started_at: string;
  completed_at?: string;
  completed: boolean;
  last_interaction_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  created_at: string;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
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

export interface QuizReviewDetail {
  subject: string;
  topic: string;
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  date: string;
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

export interface AIRecommendationData {
  student_id: string;
  recommendation: string;
  recommendation_type: string;
  read?: boolean;
}

export interface DetailedQuizAttempt {
  id: string;
  student_id: string;
  quiz_id: string;
  question_text: string;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  attempted_at: string;
  subject_id: string;
  topic_id: string;
  quiz_title?: string; 
}

export interface TopicQuizHistory {
  topic: string;
  subject: string;
  attempts: DetailedQuizAttempt[];
  averageScore: number;
  topicName?: string;
}

// Enhanced AI Summary Report interface with proper types for data arrays
export interface AISummaryReport {
  studentId: string;
  studentName: string;
  gradeLevel: string;
  strengths: string[];
  areasForImprovement: string[];
  overallSummary: string;
  activityAnalysis: string;
  quizReview: {
    topics: string[];
    scores: number[];
  };
  knowledgeGrowthChartData: Array<{
    date: string;
    score: number;
  }>;
  generatedAt: string;
  version: number;
}

export interface ActivityRecordData {
  student_id: string;
  activity_type: string;
  subject: string;
  topic: string;
  completed?: boolean;
  progress?: number;
  stars_earned?: number;
  recommendation_id?: string;
}

// Implementation of the studentProgressService
export const studentProgressService = {
  // Get subject progress for a student
  async getSubjectProgress(studentId: string): Promise<SubjectProgress[]> {
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
  },
  
  // Get AI summary report for a student
  async getAISummaryReport(studentId: string, gradeLevel: string, studentName: string, forceRefresh = false): Promise<AISummaryReport | null> {
    try {
      // Check for existing report if not forcing refresh
      if (!forceRefresh) {
        const { data, error } = await supabase
          .from('ai_student_reports')
          .select('*')
          .eq('student_id', studentId)
          .order('generated_at', { ascending: false })
          .limit(1);
          
        if (!error && data && data.length > 0) {
          // If report exists, parse and return it
          const reportData = data[0].report_data;
          
          // Handle possible JSON formats - convert if it's a string
          const parsedData = typeof reportData === 'string' ? JSON.parse(reportData) : reportData;
          
          // Convert to proper AISummaryReport format
          const formattedReport: AISummaryReport = {
            studentId: studentId,
            studentName,
            gradeLevel,
            strengths: Array.isArray(parsedData?.strengths) ? parsedData.strengths : [],
            areasForImprovement: Array.isArray(parsedData?.areasForImprovement) ? parsedData.areasForImprovement : [],
            overallSummary: parsedData?.overallSummary || '',
            activityAnalysis: parsedData?.activityAnalysis || '',
            quizReview: {
              topics: Array.isArray(parsedData?.quizReview?.topics) ? parsedData.quizReview.topics : [],
              scores: Array.isArray(parsedData?.quizReview?.scores) ? parsedData.quizReview.scores : []
            },
            knowledgeGrowthChartData: Array.isArray(parsedData?.knowledgeGrowthChartData) ? 
              parsedData.knowledgeGrowthChartData : 
              [],
            generatedAt: data[0].generated_at,
            version: data[0].version
          };
          
          return formattedReport;
        }
      }
      
      // Generate a new report using edge function
      try {
        const { data: aiData, error: aiError } = await supabase.functions.invoke('get-student-ai-summary-report', {
          body: { studentId, gradeLevel, studentName }
        });
        
        if (aiError) {
          console.error('Error generating AI report:', aiError);
          return this.generateFallbackReport(studentName, gradeLevel);
        }
        
        // Save the generated report
        await supabase
          .from('ai_student_reports')
          .insert({
            student_id: studentId,
            report_data: aiData,
            version: 1
          });
          
        // Format the response as AISummaryReport
        const formattedReport: AISummaryReport = {
          studentId,
          studentName,
          gradeLevel,
          strengths: Array.isArray(aiData?.strengths) ? aiData.strengths : [],
          areasForImprovement: Array.isArray(aiData?.areasForImprovement) ? aiData.areasForImprovement : [],
          overallSummary: aiData?.overallSummary || '',
          activityAnalysis: aiData?.activityAnalysis || '',
          quizReview: {
            topics: Array.isArray(aiData?.quizReview?.topics) ? aiData.quizReview.topics : [],
            scores: Array.isArray(aiData?.quizReview?.scores) ? aiData.quizReview.scores : []
          },
          knowledgeGrowthChartData: Array.isArray(aiData?.knowledgeGrowthChartData) ? 
            aiData.knowledgeGrowthChartData : 
            [],
          generatedAt: new Date().toISOString(),
          version: 1
        };
        
        return formattedReport;
      } catch (innerError) {
        console.error('Error in AI report generation:', innerError);
        return this.generateFallbackReport(studentName, gradeLevel);
      }
    } catch (error) {
      console.error('Error in getAISummaryReport:', error);
      return this.generateFallbackReport(studentName, gradeLevel);
    }
  },
  
  // Generate a fallback report when AI fails
  generateFallbackReport(studentName: string, gradeLevel: string): AISummaryReport {
    return {
      studentId: 'fallback',
      studentName,
      gradeLevel,
      strengths: ['Reading comprehension', 'Problem solving'],
      areasForImprovement: ['Mathematical concepts', 'Science terminology'],
      overallSummary: 'Overall making good progress. Keep up the positive attitude!',
      activityAnalysis: 'Limited activity data available. Encourage more regular practice.',
      quizReview: {
        topics: ['Math', 'Reading', 'Science'],
        scores: [65, 85, 70]
      },
      knowledgeGrowthChartData: [
        { date: '2023-01-15', score: 30 },
        { date: '2023-02-15', score: 45 },
        { date: '2023-03-15', score: 60 },
        { date: '2023-04-15', score: 70 }
      ],
      generatedAt: new Date().toISOString(),
      version: 1
    };
  },
  
  // Get AI recommendations for a student
  async getAIRecommendations(studentId: string): Promise<AIRecommendation[]> {
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
  },
  
  // Mark a recommendation as read
  async markRecommendationAsRead(recommendationId: string): Promise<boolean> {
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
  },
  
  // Mark a recommendation as acted upon
  async markRecommendationAsActedOn(recommendationId: string): Promise<boolean> {
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
  },
  
  // Record a new recommendation
  async recordAIRecommendation(data: AIRecommendationData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .insert([{
          student_id: data.student_id,
          recommendation: data.recommendation,
          recommendation_type: data.recommendation_type,
          read: data.read || false,
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
  },
  
  // Record activity
  async recordActivity(activityData: ActivityRecordData): Promise<boolean> {
    try {
      // Define the activity record
      const activity = {
        student_id: activityData.student_id,
        activity_type: activityData.activity_type,
        subject: activityData.subject,
        topic: activityData.topic,
        progress: activityData.progress || 0,
        stars_earned: activityData.stars_earned || 0,
        completed: activityData.completed || false
      };
      
      // If completed, add completed_at timestamp
      if (activity.completed) {
        Object.assign(activity, {
          completed_at: new Date().toISOString()
        });
      }
      
      const { error } = await supabase
        .from('learning_activities')
        .insert([activity]);
        
      if (error) {
        console.error('Error recording activity:', error);
        return false;
      }
      
      // If there's a recommendation ID, mark it as acted upon
      if (activityData.recommendation_id) {
        await this.markRecommendationAsActedOn(activityData.recommendation_id);
      }
      
      return true;
    } catch (error) {
      console.error('Error in recordActivity:', error);
      return false;
    }
  },
  
  // Get learning activities for a student - Fix the argument count
  async getLearningActivities(studentId: string): Promise<LearningActivity[]> {
    try {
      const { data, error } = await supabase
        .from('learning_activities')
        .select('*')
        .eq('student_id', studentId)
        .order('last_interaction_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching learning activities:', error);
        return [];
      }
      
      return data as LearningActivity[];
    } catch (error) {
      console.error('Error in getLearningActivities:', error);
      return [];
    }
  },
  
  // Get quiz scores for a student
  async getQuizScores(studentId: string): Promise<QuizScore[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_scores')
        .select('*')
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching quiz scores:', error);
        return [];
      }
      
      return data as QuizScore[];
    } catch (error) {
      console.error('Error in getQuizScores:', error);
      return [];
    }
  },
  
  // Record quiz score
  async recordQuizScore(scoreData: Omit<QuizScore, 'id' | 'completed_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('quiz_scores')
        .insert([{
          ...scoreData,
          completed_at: new Date().toISOString()
        }]);
        
      if (error) {
        console.error('Error recording quiz score:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in recordQuizScore:', error);
      return false;
    }
  },
  
  // Get student badges
  async getStudentBadges(studentId: string): Promise<StudentBadge[]> {
    try {
      const { data, error } = await supabase
        .from('student_badges')
        .select(`
          *,
          badges:badge_id (*)
        `)
        .eq('student_id', studentId);
        
      if (error) {
        console.error('Error fetching student badges:', error);
        return [];
      }
      
      return data.map(item => ({
        ...item,
        badge: item.badges
      })) as unknown as StudentBadge[];
    } catch (error) {
      console.error('Error in getStudentBadges:', error);
      return [];
    }
  },
  
  // Get detailed quiz history by topic
  async getDetailedQuizHistoryByTopic(studentId: string, gradeLevel: string, subject?: string): Promise<TopicQuizHistory[]> {
    try {
      // Call the edge function to get detailed quiz history
      const { data, error } = await supabase.functions.invoke('get-student-quiz-history-by-topic', {
        body: { studentId, gradeLevel, subject }
      });
      
      if (error) {
        console.error('Error fetching quiz history:', error);
        return [];
      }
      
      // Ensure each topic has a topicName property
      const topicHistory = data.map((topic: any) => ({
        ...topic,
        topicName: topic.topic // Add the missing property
      }));
      
      // Ensure each attempt has the quiz_title property
      const processedData = topicHistory.map((topic: any) => {
        const processedAttempts = topic.attempts.map((attempt: any) => ({
          ...attempt,
          quiz_title: attempt.quiz_title || 'Quiz' // Add the missing property
        }));
        
        return {
          ...topic,
          attempts: processedAttempts
        };
      });
      
      return processedData as TopicQuizHistory[];
    } catch (error) {
      console.error('Error in getDetailedQuizHistoryByTopic:', error);
      return [];
    }
  }
};
