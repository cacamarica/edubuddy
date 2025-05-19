# EduBuddy Lesson Content Reset

This guide explains how to reset all lesson content in the EduBuddy database.

## What Will Be Reset

Running these scripts will delete:
1. All lesson progress tracking data
2. Learning activities linked to lessons
3. All lesson materials

This is useful when you want to start fresh with no lesson content in your database.

## Option 1: Using the Shell Script (with Supabase CLI)

If you have the Supabase CLI installed, you can use the provided shell script:

```bash
# Make sure the script is executable
chmod +x reset_lessons.sh

# Run the script
./reset_lessons.sh
```

## Option 2: Using the Node.js Script

You can use the provided Node.js script to reset lesson content:

```bash
# Install dependencies if needed
npm install @supabase/supabase-js dotenv

# Run the script with Node
node reset_lessons.js
```

Make sure your environment variables (SUPABASE_URL and SUPABASE_ANON_KEY) are properly set in a .env file.

## Option 3: Running SQL Directly

If you prefer, you can execute the SQL commands directly:

1. Connect to your Supabase database
2. Run the SQL in the `reset_lessons.sql` file

## After Resetting

After resetting the lesson content:

1. Restart your application if it's running
2. Any new lessons will be generated fresh when requested
3. Students will need to start lessons from the beginning again

## Troubleshooting

If you encounter errors:

1. Check that your database connection is valid
2. Verify that the tables mentioned exist in your schema
3. Look for foreign key constraints that might prevent deletion
4. Check for RLS (Row Level Security) policies that might block deletion operations 