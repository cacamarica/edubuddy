import React, { useState, useEffect, useCallback } from 'react';
import { getAIEducationContent } from '@/services/aiEducationService';
import { toast } from 'sonner';
import LoadingQuiz from './QuizComponents/LoadingQuiz';
import QuizSetup from './QuizComponents/QuizSetup';
import QuizQuestionCard, { QuizQuestion } from './QuizComponents/QuizQuestionCard';
import QuizResults from './QuizComponents/QuizResults';
import QuizError from './QuizComponents/QuizError';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface AIQuizProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  onComplete?: (score: number, total?: number) => void;
  limitProgress?: boolean; // Added this prop to match what's being passed in LearningContent.tsx
}

const AIQuiz = ({ subject, gradeLevel, topic, onComplete, limitProgress = false }: AIQuizProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [questionCount, setQuestionCount] = useState(10); // Default number of questions
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  // Add logic to limit quiz questions for non-logged in users
  useEffect(() => {
    if (questions.length > 0 && limitProgress && !user) {
      // For non-logged in users, limit to 30% of questions (minimum 1)
      const limitedCount = Math.max(1, Math.floor(questions.length * 0.3));
      if (questionCount > limitedCount) {
        setQuestionCount(limitedCount);
      }
    }
  }, [questions, user, limitProgress, questionCount]);

  // Shuffle array helper function
  const shuffleArray = useCallback((array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Check if current question is valid
  useEffect(() => {
    if (shuffledQuestions.length > 0 && currentQuestion >= shuffledQuestions.length) {
      setCurrentQuestion(0);
    }
  }, [shuffledQuestions, currentQuestion]);

  // Reset selected answer when current question changes
  useEffect(() => {
    // Reset selected answer to null when changing questions or loading new questions
    setSelectedAnswer(null);
  }, [currentQuestion, shuffledQuestions]);

  // Shuffle questions when they change
  useEffect(() => {
    if (questions.length > 0) {
      // Shuffle all questions
      const allShuffled = shuffleArray(questions);
      
      // Take the first questionCount questions for this quiz session
      const selectedQuestions = allShuffled.slice(0, Math.min(questionCount, allShuffled.length));
      
      setShuffledQuestions(selectedQuestions);
      setAnswers(new Array(selectedQuestions.length).fill(null));
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  }, [questions, shuffleArray, questionCount]);

  // Function to normalize image structure
  const normalizeImage = (image: any) => {
    if (!image) return undefined;
    
    // Already in the right format
    if (image.url) return image;
    
    // String URL
    if (typeof image === 'string') {
      return { url: image, alt: "Quiz question illustration" };
    }
    
    // Description object needs conversion
    if (image.description) {
      return { 
        url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80", 
        alt: image.description 
      };
    }
    
    // Unknown format
    return undefined;
  };

  const generateQuiz = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getAIEducationContent({
        contentType: 'quiz',
        subject,
        gradeLevel,
        topic
      });
      
      // Ensure we have valid questions array
      if (result && result.content) {
        if (Array.isArray(result.content)) {
          // Process direct questions array
          const normalizedQuestions = result.content.map((q: any) => ({
            ...q,
            image: normalizeImage(q.image)
          }));
          setQuestions(normalizedQuestions);
        } else if (result.content.questions && Array.isArray(result.content.questions)) {
          // Handle nested questions structure
          const normalizedQuestions = result.content.questions.map((q: any) => ({
            ...q,
            image: normalizeImage(q.image)
          }));
          setQuestions(normalizedQuestions);
        } else {
          console.error("Unexpected quiz content format:", result);
          setHasError(true);
          toast.error("Quiz content couldn't be processed. Please try again.");
        }
      } else {
        setHasError(true);
        toast.error("Couldn't retrieve quiz questions. Please try again.");
      }
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      toast.error("Oops! We couldn't create your quiz right now. Please try again!");
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Quiz interaction handlers
  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    
    // Update answers array
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };
  
  const handleCheckAnswer = () => {
    setShowFeedback(true);
    
    if (shuffledQuestions.length > 0 && currentQuestion < shuffledQuestions.length) {
      const isCorrect = selectedAnswer === shuffledQuestions[currentQuestion].correctAnswer;
      
      if (isCorrect) {
        toast.success("Great job! That's correct! ✨", {
          position: "bottom-right",
        });
      }
    }
  };
  
  const handleNextQuestion = () => {
    setShowFeedback(false);
    setSelectedAnswer(null); // Ensure selection is cleared when moving to next question
    
    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz complete
      const correctAnswers = answers.filter(
        (answer, index) => answer === shuffledQuestions[index]?.correctAnswer
      ).length;
      setScore(correctAnswers);
      setQuizComplete(true);
      
      if (onComplete) onComplete(correctAnswers, shuffledQuestions.length);
      
      // Show toast for good scores
      if (correctAnswers >= shuffledQuestions.length * 0.6) {
        toast.success(`Quiz complete! You got ${correctAnswers} out of ${shuffledQuestions.length} correct!`, {
          position: "top-center",
          duration: 5000,
        });
      }
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      // Get the previously selected answer from the answers array
      setSelectedAnswer(answers[currentQuestion - 1]);
      setShowFeedback(false);
    }
  };
  
  const handleRestartQuiz = () => {
    // Re-shuffle questions for a different experience
    if (questions.length > 0) {
      const newShuffled = shuffleArray(questions).slice(0, questionCount);
      setShuffledQuestions(newShuffled);
      
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setAnswers(new Array(newShuffled.length).fill(null));
      setShowFeedback(false);
      setQuizComplete(false);
    } else {
      // If no questions, trigger generateQuiz
      generateQuiz();
    }
  };

  const handleTryAgain = () => {
    setQuestions([]);
    setShuffledQuestions([]);
    setCurrentQuestion(0);
    setHasError(false);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowFeedback(false);
    setQuizComplete(false);
  };

  const handleNewQuiz = () => {
    setQuestions([]);
    setShuffledQuestions([]);
    setQuizComplete(false);
  };

  // Render logic
  if (isLoading) {
    return <LoadingQuiz />;
  }

  if (shuffledQuestions.length === 0) {
    return (
      <QuizSetup
        topic={topic}
        subject={subject}
        questionCount={questionCount}
        onQuestionCountChange={(count) => {
          // Only allow changing up to the limit for non-logged in users
          if (!user && limitProgress) {
            const maxAllowed = Math.max(1, Math.floor(10 * 0.3)); // Using 10 as default total questions
            setQuestionCount(Math.min(count, maxAllowed));
          } else {
            setQuestionCount(count);
          }
        }}
        onStartQuiz={generateQuiz}
        limited={!user && limitProgress}
      />
    );
  }

  if (quizComplete) {
    return (
      <QuizResults
        score={score}
        totalQuestions={shuffledQuestions.length}
        subject={subject}
        questions={shuffledQuestions}
        answers={answers}
        onRestartQuiz={handleRestartQuiz}
        onNewQuiz={handleNewQuiz}
      />
    );
  }

  // Error handling - if questions exist but current question is invalid
  if (hasError || (shuffledQuestions.length > 0 && currentQuestion >= shuffledQuestions.length)) {
    return <QuizError onTryAgain={handleTryAgain} />;
  }

  // Safety check
  if (!shuffledQuestions[currentQuestion]) {
    return <LoadingQuiz />;
  }

  return (
    <QuizQuestionCard
      question={shuffledQuestions[currentQuestion]}
      currentQuestionIndex={currentQuestion}
      totalQuestions={shuffledQuestions.length}
      selectedAnswer={selectedAnswer}
      showFeedback={showFeedback}
      onAnswerSelect={handleAnswerSelect}
      onCheckAnswer={handleCheckAnswer}
      onNextQuestion={handleNextQuestion}
      onPrevQuestion={handlePrevQuestion}
    />
  );
};

export default AIQuiz;
