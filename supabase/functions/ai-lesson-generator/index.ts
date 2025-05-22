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
  subtopic?: string;
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

// Deno.env is a Deno-specific API to access environment variables
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { subject, gradeLevel, topic, language = 'en', skipMediaSearch = false, subtopic } = requestBody;
    
    if (!subject || !gradeLevel || !topic) {
      throw new Error("Missing required parameters: subject, gradeLevel, or topic");
    }

    console.log(`Generating lesson for ${topic}${subtopic ? ` (subtopic: ${subtopic})` : ''} in ${subject} (grade ${gradeLevel}, language: ${language})`);

    // Create a prompt for OpenAI - optimized for faster generation
    const prompt = `
    Create a comprehensive educational lesson about "${topic}" in ${subject} for grade ${gradeLevel} students in ${language === 'id' ? 'Indonesian' : 'English'} language. 
    
    This should be a substantial lesson designed to take students 30-45 minutes to read through. Include rich details, examples, and explanations appropriate for the grade level.
    
    The lesson should include:
    - An engaging title
    - A thorough introduction that hooks the student
    - 5-7 detailed chapters/sections with clear headings and substantial content
    - 3-5 fun facts and interesting information
    - 1-2 interactive activities or exercises
    - A thoughtful conclusion that ties everything together
    - A comprehensive summary of key points
    
    ${skipMediaSearch ? '' : 'For each chapter, suggest an image description that would help illustrate the content.'}
    
    Format the response as a JSON object with the following structure:
    {
      "title": "Lesson Title",
      "introduction": "Thorough introduction text",
      "chapters": [
        {
          "heading": "Chapter 1 Title",
          "text": "Detailed content for chapter 1...",
          ${skipMediaSearch ? '' : `
          "image": {
            "description": "Brief description of an ideal image for this chapter",
            "alt": "Alt text for accessibility"
          }`}
        },
        // more chapters...
      ],
      "funFacts": ["Fun fact 1", "Fun fact 2", "Fun fact 3"],
      "activities": [
        {
          "title": "Activity 1 Title",
          "instructions": "Detailed instructions for the activity...",
          "materials": ["Item 1", "Item 2", "Item 3"]
        }
      ],
      "conclusion": "Concluding paragraph",
      "summary": "Comprehensive summary of key points"
    }
    
    Make the content appropriate for ${gradeLevel} grade level, engaging, educational, and accurate.
    `;
    
    console.log("Sending request to OpenAI API using optimized prompt");
    
    // Call OpenAI API to generate the lesson - use gpt-3.5-turbo for faster response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo-1106', // Using faster model option
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert educational content creator specializing in creating engaging lessons for children. Your content is detailed, age-appropriate, and rich with examples and connections to real-world experiences.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3500, // Reduced token count for faster response
      }),
    }).catch(error => {
      console.error("Error fetching from OpenAI:", error);
      throw new Error("Failed to connect to OpenAI service");
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`OpenAI API error (${response.status}):`, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
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
          // Generate a simple placeholder image URL based on topic
          const imageUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(topic)}-${index}&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9,b6e3f4`;
          
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
            
            const imageUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(topic)}-activity-${index}&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9,b6e3f4`;
            
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
