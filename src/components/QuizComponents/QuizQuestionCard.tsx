import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Pause, BookOpen, PenLine } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface QuizQuestion {
  question: string;
  questionType: 'multiple-choice' | 'essay';
  options: string[];
  correctAnswer: number;
  explanation?: string;
  modelAnswer?: string; // For essay questions
}

interface QuizQuestionCardProps {
  question: QuizQuestion;
  currentQuestionIndex: number;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  essayAnswer?: string;
  showFeedback: boolean;
  onAnswerSelect: (answerIndex: number) => void;
  onEssayChange?: (text: string) => void;
  onCheckAnswer: () => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onPauseQuiz?: () => void;
}

// Get the letter corresponding to option index
const getOptionLetter = (index: number): string => {
  return String.fromCharCode(65 + index); // A=65, B=66, etc.
};

const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  question,
  currentQuestionIndex,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  essayAnswer = '',
  showFeedback,
  onAnswerSelect,
  onEssayChange,
  onCheckAnswer,
  onNextQuestion,
  onPrevQuestion,
  onPauseQuiz,
}) => {
  const { t, language } = useLanguage();
  const [localEssayValue, setLocalEssayValue] = useState(essayAnswer);
  
  // Default text for buttons and labels
  const defaultText = {
    previous: language === 'id' ? 'Sebelumnya' : 'Previous',
    next: language === 'id' ? 'Berikutnya' : 'Next',
    check: language === 'id' ? 'Periksa Jawaban' : 'Check Answer',
    submit: language === 'id' ? 'Kirim Jawaban' : 'Submit Answer',
    finish: language === 'id' ? 'Selesai' : 'Finish',
    saveExit: language === 'id' ? 'Simpan & Keluar' : 'Save & Exit',
    question: language === 'id' 
      ? `Pertanyaan ${questionNumber} dari ${totalQuestions}` 
      : `Question ${questionNumber} of ${totalQuestions}`
  };
  
  // Safety check for missing question
  if (!question) {
    console.error('Invalid question data:', question);
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Error Loading Question</CardTitle>
          <CardDescription>
            There was a problem loading this question.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please try again or continue to the next question.</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={onPrevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('quiz.previous') || defaultText.previous}
          </Button>
          
          <Button onClick={onNextQuestion} className="bg-eduPurple hover:bg-eduPurple-dark">
            {currentQuestionIndex < totalQuestions - 1 ? (
              <>
                {t('quiz.next') || defaultText.next}
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            ) : (
              t('quiz.finish') || defaultText.finish
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Check if the topic is about Living Things and add special styling
  const isLivingThingsQuestion = question.question.toLowerCase().includes('living') || 
                               question.question.toLowerCase().includes('organism') || 
                               question.question.toLowerCase().includes('character') ||
                               question.question.toLowerCase().includes('cell') ||
                               question.question.toLowerCase().includes('classification');
  
  // Handle essay input change
  const handleEssayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalEssayValue(e.target.value);
    if (onEssayChange) {
      onEssayChange(e.target.value);
    }
  };
  
  // Check if this is an essay question
  const isEssayQuestion = question.questionType === 'essay';
  
  // Determine if answer button should be disabled
  const isAnswerButtonDisabled = isEssayQuestion 
    ? !localEssayValue.trim() // Disable if essay is empty
    : selectedAnswer === null; // Disable if no multiple choice selected
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">        
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            {t('quiz.question') ? t('quiz.question', { current: questionNumber, total: totalQuestions }) : defaultText.question}
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl md:text-2xl font-display">
              {/* Question text */}
              <div className="flex items-start gap-2">
                <div className={`bg-${isEssayQuestion ? 'blue' : 'emerald'}-100 p-1 rounded-full flex-shrink-0 mt-1`}>
                  {isEssayQuestion 
                    ? <PenLine className="h-4 w-4 text-blue-600" />
                    : <BookOpen className="h-4 w-4 text-emerald-600" />
                  }
                </div>
                <h3 className={`text-lg font-semibold mb-4 ${isLivingThingsQuestion ? 'text-emerald-800' : ''}`}>
                  {question.question}
                  {isLivingThingsQuestion && <span className="ml-2 text-xs text-emerald-600">♦ Core Concept</span>}
                  {isEssayQuestion && <span className="ml-2 text-xs text-blue-600">✎ Essay Question</span>}
                </h3>
              </div>
            </CardTitle>
            
            {onPauseQuiz && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPauseQuiz}
                className="flex items-center gap-1 text-xs"
              >
                <Pause className="h-3 w-3" />
                {t('quiz.saveAndExit') || defaultText.saveExit}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEssayQuestion ? (
            /* Essay question UI */
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-md mb-4">
                <p className="text-sm text-blue-700">
                  {t('quiz.essayInstruction') || 'Write your answer in the field below. Be specific and provide examples if possible.'}
                </p>
              </div>
              
              <Textarea
                placeholder={t('quiz.essayPlaceholder') || "Enter your answer here..."}
                className="min-h-[150px] font-display text-base"
                value={localEssayValue}
                onChange={handleEssayChange}
                disabled={showFeedback}
              />
              
              {showFeedback && question.modelAnswer && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-700 mb-2">{t('quiz.modelAnswer') || 'Model Answer'}</h4>
                  <p className="font-display text-blue-800 whitespace-pre-line">{question.modelAnswer}</p>
                  
                  {question.explanation && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <h4 className="font-semibold text-blue-700 mb-2">{t('quiz.feedback') || 'Feedback'}</h4>
                      <p className="font-display text-blue-800">{question.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Multiple choice question UI */
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
                      <span>
                        <span className="font-semibold mr-2">{getOptionLetter(index)}.</span>
                        {option}
                      </span>
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
          )}
          
          {/* Show reference material for Living Things questions */}
          {isLivingThingsQuestion && !showFeedback && !isEssayQuestion && (
            <div className="mb-4 p-2 bg-emerald-50 border border-emerald-200 rounded-md">
              <p className="text-xs text-emerald-800 italic">
                Remember: Living things show organization, homeostasis, metabolism, growth, reproduction, response to stimuli, and adaptation.
              </p>
            </div>
          )}
          
          {showFeedback && question.explanation && !isEssayQuestion && (
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
            {t('quiz.previous') || defaultText.previous}
          </Button>
          
          {showFeedback ? (
            <Button 
              onClick={onNextQuestion}
              className="bg-eduPurple hover:bg-eduPurple-dark"
            >
              {currentQuestionIndex < totalQuestions - 1 ? (
                <>
                  {t('quiz.next') || defaultText.next}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                t('quiz.finish') || defaultText.finish
              )}
            </Button>
          ) : (
            <Button 
              onClick={onCheckAnswer} 
              disabled={isAnswerButtonDisabled}
              className="bg-eduPurple hover:bg-eduPurple-dark"
            >
              {isEssayQuestion ? (t('quiz.submitAnswer') || defaultText.submit) : (t('quiz.check') || defaultText.check)}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizQuestionCard;
