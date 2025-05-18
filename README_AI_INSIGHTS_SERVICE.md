// filepath: g:\eduBuddy\edubuddy\README_AI_INSIGHTS_SERVICE.md

# AI Learning Insights Service

This document explains how the AI Learning Insight Service works and how to set up the required Supabase Edge Functions.

## Overview

The AI Learning Insight Service provides personalized insights about why specific learning activities are recommended to students and what impact these activities will have on their learning journey. It leverages AI to analyze student performance data and generate tailored explanations.

## Required Supabase Edge Functions

To fully utilize this service, you need to deploy two Supabase Edge Functions:

1. `get-student-ai-insights` - For individual recommendation insights
2. `get-student-bulk-insights` - For batch processing multiple recommendations

## Edge Function Implementation

### get-student-ai-insights

```typescript
// Supabase Edge Function: get-student-ai-insights

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0';
import { OpenAI } from "https://esm.sh/openai@4.28.0";

// Function handler for AI insights
serve(async (req) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    });
  }
  
  try {
    // Parse request data
    const { studentId, subject, topic, activityType, gradeLevel, language } = await req.json();
    
    // Get OpenAI API key from environment variables
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }
    
    // Create OpenAI and Supabase clients
    const openai = new OpenAI({ apiKey: openAIApiKey });
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Fetch student data from Supabase
    const { data: quizData } = await supabaseClient
      .from('quiz_scores')
      .select('*')
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false })
      .limit(10);
      
    const { data: activityData } = await supabaseClient
      .from('learning_activities')
      .select('*')
      .eq('student_id', studentId)
      .order('last_interaction_at', { ascending: false })
      .limit(20);
    
    // Analyze data using AI
    const prompt = `
      As an educational AI, provide personalized learning insights for a student.
      
      CONTEXT INFORMATION:
      - Student ID: ${studentId}
      - Grade Level: ${gradeLevel || 'Not specified'}
      - Subject: ${subject || 'Not specified'}
      - Topic: ${topic || 'Not specified'} 
      - Activity Type: ${activityType || 'lesson'}
      - Language: ${language || 'en'}
      
      STUDENT DATA:
      - Quiz performance: ${JSON.stringify(quizData || [])}
      - Learning activities: ${JSON.stringify(activityData || [])}
      
      Based on this student's data, provide:
      1. A personalized reasoning explaining why this specific topic is recommended for them (max 2 sentences)
      2. An expected impact statement describing how learning this topic will benefit them (max 2 sentences)
      
      Format your response as JSON with the following structure:
      {
        "reasoning": "...",
        "expectedImpact": "..."
      }
      
      If the language parameter is 'id', provide the response in Indonesian, otherwise in English.
    `;
    
    // Generate response using OpenAI
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    // Parse response
    const responseText = chatCompletion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }
    
    const insights = JSON.parse(responseText);
    
    // Return insights
    return new Response(JSON.stringify(insights), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      status: 200,
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      status: 500,
    });
  }
});
```

### get-student-bulk-insights

```typescript
// Supabase Edge Function: get-student-bulk-insights

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0';
import { OpenAI } from "https://esm.sh/openai@4.28.0";

// Function handler for bulk AI insights
serve(async (req) => {
  // CORS handling (same as individual insights function)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    });
  }
  
  try {
    // Parse request data
    const { studentId, recommendations, gradeLevel, language } = await req.json();
    
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      throw new Error('Invalid recommendations array');
    }
    
    // Get OpenAI API key from environment variables
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }
    
    // Create OpenAI and Supabase clients
    const openai = new OpenAI({ apiKey: openAIApiKey });
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Fetch student data from Supabase
    const { data: quizData } = await supabaseClient
      .from('quiz_scores')
      .select('*')
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false })
      .limit(20);
      
    const { data: activityData } = await supabaseClient
      .from('learning_activities')
      .select('*')
      .eq('student_id', studentId)
      .order('last_interaction_at', { ascending: false })
      .limit(30);
    
    // Analyze data using AI
    const prompt = `
      As an educational AI, provide personalized learning insights for a student.
      
      CONTEXT INFORMATION:
      - Student ID: ${studentId}
      - Grade Level: ${gradeLevel || 'Not specified'}
      - Language: ${language || 'en'}
      
      STUDENT DATA SUMMARY:
      - Quiz performance: ${quizData ? quizData.length + ' quizzes completed' : 'No quiz data'}
      - Learning activities: ${activityData ? activityData.length + ' activities recorded' : 'No activity data'}
      
      RECOMMENDATIONS TO ANALYZE:
      ${JSON.stringify(recommendations)}
      
      For EACH recommendation in the list, provide:
      1. A personalized reasoning explaining why this specific topic is recommended for this student (1-2 sentences)
      2. An expected impact statement describing how learning this topic will benefit them (1-2 sentences)
      
      Format your response as a JSON array with one object per recommendation, preserving the ID:
      [
        {
          "id": "recommendation-id-1",
          "reasoning": "...",
          "expectedImpact": "..."
        },
        {
          "id": "recommendation-id-2",
          "reasoning": "...",
          "expectedImpact": "..."
        }
      ]
      
      If the language parameter is 'id', provide the response in Indonesian, otherwise in English.
    `;
    
    // Generate response using OpenAI
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    // Parse response
    const responseText = chatCompletion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }
    
    const insights = JSON.parse(responseText);
    
    // Return insights
    return new Response(JSON.stringify(insights), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      status: 200,
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      status: 500,
    });
  }
});
```

## How to Deploy Edge Functions

1. Navigate to your Supabase project directory
```bash
cd supabase/functions
```

2. Create the function directories
```bash
mkdir get-student-ai-insights get-student-bulk-insights
```

3. Create the function files
```bash
touch get-student-ai-insights/index.ts get-student-bulk-insights/index.ts
```

4. Copy the code from this README and paste it into the respective files

5. Deploy the functions using the Supabase CLI
```bash
supabase functions deploy get-student-ai-insights
supabase functions deploy get-student-bulk-insights
```

6. Set environment variables
```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

## Fallback Mechanism

If the edge functions are not available or return an error, the `aiLearningInsightService` will automatically fall back to local logic to generate insights based on limited data analysis. This ensures that users always see personalized recommendations, even if the AI service is temporarily unavailable.
