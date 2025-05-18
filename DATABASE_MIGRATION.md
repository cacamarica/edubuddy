# Database Migration Guide

This guide explains how to apply schema changes to your Supabase database for EduBuddy.

## Recent Schema Changes

### Adding Avatar Column

The `avatar` column is now used to store student avatar emojis.

To add this column to your database:

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query using the contents of `migration.sql` file
4. Click "Run" to execute the migration

```sql
-- Migration script to add avatar column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar TEXT;
```

Alternatively, you can run this SQL statement directly in the SQL Editor.

## After Running Migrations

After successfully adding the avatar column to your database schema, you can uncomment the avatar-related code in the following files:

1. `src/components/StudentProfile.tsx` - Look for these comments:
   - "avatar field temporarily removed until database schema is updated"
   
Re-enable these sections after successfully running the migration.
