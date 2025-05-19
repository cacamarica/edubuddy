
import { supabase } from "@/integrations/supabase/client";

// Interfaces for AI Education Service
interface AILessonRequest {
  subject: string;
  topic: string;
  gradeLevel: string;
}

interface AILessonResponse {
  title: string;
  content: string;
  recommendations?: string[];
  summary?: string;
}

export const aiEducationService = {
  // Fetch AI-generated lesson content
  async generateLesson(params: AILessonRequest): Promise<AILessonResponse> {
    try {
      // This is a placeholder that would normally call a Supabase function or API
      // For now, we'll return some dummy content
      return {
        title: `${params.topic} - ${params.subject}`,
        content: `This is an AI-generated lesson about ${params.topic} for ${params.gradeLevel} grade level students.`,
        recommendations: ["Practice with related quizzes", "Explore additional resources"],
        summary: `A summary of the ${params.topic} lesson for ${params.gradeLevel} students.`
      };
    } catch (error) {
      console.error("Error generating AI lesson:", error);
      throw new Error("Could not generate lesson content");
    }
  },

  // Save learning interaction
  async trackLearningActivity(studentId: string, params: {
    subject: string;
    topic: string;
    activityType: 'lesson' | 'quiz' | 'game';
    completed?: boolean;
    progress?: number;
  }): Promise<void> {
    try {
      const { subject, topic, activityType, completed = false, progress = 0 } = params;
      
      await supabase.from('learning_activities').insert({
        student_id: studentId,
        subject,
        topic,
        activity_type: activityType,
        completed,
        progress
      });
    } catch (error) {
      console.error("Error tracking learning activity:", error);
      // Don't throw here, just log - we don't want tracking errors to disrupt the user experience
    }
  }
};
