
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

    // Ensure count is within acceptable range (10-60)
    const questionCount = Math.max(10, Math.min(60, count));
    
    // Create a more detailed prompt for OpenAI to generate content appropriate to grade level
    const prompt = `
    Create ${questionCount} quiz questions about "${topic}" in ${subject} for grade ${gradeLevel} students in ${language === 'id' ? 'Indonesian' : 'English'} language. 
    
    Consider the following grade level guidance:
    ${getGradeLevelGuidance(gradeLevel, language)}
    
    Each question should:
    - Be age-appropriate for the grade level specified (${gradeLevel})
    - Have 4 possible answer options
    - Have exactly one correct answer
    - Include a detailed explanation of why the correct answer is right and why the others are wrong
    - Be diverse in difficulty and focus on different aspects of the topic
    - Include some scenario-based questions where relevant
    - Be well structured and follow educational best practices for the specified grade level

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
    
    Make sure the questions are diverse in difficulty, engaging for children, educational, and comprehensive enough for a thorough assessment of the topic.
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

// Helper function to provide grade-specific guidance
function getGradeLevelGuidance(gradeLevel: string, language: string): string {
  if (language === 'id') {
    switch(gradeLevel) {
      case 'k-3':
        return 'Ini untuk siswa kelas K-3 (5-8 tahun). Gunakan bahasa sederhana, fokus pada konsep dasar, dengan pertanyaan yang jelas dan singkat. Materi harus konkret, bukan abstrak. Gunakan gambar dan contoh sederhana jika memungkinkan.';
      case '4-6':
        return 'Ini untuk siswa kelas 4-6 (9-11 tahun). Dapat menggunakan konsep yang lebih kompleks, kosakata yang lebih kaya, dan beberapa pemikiran kritis. Siswa dalam kelompok usia ini mampu mengingat fakta dan menerapkan pengetahuan dalam skenario sederhana.';
      case '7-9':
        return 'Ini untuk siswa kelas 7-9 (12-14 tahun). Dapat mencakup konsep abstrak, penalaran logis, dan analisis yang lebih mendalam. Siswa dalam kelompok usia ini mampu berpikir kritis dan menerapkan pengetahuan di berbagai konteks.';
      default:
        return 'Sesuaikan tingkat kesulitan dengan usia siswa, menggunakan bahasa dan konsep yang sesuai perkembangan.';
    }
  } else {
    switch(gradeLevel) {
      case 'k-3':
        return 'This is for K-3 students (ages 5-8). Use simple language, focus on basic concepts, with clear and short questions. Material should be concrete, not abstract. Use pictures and simple examples where possible.';
      case '4-6':
        return 'This is for grades 4-6 students (ages 9-11). Can use more complex concepts, richer vocabulary, and some critical thinking. Students in this age group are capable of recalling facts and applying knowledge in simple scenarios.';
      case '7-9':
        return 'This is for grades 7-9 students (ages 12-14). Can include abstract concepts, logical reasoning, and deeper analysis. Students in this age group are capable of critical thinking and applying knowledge across various contexts.';
      default:
        return 'Adapt difficulty level to the students\' age, using developmentally appropriate language and concepts.';
    }
  }
}
