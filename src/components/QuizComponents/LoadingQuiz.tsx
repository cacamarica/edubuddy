
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

const LoadingQuiz: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <Card>
      <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
        <div className="animate-bounce mb-2">
          <div className="animate-spin w-12 h-12 border-4 border-eduPurple border-t-transparent rounded-full"></div>
        </div>
        <p className="text-center font-display text-lg">{t('quiz.creating')}</p>
        <p className="text-center text-muted-foreground">{t('quiz.moment')}</p>
        <div className="mt-4 flex gap-2">
          <span className="animate-bounce delay-100 text-2xl">🧩</span>
          <span className="animate-bounce delay-200 text-2xl">🎮</span>
          <span className="animate-bounce delay-300 text-2xl">🎯</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingQuiz;
