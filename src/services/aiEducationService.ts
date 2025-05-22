
import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';
import { AIEducationContentRequest, AIEducationContentResponse } from '@/types/learning';

interface ExtendedAIEducationContentRequest extends AIEducationContentRequest {
  skipMediaSearch?: boolean;
  enhancedParams?: any;
}

/**
 * Service for AI-generated educational content
 */
class AIEducationService {
  /**
   * Generate educational content using AI
   * @param params Request parameters for content generation
   * @returns Generated content
   */
  async generateContent(params: ExtendedAIEducationContentRequest): Promise<AIEducationContentResponse> {
    try {
      console.log('Generating AI content for:', JSON.stringify(params, null, 2));
      
      // First try using the Supabase edge function
      try {
        console.log('Attempting direct OpenAI API call...');
        const { data, error } = await supabase.functions.invoke('ai-edu-content', {
          body: params
        });
        
        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(error instanceof Error ? error.message : 'Unknown error');
        }
        
        if (data && (data.content || data.error)) {
          return data;
        }
      } catch (supabaseError) {
        console.error('Error calling Supabase function:', supabaseError);
        // Fall through to backup method
      }
      
      // Fallback to direct API call (if deployed)
      try {
        const response = await axios.post('/api/ai-education/generate', params);
        return response.data;
      } catch (apiError) {
        console.error('API fallback error:', apiError);
        throw apiError;
      }
    } catch (error) {
      console.error('AI Education Service error:', error);
      return {
        content: null,
        error: error instanceof Error ? error.message : 'Error generating educational content'
      };
    }
  }
  
  /**
   * Generate a lesson using AI
   * @param options Lesson generation options
   * @returns Generated lesson content
   */
  async generateLesson(options: {
    subject: string;
    topic: string;
    gradeLevel: string;
    studentId?: string;
    skipMediaSearch?: boolean;
  }): Promise<any> {
    const { subject, topic, gradeLevel, studentId, skipMediaSearch = true } = options;
    
    try {
      const result = await this.generateContent({
        contentType: 'lesson',
        subject,
        topic,
        gradeLevel: this.normalizeGradeLevel(gradeLevel),
        studentId,
        skipMediaSearch
      });
      
      if (result.error) {
        return { error: result.error };
      }
      
      // Generate a unique ID for the lesson
      const lessonId = `${subject.toLowerCase().replace(/\s+/g, '-')}_${topic.toLowerCase().replace(/\s+/g, '-')}_${Date.now()}`;
      
      return {
        ...result,
        lessonId
      };
    } catch (error) {
      console.error('Error generating lesson:', error);
      return { error: error instanceof Error ? error.message : 'Failed to generate lesson' };
    }
  }
  
  /**
   * Generate a quiz using AI
   * @param options Quiz generation options
   * @returns Generated quiz content
   */
  async generateQuiz(options: {
    subject: string;
    topic: string;
    gradeLevel: string;
    questionCount?: number;
    difficultyLevel?: 'easy' | 'medium' | 'hard';
    skipMediaSearch?: boolean;
  }): Promise<any> {
    const { subject, topic, gradeLevel, questionCount = 10, difficultyLevel = 'medium', skipMediaSearch = true } = options;
    
    try {
      const result = await this.generateContent({
        contentType: 'quiz',
        subject,
        topic,
        gradeLevel: this.normalizeGradeLevel(gradeLevel),
        questionCount,
        difficultyLevel,
        skipMediaSearch
      });
      
      if (result.error) {
        return { error: result.error };
      }
      
      // Generate a unique ID for the quiz
      const quizId = `${subject.toLowerCase().replace(/\s+/g, '-')}_${topic.toLowerCase().replace(/\s+/g, '-')}_${Date.now()}`;
      
      return {
        ...result,
        quizId
      };
    } catch (error) {
      console.error('Error generating quiz:', error);
      return { error: error instanceof Error ? error.message : 'Failed to generate quiz' };
    }
  }
  
  /**
   * Generate an educational game using AI
   * @param options Game generation options
   * @returns Generated game content
   */
  async generateGame(options: {
    subject: string;
    topic: string;
    gradeLevel: string;
    gameType?: 'puzzle' | 'matching' | 'adventure' | 'quiz';
  }): Promise<any> {
    const { subject, topic, gradeLevel, gameType = 'matching' } = options;
    
    try {
      const result = await this.generateContent({
        contentType: 'game',
        subject,
        topic,
        gradeLevel: this.normalizeGradeLevel(gradeLevel),
        gameType
      });
      
      if (result.error) {
        return { error: result.error };
      }
      
      // Generate a unique ID for the game
      const gameId = `${subject.toLowerCase().replace(/\s+/g, '-')}_${topic.toLowerCase().replace(/\s+/g, '-')}_${Date.now()}`;
      
      return {
        ...result,
        gameId
      };
    } catch (error) {
      console.error('Error generating game:', error);
      return { error: error instanceof Error ? error.message : 'Failed to generate game' };
    }
  }
  
  /**
   * Get a response from the AI learning buddy
   * @param options Options for the learning buddy
   * @returns AI response
   */
  async askLearningBuddy(options: {
    question: string;
    subject?: string;
    gradeLevel?: string;
    studentName?: string;
    language?: 'en' | 'id';
  }): Promise<any> {
    const { question, subject, gradeLevel, studentName, language = 'en' } = options;
    
    try {
      const result = await this.generateContent({
        contentType: 'buddy',
        subject,
        question,
        gradeLevel: gradeLevel ? this.normalizeGradeLevel(gradeLevel) : undefined,
        studentName,
        language
      });
      
      if (result.error) {
        return { error: result.error };
      }
      
      return result;
    } catch (error) {
      console.error('Error asking learning buddy:', error);
      return { error: error instanceof Error ? error.message : 'Failed to get response from learning buddy' };
    }
  }

  /**
   * Get AI educational content with enhanced parameters
   * @param params Request parameters for content generation
   * @returns Generated content
   */
  async getAIEducationContent(params: ExtendedAIEducationContentRequest): Promise<AIEducationContentResponse> {
    // Skip media search by default for better performance
    const enhancedParams = {
      ...params,
      skipMediaSearch: params.skipMediaSearch !== false, // Default to true if not specified
    };
    
    try {
      return await this.generateContent(enhancedParams);
    } catch (error) {
      console.error('Error generating AI education content:', error);
      return {
        content: null,
        error: error instanceof Error ? error.message : 'Error generating educational content'
      };
    }
  }
  
  /**
   * Normalize grade level to match the expected format
   * @param gradeLevel The grade level to normalize
   * @returns Normalized grade level
   */
  private normalizeGradeLevel(gradeLevel: string): 'k-3' | '4-6' | '7-9' {
    if (!gradeLevel) return '4-6'; // Default to middle grade
    
    // Convert single grades to ranges
    const grade = parseInt(gradeLevel);
    if (!isNaN(grade)) {
      if (grade <= 3) return 'k-3';
      if (grade <= 6) return '4-6';
      return '7-9';
    }
    
    // Handle existing ranges
    if (['k-3', '4-6', '7-9'].includes(gradeLevel.toLowerCase())) {
      return gradeLevel.toLowerCase() as 'k-3' | '4-6' | '7-9';
    }
    
    // Map other common formats
    if (['kindergarten', 'k', 'pre-k', 'pre-school', 'preschool'].includes(gradeLevel.toLowerCase())) {
      return 'k-3';
    }
    
    if (['middle school', 'junior high'].includes(gradeLevel.toLowerCase())) {
      return '4-6';
    }
    
    if (['high school', 'secondary'].includes(gradeLevel.toLowerCase())) {
      return '7-9';
    }
    
    // Default fallback
    return '4-6';
  }
}

export const aiEducationService = new AIEducationService();

// Export the getAIEducationContent function for direct use in components
export const getAIEducationContent = (params: ExtendedAIEducationContentRequest): Promise<AIEducationContentResponse> => {
  return aiEducationService.getAIEducationContent(params);
};

