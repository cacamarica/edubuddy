#!/bin/bash

# Reset lesson content in EduBuddy database
echo "Resetting lesson content in EduBuddy database..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "Supabase CLI not found. Please install it first."
    echo "npm install -g supabase"
    exit 1
fi

# First, run the database schema fixes
echo "Fixing database schema..."
supabase db execute --file migration_fix_lesson_progress.sql

# Now execute the reset SQL script against the local Supabase instance
echo "Executing reset script..."
supabase db execute --file reset_lessons.sql

# Alternative method if the above doesn't work (uncomment if needed)
# cat reset_lessons.sql | supabase db execute

echo "Lesson content reset complete!"
echo "You may need to restart your application for changes to take effect." 