
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
    const { subject, gradeLevel, topic, count = 10, language = 'en' } = await req.json();

    // Create a prompt for OpenAI
    const prompt = `
    Create ${count} quiz questions about "${topic}" in ${subject} for grade ${gradeLevel} students in ${language === 'id' ? 'Indonesian' : 'English'} language. 
    
    Each question should:
    - Be age-appropriate for the grade level
    - Have 4 possible answer options
    - Have exactly one correct answer
    - Include an explanation of why the correct answer is right

    Return the questions in the following JSON format:
    [
      {
        "question": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0, // Index of correct answer (0-3)
        "explanation": "Explanation of why this answer is correct"
      },
      // ... more questions
    ]
    
    Make sure the questions are diverse in difficulty, engaging for children, and educational.
    `;
    
    // Call OpenAI API to generate quiz questions
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert educational quiz creator specializing in creating age-appropriate quizzes for children.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Error generating quiz questions');
    }

    const generatedContent = data.choices[0].message.content;
    
    // Parse the JSON response
    let questions;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = generatedContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        questions = JSON.parse(generatedContent);
      }
      
      return new Response(JSON.stringify({ questions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error parsing generated content:', error);
      console.error('Raw content:', generatedContent);
      throw new Error('Failed to parse the generated quiz questions');
    }
  } catch (error) {
    console.error('Error in ai-quiz-generator function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
