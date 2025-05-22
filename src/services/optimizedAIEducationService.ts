import { supabase } from "@/integrations/supabase/client";
import { getChatCompletion } from "@/api/openai";
import { createTokenEfficientRequest, getOptimalTokens } from "@/utils/tokenOptimizer";
import { APICallTracker } from "@/utils/rateLimiter";
import { TOKEN_OPTIMIZATION_CONFIG, PLACEHOLDER_IMAGES, FEATURE_FLAGS, FALLBACK_CONTENT } from "@/config/aiOptimizationConfig";

// Interface for AI content generation requests
export interface AIEducationContentRequest {
  contentType: 'lesson' | 'quiz' | 'game' | 'chat';
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  subtopic?: string;
  language?: string;
  studentId?: string;
  studentAge?: number;
  studentName?: string;
  skipMediaSearch?: boolean; // Flag to skip media search for improved performance
  fastMode?: boolean; // Flag to use faster generation mode
  studentProfile?: {
    age?: number;
    name?: string;
    interests?: string[];
    learningStyle?: string;
    comprehensionLevel?: 'basic' | 'intermediate' | 'advanced';
  };
}

// Initialize rate limiters for each content type
const contentRateLimiters = {
  lesson: new APICallTracker({
    maxCallsPerMinute: TOKEN_OPTIMIZATION_CONFIG.RATE_LIMITS?.LESSONS_PER_MINUTE || 3,
    maxCallsPerHour: TOKEN_OPTIMIZATION_CONFIG.RATE_LIMITS?.LESSONS_PER_HOUR || 20,
    cacheDurationMinutes: TOKEN_OPTIMIZATION_CONFIG.CACHE.TTL_MINUTES
  }),
  quiz: new APICallTracker({
    maxCallsPerMinute: TOKEN_OPTIMIZATION_CONFIG.RATE_LIMITS?.QUIZZES_PER_MINUTE || 5,
    maxCallsPerHour: TOKEN_OPTIMIZATION_CONFIG.RATE_LIMITS?.QUIZZES_PER_HOUR || 30,
    cacheDurationMinutes: TOKEN_OPTIMIZATION_CONFIG.CACHE.TTL_MINUTES
  }),
  game: new APICallTracker({
    maxCallsPerMinute: TOKEN_OPTIMIZATION_CONFIG.RATE_LIMITS?.GAMES_PER_MINUTE || 3,
    maxCallsPerHour: TOKEN_OPTIMIZATION_CONFIG.RATE_LIMITS?.GAMES_PER_HOUR || 20,
    cacheDurationMinutes: TOKEN_OPTIMIZATION_CONFIG.CACHE.TTL_MINUTES
  }),
  chat: new APICallTracker({
    maxCallsPerMinute: TOKEN_OPTIMIZATION_CONFIG.RATE_LIMITS?.CHATS_PER_MINUTE || 8,
    maxCallsPerHour: TOKEN_OPTIMIZATION_CONFIG.RATE_LIMITS?.CHATS_PER_HOUR || 50,
    cacheDurationMinutes: TOKEN_OPTIMIZATION_CONFIG.CACHE.TTL_MINUTES
  })
};

// Memory cache for content
const contentCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_HOURS = 24;

// Optimized version of getAIEducationContent
export async function getAIEducationContent(params: AIEducationContentRequest): Promise<{content: any} | null> {
  try {
    console.log("Generating AI content for:", params.contentType, params.topic);
    
    // Create a cache key based on request parameters
    const cacheKey = `ai_content_${params.contentType}_${params.subject}_${params.topic}_${params.gradeLevel}_${params.subtopic || ''}_${params.language || 'en'}`;
    
    // Check session storage cache first (fastest)
    if (TOKEN_OPTIMIZATION_CONFIG.CACHE.SESSION_STORAGE) {
      const cachedContent = sessionStorage.getItem(cacheKey);
      if (cachedContent) {
        console.log('Using session-cached content');
        return { content: JSON.parse(cachedContent) };
      }
    }
    
    // Check memory cache next
    const memoryCached = contentCache.get(cacheKey);
    if (memoryCached && (Date.now() - memoryCached.timestamp < CACHE_TTL_HOURS * 60 * 60 * 1000)) {
      console.log('Using memory-cached content');
      
      // Store in session storage for future use
      if (TOKEN_OPTIMIZATION_CONFIG.CACHE.SESSION_STORAGE) {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(memoryCached.data));
        } catch (e) {
          console.warn('Failed to cache content in session storage:', e);
        }
      }
      
      return { content: memoryCached.data };
    }
    
    // Check rate limits before making API call
    const rateLimiter = contentRateLimiters[params.contentType];
    if (!rateLimiter.canMakeCall()) {
      console.warn('Rate limit reached for content type:', params.contentType);
      
      // Return cached result if available, or fallback content
      const cachedResult = rateLimiter.getCachedResult(cacheKey);
      if (cachedResult) {
        return { content: cachedResult };
      }
      
      // Use fallback content as last resort
      const fallbackContent = createFallbackContent(params);
      return { content: fallbackContent };
    }
    
    // Content generation based on type, with optimizations for fast mode
    let content;
    
    if (params.fastMode) {
      // Fast mode uses simplified prompts and less content
      content = await generateFastModeContent(params);
    } else {
      // Regular mode with complete content
      content = await generateCompleteContent(params);
    }
    
    // Cache the generated content
    if (content) {
      // Memory cache
      contentCache.set(cacheKey, {
        data: content,
        timestamp: Date.now()
      });
      
      // Session storage cache if enabled
      if (TOKEN_OPTIMIZATION_CONFIG.CACHE.SESSION_STORAGE) {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(content));
        } catch (e) {
          console.warn('Failed to cache content in session storage:', e);
        }
      }
      
      // Add to rate limiter's cache
      rateLimiter.recordCall();
    }
    
    return { content };
  } catch (error) {
    console.error('Error in getAIEducationContent:', error);
    return { content: createFallbackContent(params) };
  }
}

// Fast mode content generation (optimized for speed)
async function generateFastModeContent(params: AIEducationContentRequest): Promise<any> {
  // Get the right model based on content type
  const model = TOKEN_OPTIMIZATION_CONFIG.MODELS[params.contentType.toUpperCase() as keyof typeof TOKEN_OPTIMIZATION_CONFIG.MODELS] 
               || TOKEN_OPTIMIZATION_CONFIG.MODELS.DEFAULT;
               
  // Get optimal token count
  const maxTokens = TOKEN_OPTIMIZATION_CONFIG.TOKEN_LIMITS[`${params.contentType.toUpperCase()}_MAX_TOKENS` as keyof typeof TOKEN_OPTIMIZATION_CONFIG.TOKEN_LIMITS] 
                   || TOKEN_OPTIMIZATION_CONFIG.TOKEN_LIMITS.DEFAULT_MAX_TOKENS;

  // Create an efficient prompt based on content type
  const focusPoint = params.subtopic || params.topic;
  
  // Single API call with optimized parameters for faster response
  const messages = createTokenEfficientRequest(
    `You are an educational content creator specializing in ${params.subject} for ${params.gradeLevel} students.`,
    `Create complete, high-quality ${params.contentType} content about "${focusPoint}" for ${params.gradeLevel} level students.
    
    Return content in the following format:
    {
      "title": "Title for the ${params.contentType}",
      "introduction": "Brief introduction to the topic",
      "chapters": [
        {"heading": "Chapter 1 Title", "text": "Chapter 1 content..."},
        {"heading": "Chapter 2 Title", "text": "Chapter 2 content..."},
        {"heading": "Chapter 3 Title", "text": "Chapter 3 content..."}
      ],
      "funFacts": ["Fun fact 1", "Fun fact 2", "Fun fact 3"],
      "activity": {
        "title": "Activity Title",
        "instructions": "Step-by-step instructions for an activity related to the topic"
      },
      "conclusion": "Brief conclusion summarizing key points"
    }
    
    Keep the content appropriate for ${params.gradeLevel} students. Be educational and engaging.
    ${params.subtopic ? `Focus specifically on "${params.subtopic}" as a subtopic of "${params.topic}".` : ''}
    `
  );
  
  try {
    const response = await getChatCompletion(messages, {
      model,
      maxTokens: maxTokens,
      temperature: 0.7
    });
    
    // Extract JSON from response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedContent = JSON.parse(jsonMatch[0]);
      
      // Add placeholder images for chapters and activity
      const enhancedContent = {
        ...parsedContent,
        chapters: (parsedContent.chapters || []).map((chapter: any, index: number) => ({
          ...chapter,
          image: {
            url: `${PLACEHOLDER_IMAGES.LESSON}${index}`,
            alt: `Visual representation of ${chapter.heading}`,
            caption: `${chapter.heading} illustration`
          }
        })),
        activity: {
          ...(parsedContent.activity || { title: "Activity", instructions: "Practice activity instructions" }),
          image: {
            url: PLACEHOLDER_IMAGES.ACTIVITY,
            alt: `Activity related to ${params.topic}`,
            caption: `Interactive activity for ${params.topic}`
          }
        }
      };
      
      return enhancedContent;
    }
    
    // Fallback if JSON parsing fails
    return createFallbackContent(params);
    
  } catch (error) {
    console.error('Error generating fast mode content:', error);
    return createFallbackContent(params);
  }
}

// Regular mode with complete, high-quality content
async function generateCompleteContent(params: AIEducationContentRequest): Promise<any> {
  // Get the right model based on content type
  const model = TOKEN_OPTIMIZATION_CONFIG.MODELS[params.contentType.toUpperCase() as keyof typeof TOKEN_OPTIMIZATION_CONFIG.MODELS] 
               || TOKEN_OPTIMIZATION_CONFIG.MODELS.DEFAULT;

  // Fix for Error 2345: Mapping 'chat' to 'summary' for compatibility
  const optimalTokens = getOptimalTokens(
    params.contentType === 'game' ? 'lesson' : params.contentType === 'chat' ? 'summary' : params.contentType,
    params.gradeLevel
  );

  // Select appropriate prompt based on content type
  let prompt;
  
  if (params.contentType === 'lesson') {
    prompt = createLessonPrompt(params);
  } else if (params.contentType === 'quiz') {
    prompt = createQuizPrompt(params);
  } else if (params.contentType === 'game') {
    prompt = createGamePrompt(params);
  } else {
    prompt = createChatPrompt(params);
  }
  
  try {
    const response = await getChatCompletion(prompt, {
      model,
      maxTokens: optimalTokens,
      temperature: 0.7
    });
    
    // Extract JSON from response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedContent = JSON.parse(jsonMatch[0]);
      
      // Add placeholder images for content that used to have media
      return enhanceContentWithPlaceholders(parsedContent, params);
    }
    
    return createFallbackContent(params);
  } catch (error) {
    console.error('Error generating complete content:', error);
    return createFallbackContent(params);
  }
}

// Create fallback content when API calls fail or are rate limited
function createFallbackContent(params: AIEducationContentRequest): any {
  const fallbackType = params.contentType.toUpperCase() as keyof typeof FALLBACK_CONTENT;
  const fallbackTemplate = FALLBACK_CONTENT[`${fallbackType}_TEMPLATE`];
  
  if (typeof fallbackTemplate === 'function') {
    return fallbackTemplate(params.topic, params.subject);
  }
  
  // Generic fallback if specific template not available
  return {
    title: `Learning about ${params.topic}`,
    introduction: `This ${params.contentType} explores key concepts of ${params.topic} in ${params.subject}.`,
    chapters: [
      {
        heading: `Introduction to ${params.topic}`,
        text: `${params.topic} is an important concept in ${params.subject}.`,
        image: {
          url: PLACEHOLDER_IMAGES.LESSON,
          alt: `${params.topic} concept`,
          caption: `Visual representation of ${params.topic}`
        }
      },
      {
        heading: 'Key Concepts',
        text: `The main principles include...`,
        image: {
          url: PLACEHOLDER_IMAGES.LESSON,
          alt: 'Key concepts',
          caption: 'Visual overview of key concepts'
        }
      }
    ],
    funFacts: [
      `Interesting fact about ${params.topic}...`,
      `Another fun fact about ${params.topic}...`
    ],
    activity: {
      title: `${params.topic} Activity`,
      instructions: `Practice applying concepts about ${params.topic}...`,
      image: {
        url: PLACEHOLDER_IMAGES.ACTIVITY,
        alt: `Activity for ${params.topic}`,
        caption: 'Interactive learning activity'
      }
    },
    conclusion: `We've explored the fundamentals of ${params.topic}.`
  };
}

// Add placeholder images where media would have been
function enhanceContentWithPlaceholders(content: any, params: AIEducationContentRequest): any {
  // Copy to avoid mutations
  const enhanced = { ...content };
  
  // Add placeholder images for chapters
  if (Array.isArray(enhanced.chapters)) {
    enhanced.chapters = enhanced.chapters.map((chapter: any, index: number) => ({
      ...chapter,
      image: {
        url: `${PLACEHOLDER_IMAGES.LESSON}${index % 5}`,
        alt: `Visual representation of ${chapter.heading || 'concept'}`,
        caption: `Illustration for ${chapter.heading || 'this concept'}`
      }
    }));
  }
  
  // Add placeholder image for activity
  if (enhanced.activity) {
    enhanced.activity = {
      ...enhanced.activity,
      image: {
        url: PLACEHOLDER_IMAGES.ACTIVITY,
        alt: `Activity related to ${params.topic}`,
        caption: `Interactive activity for learning about ${params.topic}`
      }
    };
  }
  
  return enhanced;
}

// Create optimized prompt for lesson content
function createLessonPrompt(params: AIEducationContentRequest): any[] {
  const focusPoint = params.subtopic || params.topic;
  
  return createTokenEfficientRequest(
    `You are an exceptional educational content creator specializing in ${params.subject} for ${params.gradeLevel} students.`,
    `Create a complete, high-quality lesson about "${focusPoint}" for ${params.gradeLevel} level students.
    
    Return content in the following JSON format:
    {
      "title": "An engaging title for the lesson",
      "introduction": "An engaging introduction that excites students about learning ${focusPoint}",
      "chapters": [
        {"heading": "First Main Concept", "text": "Clear explanation with examples..."},
        {"heading": "Second Main Concept", "text": "Thorough explanation appropriate for ${params.gradeLevel} students..."},
        {"heading": "Third Main Concept", "text": "More key information with practical examples..."}
      ],
      "funFacts": ["Interesting fact 1 about ${focusPoint}", "Interesting fact 2", "Interesting fact 3"],
      "activity": {
        "title": "Hands-on Activity Title",
        "instructions": "Step-by-step instructions for an activity that reinforces learning"
      },
      "conclusion": "A conclusion summarizing key points and why this knowledge matters"
    }
    
    Make the content educational, engaging, and specifically about ${focusPoint}.
    ${params.subtopic ? `Focus on "${params.subtopic}" specifically as a subtopic of the broader "${params.topic}".` : ''}
    Be clear, accurate, and appropriate for ${params.gradeLevel} level students.
    `
  );
}

// Create optimized prompt for quiz content
function createQuizPrompt(params: AIEducationContentRequest): any[] {
  const focusPoint = params.subtopic || params.topic;
  
  return createTokenEfficientRequest(
    `You are an expert educational quiz creator specializing in ${params.subject} for ${params.gradeLevel} students.`,
    `Create a comprehensive quiz about "${focusPoint}" for ${params.gradeLevel} level students.
    
    Return the quiz in the following JSON format:
    {
      "title": "Quiz title",
      "introduction": "Brief introduction explaining what this quiz covers",
      "questions": [
        {
          "question": "Question 1 text",
          "questionType": "multiple-choice",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Explanation for why this answer is correct"
        },
        {
          "question": "Question 2 text",
          "questionType": "true-false",
          "options": ["True", "False"],
          "correctAnswer": 0,
          "explanation": "Explanation for why this answer is correct"
        },
        {
          "question": "Question 3 text",
          "questionType": "short-answer",
          "modelAnswer": "Expected answer from student"
        }
        // Add 5-7 questions with a mix of question types
      ],
      "conclusion": "Encouraging message about what student has learned"
    }
    
    Focus specifically on "${focusPoint}" and include a mix of question types.
    Make questions appropriate for ${params.gradeLevel} students, testing both recall and understanding.
    ${params.subtopic ? `Focus questions specifically on "${params.subtopic}" as a subtopic of "${params.topic}".` : ''}
    `
  );
}

// Create optimized prompt for educational game content
function createGamePrompt(params: AIEducationContentRequest): any[] {
  const focusPoint = params.subtopic || params.topic;
  
  return createTokenEfficientRequest(
    `You are a creative educational game designer specializing in ${params.subject} activities for ${params.gradeLevel} students.`,
    `Create an engaging educational game about "${focusPoint}" for ${params.gradeLevel} level students.
    
    Return the game in the following JSON format:
    {
      "title": "Catchy game title",
      "objective": "Learning objective of the game",
      "materials": ["Simple item 1", "Simple item 2", "etc"],
      "setup": "How to set up the game environment",
      "instructions": "Clear step-by-step instructions on how to play",
      "variations": {
        "easier": "How to make the game simpler for younger students",
        "harder": "How to make the game more challenging for advanced students"
      },
      "learningObjectives": [
        "Specific skill or knowledge students will gain 1",
        "Specific skill or knowledge students will gain 2"
      ],
      "conceptsReinforced": [
        "Key concept from ${focusPoint} this reinforces 1",
        "Key concept from ${focusPoint} this reinforces 2"
      ]
    }
    
    The game should:
    - Use readily available materials students would have at home
    - Take 15-30 minutes to play
    - Be appropriate for individual students or small groups
    - Be genuinely fun while reinforcing key concepts
    - Focus specifically on teaching about "${focusPoint}"
    ${params.subtopic ? `- Emphasize the subtopic "${params.subtopic}" specifically` : ''}
    
    Be creative and make learning fun through play!
    `
  );
}

// Create optimized prompt for AI chat helper
function createChatPrompt(params: AIEducationContentRequest): any[] {
  const focusPoint = params.subtopic || params.topic;
  
  return createTokenEfficientRequest(
    `You are an expert educator specializing in teaching ${params.subject} to ${params.gradeLevel} level students.`,
    `Create a helpful AI chat response template about "${focusPoint}" for ${params.gradeLevel} students.
    
    Return the template in the following JSON format:
    {
      "introduction": "Brief introduction to establish expertise",
      "keyFacts": [
        "Important fact about ${focusPoint} 1",
        "Important fact about ${focusPoint} 2",
        "Important fact about ${focusPoint} 3"
      ],
      "commonQuestions": [
        {
          "question": "Likely student question 1",
          "answer": "Clear, helpful answer for ${params.gradeLevel} students"
        },
        {
          "question": "Likely student question 2",
          "answer": "Clear, helpful answer for ${params.gradeLevel} students"
        }
      ],
      "explanationStyle": "Description of how to explain concepts at this level",
      "sampleExplanation": "Example of explaining a difficult concept about ${focusPoint}",
      "encouragements": [
        "Supportive message 1",
        "Supportive message 2"
      ]
    }
    
    Focus specifically on "${focusPoint}" and how to explain it clearly to ${params.gradeLevel} students.
    ${params.subtopic ? `Emphasize the subtopic "${params.subtopic}" specifically within the broader context of "${params.topic}".` : ''}
    Be educational, encouraging, and appropriate for the student age level.
    `
  );
}
