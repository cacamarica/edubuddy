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

/**
 * Sends a chat completion request to OpenAI
 */
export async function getChatCompletion(messages: Message[]) {
  const openai = createOpenAIClient();
  
  if (!openai.apiKey) {
    throw new Error('OpenAI API key is not set. Please add your API key in settings.');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      content: completion.choices[0]?.message?.content || '',
      model: completion.model,
      usage: completion.usage,
    };
  } catch (error: any) {
    console.error('Error calling OpenAI:', error);
    throw new Error(`Error processing your request: ${error.message}`);
  }
}

/**
 * Fallback function when API route is not available
 */
export async function handleChatRequest(messages: Message[], userId?: string, studentId?: string) {
  try {
    // Log request for debugging (can be removed in production)
    console.log(`Processing chat request for user: ${userId || 'anonymous'}, student: ${studentId || 'unknown'}`);
    
    // Call OpenAI directly
    return await getChatCompletion(messages);
  } catch (error: any) {
    console.error('Error in handleChatRequest:', error);
    throw error;
  }
} 