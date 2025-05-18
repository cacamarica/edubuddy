
import { supabase } from "@/integrations/supabase/client";
import { AIRecommendation } from "./studentProgressService";

interface PersonalizedInsightOptions {
  studentId: string;
  subject?: string;
  topic?: string;
  activityType?: string;
  gradeLevel: string;
  language: 'en' | 'id';
}

interface PersonalizedInsight {
  reasoning?: string;
  expectedImpact?: string;
  confidenceScore?: number;
}

interface EnhanceRecommendationsOptions {
  recommendations: any[];
  studentId: string;
  gradeLevel: string;
  language: 'en' | 'id';
}

export const aiLearningInsightService = {
  /**
   * Get personalized insight for a specific learning recommendation
   */
  async getPersonalizedInsight(options: PersonalizedInsightOptions): Promise<PersonalizedInsight | null> {
    try {
      const { data, error } = await supabase.functions.invoke('get-student-ai-insights', {
        body: {
          student_id: options.studentId,
          subject: options.subject,
          topic: options.topic,
          activity_type: options.activityType,
          grade_level: options.gradeLevel,
          language: options.language
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        console.error("Error invoking AI insights function:", error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error("Error in getPersonalizedInsight:", error);
      return null;
    }
  },

  /**
   * Enhance multiple recommendations with AI insights
   * Supports both object parameter style and individual parameters
   */
  async enhanceRecommendationsWithInsights(
    optionsOrRecommendations: EnhanceRecommendationsOptions | any[], 
    studentId?: string, 
    gradeLevel?: string, 
    language?: 'en' | 'id'
  ): Promise<any[]> {
    try {
      // Parse parameters based on which style is used (object or individual parameters)
      let recommendations: any[];
      let studId: string;
      let grade: string;
      let lang: 'en' | 'id';

      if (Array.isArray(optionsOrRecommendations)) {
        recommendations = optionsOrRecommendations;
        studId = studentId || '';
        grade = gradeLevel || 'k-3';
        lang = language || 'en';
      } else {
        recommendations = optionsOrRecommendations.recommendations;
        studId = optionsOrRecommendations.studentId;
        grade = optionsOrRecommendations.gradeLevel;
        lang = optionsOrRecommendations.language || 'en';
      }

      // Call batch processing edge function
      const { data, error } = await supabase.functions.invoke('get-student-bulk-insights', {
        body: {
          student_id: studId,
          grade_level: grade,
          recommendations: recommendations,
          language: lang
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        console.error("Error invoking AI bulk insights function:", error);
        // Return original recommendations if there's an error
        return recommendations;
      }

      return data || recommendations;
    } catch (error) {
      console.error("Error in enhanceRecommendationsWithInsights:", error);
      return Array.isArray(optionsOrRecommendations) ? optionsOrRecommendations : optionsOrRecommendations.recommendations || [];
    }
  },

  /**
   * Generate a simple insight without calling the AI service (fallback)
   */
  generateSimpleInsight(subject: string, topic: string, activityType: string, language: string = 'en'): PersonalizedInsight {
    if (language === 'id') {
      return {
        reasoning: `Berdasarkan analisis pembelajaran Anda, topik ${topic} dalam ${subject} akan membantu Anda memahami konsep penting.`,
        expectedImpact: `Mempelajari topik ini akan meningkatkan pemahaman dan keterampilan Anda dalam ${subject}.`
      };
    } else {
      return {
        reasoning: `Based on analysis of your learning patterns, the topic ${topic} in ${subject} will help you understand important concepts.`,
        expectedImpact: `Learning this topic will improve your understanding and skills in ${subject}.`
      };
    }
  }
};
