
// Supabase Edge Function: get-student-ai-summary-report

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0';

// Helper function to create CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins (for development)
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS requests
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // Common headers
};

// Define interfaces for report structure (mirroring frontend)
interface QuizQuestionReview {
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}
interface QuizReviewDetail {
  quizId: string;
  quizTitle: string;
  completedDate: string;
  score: number;
  maxScore: number;
  percentage: number;
  questions: QuizQuestionReview[]; 
}
interface AISummaryReport {
  overallSummary: string;
  strengths: string[];
  areasForImprovement: string[];
  activityAnalysis: string;
  quizReview?: QuizReviewDetail[];
  knowledgeGrowthChartData?: { date: string; score: number }[]; // For graphics
  gradeLevel?: string;
  studentName?: string; // Added studentName
  generatedAt?: string; // Timestamp of when this report was generated
  reportId?: string; // ID of the report in the database
}

// Education level information with age ranges
const educationLevels = {
  'k-3': {
    levelName: 'Early Elementary',
    ageRange: '5-8 years',
    grades: 'Kindergarten to 3rd Grade',
  },
  '4-6': {
    levelName: 'Upper Elementary',
    ageRange: '9-11 years',
    grades: '4th to 6th Grade',
  },
  '7-9': {
    levelName: 'Middle School',
    ageRange: '12-15 years',
    grades: '7th to 9th Grade',
  }
};

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getStoredReport(studentId: string): Promise<AISummaryReport | null> {
  try {
    // Get the most recent report for this student
    const { data, error } = await supabase
      .from('ai_student_reports')
      .select('*')
      .eq('student_id', studentId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error || !data) {
      console.log("No stored report found:", error?.message);
      return null;
    }
    
    return {
      ...data.report_data as AISummaryReport,
      reportId: data.id,
      generatedAt: data.generated_at
    };
  } catch (error) {
    console.error("Error retrieving stored report:", error);
    return null;
  }
}

async function storeReport(studentId: string, report: AISummaryReport): Promise<string | null> {
  try {
    // Store the report in the database
    const { data, error } = await supabase
      .from('ai_student_reports')
      .insert({
        student_id: studentId,
        report_data: report,
        last_activity_timestamp_at_generation: new Date().toISOString()
      })
      .select('id')
      .single();
      
    if (error) {
      console.error("Error storing report:", error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error("Error storing report:", error);
    return null;
  }
}

// Mock AI Service with enhanced data
async function generateAIReport(
  studentId: string,
  gradeLevel: string,
  studentName: string,
): Promise<AISummaryReport> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Get actual student data
  let quizScores: any[] = [];
  let learningActivities: any[] = [];
  
  try {
    // Get real quiz scores
    const { data: scores, error: scoresError } = await supabase
      .from('quiz_scores')
      .select('*')
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false })
      .limit(10);
      
    if (!scoresError && scores) {
      quizScores = scores;
    }
    
    // Get real learning activities
    const { data: activities, error: activitiesError } = await supabase
      .from('learning_activities')
      .select('*')
      .eq('student_id', studentId)
      .order('last_interaction_at', { ascending: false })
      .limit(20);
      
    if (!activitiesError && activities) {
      learningActivities = activities;
    }
  } catch (error) {
    console.error("Error fetching student data:", error);
    // Continue with default mock data if real data fetch fails
  }

  const levelInfo = educationLevels[gradeLevel as keyof typeof educationLevels] || {
    levelName: 'General Education',
    ageRange: 'All ages',
    grades: 'All grades'
  };

  // Create more comprehensive report using real data if available
  const report: AISummaryReport = {
    studentName: studentName || "Student",
    overallSummary: `${studentName || 'The student'} is showing good progress in their ${levelInfo.levelName} education (${levelInfo.ageRange}). Their engagement with interactive lessons has been consistent, with particular strengths in ${quizScores.length > 0 ? quizScores[0].subject : 'Mathematics'} and ${learningActivities.length > 0 ? learningActivities[0].subject : 'Science'} topics. Based on recent quiz performance, they are demonstrating solid understanding of core concepts appropriate for their grade level.`,
    strengths: [
      quizScores.length > 0 ? `Strong performance in ${quizScores[0].subject} quizzes` : "Strong engagement with mathematical concepts",
      learningActivities.length > 0 ? `Consistent participation in ${learningActivities[0].subject} activities` : "Good retention of science vocabulary and principles",
      "Effective problem-solving in interactive exercises",
      "Good comprehension of core learning materials"
    ],
    areasForImprovement: [
      "More practice needed with complex vocabulary in English lessons",
      "Additional focus on historical timelines and contexts",
      "Further development of creative writing skills",
      "Strengthening understanding of geography concepts"
    ],
    activityAnalysis: `Over the past month, ${studentName || 'the student'} has completed ${learningActivities.filter(a => a.completed).length} lessons and ${quizScores.length} quizzes across various subjects. Their engagement is highest in ${quizScores.length > 0 ? quizScores[0].subject : 'Mathematics'} (${Math.floor(Math.random() * 20 + 70)}% completion rate) and ${learningActivities.length > 0 ? learningActivities[0].subject : 'Science'} (${Math.floor(Math.random() * 20 + 60)}% completion rate), with moderate participation in Language Arts and Social Studies. Quiz scores show steady improvement, particularly in topics where they've completed multiple related lessons. We recommend additional focus on Geography concepts and historical contexts to create a more balanced learning profile.`,
    quizReview: quizScores.length > 0 ? [
      {
        quizId: quizScores[0].id || "mock-quiz-1",
        quizTitle: `${quizScores[0].subject} - ${quizScores[0].topic}` || "Basic Mathematics Operations",
        completedDate: quizScores[0].completed_at || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        score: quizScores[0].score || 8,
        maxScore: quizScores[0].max_score || 10,
        percentage: quizScores[0].percentage || 80,
        questions: Array(quizScores[0].max_score || 10).fill(0).map((_, i) => ({
          questionText: `Question ${i + 1} about ${quizScores[0].topic || 'the subject'}?`,
          studentAnswer: `Student answer ${i + 1}`,
          correctAnswer: `Correct answer ${i + 1}`,
          isCorrect: Math.random() > 0.2 // 80% chance to be correct
        })),
      }
    ] : [
      {
        quizId: "mock-math-quiz-1",
        quizTitle: "Basic Mathematics Operations",
        completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        score: 8,
        maxScore: 10,
        percentage: 80,
        questions: [
          { questionText: "What is 15 + 7?", studentAnswer: "22", correctAnswer: "22", isCorrect: true },
          { questionText: "What is 20 - 8?", studentAnswer: "12", correctAnswer: "12", isCorrect: true },
          { questionText: "What is 4 × 6?", studentAnswer: "24", correctAnswer: "24", isCorrect: true },
          { questionText: "What is 27 ÷ 3?", studentAnswer: "9", correctAnswer: "9", isCorrect: true },
          { questionText: "What is 12 × 5?", studentAnswer: "60", correctAnswer: "60", isCorrect: true },
          { questionText: "What is 72 ÷ 8?", studentAnswer: "9", correctAnswer: "9", isCorrect: true },
          { questionText: "What is 17 + 25?", studentAnswer: "42", correctAnswer: "42", isCorrect: true },
          { questionText: "What is 50 - 27?", studentAnswer: "33", correctAnswer: "23", isCorrect: false },
          { questionText: "What is 15 × 4?", studentAnswer: "60", correctAnswer: "60", isCorrect: true },
          { questionText: "What is 56 ÷ 7?", studentAnswer: "9", correctAnswer: "8", isCorrect: false }
        ],
      }
    ],
    knowledgeGrowthChartData: [
      { date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), score: 60 },
      { date: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(), score: 65 },
      { date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), score: 68 },
      { date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), score: 72 },
      { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), score: 70 },
      { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), score: 75 },
      { date: new Date().toISOString(), score: 80 },
    ],
    gradeLevel: gradeLevel,
    generatedAt: new Date().toISOString(),
  };
  return report;
}

serve(async (req) => {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for get-student-ai-summary-report');
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const { studentId, gradeLevel, studentName, forceRefresh } = await req.json();
    
    console.log(`Processing request for student: ${studentId}, grade: ${gradeLevel}, name: ${studentName}, forceRefresh: ${forceRefresh}`);
    
    if (!studentId || !gradeLevel) {
      return new Response(
        JSON.stringify({ error: "studentId and gradeLevel are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Try to get an existing report first if not forcing refresh
    if (!forceRefresh) {
      const existingReport = await getStoredReport(studentId);
      if (existingReport) {
        console.log('Returning existing report from database');
        return new Response(
          JSON.stringify(existingReport),
          { 
            status: 200, 
            headers: { 
              "Content-Type": "application/json", 
              "Cache-Control": "no-cache", 
              ...corsHeaders 
            } 
          }
        );
      }
    }

    // Generate a new report
    console.log(`Generating new report for student ${studentId}, grade ${gradeLevel}`);
    const newReport = await generateAIReport(studentId, gradeLevel, studentName);
    
    // Store the new report in the database
    const reportId = await storeReport(studentId, newReport);
    if (reportId) {
      newReport.reportId = reportId;
    }
    
    return new Response(
      JSON.stringify(newReport),
      { 
        status: 200,
        headers: { 
          "Content-Type": "application/json", 
          "Cache-Control": "no-cache", 
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error("Error in get-student-ai-summary-report function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
