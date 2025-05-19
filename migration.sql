-- Migration script to add avatar column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Add lesson_id column to learning_activities table
ALTER TABLE learning_activities 
ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES lesson_materials(id);

-- Add grade_level column to learning_activities table
ALTER TABLE learning_activities 
ADD COLUMN IF NOT EXISTS grade_level TEXT;
