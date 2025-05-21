-- Create custom_topics table
CREATE TABLE IF NOT EXISTS public.custom_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id),
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_topics_student ON public.custom_topics (student_id);
CREATE INDEX IF NOT EXISTS idx_custom_topics_subject ON public.custom_topics (subject, topic);

-- Grant access to authenticated users
ALTER TABLE public.custom_topics ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to authenticated users"
  ON public.custom_topics
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow insert/update/delete to the owner
CREATE POLICY "Allow insert/update/delete to the student owner"
  ON public.custom_topics
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT parent_id FROM students WHERE id = student_id
  ))
  WITH CHECK (auth.uid() IN (
    SELECT parent_id FROM students WHERE id = student_id
  )); 