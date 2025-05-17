
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuizErrorProps {
  onTryAgain: () => void;
  error?: string; // Add the error prop that was missing
}

const QuizError: React.FC<QuizErrorProps> = ({ onTryAgain, error }) => {
  return (
    <Card>
      <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
        <p className="text-center font-display text-lg">
          {error || "Oops! Something went wrong with the quiz."}
        </p>
        <Button 
          onClick={onTryAgain} 
          className="mt-4 bg-eduPurple hover:bg-eduPurple-dark"
        >
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuizError;
