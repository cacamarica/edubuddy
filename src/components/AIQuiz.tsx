
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { getAIEducationContent } from '@/services/aiEducationService';
import { CheckCircle, XCircle, Star, Award, PencilRuler } from 'lucide-react';
import { toast } from 'sonner';

interface AIQuizProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  onComplete?: (score: number, total: number) => void;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const AIQuiz = ({ subject, gradeLevel, topic, onComplete }: AIQuizProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState(0);

  const generateQuiz = async () => {
    setIsLoading(true);
    try {
      const result = await getAIEducationContent({
        contentType: 'quiz',
        subject,
        gradeLevel,
        topic
      });
      
      setQuestions(result.content);
      setAnswers(new Array(result.content.length).fill(null));
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      toast.error("Oops! We couldn't create your quiz right now. Please try again!");
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
      
      if (onComplete) onComplete(correctAnswers, questions.length);
      
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

  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-display">Quiz Time: {topic}!</CardTitle>
          <CardDescription>
            Test your knowledge about {topic} in {subject}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={generateQuiz} className="bg-eduPurple hover:bg-eduPurple-dark">
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
                  ? "Amazing job! You're a quiz superstar! 🌟"
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
                <div className="badge h-12 w-12 bg-eduPurple text-white flex items-center justify-center rounded-full">
                  <Star className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium mt-1">{score} Stars</p>
              </div>
              
              {score >= questions.length * 0.8 && (
                <div className="flex flex-col items-center">
                  <div className="badge h-12 w-12 bg-eduPurple text-white flex items-center justify-center rounded-full">
                    <Award className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium mt-1">{subject} Master Badge</p>
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
            onClick={() => {
              setQuestions([]);
              setQuizComplete(false);
            }}
          >
            New Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Guard against empty questions array or invalid currentQuestion index
  if (!questions[currentQuestion]) {
    // Reset to a valid state
    setCurrentQuestion(0);
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
          <p className="text-center font-display text-lg">Oops! Something went wrong with the quiz.</p>
          <Button 
            onClick={() => {
              setQuestions([]);
              setCurrentQuestion(0);
            }} 
            className="mt-4 bg-eduPurple hover:bg-eduPurple-dark"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-display text-center">
          {questions[currentQuestion].question}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
          Previous
        </Button>
        
        {showFeedback ? (
          <Button onClick={handleNextQuestion} className="bg-eduPurple hover:bg-eduPurple-dark">
            {currentQuestion < questions.length - 1 ? "Next" : "Finish Quiz"}
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
