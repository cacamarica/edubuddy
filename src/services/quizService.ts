
import { supabase } from "@/integrations/supabase/client";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizProgress {
  student_id: string;
  subject: string;
  topic: string;
  grade_level: string;
  current_question: number;
  questions_answered: number[];
  correct_answers: number[];
  is_completed: boolean;
}

interface FetchQuizQuestionsOptions {
  subject: string;
  gradeLevel: string;
  topic: string;
  language: 'en' | 'id';
  questionCount: number;
}

export async function fetchQuizQuestions(options: FetchQuizQuestionsOptions): Promise<QuizQuestion[]> {
  try {
    // Try to get cached questions first
    const { data: cachedQuestions } = await supabase
      .from('quiz_questions')
      .select('question, options, correct_answer, explanation')
      .eq('subject', options.subject)
      .eq('grade_level', options.gradeLevel)
      .eq('topic', options.topic)
      .limit(options.questionCount);
      
    if (cachedQuestions && cachedQuestions.length >= options.questionCount) {
      // We have enough cached questions, transform them to match QuizQuestion interface
      return cachedQuestions.map(q => ({
        question: q.question,
        options: Array.isArray(q.options) 
          ? q.options 
          : (q.options && typeof q.options === 'object' 
            ? Object.values(q.options).map(opt => String(opt)) 
            : []),
        correctAnswer: q.correct_answer,
        explanation: q.explanation
      }));
    }
    
    // If not enough cached questions, generate new ones using the edge function
    const { data, error } = await supabase.functions.invoke('ai-quiz-generator', {
      body: {
        subject: options.subject,
        grade_level: options.gradeLevel,
        topic: options.topic,
        language: options.language,
        question_count: options.questionCount
      }
    });
    
    if (error) {
      console.error("Error generating quiz questions:", error);
      throw new Error(`Failed to generate quiz questions: ${error.message}`);
    }
    
    return data as QuizQuestion[];
  } catch (error) {
    console.error("Error in fetchQuizQuestions:", error);
    
    // Return placeholder questions in case of failure
    const placeholders: QuizQuestion[] = Array(options.questionCount).fill(0).map((_, i) => ({
      question: options.language === 'id' 
        ? `Pertanyaan contoh ${i + 1} tentang ${options.topic}` 
        : `Sample question ${i + 1} about ${options.topic}`,
      options: options.language === 'id'
        ? ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'] 
        : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      explanation: options.language === 'id'
        ? 'Penjelasan tidak tersedia'
        : 'Explanation not available'
    }));
    
    return placeholders;
  }
}

export async function saveQuizProgress(studentId: string, progress: QuizProgress): Promise<void> {
  try {
    // Check if progress already exists
    const { data: existingProgress } = await supabase
      .from('quiz_progress')
      .select('id')
      .eq('student_id', studentId)
      .eq('subject', progress.subject)
      .eq('topic', progress.topic)
      .eq('grade_level', progress.grade_level)
      .maybeSingle();
      
    if (existingProgress) {
      // Update existing progress
      await supabase
        .from('quiz_progress')
        .update({
          current_question: progress.current_question,
          questions_answered: progress.questions_answered,
          correct_answers: progress.correct_answers,
          is_completed: progress.is_completed,
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', existingProgress.id);
    } else {
      // Create new progress
      await supabase
        .from('quiz_progress')
        .insert([{
          student_id: progress.student_id,
          subject: progress.subject,
          topic: progress.topic,
          grade_level: progress.grade_level,
          current_question: progress.current_question,
          questions_answered: progress.questions_answered,
          correct_answers: progress.correct_answers,
          is_completed: progress.is_completed
        }]);
    }
  } catch (error) {
    console.error("Error saving quiz progress:", error);
  }
}

export async function getQuizProgress(
  studentId: string, 
  subject: string, 
  topic: string, 
  gradeLevel: string
): Promise<QuizProgress | null> {
  try {
    const { data, error } = await supabase
      .from('quiz_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('subject', subject)
      .eq('topic', topic)
      .eq('grade_level', gradeLevel)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching quiz progress:", error);
      return null;
    }
    
    return data as QuizProgress;
  } catch (error) {
    console.error("Error in getQuizProgress:", error);
    return null;
  }
}
