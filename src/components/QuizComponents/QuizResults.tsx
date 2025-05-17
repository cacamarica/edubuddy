
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, CheckCircle, Award, RotateCcw } from 'lucide-react';
import { QuizQuestion } from './QuizQuestionCard';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  subject: string;
  questions: QuizQuestion[];
  answers: (number | null)[];
  onRestartQuiz: () => void;
  onNewQuiz: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  score,
  totalQuestions,
  subject,
  questions,
  answers,
  onRestartQuiz,
  onNewQuiz,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl md:text-3xl font-display">
          Quiz Complete!
        </CardTitle>
        <CardDescription>
          You've completed the Quiz
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-4">
          {score >= totalQuestions * 0.8 ? (
            <div className="h-24 w-24 rounded-full bg-yellow-100 flex items-center justify-center">
              <Star className="h-16 w-16 text-yellow-500 fill-yellow-500" />
            </div>
          ) : score >= totalQuestions * 0.6 ? (
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
              {score} / {totalQuestions}
            </p>
            <p className="text-muted-foreground">
              {score >= totalQuestions * 0.8
                ? "Amazing job! You're a quiz superstar! 🌟"
                : score >= totalQuestions * 0.6
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
            
            {score >= totalQuestions * 0.8 && (
              <div className="flex flex-col items-center">
                <div className="badge h-12 w-12 bg-eduPurple text-white flex items-center justify-center rounded-full">
                  <Award className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium mt-1">{subject} Master Badge</p>
              </div>
            )}
          </div>
        </div>
        
        {answers.some((answer, index) => answer !== questions[index]?.correctAnswer) && (
          <div className="bg-eduPastel-blue p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Questions you might want to review:</h3>
            <ul className="list-disc pl-5 space-y-1">
              {answers.map((answer, index) => {
                const question = questions[index];
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
          onClick={onRestartQuiz}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
        <Button
          className="bg-eduPurple hover:bg-eduPurple-dark"
          onClick={onNewQuiz}
        >
          New Quiz
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizResults;
