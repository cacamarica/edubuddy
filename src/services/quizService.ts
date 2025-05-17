
import { supabase } from "@/integrations/supabase/client";
import { QuizQuestion } from "@/components/QuizComponents/QuizQuestionCard";
import { toast } from "sonner";

export interface QuizParams {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  language?: 'en' | 'id';
  questionCount?: number;
}

export interface QuizProgress {
  id?: string;
  student_id: string;
  subject: string;
  topic: string;
  grade_level: string;
  current_question: number;
  questions_answered?: number[];
  correct_answers?: number[];
  is_completed: boolean;
  last_attempt_at?: string;
}

// Fetch quiz questions from the database
export const fetchQuizQuestions = async (params: QuizParams): Promise<QuizQuestion[]> => {
  const { subject, gradeLevel, topic, questionCount = 10, language = 'en' } = params;
  
  try {
    console.log('Fetching quiz questions for:', { subject, gradeLevel, topic, language });
    
    // Query existing questions from the database
    const { data: existingQuestions, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('subject', subject)
      .eq('topic', topic)
      .eq('grade_level', gradeLevel)
      .limit(questionCount);
      
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    // If we have enough questions in the database, return them
    if (existingQuestions && existingQuestions.length >= questionCount) {
      console.log('Using existing questions from database:', existingQuestions.length);
      return existingQuestions.slice(0, questionCount).map(q => ({
        question: q.question,
        options: q.options as string[],
        correctAnswer: q.correct_answer,
        explanation: q.explanation || ''
      }));
    }
    
    // If we don't have enough questions, generate more with AI
    console.log('Not enough questions in database, generating with AI');
    const newQuestions = await generateQuizQuestions({
      ...params,
      language
    });
    
    // Store the new questions in the database
    if (newQuestions && newQuestions.length > 0) {
      const questionsToStore = newQuestions.map(q => ({
        subject: subject,
        topic: topic,
        grade_level: gradeLevel,
        question: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation: q.explanation
      }));
      
      const { error: insertError } = await supabase
        .from('quiz_questions')
        .insert(questionsToStore)
        .select();
        
      if (insertError) {
        console.error('Error storing questions in database:', insertError);
        // Continue using the generated questions even if storing failed
      }
    }
    
    return newQuestions;
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    toast.error(language === 'id' ? 'Gagal memuat pertanyaan kuis' : 'Failed to load quiz questions');
    return [];
  }
};

// Generate quiz questions with OpenAI
const generateQuizQuestions = async (params: QuizParams): Promise<QuizQuestion[]> => {
  const { subject, gradeLevel, topic, language = 'en', questionCount = 10 } = params;
  
  try {
    console.log('Calling AI function to generate questions');
    const response = await supabase.functions.invoke('ai-quiz-generator', {
      body: { 
        subject,
        gradeLevel,
        topic,
        language,
        count: questionCount
      }
    });

    if (response.error) {
      console.error('Edge function error:', response.error);
      throw new Error(response.error.message || 'Failed to generate quiz questions');
    }
    
    console.log('AI response received successfully');
    return response.data.questions;
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    toast.error(language === 'id' ? 'Gagal menghasilkan pertanyaan kuis' : 'Failed to generate quiz questions');
    // Return an empty array or some default questions as fallback
    return [];
  }
};

// Save quiz progress
export const saveQuizProgress = async (studentId: string, progress: Partial<QuizProgress>): Promise<boolean> => {
  try {
    const { subject, topic, grade_level, current_question, is_completed } = progress;
    
    // Check if progress record exists
    const { data: existingProgress, error: queryError } = await supabase
      .from('quiz_progress')
      .select('id')
      .eq('student_id', studentId)
      .eq('subject', subject)
      .eq('topic', topic)
      .eq('grade_level', grade_level)
      .single();
      
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 = Not found
      console.error('Error checking existing progress:', queryError);
      throw queryError;
    }
    
    if (existingProgress) {
      // Update existing progress
      const { error: updateError } = await supabase
        .from('quiz_progress')
        .update({
          current_question,
          questions_answered: progress.questions_answered,
          correct_answers: progress.correct_answers,
          is_completed,
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', existingProgress.id);
        
      if (updateError) {
        console.error('Error updating progress:', updateError);
        throw updateError;
      }
    } else {
      // Create new progress record
      const { error: insertError } = await supabase
        .from('quiz_progress')
        .insert([{
          student_id: studentId,
          subject,
          topic,
          grade_level,
          current_question,
          questions_answered: progress.questions_answered || [],
          correct_answers: progress.correct_answers || [],
          is_completed,
          last_attempt_at: new Date().toISOString()
        }]);
        
      if (insertError) {
        console.error('Error inserting progress:', insertError);
        throw insertError;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving quiz progress:', error);
    toast.error('Failed to save quiz progress');
    return false;
  }
};

// Get saved quiz progress
export const getQuizProgress = async (studentId: string, subject: string, topic: string, gradeLevel: string): Promise<QuizProgress | null> => {
  try {
    const { data, error } = await supabase
      .from('quiz_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('subject', subject)
      .eq('topic', topic)
      .eq('grade_level', gradeLevel)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      console.error('Error getting quiz progress:', error);
      throw error;
    }
    
    return data as QuizProgress;
  } catch (error) {
    console.error('Error getting quiz progress:', error);
    toast.error('Failed to load quiz progress');
    return null;
  }
};
