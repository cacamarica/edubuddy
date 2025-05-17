
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    });

    const { subject, gradeLevel, topic, language = 'en' } = requestBody;
    
    if (!subject || !gradeLevel || !topic) {
      throw new Error("Missing required parameters: subject, gradeLevel, or topic");
    }

    console.log(`Generating lesson for ${topic} in ${subject} (grade ${gradeLevel}, language: ${language})`);

    // Create a prompt for OpenAI
    const prompt = `
    Create a comprehensive lesson about "${topic}" in ${subject} for grade ${gradeLevel} students in ${language === 'id' ? 'Indonesian' : 'English'} language. 
    
    The lesson should include:
    - An engaging title
    - A brief introduction
    - Between 3-6 chapters/sections with headings and detailed content
    - Fun facts about the topic
    - An interactive activity or exercise
    - A conclusion
    - A brief summary of key points
    
    For each chapter, suggest an image description that would help illustrate the content.
    
    Format the response as a JSON object with the following structure:
    {
      "title": "Lesson Title",
      "introduction": "Brief introduction text",
      "chapters": [
        {
          "heading": "Chapter 1 Title",
          "text": "Detailed content for chapter 1...",
          "image": {
            "url": "",
            "description": "Description of an ideal image for this chapter",
            "alt": "Alt text for accessibility"
          }
        },
        // more chapters...
      ],
      "funFacts": ["Fun fact 1", "Fun fact 2", "Fun fact 3"],
      "activity": {
        "title": "Activity Title",
        "instructions": "Detailed instructions for the activity...",
        "image": {
          "url": "",
          "description": "Description of an ideal image for this activity",
          "alt": "Alt text for accessibility"
        }
      },
      "conclusion": "Concluding paragraph",
      "summary": "Brief summary of key points"
    }
    
    Make the content appropriate for ${gradeLevel} grade level, engaging, educational, and accurate.
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
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert educational content creator specializing in creating engaging lessons for children.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
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
    });
    
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
                caption: chapter.image.description || `Visual aid for ${chapter.heading}`
              }
            };
          }
          return chapter;
        })
      };
      
      // Process the activity image if it exists
      if (processedContent.activity && processedContent.activity.image) {
        const imageUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(topic)}-activity&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9,b6e3f4`;
        
        processedContent.activity.image = {
          url: imageUrl,
          alt: processedContent.activity.image.alt || `Image for ${processedContent.activity.title}`,
          caption: processedContent.activity.image.description || `Visual aid for this activity`
        };
      }
      
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
        activity: {
          title: "Try again later",
          instructions: "Please check back soon when our systems are working properly."
        },
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
