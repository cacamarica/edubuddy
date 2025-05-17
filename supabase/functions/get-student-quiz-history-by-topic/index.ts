// Supabase Edge Function: get-student-quiz-history-by-topic

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define interfaces for quiz history (mirroring frontend if necessary)
interface QuizAttemptDetail {
  question_text: string; // Assuming column names in DB
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  attempted_at: string; // Timestamp of the attempt
  quiz_title?: string; // Optional: if you want to group by quiz instance
  topic_name?: string; // Optional: for context
}

// Helper function to create CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins (for development)
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS requests
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // Common headers
};

serve(async (req) => {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for get-student-quiz-history-by-topic');
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const { studentId, topicId } = await req.json();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!studentId || !topicId) {
    return new Response(
      JSON.stringify({ error: "studentId and topicId are required" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({ error: "Supabase environment variables not set" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 1. Fetch quiz attempts from student_quiz_attempts table
    //    for the given studentId and topicId.
    //    You might need to join with a 'quizzes' or 'questions' table to get more details.
    //    This example assumes student_quiz_attempts has all necessary info or you denormalize.

    const { data, error } = await supabase
      .from("student_quiz_attempts") // Ensure this table name is correct
      .select(`
        question_text,
        student_answer,
        correct_answer,
        is_correct,
        attempted_at,
        quizzes ( quiz_title ),  // Assuming a foreign key to a 'quizzes' table with 'quiz_title'
        topics ( topic_name )    // Assuming a foreign key to a 'topics' table with 'topic_name'
      `)
      .eq("student_id", studentId)
      .eq("topic_id", topicId) // Ensure your table has a topic_id column or similar filter
      .order("attempted_at", { ascending: false });

    if (error) {
      console.error("Error fetching quiz history:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch quiz history", details: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2. Structure and return the data
    // The data from Supabase might already be in a good format.
    // If you joined, it will be nested, e.g., data.quizzes.quiz_title.
    // You may need to flatten or transform it to match QuizAttemptDetail.

    const formattedAttempts: QuizAttemptDetail[] = (data || []).map((attempt: any) => ({
      question_text: attempt.question_text,
      student_answer: attempt.student_answer,
      correct_answer: attempt.correct_answer,
      is_correct: attempt.is_correct,
      attempted_at: attempt.attempted_at,
      quiz_title: attempt.quizzes?.quiz_title, // Access nested property
      topic_name: attempt.topics?.topic_name,   // Access nested property
    }));
    
    // For the TopicQuizHistory structure used in the frontend mock:
    // We need a topicName. We can get it from the first attempt if available, or pass it from client.
    const topicName = formattedAttempts.length > 0 ? formattedAttempts[0].topic_name : "Unknown Topic";

    return new Response(
      JSON.stringify({ 
        topicId: topicId,
        topicName: topicName, // You might want to fetch this more reliably
        attempts: formattedAttempts 
      }),
      { headers: { "Content-Type": "application/json", "Cache-Control": "no-cache", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Error in get-student-quiz-history-by-topic function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

/*
Assumed table: student_quiz_attempts
Columns:
  id: uuid (Primary Key)
  student_id: uuid (FK to students)
  quiz_id: uuid (FK to quizzes table)
  topic_id: uuid (FK to topics table)
  question_id: uuid (FK to questions table, if attempts are per question)
  question_text: text (Denormalized or joined from questions table)
  student_answer: text
  correct_answer: text (Denormalized or joined)
  is_correct: boolean
  attempted_at: timestamptz (default: now())
  ...

Assumed table: quizzes
Columns:
  id: uuid (PK)
  quiz_title: text
  topic_id: uuid (FK to topics)
  ...

Assumed table: topics
Columns:
  id: uuid (PK)
  topic_name: text
  ...

RLS Policies for 'student_quiz_attempts', 'quizzes', 'topics' tables need to allow access 
for the key used by createClient (anon key by default in this function).
If using service_role key, RLS is bypassed.

Example RLS (adjust as needed):
ALTER TABLE public.student_quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read access to quiz attempts" ON public.student_quiz_attempts
  FOR SELECT USING (true); -- Or more restrictive, e.g., (auth.role() = 'anon')

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read access to quizzes" ON public.quizzes
  FOR SELECT USING (true);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read access to topics" ON public.topics
  FOR SELECT USING (true);
*/
