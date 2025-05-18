-- Migration script to add avatar column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar TEXT;
