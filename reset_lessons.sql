
-- Reset lessons SQL script for EduBuddy

-- Delete quiz records first (to avoid foreign key constraints)
DELETE FROM quiz_progress;
DELETE FROM quiz_scores;
DELETE FROM quiz_questions;

-- Delete lesson records
DELETE FROM lesson_progress;
DELETE FROM lesson_materials;

-- Delete learning activity records
DELETE FROM learning_activities;

-- Reset AI-related tables
DELETE FROM ai_recommendations;
DELETE FROM ai_student_reports;

-- Clean up unused student_badges that might be orphaned
DELETE FROM student_badges
WHERE badge_id NOT IN (SELECT id FROM badges);

-- Optional: If you want to reset badges as well, uncomment the line below
-- DELETE FROM badges;

-- Confirmation message
DO $$
BEGIN
    RAISE NOTICE 'Lesson content reset complete!';
END $$;
