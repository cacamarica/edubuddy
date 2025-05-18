
// Supabase Edge Function: get-student-ai-summary-report

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

// Mock AI Service with enhanced data
async function mockAIService(
  studentId: string,
  gradeLevel: string,
  studentName: string,
): Promise<AISummaryReport> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const levelInfo = educationLevels[gradeLevel as keyof typeof educationLevels] || {
    levelName: 'General Education',
    ageRange: 'All ages',
    grades: 'All grades'
  };

  // Create more comprehensive mock data
  const report: AISummaryReport = {
    studentName: studentName || "Student",
    overallSummary: `${studentName || 'The student'} is showing good progress in their ${levelInfo.levelName} education (${levelInfo.ageRange}). Their engagement with interactive lessons has been consistent, with particular strengths in Mathematics and Science topics. Based on recent quiz performance, they are demonstrating solid understanding of core concepts appropriate for their grade level.`,
    strengths: [
      "Strong engagement with mathematical concepts",
      "Good retention of science vocabulary and principles",
      "Consistent participation in reading activities",
      "Effective problem-solving in interactive exercises"
    ],
    areasForImprovement: [
      "More practice needed with complex vocabulary in English lessons",
      "Additional focus on historical timelines and contexts",
      "Further development of creative writing skills",
      "Strengthening understanding of geography concepts"
    ],
    activityAnalysis: `Over the past month, ${studentName || 'the student'} has completed 12 lessons and 5 quizzes across various subjects. Their engagement is highest in Mathematics (85% completion rate) and Science (73% completion rate), with moderate participation in Language Arts and Social Studies. Quiz scores show steady improvement, particularly in topics where they've completed multiple related lessons. We recommend additional focus on Geography concepts and historical contexts to create a more balanced learning profile.`,
    quizReview: [
      {
        quizId: "mock-math-quiz-1",
        quizTitle: "Basic Mathematics Operations",
        completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
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
      },
      {
        quizId: "mock-science-quiz-1",
        quizTitle: "Introduction to Plant Biology",
        completedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        score: 7,
        maxScore: 10,
        percentage: 70,
        questions: [
          { questionText: "What do plants need to make their own food?", studentAnswer: "Sunlight", correctAnswer: "Sunlight", isCorrect: true },
          { questionText: "What is photosynthesis?", studentAnswer: "Process where plants make food using sunlight", correctAnswer: "Process where plants make food using sunlight", isCorrect: true },
          { questionText: "Which part of the plant absorbs water from soil?", studentAnswer: "Roots", correctAnswer: "Roots", isCorrect: true },
          { questionText: "Which gas do plants release during photosynthesis?", studentAnswer: "Oxygen", correctAnswer: "Oxygen", isCorrect: true },
          { questionText: "What is the main function of leaves?", studentAnswer: "Photosynthesis", correctAnswer: "Photosynthesis", isCorrect: true },
          { questionText: "What do you call the green pigment in plants?", studentAnswer: "Chloroplast", correctAnswer: "Chlorophyll", isCorrect: false },
          { questionText: "What are the reproductive parts of flowering plants?", studentAnswer: "Flowers", correctAnswer: "Flowers", isCorrect: true },
          { questionText: "What do plants use to transport water from roots?", studentAnswer: "Stem", correctAnswer: "Stem", isCorrect: true },
          { questionText: "What is pollination?", studentAnswer: "Transfer of seeds", correctAnswer: "Transfer of pollen", isCorrect: false },
          { questionText: "What are the tiny pores on leaf surfaces called?", studentAnswer: "Holes", correctAnswer: "Stomata", isCorrect: false }
        ],
      }
    ],
    knowledgeGrowthChartData: [
      { date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), score: 60 }, // 90 days ago
      { date: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(), score: 65 }, // 75 days ago
      { date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), score: 68 }, // 60 days ago
      { date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), score: 72 }, // 45 days ago
      { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), score: 70 }, // 30 days ago
      { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), score: 75 }, // 15 days ago
      { date: new Date().toISOString(), score: 80 }, // today
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

    // Generate a mock report
    console.log(`Generating mock report for student ${studentId}, grade ${gradeLevel}`);
    const newReport = await mockAIService(studentId, gradeLevel, studentName);
    
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
