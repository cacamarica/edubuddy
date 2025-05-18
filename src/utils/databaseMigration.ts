
import { supabase } from "@/integrations/supabase/client";

/**
 * Utility function to ensure the students table is properly mapped for AI reports
 * This bypasses the profiles foreign key constraint issues
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

    // Direct approach: Create AI student reports directly without using profiles
    for (const student of students) {
      // First check if a report already exists - use limit(1) instead of maybeSingle to handle multiple rows
      const { data: existingReportData, error: checkError } = await supabase
        .from('ai_student_reports')
        .select('id')
        .eq('student_id', student.id)
        .limit(1);
        
      if (checkError) {
        console.error(`Error checking for existing AI report for student ${student.id}:`, checkError);
        continue;
      }
      
      // Get the first report if multiple exist
      const existingReport = existingReportData && existingReportData.length > 0 ? existingReportData[0] : null;
      
      const reportData = {
        student_id: student.id,
        report_data: {
          studentName: student.name,
          gradeLevel: student.grade_level || '4-6',
          overallSummary: 'No activity data yet. Complete more learning activities to generate a full report.',
          strengths: [],
          areasForImprovement: [],
          generatedAt: new Date().toISOString()
        },
        last_activity_timestamp_at_generation: new Date().toISOString()
      };
      
      let operation;
      if (existingReport) {
        // Update existing report
        operation = supabase
          .from('ai_student_reports')
          .update(reportData)
          .eq('id', existingReport.id);
      } else {
        // Insert new report
        operation = supabase
          .from('ai_student_reports')
          .insert(reportData);
      }
      
      const { error: opError } = await operation;
      if (opError) {
        console.error(`Error ${existingReport ? 'updating' : 'creating'} AI report for student ${student.id}:`, opError);
      } else {
        console.log(`Successfully ${existingReport ? 'updated' : 'created'} AI report for student ${student.id}`);
      }
    }
    
    console.log("Student profiles constraint fix completed");
  } catch (error) {
    console.error("Error in fixStudentProfilesMappings:", error);
  }
};
