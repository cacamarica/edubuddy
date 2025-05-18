
import { supabase } from "@/integrations/supabase/client";

/**
 * Utility function to ensure the students table is properly mapped to profiles
 * This resolves the foreign key constraint issues with ai_student_reports
 */
export const fixStudentProfilesMappings = async (): Promise<void> => {
  try {
    console.log("Running student profiles constraint fix...");
    
    // Get all student IDs from the system
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, grade_level, parent_id')
      .order('created_at', { ascending: false });
      
    if (studentsError) {
      console.error("Error fetching students:", studentsError);
      return;
    }

    if (!students || students.length === 0) {
      console.log("No students found to fix mappings");
      return;
    }

    console.log(`Found ${students.length} students to verify`);

    // For each student ID, ensure it exists in profiles
    for (const student of students) {
      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', student.id)
        .maybeSingle();

      if (checkError) {
        console.error(`Error checking profile for student ${student.id}:`, checkError);
        continue;
      }

      // If profile doesn't exist, create one
      if (!existingProfile) {
        console.log(`Creating missing profile for student ${student.id} (${student.name})`);
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: student.id,
            full_name: student.name,
            is_teacher: false
          });

        if (insertError) {
          console.error(`Error creating profile for student ${student.id}:`, insertError);
        } else {
          console.log(`Successfully created profile for student ${student.id}`);
        }
      } else {
        console.log(`Profile already exists for student ${student.id}`);
      }
    }
    
    console.log("Student profiles constraint fix completed");
  } catch (error) {
    console.error("Error in fixStudentProfilesMappings:", error);
  }
};
