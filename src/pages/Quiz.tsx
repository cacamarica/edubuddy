
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LearningBuddy from '@/components/LearningBuddy';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Star } from 'lucide-react';
import { toast } from 'sonner';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// Sample math questions for grade K-3
const mathQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What comes after 5?",
    options: ["4", "5", "6", "7"],
    correctAnswer: 2,
    explanation: "After 5 comes 6! When we count, we go 1, 2, 3, 4, 5, 6, 7, 8, 9, 10!"
  },
  {
    id: 2,
    question: "How many sides does a triangle have?",
    options: ["2", "3", "4", "5"],
    correctAnswer: 1,
    explanation: "A triangle has 3 sides! That's why it's called a tri-angle. 'Tri' means three!"
  },
  {
    id: 3,
    question: "What is 3 + 2?",
    options: ["4", "5", "6", "7"],
    correctAnswer: 1,
    explanation: "3 + 2 = 5! When we add 3 things and 2 more things, we get 5 things total!"
  },
  {
    id: 4,
    question: "Which shape has 4 equal sides?",
    options: ["Triangle", "Circle", "Rectangle", "Square"],
    correctAnswer: 3,
    explanation: "A square has 4 equal sides! All sides of a square are the same length."
  },
  {
    id: 5,
    question: "What is 10 - 5?",
    options: ["3", "4", "5", "6"],
    correctAnswer: 2,
    explanation: "10 - 5 = 5! When we take away 5 things from 10 things, we have 5 things left."
  }
];

const Quiz = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  
  useEffect(() => {
    // In a real app, we would fetch questions based on subject and grade level
    // For this demo, we're using the sample math questions
    setQuestions(mathQuestions);
    
    // Initialize answers array
    setAnswers(new Array(mathQuestions.length).fill(null));
  }, []);
  
  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    
    // Update answers array
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };
  
  const handleCheckAnswer = () => {
    setShowFeedback(true);
    
    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
    
    if (isCorrect) {
      toast.success("Great job! That's correct! ✨", {
        position: "bottom-right",
      });
    }
  };
  
  const handleNextQuestion = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz complete
      const correctAnswers = answers.filter(
        (answer, index) => answer === questions[index].correctAnswer
      ).length;
      setScore(correctAnswers);
      setQuizComplete(true);
      
      // Show confetti for good scores
      if (correctAnswers >= questions.length * 0.6) {
        toast.success(`Quiz complete! You got ${correctAnswers} out of ${questions.length} correct!`, {
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
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers(new Array(questions.length).fill(null));
    setShowFeedback(false);
    setQuizComplete(false);
  };
  
  const handleGoBack = () => {
    navigate('/lessons');
  };
  
  if (questions.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center space-y-4">
            <div className="rounded-full bg-muted h-12 w-12"></div>
            <div className="h-4 bg-muted rounded w-48"></div>
            <div className="h-2 bg-muted rounded w-64"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <section className="bg-eduPastel-blue py-8">
          <div className="container px-4 md:px-6">
            <Button 
              variant="ghost" 
              size="sm"
              className="mb-4"
              onClick={handleGoBack}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Lessons
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold">Math Quiz</h1>
                <p className="text-muted-foreground">Test your math skills with this fun quiz!</p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-12">
          <div className="container px-4 md:px-6">
            {!quizComplete ? (
              <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      Question {currentQuestion + 1} of {questions.length}
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={((currentQuestion + 1) / questions.length) * 100} 
                    className="h-2" 
                  />
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl md:text-2xl font-display text-center grade-k-3">
                      {questions[currentQuestion].question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup 
                      value={selectedAnswer?.toString()} 
                      onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                      className="space-y-4"
                    >
                      {questions[currentQuestion].options.map((option, index) => (
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
                              showFeedback && index === questions[currentQuestion].correctAnswer 
                                ? 'bg-green-100 text-green-800'
                                : showFeedback && index === selectedAnswer
                                  ? 'bg-red-100 text-red-800'
                                  : 'hover:bg-eduPastel-purple cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              {showFeedback && index === questions[currentQuestion].correctAnswer && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                              {showFeedback && index === selectedAnswer && index !== questions[currentQuestion].correctAnswer && (
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
                          {questions[currentQuestion].explanation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={handlePrevQuestion}
                      disabled={currentQuestion === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    {showFeedback ? (
                      <Button onClick={handleNextQuestion}>
                        {currentQuestion < questions.length - 1 ? (
                          <>
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
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
              </div>
            ) : (
              <div className="max-w-2xl mx-auto text-center">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl font-display">
                      Quiz Complete!
                    </CardTitle>
                    <CardDescription>
                      You've completed the Math Quiz
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center justify-center gap-4">
                      {score >= questions.length * 0.8 ? (
                        <div className="h-24 w-24 rounded-full bg-yellow-100 flex items-center justify-center">
                          <Star className="h-16 w-16 text-yellow-500 fill-yellow-500" />
                        </div>
                      ) : score >= questions.length * 0.6 ? (
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
                          {score} / {questions.length}
                        </p>
                        <p className="text-muted-foreground">
                          {score >= questions.length * 0.8
                            ? "Amazing job! You're a math superstar! 🌟"
                            : score >= questions.length * 0.6
                              ? "Great work! You're doing well! 👏"
                              : "Good try! Let's practice more! 💪"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <h3 className="text-lg font-semibold">You earned:</h3>
                      <div className="flex items-center justify-center gap-4 flex-wrap">
                        <div className="flex flex-col items-center">
                          <div className="badge badge-math h-12 w-12 flex items-center justify-center">
                            <Star className="h-6 w-6 text-white" />
                          </div>
                          <p className="text-sm font-medium mt-1">{score} Stars</p>
                        </div>
                        
                        {score >= questions.length * 0.8 && (
                          <div className="flex flex-col items-center">
                            <div className="badge badge-math h-12 w-12 flex items-center justify-center">
                              <Award className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-sm font-medium mt-1">Math Master Badge</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={handleRestartQuiz}
                    >
                      Try Again
                    </Button>
                    <Button
                      className="bg-eduPurple hover:bg-eduPurple-dark"
                      onClick={handleGoBack}
                    >
                      Back to Lessons
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        </section>
        
        {/* Learning Buddy */}
        <LearningBuddy />
      </main>
      
      <Footer />
    </div>
  );
};

export default Quiz;
