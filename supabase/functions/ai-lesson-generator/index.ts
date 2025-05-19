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

    const { subject, gradeLevel, topic, language = 'en' } = requestBody;
    
    if (!subject || !gradeLevel || !topic) {
      throw new Error("Missing required parameters: subject, gradeLevel, or topic");
    }

    console.log(`Generating lesson for ${topic} in ${subject} (grade ${gradeLevel}, language: ${language})`);

    // Create a prompt for OpenAI
    const prompt = `
    Create a comprehensive, in-depth educational lesson about "${topic}" in ${subject} for grade ${gradeLevel} students in ${language === 'id' ? 'Indonesian' : 'English'} language. 
    
    This should be a substantial lesson designed to take students 60-90 minutes to read through and engage with. Include rich details, examples, and explanations appropriate for the grade level.
    
    The lesson should include:
    - An engaging, captivating title
    - A thorough introduction that hooks the student (300-400 words)
    - 10-15 detailed chapters/sections with clear headings and extensive content (at least 400-600 words per chapter)
    - Multiple fun facts and interesting information spread throughout (at least 8-10 facts)
    - 3-5 interactive activities or exercises
    - Real-world applications and examples of the concepts (4-6 examples)
    - A thoughtful conclusion that ties everything together (250-350 words)
    - A comprehensive summary of key points (300-400 words)
    - Challenge questions for students (5-8 questions)
    
    For each chapter, suggest an image description that would help illustrate the content. Be detailed in what the image should show.
    
    Format the response as a JSON object with the following structure:
    {
      "title": "Lesson Title",
      "introduction": "Thorough introduction text (200-300 words)",
      "chapters": [
        {
          "heading": "Chapter 1 Title",
          "text": "Detailed content for chapter 1 (300-500 words)...",
          "image": {
            "url": "",
            "description": "Detailed description of an ideal image for this chapter - be specific about what should be shown",
            "alt": "Alt text for accessibility"
          }
        },
        // more chapters...
      ],
      "funFacts": ["Fun fact 1", "Fun fact 2", "Fun fact 3", "Fun fact 4", "Fun fact 5"],
      "activities": [
        {
          "title": "Activity 1 Title",
          "instructions": "Detailed instructions for the activity...",
          "materials": ["Item 1", "Item 2", "Item 3"],
          "image": {
            "url": "",
            "description": "Description of an ideal image for this activity",
            "alt": "Alt text for accessibility"
          }
        },
        {
          "title": "Activity 2 Title",
          "instructions": "Detailed instructions for the second activity...",
          "materials": ["Item 1", "Item 2", "Item 3"],
          "image": {
            "url": "",
            "description": "Description of an ideal image for this activity",
            "alt": "Alt text for accessibility"
          }
        }
      ],
      "realWorldExamples": [
        {
          "title": "Example 1 Title",
          "description": "Detailed description of a real-world example..."
        },
        {
          "title": "Example 2 Title",
          "description": "Detailed description of another real-world example..."
        }
      ],
      "conclusion": "Concluding paragraph (150-200 words)",
      "summary": "Comprehensive summary of key points (200-300 words)",
      "challengeQuestions": ["Question 1?", "Question 2?", "Question 3?"]
    }
    
    Make the content appropriate for ${gradeLevel} grade level, engaging, educational, and accurate. Adjust language complexity appropriately for the grade level while ensuring sufficient depth and coverage of the topic.
    `;
    
    console.log("Sending request to OpenAI API");
    
    // Call OpenAI API to generate the lesson
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert educational content creator specializing in creating comprehensive, engaging lessons for children. Your content is detailed, age-appropriate, and rich with examples, analogies, and connections to real-world experiences. You create lessons that take 60-90 minutes to read through and fully engage with.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 7000,
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
          if (chapter.image) {
            // Generate a placeholder image URL based on the description
            const imageUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(topic)}-${index}&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9,b6e3f4`;
            
            return {
              ...chapter,
              image: {
                url: imageUrl,
                alt: chapter.image.alt || `Image for ${chapter.heading}`,
                caption: chapter.image.description || `Visual aid for ${chapter.heading}`,
                searchQuery: `${topic} ${chapter.heading}`
              }
            };
          }
          return chapter;
        }),
        activities: Array.isArray(lessonContent.activities) ? 
          lessonContent.activities.map((activity: any, index: number) => {
            if (activity.image) {
              const imageUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(topic)}-activity-${index}&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9,b6e3f4`;
              
              return {
                ...activity,
                image: {
                  url: imageUrl,
                  alt: activity.image.alt || `Image for ${activity.title}`,
                  caption: activity.image.description || `Visual aid for this activity`,
                  searchQuery: `${topic} ${activity.title} activity`
                }
              };
            }
            return activity;
          }) : [],
        realWorldExamples: lessonContent.realWorldExamples || [],
        challengeQuestions: lessonContent.challengeQuestions || []
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
        realWorldExamples: [],
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
