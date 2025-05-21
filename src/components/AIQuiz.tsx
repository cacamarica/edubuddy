import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingQuiz from '@/components/QuizComponents/LoadingQuiz';
import QuizSetup from "./QuizComponents/QuizSetup";
import QuizQuestionCard, { QuizQuestion } from '@/components/QuizComponents/QuizQuestionCard';
import { fetchQuizQuestions, saveQuizProgress, getQuizProgress } from "@/services/quiz.service";
import { Button, buttonVariants } from '@/components/ui/button';
import { ArrowLeft, HelpCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import QuizResults from "./QuizComponents/QuizResults";
import QuizError from "./QuizComponents/QuizError";
import { studentProgressService } from "@/services/studentProgressService";

export interface AIQuizProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  subtopic?: string;
  onComplete?: (score: number) => void;
  limitProgress?: boolean;
  studentId?: string; // Added studentId prop to the interface
  recommendationId?: string; // Added recommendationId prop to track recommendation source
}

const AIQuiz = ({ subject, gradeLevel, topic, subtopic, onComplete, limitProgress = false, studentId, recommendationId }: AIQuizProps) => {
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [questionCount, setQuestionCount] = useState(10); // Default to 10 questions now
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const { user } = useAuth();
  const { language } = useLanguage();

  // Check for saved progress
  useEffect(() => {
    const checkSavedProgress = async () => {
      if (!user) return;
      
      try {
        // Get the current student
        const { data: students } = await supabase
          .from('students')
          .select('*')
          .eq('parent_id', user.id)
          .limit(1);
          
        if (!students || students.length === 0) return;
        const student = students[0];
        
        const savedProgress = await getQuizProgress(student.id, subject, topic, gradeLevel);
        if (savedProgress && !savedProgress.is_completed) {
          setHasSavedProgress(true);
        }
      } catch (error) {
        console.error('Error checking saved progress:', error);
      }
    };
    
    if (quizStarted) return; // Only check on initial load
    checkSavedProgress();
  }, [user, subject, topic, gradeLevel, quizStarted]);

  // First effect to log initialization props
  useEffect(() => {
    console.log('AIQuiz initialized with props:', {
      subject,
      gradeLevel,
      topic,
      subtopic,
      questionCount
    });
  }, [subject, gradeLevel, topic, subtopic, questionCount]);

  // Second effect to auto-start the quiz when needed
  useEffect(() => {
    // Only run this effect once when the component mounts
    if (subject && gradeLevel && topic) {
      console.log('Auto-starting quiz');
      setQuizStarted(true);
      
      // Add a backup timeout in case fetchQuiz fails or gets stuck
      const forceStartTimeout = setTimeout(() => {
        if (loading) {
          console.log('Quiz loading timed out, force starting with fallback questions');
          forceStartQuiz();
        }
      }, 10000); // 10 second backup
      
      fetchQuiz(false).catch(() => {
        console.error('Error in initial fetchQuiz, force starting');
        forceStartQuiz();
      });
      
      return () => clearTimeout(forceStartTimeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a debugging log for component state changes
  useEffect(() => {
    console.log('AIQuiz state updated:', {
      quizStarted,
      loading,
      questionsLoaded: questions.length > 0,
      error
    });
  }, [quizStarted, loading, questions.length, error]);

  // Add forceStartQuiz as a useCallback before other useEffects
  const forceStartQuiz = useCallback(() => {
    console.log('Forcing quiz to start with fallback questions');
    
    // Create fallback questions if none exist
    if (questions.length === 0) {
      const fallbackQuestions: QuizQuestion[] = [
        {
          question: `What is the capital of France?`,
          questionType: 'multiple-choice',
          options: ["London", "Berlin", "Paris", "Madrid"],
          correctAnswer: 2,
          explanation: "Paris is the capital of France."
        },
        {
          question: "What planet is known as the Red Planet?",
          questionType: 'multiple-choice',
          options: ["Venus", "Mars", "Jupiter", "Saturn"],
          correctAnswer: 1,
          explanation: "Mars is known as the Red Planet due to its reddish appearance."
        },
        {
          question: "What is 8 + 5?",
          questionType: 'multiple-choice',
          options: ["12", "13", "14", "15"],
          correctAnswer: 1,
          explanation: "8 + 5 = 13"
        },
        {
          question: `What is the main topic you selected: ${topic}?`,
          questionType: 'multiple-choice',
          options: ["I don't know", "It's interesting", "I want to learn more", "All of the above"],
          correctAnswer: 3,
          explanation: `Learning about ${topic} is valuable!`
        },
        {
          question: "Which of these is NOT a primary color?",
          questionType: 'multiple-choice',
          options: ["Red", "Blue", "Green", "Yellow"],
          correctAnswer: 3,
          explanation: "Green is not a primary color. The primary colors are Red, Blue, and Yellow."
        }
      ];
      
      setQuestions(fallbackQuestions);
      setAnswers(new Array(fallbackQuestions.length).fill(null));
    }
    
    // Clear loading state
    setLoading(false);
    setError(null);
    setQuizStarted(true);
    
    // Make sure the quiz is visible
    if (onComplete) {
      // If we have an onComplete callback, we are in embedded mode
      // Notify parent component that loading is done
      console.log('Notifying parent component that quiz is ready');
    }
  }, [questions.length, topic, onComplete]);

  // Fix the dependencies array to not include forceStartQuiz (now defined with useCallback)
  useEffect(() => {
    const forceVisibilityTimeout = setTimeout(() => {
      if (!quizStarted || loading) {
        console.log('AIQuiz: Force starting quiz display');
        setQuizStarted(true);
        setLoading(false);
        
        // If we have no questions, create fallback ones
        if (questions.length === 0) {
          forceStartQuiz();
        }
      }
    }, 3000); // Only wait 3 seconds before forcing
    
    return () => clearTimeout(forceVisibilityTimeout);
  }, [quizStarted, loading, questions.length, forceStartQuiz]);

  const fetchQuiz = async (resumeProgress = false) => {
    setLoading(true);
    setError(null);
    
    // Add a safety timeout to clear loading state if something goes wrong
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.log('Quiz loading timed out - forcing state clear');
        setLoading(false);
        if (questions.length === 0) {
          setError(language === 'id' 
            ? 'Waktu pemuatan kuis habis, silakan coba lagi' 
            : 'Quiz loading timed out, please try again');
        }
      }
    }, 15000); // 15 second timeout

    try {
      // Always reset selectedAnswer when fetching a new quiz
      setSelectedAnswer(null);
      
      // Determine the appropriate subtopics to use
      const specificSubtopics = subtopic 
        ? [subtopic.toLowerCase()]
        : topic.toLowerCase().includes('living things') 
          ? [
              'characteristics of living things',
              'classification of organisms', 
              'cell structure',
              'life processes',
              'adaptation and evolution'
            ] 
          : undefined;
      
      // First check if the user is logged in
      if (!user) {
        try {
          console.log('Fetching quiz questions for non-logged in user');
          
          const questions = await fetchQuizQuestions({
            subject,
            gradeLevel,
            topic,
            subtopic,
            language: language as 'en' | 'id',
            questionCount,
            includeLessonContent: true,
            specificSubtopics,
            includeLearnedConcepts: true
          });
          
          console.log('Received questions:', questions);
          
          if (!questions || questions.length === 0) {
            clearTimeout(safetyTimeout);
            throw new Error('No questions returned from API');
          }
          
          setQuestions(questions);
          setAnswers(new Array(questions.length).fill(null));
          setLoading(false);
          clearTimeout(safetyTimeout);
          return;
        } catch (err) {
          console.error('Error fetching questions for non-logged user:', err);
          
          // With our improved quizService, this should no longer throw but use fallbacks instead
          if (err instanceof Error) {
            // If we still got an error, show it to the user
            clearTimeout(safetyTimeout);
            setError(language === 'id' 
              ? `Gagal memuat kuis: ${err.message}` 
              : `Failed to load quiz: ${err.message}`);
            setLoading(false);
            return;
          }
        }
      }
      
      // We're here, so the user must be logged in
      if (!user) {
        clearTimeout(safetyTimeout);
        setError(language === 'id' ? "Sesi login tidak valid" : "Invalid login session");
        setLoading(false);
        return;
      }
      
      // Get the current student
      console.log('Fetching student profile');
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', user.id)
        .limit(1);
      
      if (studentError) {
        console.error('Error fetching student profile:', studentError);
        clearTimeout(safetyTimeout);
        throw new Error('Could not fetch student profile');
      }
        
      if (!students || students.length === 0) {
        clearTimeout(safetyTimeout);
        setError(language === 'id' ? "Profil siswa tidak ditemukan" : "No student profile found");
        setLoading(false);
        return;
      }
      
      const student = students[0];
      console.log('Found student:', student.id);
      
      if (resumeProgress) {
        // Load saved progress
        console.log('Attempting to resume progress');
        const savedProgress = await getQuizProgress(student.id, subject, topic, gradeLevel);
        
        if (savedProgress) {
          console.log('Found saved progress:', savedProgress);
          // Fetch questions first
          const questions = await fetchQuizQuestions({
            subject,
            gradeLevel, 
            topic,
            subtopic,
            language: language as 'en' | 'id',
            questionCount: Math.max(questionCount, savedProgress.current_question + 1),
            includeLessonContent: true,
            specificSubtopics,
            includeLearnedConcepts: true
          });
          
          if (!questions || questions.length === 0) {
            throw new Error('No questions returned from API when resuming');
          }
          
          // Restore progress
          setQuestions(questions);
          setCurrentQuestionIndex(savedProgress.current_question);
          
          // Reconstruct answers array
          const answersArray = new Array(questions.length).fill(null);
          if (savedProgress.questions_answered && savedProgress.questions_answered.length > 0) {
            savedProgress.questions_answered.forEach((questionIndex, index) => {
              if (index < answersArray.length) {
                answersArray[questionIndex] = savedProgress.correct_answers?.[index] || null;
              }
            });
          }
          setAnswers(answersArray);
          
          // Calculate current score
          const correctCount = savedProgress.correct_answers?.length || 0;
          setScore(correctCount);
          
          // Ensure selected answer is reset for the current question
          setSelectedAnswer(null);
          
          toast.success(language === 'id' ? 'Kemajuan kuis dimuat' : 'Quiz progress loaded');
          setLoading(false);
          clearTimeout(safetyTimeout);
          return;
        } else {
          console.log('No saved progress found, starting new quiz');
        }
      }
      
      // If no progress or not resuming, start a new quiz
      console.log('Starting new quiz, fetching questions');
      const questions = await fetchQuizQuestions({
        subject,
        gradeLevel,
        topic,
        subtopic,
        language: language as 'en' | 'id',
        questionCount,
        includeLessonContent: true,
        specificSubtopics,
        includeLearnedConcepts: true
      });
      
      console.log('Received questions for new quiz:', questions.length > 0 ? 
                 `${questions.length} questions` : 'No questions');
      
      if (!questions || questions.length === 0) {
        clearTimeout(safetyTimeout);
        throw new Error('No questions returned from API for new quiz');
      }
      
      // Check if we received the fallback questions (by checking for specific questions)
      const isFallbackQuestions = questions.some(q => 
        q.question.includes("capital of France") || 
        q.question.includes("Red Planet") ||
        q.question.includes("8 + 5")
      );
      
      if (isFallbackQuestions) {
        console.log('Received fallback questions - API service may be unavailable');
        toast.info(language === 'id' 
          ? 'Menggunakan pertanyaan cadangan karena layanan AI tidak tersedia' 
          : 'Using backup questions because AI service is unavailable');
      }
      
      setQuestions(questions);
      setAnswers(new Array(questions.length).fill(null));
      
      // Record starting a new quiz
      try {
        console.log('Saving initial quiz progress');
        await saveQuizProgress(student.id, {
          student_id: student.id,
          subject,
          topic,
          grade_level: gradeLevel,
          current_question: 0,
          questions_answered: [],
          correct_answers: [],
          is_completed: false
        });
        console.log('Initial quiz progress saved');
      } catch (progressError) {
        console.error('Error saving initial quiz progress:', progressError);
        // Continue anyway, this isn't critical
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error("Error fetching quiz:", err);
      setError(language === 'id' 
        ? "Gagal memuat kuis: " + (err instanceof Error ? err.message : "Kesalahan tidak diketahui") 
        : "Failed to load quiz: " + (err instanceof Error ? err.message : "Unknown error"));
      setLoading(false);
    } finally {
      // Make sure to clear the timeout when the function completes normally
      clearTimeout(safetyTimeout);
    }
  };

  const handleStartQuiz = (resumeProgress = false) => {
    setQuizStarted(true);
    fetchQuiz(resumeProgress);
    
    // Record the activity start in the database if user is logged in
    recordActivityStart();
  };
  
  const recordActivityStart = async () => {
    if (!studentId) return;
    
    try {
      await studentProgressService.recordActivity({
        student_id: studentId,
        activity_type: 'quiz',
        subject,
        topic,
        progress: 0,
        completed: false,
        recommendation_id: recommendationId
        // No lesson_id for quiz activities
      });
      
      console.log('Quiz activity start recorded');
    } catch (error) {
      console.error('Error recording activity start:', error);
    }
  };

  const handleSelectAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleCheckAnswer = () => {
    setShowFeedback(true);
    
    // Check if answer is correct and update score
    if (selectedAnswer === questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = async () => {
    setShowFeedback(false);
    
    // Save the current answer
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);
    
    // Reset selected answer for the next question
    setSelectedAnswer(null);
    
    // Save progress if user is logged in
    if (user) {
      try {
        // Get the current student
        const { data: students } = await supabase
          .from('students')
          .select('*')
          .eq('parent_id', user.id)
          .limit(1);
          
        if (!students || students.length === 0) return;
        const student = students[0];
        
        // Update questions answered and correct answers arrays for progress tracking
        const isCorrect = selectedAnswer === questions[currentQuestionIndex].correctAnswer;
        
        // Get existing progress
        const existingProgress = await getQuizProgress(student.id, subject, topic, gradeLevel);
        
        const questionsAnswered = existingProgress?.questions_answered || [];
        const correctAnswers = existingProgress?.correct_answers || [];
        
        // Add current question to the arrays
        questionsAnswered.push(currentQuestionIndex);
        if (isCorrect) {
          correctAnswers.push(currentQuestionIndex);
        }
        
        // Save progress
        if (currentQuestionIndex < questions.length - 1) {
          await saveQuizProgress(student.id, {
            student_id: student.id,
            subject,
            topic,
            grade_level: gradeLevel,
            current_question: currentQuestionIndex + 1,
            questions_answered: questionsAnswered,
            correct_answers: correctAnswers,
            is_completed: false
          });
        } else {
          // Mark as completed if this is the last question
          await saveQuizProgress(student.id, {
            student_id: student.id,
            subject,
            topic,
            grade_level: gradeLevel,
            current_question: currentQuestionIndex,
            questions_answered: questionsAnswered,
            correct_answers: correctAnswers,
            is_completed: true
          });
          
          // Generate and store a summary of the quiz results
          const correctCount = correctAnswers.length;
          const totalQuestions = questions.length;
          const percentage = Math.round((correctCount / totalQuestions) * 100);
          
          // Create a summary of the quiz results
          const summary = `Quiz on ${topic} in ${subject}: Score ${correctCount}/${totalQuestions} (${percentage}%). ${
            percentage >= 80 ? "Excellent performance!" : 
            percentage >= 60 ? "Good job!" : 
            "Keep practicing to improve!"
          }`;
          
          // Store in learning_activities table with the summary
          await supabase
            .from('learning_activities')
            .insert([{
              student_id: student.id,
              activity_type: 'quiz',
              subject,
              topic,
              completed: true,
              progress: 100,
              stars_earned: Math.ceil(percentage / 20), // 1-5 stars based on percentage
              completed_at: new Date().toISOString(),
              last_interaction_at: new Date().toISOString(),
              recommendation_id: recommendationId, // Track recommendation if available
              summary: summary // Store the quiz summary for future reference
            }]);
        }
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      // First update the index
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      // Explicitly ensure selectedAnswer is reset for the next question
      setSelectedAnswer(null);
    } else {
      // Calculate final score
      const finalScore = calculateFinalScore();
      setScore(finalScore);
      setQuizComplete(true);
      
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete(finalScore);
      }
    }
  };

  // Calculate final score by counting correct answers
  const calculateFinalScore = () => {
    let correctCount = 0;
    
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctAnswer) {
        correctCount++;
      }
    }
    
    // Ensure score doesn't exceed questions length
    return Math.min(correctCount, questions.length);
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowFeedback(false);
      setSelectedAnswer(answers[currentQuestionIndex - 1]);
    }
  };

  const handleRestartQuiz = () => {
    setQuizComplete(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers(new Array(questions.length).fill(null));
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const handleNewQuiz = () => {
    setQuizStarted(false);
    setQuizComplete(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuestions([]);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const handlePauseQuiz = async () => {
    // Only pause if user is logged in
    if (!user) {
      toast.error(language === 'id' ? "Anda perlu masuk untuk menyimpan progres" : "You need to be logged in to save progress");
      return;
    }
    
    try {
      // Get the current student
      const { data: students } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', user.id)
        .limit(1);
        
      if (!students || students.length === 0) return;
      const student = students[0];
      
      // Save current progress
      await saveQuizProgress(student.id, {
        student_id: student.id,
        subject,
        topic,
        grade_level: gradeLevel,
        current_question: currentQuestionIndex,
        questions_answered: answers.map((answer, index) => index).filter(index => answers[index] !== null),
        correct_answers: answers.map((answer, index) => index).filter(index => answers[index] === questions[index].correctAnswer),
        is_completed: false
      });
      
      toast.success(language === 'id' ? "Progres kuis tersimpan" : "Quiz progress saved");
      
      // Return to setup
      setQuizStarted(false);
      setQuizComplete(false);
      setQuestions([]);
      setAnswers([]);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setHasSavedProgress(true);
    } catch (error) {
      console.error('Error pausing quiz:', error);
      toast.error(language === 'id' ? "Gagal menyimpan progres" : "Failed to save progress");
    }
  };

  // Modify the if-block controlling loading display
  if (loading) {
    // Instead of showing a loading component, log and continue to content
    console.log('AIQuiz is in loading state, but proceeding to content');
    
    // If we've been loading too long, force-start with fallback questions
    if (questions.length === 0) {
      console.log('No questions loaded yet, using fallback questions');
      // Since we're not returning, the code will continue to the next check
      // and show content if questions exist, or the QuizSetup component
    }
  }

  // Show the appropriate component based on the current state
  if (!quizStarted) {
    return (
      <QuizSetup
        topic={topic}
        subject={subject}
        questionCount={questionCount}
        onQuestionCountChange={setQuestionCount}
        onStartQuiz={() => handleStartQuiz(false)}
        onResumePreviousQuiz={() => handleStartQuiz(true)}
        hasSavedProgress={hasSavedProgress}
        limited={limitProgress}
        gradeLevel={gradeLevel}
      />
    );
  }

  if (error) {
    return <QuizError onTryAgain={fetchQuiz} error={error} />;
  }

  if (quizComplete) {
    const navigate = useNavigate();
    
    // Calculate final score
    const finalScore = calculateFinalScore();
    
    // Navigate to QuizResults with the necessary state
    navigate('/quiz/results', {
      state: {
        studentId,
        subject,
        topic,
        correctAnswers: finalScore,
        totalQuestions: questions.length
      },
      replace: true
    });
    
    // Return loading state during navigation
    return <LoadingQuiz progress={100} />;
  }

  // Show the current question
  if (questions.length > 0) {
    return (
      <QuizQuestionCard
        question={questions[currentQuestionIndex]}
        currentQuestionIndex={currentQuestionIndex}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        selectedAnswer={selectedAnswer}
        showFeedback={showFeedback}
        onAnswerSelect={handleSelectAnswer}
        onCheckAnswer={handleCheckAnswer}
        onNextQuestion={handleNextQuestion}
        onPrevQuestion={handlePrevQuestion}
        onPauseQuiz={handlePauseQuiz}
      />
    );
  }

  // Fallback (should not happen)
  return <LoadingQuiz />;
};

export default AIQuiz;
