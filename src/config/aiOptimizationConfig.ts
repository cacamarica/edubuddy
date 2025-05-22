// Config for optimization of AILearning and AI Education functionality
// Control and prevent excessive API calls

// Token optimization settings
export const TOKEN_OPTIMIZATION_CONFIG = {
  // Models to use based on content type
  MODELS: {
    DEFAULT: 'gpt-3.5-turbo',
    LESSON: 'gpt-3.5-turbo',
    QUIZ: 'gpt-3.5-turbo',
    GAME: 'gpt-3.5-turbo',
    CHAT: 'gpt-3.5-turbo'
  },
  
  // Token limits by content type
  TOKEN_LIMITS: {
    DEFAULT_MAX_TOKENS: 1000,
    LESSON_MAX_TOKENS: 1500,
    QUIZ_MAX_TOKENS: 800,
    GAME_MAX_TOKENS: 1000,
    CHAT_MAX_TOKENS: 800
  },
  
  // Caching durations
  CACHE: {
    TTL_MINUTES: 30,
    SESSION_STORAGE: true,
    LOCAL_STORAGE: true,
    MEMORY_STORAGE: true
  },
  
  // Rate limiting settings
  RATE_LIMITS: {
    LESSONS_PER_MINUTE: 3,
    LESSONS_PER_HOUR: 20,
    QUIZZES_PER_MINUTE: 5,
    QUIZZES_PER_HOUR: 30,
    GAMES_PER_MINUTE: 3,
    GAMES_PER_HOUR: 20,
    CHATS_PER_MINUTE: 8,
    CHATS_PER_HOUR: 50
  }
};

// Rate limiting configuration
export const API_RATE_LIMITS = {
  // Default limits
  DEFAULT: {
    MAX_CALLS_PER_MINUTE: 10,
    MAX_CALLS_PER_HOUR: 100,
    MAX_DUPLICATE_CALLS_PER_HOUR: 3
  },
  
  // Content-specific limits
  LESSON: {
    MAX_CALLS_PER_MINUTE: 5,
    MAX_CALLS_PER_HOUR: 30,
    MAX_DUPLICATE_CALLS_PER_HOUR: 2
  },
  
  QUIZ: {
    MAX_CALLS_PER_MINUTE: 8,
    MAX_CALLS_PER_HOUR: 50,
    MAX_DUPLICATE_CALLS_PER_HOUR: 2
  }
};

// Retry configuration
export const API_RETRY_CONFIG = {
  MAX_RETRY_ATTEMPTS: 2,
  INITIAL_RETRY_DELAY_MS: 1000,
  MAX_RETRY_DELAY_MS: 5000,
  REQUEST_TIMEOUT_MS: 30000
};

// Feature flags to disable resource-intensive or unnecessary features
export const FEATURE_FLAGS = {
  ENABLE_VIDEO_GENERATION: false, // Disable YouTube video generation
  ENABLE_IMAGE_GENERATION: false, // Disable DALL-E image generation
  ENABLE_MEDIA_SEARCH: false,     // Disable media search
  USE_PLACEHOLDERS_ONLY: true     // Use placeholder images only
};

// Default placeholder image URLs
export const PLACEHOLDER_IMAGES = {
  LESSON: 'https://api.dicebear.com/7.x/shapes/svg?seed=lesson&backgroundColor=ffdfbf',
  ACTIVITY: 'https://api.dicebear.com/7.x/shapes/svg?seed=activity&backgroundColor=c0aede',
  QUIZ: 'https://api.dicebear.com/7.x/shapes/svg?seed=quiz&backgroundColor=ffd5dc',
  GAME: 'https://api.dicebear.com/7.x/shapes/svg?seed=game&backgroundColor=d1d4f9'
};

// Fallback content generation
export const FALLBACK_CONTENT = {
  // Templates for fallback content when API calls fail
  LESSON_TEMPLATE: (topic: string, subject: string) => ({
    title: `Learning about ${topic}`,
    introduction: `This lesson explores key concepts of ${topic} in ${subject}.`,
    mainContent: [
      {
        heading: `Introduction to ${topic}`,
        text: `${topic} is an important concept in ${subject}...`
      },
      {
        heading: `Key Concepts`,
        text: `The main principles of ${topic} include...`
      }
    ],
    summary: `We've explored the fundamentals of ${topic}.`
  }),
  
  QUIZ_TEMPLATE: (topic: string) => ({
    questions: [
      {
        question: `What is a key aspect of ${topic}?`,
        questionType: 'multiple-choice',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: `This relates to the core principles of ${topic}.`
      }
    ]
  })
};
