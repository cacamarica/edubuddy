
import OpenAI from 'openai';
import { apiRateLimiter, APICallTracker } from '@/utils/rateLimiter';

// Key for storing the API key in localStorage - must match the one in LearningBuddySettings
const API_KEY_STORAGE_KEY = 'edu_buddy_openai_api_key';

// Configuration for token usage optimization
interface TokenConfig {
  defaultMaxTokens: number;
  longContentMaxTokens: number;
  model: string;
  lessonModel: string;
}

// Token configuration with optimized values
const tokenConfig: TokenConfig = {
  defaultMaxTokens: 1000,
  longContentMaxTokens: 2000,
  model: "gpt-3.5-turbo",
  lessonModel: "gpt-3.5-turbo",
};

// Maximum retry attempts for API calls - increased for better reliability
const MAX_RETRY_ATTEMPTS = 3;

// Function to get the API key from localStorage or environment
const getApiKey = (): string => {
  // First try to get the key from localStorage
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (localKey) return localKey;
  }
  
  // Fall back to environment variable
  return import.meta.env.VITE_OPENAI_API_KEY || '';
};

// Initialize OpenAI client with dynamic API key
const createOpenAIClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('OpenAI API key is missing. Please configure it in the settings.');
  }
  
  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });
};

// Message type definition
type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Call options to customize behavior
interface ChatOptions {
  maxTokens?: number;
  model?: string;
  isLesson?: boolean;
  skipCache?: boolean;
  temperature?: number;
}

// Get appropriate model and token settings based on content type
function getModelSettings(options?: ChatOptions): { model: string, maxTokens: number, temperature: number } {
  const isLesson = options?.isLesson || false;
  
  return {
    model: options?.model || (isLesson ? tokenConfig.lessonModel : tokenConfig.model),
    maxTokens: options?.maxTokens || 
               (isLesson ? tokenConfig.longContentMaxTokens : tokenConfig.defaultMaxTokens),
    temperature: options?.temperature || 0.7
  };
}

// Try different API endpoints for OpenAI requests with improved error handling
async function tryServerEndpoints(messages: Message[], options?: ChatOptions) {
  // Check rate limiting before making calls
  if (!apiRateLimiter.canMakeCall()) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  // Generate cache key from messages and options
  const cacheKey = APICallTracker.generateCacheKey({ 
    messages, 
    model: options?.model,
    maxTokens: options?.maxTokens 
  });
  
  // Check cache first if not explicitly skipped
  if (!options?.skipCache) {
    const cachedResult = apiRateLimiter.getCachedResult(cacheKey);
    if (cachedResult) {
      console.log('Using cached API response');
      return cachedResult;
    }
  }
  
  // List of potential endpoints to try
  const endpoints = [
    '/api/openai/chat',
    'http://localhost:8080/api/openai/chat', 
    'http://localhost:3001/api/openai/chat'
  ];
  
  let lastError: Error | null = null;
  let retryCount = 0;
  
  // Try each endpoint with retries and better error handling
  while (retryCount < MAX_RETRY_ATTEMPTS) {
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying OpenAI server endpoint: ${endpoint} (attempt ${retryCount + 1})`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            messages, 
            model: options?.model || tokenConfig.model,
            maxTokens: options?.maxTokens || tokenConfig.defaultMaxTokens
          }),
          // Add signal for timeout control
          signal: AbortSignal.timeout(60000) // 60 second timeout
        });
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown API error");
          console.warn(`Endpoint ${endpoint} returned status ${response.status}: ${errorText}`);
          lastError = new Error(`HTTP error ${response.status}: ${errorText}`);
          continue; // Try next endpoint
        }
        
        const data = await response.json();
        console.log(`Successfully used endpoint: ${endpoint}`);
        
        // Record the successful API call
        apiRateLimiter.recordCall();
        
        const result = {
          content: data.message || data.content || '',
          model: data.model || tokenConfig.model,
          usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        };
        
        // Cache the result for future use
        apiRateLimiter.cacheResult(cacheKey, result);
        
        return result;
      } catch (error) {
        console.warn(`Error with endpoint ${endpoint}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        // Continue to next endpoint
      }
    }
    
    // All endpoints failed, increment retry counter
    retryCount++;
    
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      // Wait before retrying (exponential backoff)
      const delay = 1000 * Math.pow(2, retryCount);
      console.log(`All endpoints failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // If we get here, all endpoints and retries failed
  console.error('All OpenAI endpoints failed after multiple attempts');
  throw lastError || new Error('All server endpoints failed after multiple attempts');
}

/**
 * Sends a chat completion request to OpenAI with rate limiting and caching
 */
export async function getChatCompletion(messages: Message[], options?: ChatOptions) {
  // Check if we can make a call based on rate limiting rules
  if (!apiRateLimiter.canMakeCall()) {
    // Try to use cached content for this request
    const cacheKey = APICallTracker.generateCacheKey({ messages, options });
    const cachedResult = apiRateLimiter.getCachedResult(cacheKey);
    
    if (cachedResult) {
      console.log('Rate limit reached, using cached response');
      return cachedResult;
    }
    
    throw new Error('API rate limit reached. Please try again later.');
  }

  // Get the appropriate model and token settings
  const { model, maxTokens, temperature } = getModelSettings(options);
  // Generate cache key for this request
  const cacheKey = APICallTracker.generateCacheKey({ 
    messages, 
    model, 
    maxTokens 
  });
  
  // Check cache first if not explicitly skipped
  if (!options?.skipCache) {
    const cachedResult = apiRateLimiter.getCachedResult(cacheKey);
    if (cachedResult) {
      console.log('Using cached API response');
      return cachedResult;
    }
  }

  // First try direct API access with improved error handling
  try {
    const openai = createOpenAIClient();
    
    if (!openai.apiKey) {
      console.log('No OpenAI API key available for direct access, trying server endpoints...');
      throw new Error('OpenAI API key is not set');
    }

    console.log(`Attempting direct OpenAI API call to ${model}...`);
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    // Record this API call
    apiRateLimiter.recordCall();
    
    const result = {
      content: completion.choices[0]?.message?.content || '',
      model: completion.model,
      usage: completion.usage,
    };
    
    // Cache this result
    apiRateLimiter.cacheResult(cacheKey, result);

    return result;
  } catch (directError) {
    console.warn('Direct OpenAI API call failed, trying server endpoints:', directError);
    
    // Try server endpoints as fallback
    try {
      return await tryServerEndpoints(messages, options);
    } catch (serverError) {
      console.error('All OpenAI access methods failed:', serverError);
      throw new Error(`Could not complete OpenAI request. Please check your API key or network connection.`);
    }
  }
}

/**
 * Fallback function when API route is not available
 */
export async function handleChatRequest(messages: Message[], userId?: string, studentId?: string) {
  try {
    // Log request for debugging
    console.log(`Processing chat request for user: ${userId || 'anonymous'}, student: ${studentId || 'unknown'}`);
    
    // Call OpenAI with fallbacks
    return await getChatCompletion(messages);
  } catch (error: any) {
    console.error('Error in handleChatRequest:', error);
    throw error;
  }
} 
