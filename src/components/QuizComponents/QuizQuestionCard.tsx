
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, ArrowLeft, ArrowRight } from 'lucide-react';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  image?: {
    url: string;
    alt: string;
  };
  scenario?: string;
}

interface QuizQuestionCardProps {
  question: QuizQuestion;
  currentQuestionIndex: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onAnswerSelect: (index: number) => void;
  onCheckAnswer: () => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
}

const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  question,
  currentQuestionIndex,
  totalQuestions,
  selectedAnswer,
  showFeedback,
  onAnswerSelect,
  onCheckAnswer,
  onNextQuestion,
  onPrevQuestion,
}) => {
  return (
    <Card>
      {question.scenario && (
        <div className="mb-4 p-4 bg-eduPastel-blue rounded-lg mt-4 mx-4">
          <p className="italic">{question.scenario}</p>
        </div>
      )}
      <CardContent className="pt-6">
        <h3 className="text-xl md:text-2xl font-display text-center mb-4">
          {question.question}
        </h3>
      
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-sm font-medium">
              {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%
            </span>
          </div>
          <Progress 
            value={((currentQuestionIndex + 1) / totalQuestions) * 100} 
            className="h-2" 
          />
        </div>
        
        {question.image && (
          <div className="mb-6 flex justify-center">
            <div className="w-full max-w-md rounded-lg overflow-hidden shadow-md">
              <img 
                src={question.image.url} 
                alt={question.image.alt || "Question image"}
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
          onValueChange={(value) => onAnswerSelect(parseInt(value))}
          className="space-y-4"
        >
          {question.options.map((option, index) => (
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
                  showFeedback && index === question.correctAnswer 
                    ? 'bg-green-100 text-green-800'
                    : showFeedback && index === selectedAnswer
                      ? 'bg-red-100 text-red-800'
                      : 'hover:bg-eduPastel-purple cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showFeedback && index === question.correctAnswer && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {showFeedback && index === selectedAnswer && index !== question.correctAnswer && (
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
              {question.explanation}
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>
        
        {showFeedback ? (
          <Button 
            onClick={onNextQuestion} 
            className="bg-eduPurple hover:bg-eduPurple-dark flex items-center gap-2"
          >
            {currentQuestionIndex < totalQuestions - 1 ? (
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
            onClick={onCheckAnswer} 
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

export default QuizQuestionCard;
