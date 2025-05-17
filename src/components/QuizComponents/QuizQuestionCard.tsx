import React, { useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Pause } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { playSound } from '@/utils/SoundEffects';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizQuestionCardProps {
  question: QuizQuestion;
  currentQuestionIndex: number;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onAnswerSelect: (answerIndex: number) => void;
  onCheckAnswer: () => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onPauseQuiz?: () => void;
}

const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  question,
  currentQuestionIndex,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  showFeedback,
  onAnswerSelect,
  onCheckAnswer,
  onNextQuestion,
  onPrevQuestion,
  onPauseQuiz,
}) => {
  const { t, language } = useLanguage();
  
  // Play sound when feedback is shown
  useEffect(() => {
    if (showFeedback) {
      const isCorrect = selectedAnswer === question.correctAnswer;
      // Call playSound with just the sound type parameter
      playSound(isCorrect ? 'correct' : 'incorrect');
    }
  }, [showFeedback, selectedAnswer, question.correctAnswer]);
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            {t('quiz.question', { current: questionNumber, total: totalQuestions })}
          </span>
          <span className="text-sm font-medium">
            {Math.round(((questionNumber) / totalQuestions) * 100)}%
          </span>
        </div>
        <Progress 
          value={((questionNumber) / totalQuestions) * 100} 
          className="h-2" 
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-display">
            {question.question}
          </CardTitle>
          {onPauseQuiz && (
            <CardDescription className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPauseQuiz}
                className="flex items-center gap-1 text-xs"
              >
                <Pause className="h-3 w-3" />
                {t('quiz.saveAndExit')}
              </Button>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={selectedAnswer?.toString()} 
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
          
          {showFeedback && question.explanation && (
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
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('quiz.previous')}
          </Button>
          
          {showFeedback ? (
            <Button 
              onClick={onNextQuestion}
              className="bg-eduPurple hover:bg-eduPurple-dark"
            >
              {currentQuestionIndex < totalQuestions - 1 ? (
                <>
                  {t('quiz.next')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                t('quiz.finish')
              )}
            </Button>
          ) : (
            <Button 
              onClick={onCheckAnswer} 
              disabled={selectedAnswer === null}
              className="bg-eduPurple hover:bg-eduPurple-dark"
            >
              {t('quiz.check')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizQuestionCard;
