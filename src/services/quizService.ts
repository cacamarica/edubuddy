
import { supabase } from "@/integrations/supabase/client";
import { QuizQuestion } from "@/components/QuizComponents/QuizQuestionCard";

interface QuizProgress {
  student_id: string;
  subject: string;
  topic: string;
  grade_level: string;
  current_question: number;
  questions_answered: number[];
  correct_answers: number[];
  is_completed: boolean;
}

interface QuizOptions {
  subject: string;
  gradeLevel: string;
  topic: string;
  language?: 'en' | 'id';
  questionCount?: number;
}

// This helper function ensures options arrays are properly cast to string[]
const ensureStringArray = (options: any[]): string[] => {
  return options.map(option => String(option));
};

export const fetchQuizQuestions = async (options: QuizOptions): Promise<QuizQuestion[]> => {
  try {
    const { subject, gradeLevel, topic, language = 'en', questionCount = 10 } = options;
    
    // Call the edge function or API to get quiz questions
    const { data, error } = await supabase.functions.invoke('ai-quiz-generator', {
      body: { 
        subject, 
        gradeLevel, 
        topic,
        language,
        questionCount
      }
    });
    
    if (error) {
      console.error('Error fetching quiz questions:', error);
      return [];
    }

    // Transform the data to match the QuizQuestion interface and ensure options are strings
    return data.map((q: any) => ({
      question: q.question,
      options: ensureStringArray(q.options),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || ''
    }));
    
  } catch (error) {
    console.error('Error in fetchQuizQuestions:', error);
    return [];
  }
};

export const getQuizProgress = async (studentId: string, subject: string, topic: string, gradeLevel: string): Promise<QuizProgress | null> => {
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
      console.error('Error fetching quiz progress:', error);
      return null;
    }
    
    return data as QuizProgress;
  } catch (error) {
    console.error('Error in getQuizProgress:', error);
    return null;
  }
};

export const saveQuizProgress = async (studentId: string, progress: QuizProgress): Promise<boolean> => {
  try {
    // Check if progress entry already exists
    const existing = await getQuizProgress(
      studentId,
      progress.subject,
      progress.topic,
      progress.grade_level
    );
    
    if (existing) {
      // Update existing progress
      const { error } = await supabase
        .from('quiz_progress')
        .update(progress)
        .eq('student_id', studentId)
        .eq('subject', progress.subject)
        .eq('topic', progress.topic)
        .eq('grade_level', progress.grade_level);
        
      if (error) {
        console.error('Error updating quiz progress:', error);
        return false;
      }
    } else {
      // Insert new progress
      const { error } = await supabase
        .from('quiz_progress')
        .insert([progress]);
        
      if (error) {
        console.error('Error inserting quiz progress:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in saveQuizProgress:', error);
    return false;
  }
};
