// Reset lesson content in EduBuddy database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetLessonContent() {
  console.log('Starting lesson content reset...');

  try {
    // 1. Delete lesson progress
    console.log('Deleting lesson progress...');
    const { error: progressError } = await supabase
      .from('lesson_progress')
      .delete()
      .is('id', 'not.null');  // Delete all rows
    
    if (progressError) throw progressError;
    
    // 2. Clear learning activities that reference lessons
    console.log('Clearing learning activities linked to lessons...');
    const { error: activitiesError } = await supabase
      .from('learning_activities')
      .delete()
      .not('lesson_id', 'is', null);
    
    if (activitiesError) throw activitiesError;
    
    // 3. Delete all lesson materials
    console.log('Deleting lesson materials...');
    const { error: materialsError } = await supabase
      .from('lesson_materials')
      .delete()
      .is('id', 'not.null');  // Delete all rows
    
    if (materialsError) throw materialsError;
    
    console.log('Lesson content reset completed successfully!');
  } catch (error) {
    console.error('Error resetting lesson content:', error);
  }
}

// Execute the reset function
resetLessonContent(); 