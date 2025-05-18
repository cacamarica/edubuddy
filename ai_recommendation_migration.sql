-- Add the reason and learning_impact columns to the ai_recommendations table
ALTER TABLE ai_recommendations 
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS learning_impact TEXT;

-- Update RLS policies to include the new columns
ALTER POLICY "Users can insert their own recommendations" ON ai_recommendations 
USING (true) 
WITH CHECK (student_id IN (
  SELECT s.id FROM students s WHERE s.parent_id = auth.uid() OR auth.uid() = s.auth_user_id
));

ALTER POLICY "Users can read their own recommendations" ON ai_recommendations 
USING (student_id IN (
  SELECT s.id FROM students s WHERE s.parent_id = auth.uid() OR auth.uid() = s.auth_user_id
));

ALTER POLICY "Users can update their own recommendations" ON ai_recommendations 
USING (student_id IN (
  SELECT s.id FROM students s WHERE s.parent_id = auth.uid() OR auth.uid() = s.auth_user_id
))
WITH CHECK (student_id IN (
  SELECT s.id FROM students s WHERE s.parent_id = auth.uid() OR auth.uid() = s.auth_user_id
)); 