import { QuizQuestion } from "@/components/QuizComponents/QuizQuestionCard";

// Interface for quiz options
interface QuizCacheOptions {
  subject: string;
  gradeLevel: string;
  topic: string;
  subtopic?: string;
  language?: 'en' | 'id';
}

// Helper to generate a cache key for quiz questions
const generateCacheKey = (options: QuizCacheOptions): string => {
  const { subject, gradeLevel, topic, subtopic, language } = options;
  return `${subject.toLowerCase()}_${gradeLevel}_${topic.toLowerCase()}_${subtopic || 'none'}_${language || 'en'}`;
};

// Get cached questions from local storage (as temporary solution)
export const getCachedQuestions = async (options: QuizCacheOptions): Promise<QuizQuestion[] | null> => {
  try {
    const cacheKey = generateCacheKey(options);
    
    console.log('[Cache] Checking for cached quiz questions with key:', cacheKey);
    
    // Try to get from localStorage
    const cachedData = localStorage.getItem(`quiz_cache_${cacheKey}`);
    
    if (!cachedData) {
      console.log('[Cache] No cached questions found');
      return null;
    }
    
    try {
      const parsedData = JSON.parse(cachedData);
      
      if (!parsedData || !parsedData.questions || !Array.isArray(parsedData.questions)) {
        console.log('[Cache] Invalid cached questions format');
        return null;
      }
      
      // Check if cache is recent (within 7 days)
      const cacheDate = new Date(parsedData.timestamp);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 7) {
        console.log('[Cache] Cached questions are older than 7 days, refreshing');
        return null;
      }
      
      console.log('[Cache] Found cached questions, count:', parsedData.questions.length);
      return parsedData.questions as QuizQuestion[];
    } catch (parseError) {
      console.error('[Cache] Error parsing cached data:', parseError);
      return null;
    }
  } catch (error) {
    console.error('[Cache] Error checking for cached questions:', error);
    return null;
  }
};

// Save questions to cache in localStorage
export const cacheQuestions = async (options: QuizCacheOptions, questions: QuizQuestion[]): Promise<void> => {
  try {
    if (!questions || questions.length === 0) {
      console.log('[Cache] Not caching empty question set');
      return;
    }
    
    const cacheKey = generateCacheKey(options);
    
    console.log('[Cache] Caching quiz questions with key:', cacheKey);
    
    // Store data with timestamp
    const cacheData = {
      questions: questions,
      timestamp: new Date().toISOString(),
      ...options
    };
    
    localStorage.setItem(`quiz_cache_${cacheKey}`, JSON.stringify(cacheData));
    console.log('[Cache] Successfully cached quiz questions');
  } catch (error) {
    console.error('[Cache] Error caching quiz questions:', error);
  }
}; 