-- Create quiz questions cache table
CREATE TABLE IF NOT EXISTS public.quiz_questions_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  questions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quiz_questions_cache_key ON public.quiz_questions_cache (cache_key);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_subject_topic ON public.quiz_questions_cache (subject, topic);

-- Grant access to authenticated users
ALTER TABLE public.quiz_questions_cache ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to authenticated users"
  ON public.quiz_questions_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow insert/update access to service role
CREATE POLICY "Allow insert/update access to service role"
  ON public.quiz_questions_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true); 