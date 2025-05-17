
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PencilRuler } from 'lucide-react';

interface QuizSetupProps {
  topic: string;
  subject: string;
  questionCount: number;
  onQuestionCountChange: (count: number) => void;
  onStartQuiz: () => void;
}

const QuizSetup: React.FC<QuizSetupProps> = ({
  topic,
  subject,
  questionCount,
  onQuestionCountChange,
  onStartQuiz,
}) => {
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
                onClick={() => onQuestionCountChange(count)}
              >
                {count} questions
              </Button>
            ))}
          </div>
        </div>
        
        <Button 
          onClick={onStartQuiz} 
          className="bg-eduPurple hover:bg-eduPurple-dark"
          variant="primary"
        >
          <PencilRuler className="mr-2 h-4 w-4" />
          Start Quiz
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuizSetup;
