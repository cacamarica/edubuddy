
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const LoadingQuiz: React.FC = () => {
  return (
    <Card>
      <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
        <div className="animate-spin w-12 h-12 border-4 border-eduPurple border-t-transparent rounded-full mb-4"></div>
        <p className="text-center font-display text-lg">Creating a fun quiz just for you!</p>
        <p className="text-center text-muted-foreground">This might take a moment...</p>
      </CardContent>
    </Card>
  );
};

export default LoadingQuiz;
