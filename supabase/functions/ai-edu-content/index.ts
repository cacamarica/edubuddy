import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Placeholder images for each subject
const placeholderImages = {
  'Math': [
    'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&w=800&q=80', // math symbols
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80', // calculator
    'https://images.unsplash.com/photo-1635372722656-389f87a941ae?auto=format&fit=crop&w=800&q=80', // geometry
    'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80', // colorful numbers
    'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=800&q=80', // equation
  ],
  'Science': [
    'https://images.unsplash.com/photo-1628595351029-c2bf17511435?auto=format&fit=crop&w=800&q=80', // microscope
    'https://images.unsplash.com/photo-1517976384346-3136801d605d?auto=format&fit=crop&w=800&q=80', // planets
    'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=800&q=80', // plants
    'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80', // chemistry
    'https://images.unsplash.com/photo-1554475900-0a0350e3fc7b?auto=format&fit=crop&w=800&q=80', // experiment
  ],
  'Reading': [
    'https://images.unsplash.com/photo-1512903989752-7f2c1bddc711?auto=format&fit=crop&w=800&q=80', // open book
    'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&w=800&q=80', // library
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80', // books
    'https://images.unsplash.com/photo-1488381397757-59d6261610f4?auto=format&fit=crop&w=800&q=80', // reading
    'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80', // letters
  ],
  'Language Arts': [
    'https://images.unsplash.com/photo-1512903989752-7f2c1bddc711?auto=format&fit=crop&w=800&q=80', // open book
    'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&w=800&q=80', // library
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80', // writing
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80', // typewriter
    'https://images.unsplash.com/photo-1510936111840-65e151ad71bb?auto=format&fit=crop&w=800&q=80', // dictionary
  ],
  'Social Studies': [
    'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?auto=format&fit=crop&w=800&q=80', // globe
    'https://images.unsplash.com/photo-1559125148-869042e9d898?auto=format&fit=crop&w=800&q=80', // map
    'https://images.unsplash.com/photo-1545670723-196ed0954986?auto=format&fit=crop&w=800&q=80', // community
    'https://images.unsplash.com/photo-1533677308119-8b313fe7f72d?auto=format&fit=crop&w=800&q=80', // history
    'https://images.unsplash.com/photo-1618477460930-8c4c6aa06af5?auto=format&fit=crop&w=800&q=80', // cultures
  ],
  'History': [
    'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=800&q=80', // clock
    'https://images.unsplash.com/photo-1476990789491-712b869b91a5?auto=format&fit=crop&w=800&q=80', // castle
    'https://images.unsplash.com/photo-1491156855053-9cdff72c7f85?auto=format&fit=crop&w=800&q=80', // pyramids
    'https://images.unsplash.com/photo-1533294455009-a77b7557d2d1?auto=format&fit=crop&w=800&q=80', // old map
    'https://images.unsplash.com/photo-1495562569060-2eec283d3391?auto=format&fit=crop&w=800&q=80', // museum
  ],
  'Geography': [
    'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=800&q=80', // world map
    'https://images.unsplash.com/photo-1508900173264-5ff93ea3037e?auto=format&fit=crop&w=800&q=80', // mountain
    'https://images.unsplash.com/photo-1531761535209-180857b9b45b?auto=format&fit=crop&w=800&q=80', // river
    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80', // landscape
    'https://images.unsplash.com/photo-1605142859862-978be7eba909?auto=format&fit=crop&w=800&q=80', // compass
  ],
  'Art': [
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80', // paint
    'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=800&q=80', // art supplies
    'https://images.unsplash.com/photo-1513364778565-464df9a60104?auto=format&fit=crop&w=800&q=80', // colorful paint
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80', // drawing
    'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?auto=format&fit=crop&w=800&q=80', // sculpture
  ],
  // Default for any other subject
  'default': [
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80', // books
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80', // student
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80', // learning
    'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=800&q=80', // classroom
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80', // education
  ]
};

// Get random image for a subject
function getRandomImage(subject: string, alt: string): { url: string; alt: string } {
  const subjectImages = placeholderImages[subject as keyof typeof placeholderImages] || placeholderImages.default;
  const randomIndex = Math.floor(Math.random() * subjectImages.length);
  return {
    url: subjectImages[randomIndex],
    alt: alt || `Image related to ${subject}`
  };
}

// Convert image description to actual image URL
function convertImageDescription(description: string, subject: string): { url: string; alt: string } {
  // If the string already looks like a URL, return it
  if (description.startsWith('http') && (description.includes('.jpg') || description.includes('.png') || description.includes('.webp') || description.includes('unsplash'))) {
    return { url: description, alt: "Educational illustration" };
  }
  
  // Otherwise, map the description to a relevant image
  // Find keywords in the description
  const keywords = [
    "math", "numbers", "geometry", "algebra", "calculation", 
    "science", "chemistry", "biology", "physics", "experiment", 
    "book", "reading", "library", "writing", "language", 
    "history", "geography", "map", "social", "culture", "art", "drawing"
  ];
  
  let bestMatch = 'default';
  
  // Try to find a match in the description
  for (const keyword of keywords) {
    if (description.toLowerCase().includes(keyword)) {
      if (keyword === "math" || keyword === "numbers" || keyword === "geometry" || keyword === "algebra") {
        bestMatch = "Math";
        break;
      } else if (keyword === "science" || keyword === "chemistry" || keyword === "biology" || keyword === "physics") {
        bestMatch = "Science";
        break;
      } else if (keyword === "book" || keyword === "reading") {
        bestMatch = "Reading";
        break;
      } else if (keyword === "writing" || keyword === "language") {
        bestMatch = "Language Arts";
        break;
      } else if (keyword === "history") {
        bestMatch = "History";
        break;
      } else if (keyword === "geography" || keyword === "map") {
        bestMatch = "Geography";
        break;
      } else if (keyword === "social" || keyword === "culture") {
        bestMatch = "Social Studies";
        break;
      } else if (keyword === "art" || keyword === "drawing") {
        bestMatch = "Art";
        break;
      }
    }
  }
  
  // If no match was found in the description, use the provided subject
  if (bestMatch === 'default' && subject) {
    bestMatch = subject;
  }
  
  // Get a random image for the best match
  return getRandomImage(bestMatch, description);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { contentType, subject, gradeLevel, topic, question, includeImages = true } = requestData;
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // OpenAI API key from environment variable
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Define specific system prompts based on content type and grade level
    const systemPrompts = {
      lesson: `You are an educational content creator for ${gradeLevel} students. 
        Create an engaging, age-appropriate lesson about ${topic} in ${subject}. 
        Use simple language for K-3, more detailed explanations for 4-6, and deeper concepts for 7-9.
        
        The lesson should be comprehensive and take about 10-15 minutes to read through.
        
        Format as JSON with these sections:
        - title: A catchy, engaging title for the lesson
        - introduction: A brief, engaging introduction to the topic
        - mainContent: An array of 5-7 detailed sections, each with:
          - heading: A clear section heading
          - text: Detailed, age-appropriate explanation (300-500 words per section)
          - image (optional): Object with suggested image description if you want an image for this section
        - funFacts: Array of 5 interesting facts related to the topic
        - activity: Object with title and instructions for a hands-on activity
        - conclusion: A brief summary of what was learned
        - summary: A concise summary of the key points
        
        Make the content educational, engaging, and rich in detail. Include examples, analogies, and real-world connections appropriate for the age group.`,
      
      quiz: `You are an educational quiz creator for ${gradeLevel} students.
        Create a set of 30-50 multiple-choice questions about ${topic} in ${subject}.
        Questions should be age-appropriate: simple and visual for K-3, moderately challenging for 4-6, and thought-provoking for 7-9.
        
        Include some story-based questions and scenarios to make the quiz more engaging and interactive.
        
        Format as JSON with an array of question objects, each with:
        - question: The question text
        - options: Array of 4 choices
        - correctAnswer: Index of correct option (0-based)
        - explanation: Kid-friendly explanation of the answer
        - image (optional): Object with suggested image description if the question would benefit from an image
        - scenario (optional): A brief story or context to make the question more engaging
        
        Make sure the questions cover different aspects of the topic and include a variety of difficulty levels.`,
      
      game: `You are an educational game designer for ${gradeLevel} students.
        Create a fun, interactive learning game related to ${topic} in ${subject}.
        Games should be age-appropriate: simple matching or sorting for K-3, word puzzles or simple logic games for 4-6, 
        and more complex strategy or creative challenges for 7-9.
        Format as JSON with: title, objective, instructions (step by step), materials (if any), and variations (simpler/harder versions).`,
        
      buddy: `You are a friendly and enthusiastic teacher named Learning Buddy. 
        Your goal is to help children (ages 5-13) learn in a fun and engaging way.
        Explain concepts in simple language appropriate for children. Use examples, analogies, 
        and occasionally emojis to make your explanations more engaging.
        Be encouraging, positive, and praise effort. Keep your responses concise 
        (about 2-4 sentences) unless a detailed explanation is needed.
        Be warm and supportive like a favorite teacher would be.
        
        Always maintain age-appropriate content with absolutely no inclusion of violence, 
        politics, religion, adult themes, or controversial topics.
        
        If you don't know the answer to something, it's okay to say so in a friendly way and 
        suggest where they might find the answer.`
    };
    
    // Select the appropriate system prompt
    const systemPrompt = systemPrompts[contentType] || systemPrompts.lesson;
    
    // Prepare content for user message based on content type
    let userContent = '';
    
    if (contentType === 'buddy') {
      userContent = question || 'Hi there! What can you help me with today?';
    } else {
      userContent = `Create ${contentType} content about ${topic} in ${subject} for ${gradeLevel} students. Make it educational, engaging, and age-appropriate.`;
    }
    
    console.log(`Generating ${contentType} about ${topic} for ${gradeLevel} students`);
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Process the response based on content type
    if (contentType === 'buddy') {
      // For buddy, we return the text directly
      return new Response(JSON.stringify({ content: content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // For other content types, try to parse JSON
      try {
        if (typeof content === 'string') {
          // Extract JSON if it's wrapped in markdown code blocks
          if (content.includes('```json')) {
            content = content.split('```json')[1].split('```')[0].trim();
          } else if (content.includes('```')) {
            // Try to extract any code block
            content = content.split('```')[1].split('```')[0].trim();
          }
          
          // Try to parse JSON
          try {
            content = JSON.parse(content);
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            // If JSON parsing fails, structure the content properly
            if (contentType === 'quiz' && typeof content === 'string') {
              // For quiz, create a fallback structure with the content as text
              content = { questions: [] };
            }
          }
          
          // Add images to content if requested
          if (includeImages && contentType === 'lesson' && typeof content === 'object') {
            // Add images to each section if mainContent exists
            if (content.mainContent && Array.isArray(content.mainContent)) {
              content.mainContent = content.mainContent.map((section: any, index: number) => {
                // Only add image to some sections for visual variety
                if (index % 2 === 0 || Math.random() > 0.5) {
                  // Handle case where section.image might already exist but needs conversion
                  let imageObj;
                  
                  if (section.image && section.image.description) {
                    // Convert the description to a proper image URL
                    imageObj = convertImageDescription(section.image.description, subject);
                  } else if (section.image && typeof section.image === 'string') {
                    // Convert the string to a proper image URL
                    imageObj = convertImageDescription(section.image, subject);
                  } else {
                    // Create a new image based on section heading
                    imageObj = getRandomImage(subject, `Image illustrating ${section.heading}`);
                  }
                  
                  return {
                    ...section,
                    image: imageObj
                  };
                }
                return section;
              });
            
              // Add image to activity if it exists
              if (content.activity) {
                if (content.activity.image && content.activity.image.description) {
                  content.activity.image = convertImageDescription(content.activity.image.description, subject);
                } else if (content.activity.image && typeof content.activity.image === 'string') {
                  content.activity.image = convertImageDescription(content.activity.image, subject);
                } else {
                  content.activity.image = getRandomImage(subject, `Activity for ${topic}`);
                }
              }
            }
          } else if (includeImages && contentType === 'quiz') {
            // For quiz content
            let questions: any[] = [];
            
            if (Array.isArray(content)) {
              // Direct array of questions
              questions = content;
            } else if (content.questions && Array.isArray(content.questions)) {
              // Already has questions array
              questions = content.questions;
            }
            
            // Process questions to ensure they have proper image URLs
            questions = questions.map((question: any, index: number) => {
              // Only add images to some questions
              if (index % 3 === 0) {
                let imageObj;
                
                if (question.image && question.image.description) {
                  // Convert the description to a proper image URL
                  imageObj = convertImageDescription(question.image.description, subject);
                } else if (question.image && typeof question.image === 'string') {
                  // Convert the string to a proper image URL
                  imageObj = convertImageDescription(question.image, subject);
                } else {
                  // Create a new image related to the question
                  imageObj = getRandomImage(subject, `Image for question about ${topic}`);
                }
                
                return {
                  ...question,
                  image: imageObj
                };
              }
              return question;
            });
            
            // Wrap in a proper structure
            content = Array.isArray(content) ? { questions } : { ...content, questions };
          }
        }
      } catch (e) {
        console.log('Could not parse JSON from OpenAI response, returning raw content:', e);
      }
  
      // Return the AI-generated content
      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in AI education content function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
