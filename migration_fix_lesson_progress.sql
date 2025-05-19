-- Fix the lesson_progress table schema
-- The application is trying to use 'last_accessed' but the column is named 'last_read_at'

-- Make sure lesson_progress table has all necessary columns
ALTER TABLE lesson_progress
ADD COLUMN IF NOT EXISTS last_read_at TEXT;

ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS current_chapter INTEGER DEFAULT 0;

ALTER TABLE lesson_progress
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;

-- Make sure learning_activities table has needed columns
ALTER TABLE learning_activities
ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES lesson_materials(id);

ALTER TABLE learning_activities
ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE learning_activities
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

ALTER TABLE learning_activities
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- DROP the grade_level column if it's causing issues
-- ALTER TABLE learning_activities DROP COLUMN IF EXISTS grade_level; 