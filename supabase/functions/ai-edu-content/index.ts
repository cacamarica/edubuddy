
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const requestData = await req.json();
    const { contentType, subject, gradeLevel, topic, question } = requestData;
    
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
        Format as JSON with sections: title, introduction, mainContent (array of sections with headings and text), 
        funFacts (array), and activity (a simple hands-on activity).`,
      
      quiz: `You are an educational quiz creator for ${gradeLevel} students.
        Create 5 multiple-choice questions about ${topic} in ${subject}.
        Questions should be age-appropriate: simple and visual for K-3, moderately challenging for 4-6, and thought-provoking for 7-9.
        Format as JSON with an array of question objects, each with: question, options (array of 4 choices), correctAnswer (index of correct option), 
        and explanation (kid-friendly explanation of the answer).`,
      
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
          }
          content = JSON.parse(content);
        }
      } catch (e) {
        console.log('Could not parse JSON from OpenAI response, returning raw content');
        // If parsing fails, return the raw content
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
