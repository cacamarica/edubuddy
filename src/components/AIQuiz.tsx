
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { getAIEducationContent } from '@/services/aiEducationService';
import { CheckCircle, XCircle, Star, Award, PencilRuler, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface AIQuizProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  onComplete?: (score: number, total?: number) => void;
}

interface QuizImage {
  url: string;
  alt: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  image?: QuizImage;
  scenario?: string;
}

const AIQuiz = ({ subject, gradeLevel, topic, onComplete }: AIQuizProps) => {
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
  const [questionCount, setQuestionCount] = useState(10); // Default number of questions to show

  // Shuffle array helper function
  const shuffleArray = useCallback((array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Use an effect to reset currentQuestion if it's invalid
  useEffect(() => {
    if (shuffledQuestions.length > 0 && currentQuestion >= shuffledQuestions.length) {
      setCurrentQuestion(0);
    }
  }, [shuffledQuestions, currentQuestion]);

  // Shuffle questions and prepare for quiz
  useEffect(() => {
    if (questions.length > 0) {
      // Shuffle all questions
      const allShuffled = shuffleArray(questions);
      
      // Take the first questionCount questions for this quiz session
      const selectedQuestions = allShuffled.slice(0, Math.min(questionCount, allShuffled.length));
      
      setShuffledQuestions(selectedQuestions);
      setAnswers(new Array(selectedQuestions.length).fill(null));
      setCurrentQuestion(0); // Reset current question when questions change
      setSelectedAnswer(null); // Reset selected answer
      setShowFeedback(false); // Reset feedback
    }
  }, [questions, shuffleArray, questionCount]);

  // Function to normalize image structure
  const normalizeImage = (image: any): QuizImage | undefined => {
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
    setSelectedAnswer(null);
    
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
      
      // Show confetti for good scores
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
    // Reset state to initial
    setSelectedAnswer(null);
    setAnswers([]);
    setShowFeedback(false);
    setQuizComplete(false);
  };

  const handleQuestionCountChange = (count: number) => {
    setQuestionCount(count);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-eduPurple border-t-transparent rounded-full mb-4"></div>
          <p className="text-center font-display text-lg">Creating a fun quiz just for you!</p>
          <p className="text-center text-muted-foreground">This might take a moment...</p>
        </CardContent>
      </Card>
    );
  }

  if (shuffledQuestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-display">Quiz Time: {topic}!</CardTitle>
          <CardDescription>
            Test your knowledge about {topic} in {subject}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="text-center">
            <p className="mb-4">How many questions would you like to answer?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[5, 10, 15, 20, 30].map((count) => (
                <Button 
                  key={count}
                  variant={questionCount === count ? "primary" : "outline"}
                  className={questionCount === count ? "" : ""}
                  onClick={() => handleQuestionCountChange(count)}
                >
                  {count} questions
                </Button>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={generateQuiz} 
            className="bg-eduPurple hover:bg-eduPurple-dark"
            variant="primary"
          >
            <PencilRuler className="mr-2 h-4 w-4" />
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (quizComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-display">
            Quiz Complete!
          </CardTitle>
          <CardDescription>
            You've completed the {topic} Quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center gap-4">
            {score >= shuffledQuestions.length * 0.8 ? (
              <div className="h-24 w-24 rounded-full bg-yellow-100 flex items-center justify-center">
                <Star className="h-16 w-16 text-yellow-500 fill-yellow-500" />
              </div>
            ) : score >= shuffledQuestions.length * 0.6 ? (
              <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
            ) : (
              <div className="h-24 w-24 rounded-full bg-eduPastel-purple flex items-center justify-center">
                <Star className="h-16 w-16 text-eduPurple" />
              </div>
            )}
            
            <div>
              <p className="text-4xl font-display font-bold">
                {score} / {shuffledQuestions.length}
              </p>
              <p className="text-muted-foreground">
                {score >= shuffledQuestions.length * 0.8
                  ? "Amazing job! You're a quiz superstar! 🌟"
                  : score >= shuffledQuestions.length * 0.6
                    ? "Great work! You're doing well! 👏"
                    : "Good try! Let's practice more! 💪"}
              </p>
            </div>
          </div>
          
          <div className="grid gap-2">
            <h3 className="text-lg font-semibold">You earned:</h3>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="flex flex-col items-center">
                <div className="badge h-12 w-12 bg-eduPurple text-white flex items-center justify-center rounded-full">
                  <Star className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium mt-1">{score} Stars</p>
              </div>
              
              {score >= shuffledQuestions.length * 0.8 && (
                <div className="flex flex-col items-center">
                  <div className="badge h-12 w-12 bg-eduPurple text-white flex items-center justify-center rounded-full">
                    <Award className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium mt-1">{subject} Master Badge</p>
                </div>
              )}
            </div>
          </div>
          
          {answers.some((answer, index) => answer !== shuffledQuestions[index]?.correctAnswer) && (
            <div className="bg-eduPastel-blue p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Questions you might want to review:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {answers.map((answer, index) => {
                  const question = shuffledQuestions[index];
                  if (question && answer !== question.correctAnswer) {
                    return (
                      <li key={index}>
                        <span className="font-medium">{question.question}</span>
                        <p className="text-sm text-muted-foreground">
                          Correct answer: {question.options[question.correctAnswer]}
                        </p>
                      </li>
                    );
                  }
                  return null;
                }).filter(Boolean)}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            variant="outline"
            onClick={handleRestartQuiz}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            className="bg-eduPurple hover:bg-eduPurple-dark"
            onClick={() => {
              setQuestions([]);
              setShuffledQuestions([]);
              setQuizComplete(false);
            }}
          >
            New Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Error handling - if questions exist but current question is invalid
  if (hasError || (shuffledQuestions.length > 0 && currentQuestion >= shuffledQuestions.length)) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
          <p className="text-center font-display text-lg">Oops! Something went wrong with the quiz.</p>
          <Button 
            onClick={handleTryAgain} 
            className="mt-4 bg-eduPurple hover:bg-eduPurple-dark"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Safety check
  if (!shuffledQuestions[currentQuestion]) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
          <p className="text-center font-display text-lg">Loading question...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        {shuffledQuestions[currentQuestion].scenario && (
          <div className="mb-4 p-4 bg-eduPastel-blue rounded-lg">
            <p className="italic">{shuffledQuestions[currentQuestion].scenario}</p>
          </div>
        )}
        <CardTitle className="text-xl md:text-2xl font-display text-center">
          {shuffledQuestions[currentQuestion].question}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Question {currentQuestion + 1} of {shuffledQuestions.length}
            </span>
            <span className="text-sm font-medium">
              {Math.round(((currentQuestion + 1) / shuffledQuestions.length) * 100)}%
            </span>
          </div>
          <Progress 
            value={((currentQuestion + 1) / shuffledQuestions.length) * 100} 
            className="h-2" 
          />
        </div>
        
        {shuffledQuestions[currentQuestion].image && (
          <div className="mb-6 flex justify-center">
            <div className="w-full max-w-md rounded-lg overflow-hidden shadow-md">
              <img 
                src={shuffledQuestions[currentQuestion].image!.url} 
                alt={shuffledQuestions[currentQuestion].image!.alt || "Question image"}
                className="w-full h-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80";
                  target.alt = "Placeholder image - original image failed to load";
                }}
              />
            </div>
          </div>
        )}
        
        <RadioGroup 
          value={selectedAnswer !== null ? selectedAnswer.toString() : undefined} 
          onValueChange={(value) => handleAnswerSelect(parseInt(value))}
          className="space-y-4"
        >
          {shuffledQuestions[currentQuestion].options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem 
                value={index.toString()} 
                id={`option-${index}`} 
                disabled={showFeedback}
                className="h-5 w-5"
              />
              <Label 
                htmlFor={`option-${index}`}
                className={`font-display text-lg p-2 rounded-md w-full ${
                  showFeedback && index === shuffledQuestions[currentQuestion].correctAnswer 
                    ? 'bg-green-100 text-green-800'
                    : showFeedback && index === selectedAnswer
                      ? 'bg-red-100 text-red-800'
                      : 'hover:bg-eduPastel-purple cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showFeedback && index === shuffledQuestions[currentQuestion].correctAnswer && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {showFeedback && index === selectedAnswer && index !== shuffledQuestions[currentQuestion].correctAnswer && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        {showFeedback && (
          <div className="mt-6 p-4 bg-eduPastel-yellow rounded-lg">
            <p className="font-display">
              {shuffledQuestions[currentQuestion].explanation}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevQuestion}
          disabled={currentQuestion === 0}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>
        
        {showFeedback ? (
          <Button onClick={handleNextQuestion} className="bg-eduPurple hover:bg-eduPurple-dark flex items-center gap-2">
            {currentQuestion < shuffledQuestions.length - 1 ? (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              "Finish Quiz"
            )}
          </Button>
        ) : (
          <Button 
            onClick={handleCheckAnswer} 
            disabled={selectedAnswer === null}
            className="bg-eduPurple hover:bg-eduPurple-dark"
          >
            Check Answer
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AIQuiz;
