import { supabase } from "@/integrations/supabase/client";

export interface SubjectProgress {
  student_id: string;
  subject: string;
  progress: number;
  last_studied: string;
}

export interface FunctionInvokeOptions {
  head?: boolean;
  body?: { [key: string]: any } | FormData;
  headers?: { [key: string]: string };
  retries?: number;
  // signal?: AbortSignal; // The AI removed this line, but it's needed
}

export interface AISummaryReport {
  studentId: string;
  overallSummary: string;
  subjectSummaries: { [subject: string]: string };
  recommendations: string[];
  reportDate: string;
}

export const studentProgressService = {
  async getSubjectProgress(studentId: string): Promise<SubjectProgress[]> {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId);

      if (error) {
        console.error("Error fetching subject progress:", error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      console.error("Error in getSubjectProgress:", error);
      throw new Error(error.message);
    }
  },

  async getAISummaryReport(studentId: string, gradeLevel: string, studentName: string, forceRefresh: boolean = false): Promise<AISummaryReport> {
    try {
      const options: FunctionInvokeOptions = {
        body: {
          student_id: studentId,
          grade_level: gradeLevel,
          student_name: studentName,
          force_refresh: forceRefresh
        },
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const { data, error } = await supabase.functions.invoke('ai-student-report', options);

      if (error) {
        console.error("Error invoking AI student report function:", error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error("No data received from AI student report function");
      }

      return data as AISummaryReport;
    } catch (error: any) {
      console.error("Error in getAISummaryReport:", error);
      throw new Error(error.message);
    }
  },
  
  generateFallbackReport(studentName: string, gradeLevel: string): AISummaryReport {
    const today = new Date();
    const formattedDate = today.toLocaleDateString();

    return {
      studentId: 'fallback',
      overallSummary: `A summary is not available for ${studentName} at this time. Please check back later.`,
      subjectSummaries: {},
      recommendations: [`Please ensure all learning activities for ${gradeLevel} are completed.`],
      reportDate: formattedDate,
    };
  },
};
