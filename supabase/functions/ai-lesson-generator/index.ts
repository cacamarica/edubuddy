
// NOTE: This file is designed to run in Supabase Edge Functions with Deno runtime
// These imports and globals won't be recognized in a regular Node.js environment 
// but will work correctly when deployed to Supabase
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// TypeScript interfaces to fix type errors 
interface RequestData {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  language?: 'en' | 'id';
  forceLongerLessons?: boolean;
  skipMediaSearch?: boolean; // New option to skip media searches
  subtopic?: string; // Added subtopic as an optional parameter
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
  };
  [key: string]: any;
}

interface LessonChapter {
  heading: string;
  text: string;
  image?: {
    url?: string;
    description?: string;
    alt?: string;
    caption?: string;
    searchQuery?: string;
  };
}

interface LessonContent {
  title: string;
  introduction: string;
  chapters: LessonChapter[];
  funFacts: string[];
  activities: any[];
  realWorldExamples?: any[];
  conclusion: string;
  summary: string;
  challengeQuestions?: string[];
}

// Cache for storing generated content
const contentCache = new Map<string, {content: any, timestamp: number}>();
const CACHE_TTL_HOURS = 24; // Cache TTL in hours
const MAX_RETRY_ATTEMPTS = 3; // Increased from 2 to 3 for better reliability
const REQUEST_TIMEOUT_MS = 45000; // 45 seconds timeout (increased from 35s)

// Deno.env is a Deno-specific API to access environment variables
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting implementation
class RateLimiter {
  private static calls: {timestamp: number, topic: string}[] = [];
  private static readonly MAX_CALLS_PER_MINUTE = 10;
  private static readonly MAX_DUPLICATE_CALLS_PER_HOUR = 3;
  
  static canMakeCall(topic: string): boolean {
    const now = Date.now();
    // Clean up old calls
    RateLimiter.calls = RateLimiter.calls.filter(call => now - call.timestamp < 3600000);
    
    // Check calls in last minute
    const callsLastMinute = RateLimiter.calls.filter(call => now - call.timestamp < 60000).length;
    if (callsLastMinute >= this.MAX_CALLS_PER_MINUTE) {
      console.log(`Rate limit exceeded: ${callsLastMinute} calls in the last minute`);
      return false;
    }
    
    // Check duplicate topic calls in the last hour
    const duplicateCalls = RateLimiter.calls.filter(call => call.topic === topic).length;
    if (duplicateCalls >= this.MAX_DUPLICATE_CALLS_PER_HOUR) {
      console.log(`Rate limit exceeded: ${duplicateCalls} duplicate calls for topic "${topic}" in the last hour`);
      return false;
    }
    
    return true;
  }
  
  static recordCall(topic: string): void {
    RateLimiter.calls.push({timestamp: Date.now(), topic});
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const requestBody = await req.json().catch(error => {
      console.error("Error parsing request body:", error);
      throw new Error("Invalid request body format");
    }) as RequestData;

    const { subject, gradeLevel, topic, language = 'en', skipMediaSearch = false, subtopic = undefined } = requestBody;
    
    if (!subject || !gradeLevel || !topic) {
      throw new Error("Missing required parameters: subject, gradeLevel, or topic");
    }

    console.log(`Generating lesson for ${topic}${subtopic ? ' - ' + subtopic : ''} in ${subject} (grade ${gradeLevel}, language: ${language})`);
    
    // Generate cache key based on request parameters including subtopic
    const cacheKey = `${subject}_${topic}_${subtopic || ''}_${gradeLevel}_${language}_${skipMediaSearch}`;
    
    // Check cache first
    const cachedContent = contentCache.get(cacheKey);
    if (cachedContent && (Date.now() - cachedContent.timestamp < CACHE_TTL_HOURS * 60 * 60 * 1000)) {
      console.log(`Using cached lesson for ${topic}${subtopic ? ' - ' + subtopic : ''}`);
      return new Response(JSON.stringify({ content: cachedContent.content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Check rate limits
    if (!RateLimiter.canMakeCall(topic)) {
      // Return a simplified error response to avoid API costs when rate limited
      return new Response(JSON.stringify({ 
        error: "Rate limit exceeded. Please try again later.",
        content: {
          title: `Learning about ${topic}${subtopic ? ' - ' + subtopic : ''}`,
          introduction: "This content is being prepared. Please try again in a few minutes.",
          chapters: [
            {
              heading: "Content unavailable",
              text: "We're currently experiencing high demand. Please try again shortly.",
            }
          ],
          funFacts: ["Did you know? Our system manages requests carefully to ensure everyone gets access."],
          activities: [],
          conclusion: "Thank you for your patience.",
          summary: "Please try again later."
        }
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a prompt for OpenAI - optimized for faster generation and lower token usage
    // Enhanced prompt to handle subtopics properly
    const prompt = `
    Create a concise educational lesson about "${topic}${subtopic ? ': ' + subtopic : ''}" in ${subject} for grade ${gradeLevel} students in ${language === 'id' ? 'Indonesian' : 'English'} language.
    
    ${subtopic ? `Focus specifically on the subtopic "${subtopic}" within the broader topic of "${topic}".` : ''}
    
    Format the response as a JSON object with the following structure:
    {
      "title": "Lesson Title",
      "introduction": "Brief introduction",
      "chapters": [
        {
          "heading": "Chapter Title",
          "text": "Chapter content..."
        }
      ],
      "funFacts": ["Fun fact 1", "Fun fact 2"],
      "activities": [
        {
          "title": "Activity Title",
          "instructions": "Activity instructions..."
        }
      ],
      "conclusion": "Brief conclusion",
      "summary": "Key points summary"
    }
    `;
    
    console.log("Sending request to OpenAI API using optimized prompt");

    // Record the API call
    RateLimiter.recordCall(topic);
    
    // Call OpenAI API with retry logic
    let response;
    let retryCount = 0;
    let lastError;
    
    while (retryCount <= MAX_RETRY_ATTEMPTS) {
      try {
        // Create a promise that will reject after timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('OpenAI request timed out')), REQUEST_TIMEOUT_MS);
        });
        
        // Create the actual API call promise
        const apiCallPromise = fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo', // Using faster and less expensive model
            messages: [
              { 
                role: 'system', 
                content: 'You create concise, educational content for students. Focus on accurate information with minimal verbosity.' 
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2500, // Reduced token count for faster response and lower costs
          }),
        });
        
        // Race between the timeout and the actual API call
        response = await Promise.race([timeoutPromise, apiCallPromise]);
        
        if (response.ok) {
          break; // Successful response, break out of retry loop
        } else {
          const errorText = await response.text().catch(() => "Unknown API error");
          lastError = new Error(`OpenAI API error: ${response.status} - ${errorText}`);
          console.error(`OpenAI API error (attempt ${retryCount + 1}): ${lastError.message}`);
          throw lastError;
        }
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        lastError = error;
        
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          // Exponential backoff
          const delay = 1000 * Math.pow(2, retryCount);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
        } else {
          // All retries failed
          throw error;
        }
      }
    }

    const data = await response.json().catch(error => {
      console.error("Error parsing OpenAI response:", error);
      throw new Error("Invalid response from OpenAI");
    }) as OpenAIResponse;
    
    if (data.error) {
      console.error("OpenAI returned error:", data.error);
      throw new Error(data.error.message || 'Error generating lesson content');
    }

    console.log("Received response from OpenAI, processing content");
    const generatedContent = data.choices[0].message.content;
    
    // Parse the JSON response
    let lessonContent;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        lessonContent = JSON.parse(jsonMatch[0]);
      } else {
        lessonContent = JSON.parse(generatedContent);
      }
      
      // Process the lesson content to include placeholder image URLs
      const processedContent = {
        ...lessonContent,
        chapters: lessonContent.chapters.map((chapter: any, index: number) => {
          // Generate a simple placeholder image URL based on topic and subtopic
          const seed = subtopic ? 
            `${encodeURIComponent(topic)}-${encodeURIComponent(subtopic)}-${index}` : 
            `${encodeURIComponent(topic)}-${index}`;
          
          const imageUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9`;
          
          if (!skipMediaSearch && chapter.image) {
            return {
              ...chapter,
              image: {
                url: imageUrl,
                alt: chapter.image.alt || `Image for ${chapter.heading}`,
                caption: chapter.image.description || `Visual aid for ${chapter.heading}`
              }
            };
          } 
          
          // If skipMediaSearch or no image in original content
          return {
            ...chapter,
            image: skipMediaSearch ? undefined : {
              url: imageUrl,
              alt: `Image for ${chapter.heading}`,
              caption: `Visual aid for ${chapter.heading}`
            }
          };
        }),
        activities: Array.isArray(lessonContent.activities) ? 
          lessonContent.activities.map((activity: any, index: number) => {
            // We don't need to process activity images if skipMediaSearch is true
            if (skipMediaSearch) return activity;
            
            const seed = subtopic ? 
              `${encodeURIComponent(topic)}-${encodeURIComponent(subtopic)}-activity-${index}` : 
              `${encodeURIComponent(topic)}-activity-${index}`;
              
            const imageUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9`;
            
            return {
              ...activity,
              image: {
                url: imageUrl,
                alt: activity.image?.alt || `Image for ${activity.title}`,
                caption: activity.image?.description || `Visual aid for this activity`
              }
            };
          }) : []
      };
      
      console.log("Successfully processed lesson content");
      
      // Save to cache
      contentCache.set(cacheKey, {
        content: processedContent,
        timestamp: Date.now()
      });
      
      return new Response(JSON.stringify({ content: processedContent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error parsing generated content:', error);
      console.error('Raw content:', generatedContent);
      throw new Error('Failed to parse the generated lesson content');
    }
  } catch (error) {
    console.error('Error in ai-lesson-generator function:', error);
    
    // Create a fallback response with helpful error details
    const errorResponse = {
      error: error.message || 'An unknown error occurred',
      content: {
        title: "Error generating content",
        introduction: "We encountered an error while generating this lesson.",
        chapters: [
          {
            heading: "Technical difficulties",
            text: "We're experiencing some technical issues. Please try again later.",
            image: {
              url: "https://api.dicebear.com/7.x/shapes/svg?seed=error&backgroundColor=ffdfbf",
              alt: "Error illustration",
              caption: "Technical error"
            }
          }
        ],
        funFacts: ["Did you know that even AI sometimes needs a break?"],
        activities: [
          {
            title: "Try again later",
            instructions: "Please check back soon when our systems are working properly."
          }
        ],
        conclusion: "We apologize for the inconvenience.",
        summary: "Error: " + (error.message || 'Unknown error occurred')
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
