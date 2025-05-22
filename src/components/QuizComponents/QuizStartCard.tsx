
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuizStartCardProps {
  subject?: string;
  topic?: string;
  onStartQuiz: () => void;
  onCancelQuiz?: () => void;
  hasSavedProgress?: boolean;
  onResumePreviousQuiz?: () => void;
  limited?: boolean;
  gradeLevel?: string;
}

const QuizStartCard = ({ 
  subject, 
  topic, 
  onStartQuiz, 
  onCancelQuiz,
  hasSavedProgress, 
  onResumePreviousQuiz,
  limited = false,
  gradeLevel = 'k-3'
}: QuizStartCardProps) => {
  const { language, t } = useLanguage();
  
  const getGradeLevelDisplay = () => {
    switch(gradeLevel) {
      case 'k-3': return language === 'id' ? 'Kelas Awal (K-3)' : 'Early Elementary (K-3)';
      case '4-6': return language === 'id' ? 'Kelas Menengah (4-6)' : 'Upper Elementary (4-6)';
      case '7-9': return language === 'id' ? 'Kelas Atas (7-9)' : 'Middle School (7-9)';
      default: return gradeLevel;
    }
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto bg-white shadow-lg border-2 border-primary/10">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-8">
        <div className="flex items-center mb-2">
          <BookOpen className="h-6 w-6 text-primary mr-2" />
          <CardTitle className="text-xl text-primary">
            {language === 'id' ? 'Siap untuk Kuis?' : 'Ready for a Quiz?'}
          </CardTitle>
        </div>
        <CardDescription>
          {subject && topic ? (
            <>
              {language === 'id' 
                ? `Kuis tentang ${topic} dalam ${subject}`
                : `Quiz about ${topic} in ${subject}`
              }
              {gradeLevel && (
                <div className="mt-1">
                  <span className="text-xs font-medium bg-primary/10 text-primary rounded-full px-2 py-0.5">
                    {getGradeLevelDisplay()}
                  </span>
                </div>
              )}
            </>
          ) : (
            language === 'id' 
              ? 'Pilih topik dan mulai kuis untuk menguji pengetahuan Anda!'
              : 'Choose a topic and start a quiz to test your knowledge!'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-sm text-gray-600 mb-4">
          {language === 'id' 
            ? 'Jawab pertanyaan untuk membuktikan pengetahuan Anda dan meningkatkan pemahaman.'
            : 'Answer questions to prove your knowledge and improve understanding.'
          }
        </p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2 pt-0">
        {hasSavedProgress && onResumePreviousQuiz && (
          <Button 
            variant="outline" 
            onClick={onResumePreviousQuiz}
            className="w-full sm:w-auto"
          >
            {language === 'id' ? 'Lanjutkan Kuis' : 'Resume Quiz'}
          </Button>
        )}
        
        <Button 
          onClick={onStartQuiz} 
          className="w-full sm:w-auto"
        >
          {language === 'id' ? 'Mulai Kuis Baru' : 'Start New Quiz'}
        </Button>
        
        {onCancelQuiz && (
          <Button 
            variant="ghost" 
            onClick={onCancelQuiz}
            className="w-full sm:w-auto"
          >
            {language === 'id' ? 'Kembali' : 'Go Back'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuizStartCard;
