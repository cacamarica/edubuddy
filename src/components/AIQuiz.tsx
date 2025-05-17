import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import QuizSetup from "./QuizComponents/QuizSetup";
import QuizQuestionCard, { QuizQuestion } from "./QuizComponents/QuizQuestionCard";
import QuizResults from "./QuizComponents/QuizResults";
import LoadingQuiz from "./QuizComponents/LoadingQuiz";
import QuizError from "./QuizComponents/QuizError";
import { getAIEducationContent } from "@/services/aiEducationService";
import { useLanguage } from "@/contexts/LanguageContext";
import { studentProgressService } from "@/services/studentProgressService";

export interface AIQuizProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  onComplete?: (score: number) => void;
  limitProgress?: boolean;
}

const AIQuiz = ({ subject, gradeLevel, topic, onComplete, limitProgress = false }: AIQuizProps) => {
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const { user } = useAuth();
  const { language } = useLanguage();

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAIEducationContent({
        contentType: 'quiz',
        subject,
        gradeLevel,
        topic,
        language
      });
      
      if (data?.content?.questions) {
        // Limit the number of questions if needed
        const limitedQuestions = data.content.questions.slice(0, questionCount);
        
        // Initialize the answers array with nulls
        setQuestions(limitedQuestions);
        setAnswers(new Array(limitedQuestions.length).fill(null));
      } else {
        throw new Error("Couldn't load quiz questions");
      }
    } catch (err) {
      console.error("Error fetching quiz:", err);
      setError(language === 'id' ? "Gagal memuat kuis" : "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
    fetchQuiz();
    
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
        stars_earned: 0
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

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizComplete(true);
      
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete(score + (questions[currentQuestionIndex].correctAnswer === selectedAnswer ? 1 : 0));
      }
    }
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

  // Show the appropriate component based on the current state
  if (!quizStarted) {
    return (
      <QuizSetup
        topic={topic}
        subject={subject}
        questionCount={questionCount}
        onQuestionCountChange={setQuestionCount}
        onStartQuiz={handleStartQuiz}
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
      />
    );
  }

  // Fallback (should not happen)
  return <LoadingQuiz />;
};

export default AIQuiz;
