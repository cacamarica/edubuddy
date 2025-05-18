import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import QuizSetup from "./QuizComponents/QuizSetup";
import QuizQuestionCard, { QuizQuestion } from "./QuizComponents/QuizQuestionCard";
import QuizResults from "./QuizComponents/QuizResults";
import LoadingQuiz from "./QuizComponents/LoadingQuiz";
import QuizError from "./QuizComponents/QuizError";
import { useLanguage } from "@/contexts/LanguageContext";
import { studentProgressService } from "@/services/studentProgressService";
import { toast } from "sonner";
import { fetchQuizQuestions, saveQuizProgress, getQuizProgress } from "@/services/quizService";

export interface AIQuizProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  onComplete?: (score: number) => void;
  limitProgress?: boolean;
  studentId?: string; // Added studentId prop to the interface
  recommendationId?: string; // Added recommendationId prop to track recommendation source
}

const AIQuiz = ({ subject, gradeLevel, topic, onComplete, limitProgress = false, studentId, recommendationId }: AIQuizProps) => {
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

  const fetchQuiz = async (resumeProgress = false) => {
    setLoading(true);
    setError(null);

    try {
      // Always reset selectedAnswer when fetching a new quiz
      setSelectedAnswer(null);
      
      // First check if the user is logged in
      if (!user) {
        const questions = await fetchQuizQuestions({
          subject,
          gradeLevel,
          topic,
          language: language as 'en' | 'id',
          questionCount
        });
        
        setQuestions(questions);
        setAnswers(new Array(questions.length).fill(null));
        
        return;
      }
      
      // Get the current student
      const { data: students } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', user.id)
        .limit(1);
        
      if (!students || students.length === 0) {
        throw new Error('No student profile found');
      }
      
      const student = students[0];
      
      if (resumeProgress) {
        // Load saved progress
        const savedProgress = await getQuizProgress(student.id, subject, topic, gradeLevel);
        if (savedProgress) {
          // Fetch questions first
          const questions = await fetchQuizQuestions({
            subject,
            gradeLevel, 
            topic,
            language: language as 'en' | 'id',
            questionCount: Math.max(questionCount, savedProgress.current_question + 1)
          });
          
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
          return;
        }
      }
      
      // If no progress or not resuming, start a new quiz
      const questions = await fetchQuizQuestions({
        subject,
        gradeLevel,
        topic,
        language: language as 'en' | 'id',
        questionCount
      });
      
      setQuestions(questions);
      setAnswers(new Array(questions.length).fill(null));
      
      // Record starting a new quiz
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
      
    } catch (err) {
      console.error("Error fetching quiz:", err);
      setError(language === 'id' ? "Gagal memuat kuis" : "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (resumeProgress = false) => {
    setQuizStarted(true);
    fetchQuiz(resumeProgress);
    
    // Record the activity start in the database if user is logged in
    recordActivityStart();
  };
  
  const recordActivityStart = async () => {
    // Only record if user is logged in
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
      
      // Record learning activity start
      await studentProgressService.recordActivity({
        student_id: student.id,
        activity_type: 'quiz',
        subject,
        topic,
        completed: false,
        progress: 0,
        stars_earned: 0,
        recommendation_id: recommendationId // Track recommendation usage
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
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Ensure selected answer is reset for the next question
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
      />
    );
  }

  if (loading) {
    return <LoadingQuiz />;
  }

  if (error) {
    return <QuizError onTryAgain={fetchQuiz} error={error} />;
  }

  if (quizComplete) {
    return (
      <QuizResults
        score={score}
        totalQuestions={questions.length}
        subject={subject}
        topic={topic}
        questions={questions}
        answers={answers}
        onRestartQuiz={handleRestartQuiz}
        onNewQuiz={handleNewQuiz}
      />
    );
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
