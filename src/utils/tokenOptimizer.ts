/**
 * Token optimization utilities for OpenAI API calls
 * Helps reduce token costs while maintaining content quality
 */

// Constants for token estimation
export const TOKEN_ESTIMATE = {
  // Average tokens per word (English)
  TOKENS_PER_WORD: 1.33,
  
  // Limits for different content types
  MAX_CHAPTER_TOKENS: 1000,
  MAX_INTRODUCTION_TOKENS: 300,
  MAX_SUMMARY_TOKENS: 200,
  
  // Reserve tokens for different prompt sections
  SYSTEM_PROMPT_TOKENS: 300,
  USER_PROMPT_TOKENS: 200,
  RESPONSE_FORMAT_TOKENS: 100,
  
  // Model specific token limits
  MODEL_LIMITS: {
    'gpt-4': 8000,
    'gpt-4o': 8000,
    'gpt-3.5-turbo': 4000,
    'gpt-3.5-turbo-16k': 16000,
  }
};

/**
 * Get optimal tokens for a content generation request
 * @param contentType Type of content being generated
 * @param modelName The OpenAI model being used
 * @returns Maximum tokens to allocate for the response
 */
export function getOptimalTokens(
  contentType: 'lesson' | 'chapter' | 'quiz' | 'summary',
  modelName: string = 'gpt-3.5-turbo'
): number {
  // Default model token limit
  const modelLimit = TOKEN_ESTIMATE.MODEL_LIMITS[modelName as keyof typeof TOKEN_ESTIMATE.MODEL_LIMITS] || 4000;
  
  // Reserve tokens for the prompt
  const reservedTokens = TOKEN_ESTIMATE.SYSTEM_PROMPT_TOKENS + 
                         TOKEN_ESTIMATE.USER_PROMPT_TOKENS + 
                         TOKEN_ESTIMATE.RESPONSE_FORMAT_TOKENS;
  
  // Available tokens for response
  const availableTokens = modelLimit - reservedTokens;
  
  // Return content type specific limits, or a portion of available tokens
  switch (contentType) {
    case 'lesson':
      return Math.min(availableTokens, 2500);
    case 'chapter':
      return Math.min(availableTokens, TOKEN_ESTIMATE.MAX_CHAPTER_TOKENS);
    case 'quiz':
      return Math.min(availableTokens, 1500);
    case 'summary':
      return Math.min(availableTokens, TOKEN_ESTIMATE.MAX_SUMMARY_TOKENS);
    default:
      return Math.min(availableTokens, Math.floor(availableTokens * 0.7)); // Use 70% of available tokens
  }
}

/**
 * Optimize a prompt for token efficiency
 * @param prompt Original prompt text
 * @returns Optimized prompt with reduced token count
 */
export function optimizePrompt(prompt: string): string {
  return prompt
    // Remove redundant instructions
    .replace(/\bplease\b/gi, '')
    .replace(/I want you to/gi, '')
    // Convert wordy instructions to concise ones
    .replace(/It is important that you/gi, '')
    .replace(/Make sure to/gi, '')
    // Remove unnecessary qualifiers
    .replace(/\bvery\b/gi, '')
    .replace(/\breally\b/gi, '')
    .replace(/\bquite\b/gi, '')
    // Remove redundant professional context setting
    .replace(/\bAs (a|an) (professional|expert|experienced) [^,.]+,/gi, '')
    // Trim extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Reduce the verbosity of system prompts
 * @param prompt The system prompt to optimize
 * @returns Optimized system prompt with reduced token count
 */
export function createEfficientSystemPrompt(role: string, task: string): string {
  return `You are ${role}. ${task}`;
}

/**
 * Structure a request for maximum token efficiency
 * @param messages Messages to optimize
 * @returns Optimized messages with reduced token usage
 */
export function createTokenEfficientRequest(
  systemPrompt: string,
  userPrompt: string,
  exampleFormat?: string
): Array<{role: 'system' | 'user' | 'assistant', content: string}> {
  // Create the messages array with explicit typing
  const optimizedMessages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
    {
      role: 'system',
      content: optimizePrompt(systemPrompt)
    }
  ];
  
  // If we have a format example, include it in the system message
  if (exampleFormat) {
    optimizedMessages[0].content += `\n\nRespond in this format: ${exampleFormat}`;
  }
  
  // Add user message
  optimizedMessages.push({
    role: 'user',
    content: optimizePrompt(userPrompt)
  });
  
  return optimizedMessages;
}
