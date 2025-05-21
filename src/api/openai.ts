import OpenAI from 'openai';

// Key for storing the API key in localStorage - must match the one in LearningBuddySettings
const API_KEY_STORAGE_KEY = 'edu_buddy_openai_api_key';

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
// WARNING: Using dangerouslyAllowBrowser: true exposes your API key to the browser
// This is only for development/demo purposes - in production, always use a backend proxy
// See: https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety
const createOpenAIClient = () => {
  return new OpenAI({
    apiKey: getApiKey(),
    dangerouslyAllowBrowser: true // Required for browser usage, but not recommended for production
  });
};

// Message type definition
type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Try different API endpoints for OpenAI requests
async function tryServerEndpoints(messages: Message[]) {
  // List of potential endpoints to try
  const endpoints = [
    '/api/openai/chat',    // Next.js API route
    'http://localhost:8080/api/openai/chat', // Server on port 8080
    'http://localhost:3001/api/openai/chat'  // Server on port 3001
  ];
  
  let lastError: Error | null = null;
  
  // Try each endpoint until one works
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying OpenAI server endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });
      
      if (!response.ok) {
        console.warn(`Endpoint ${endpoint} returned status ${response.status}`);
        lastError = new Error(`HTTP error ${response.status}`);
        continue; // Try next endpoint
      }
      
      const data = await response.json();
      console.log(`Successfully used endpoint: ${endpoint}`);
      
      return {
        content: data.message || data.content || '',
        model: data.model || 'gpt-3.5-turbo',
        usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      };
    } catch (error) {
      console.warn(`Error with endpoint ${endpoint}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to next endpoint
    }
  }
  
  // If we get here, all endpoints failed
  throw lastError || new Error('All server endpoints failed');
}

/**
 * Sends a chat completion request to OpenAI
 */
export async function getChatCompletion(messages: Message[]) {
  // First try direct API access
  try {
    const openai = createOpenAIClient();
    
    if (!openai.apiKey) {
      console.log('No OpenAI API key available for direct access, trying server endpoints...');
      throw new Error('OpenAI API key is not set');
    }

    console.log('Attempting direct OpenAI API call...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 2000,  // Increased for longer content
    });

    return {
      content: completion.choices[0]?.message?.content || '',
      model: completion.model,
      usage: completion.usage,
    };
  } catch (directError) {
    console.warn('Direct OpenAI API call failed, trying server endpoints:', directError);
    
    // Try server endpoints as fallback
    try {
      return await tryServerEndpoints(messages);
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
    // Log request for debugging (can be removed in production)
    console.log(`Processing chat request for user: ${userId || 'anonymous'}, student: ${studentId || 'unknown'}`);
    
    // Call OpenAI with fallbacks
    return await getChatCompletion(messages);
  } catch (error: any) {
    console.error('Error in handleChatRequest:', error);
    throw error;
  }
} 