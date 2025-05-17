
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { PencilRuler, LogIn } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface QuizSetupProps {
  topic: string;
  subject: string;
  questionCount: number;
  onQuestionCountChange: (count: number) => void;
  onStartQuiz: () => void;
  limited?: boolean; // Add this prop for limited access message
}

const QuizSetup: React.FC<QuizSetupProps> = ({
  topic,
  subject,
  questionCount,
  onQuestionCountChange,
  onStartQuiz,
  limited = false
}) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  // Calculate max allowed questions for limited access
  const maxLimitedQuestions = Math.max(1, Math.floor(10 * 0.3)); // 30% of 10 questions
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-display">{t('quiz.title')} {topic}!</CardTitle>
        <CardDescription>
          {t('quiz.description')} {topic} {t('quiz.in')} {subject}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {limited && (
          <div className="bg-eduPastel-purple p-4 rounded-lg mb-4">
            <h3 className="font-semibold font-display text-lg mb-2">
              {language === 'id' ? 'Akses Terbatas' : 'Limited Access'}
            </h3>
            <p>
              {language === 'id' 
                ? `Sebagai pengguna tanpa login, Anda hanya dapat mengambil hingga ${maxLimitedQuestions} pertanyaan.` 
                : `As a non-logged in user, you can only take up to ${maxLimitedQuestions} questions.`}
            </p>
            <div className="mt-4">
              <Button 
                onClick={() => navigate('/auth', { state: { action: 'signin' } })}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                {language === 'id' ? 'Masuk untuk Akses Penuh' : 'Sign In for Full Access'}
              </Button>
            </div>
          </div>
        )}
      
        <div>
          <h3 className="font-semibold text-lg mb-4">{t('quiz.questionCount')}</h3>
          <div className="flex flex-col gap-4">
            <Slider
              value={[questionCount]}
              min={1}
              max={limited ? maxLimitedQuestions : 20}
              step={1}
              onValueChange={(values) => onQuestionCountChange(values[0])}
              className="mx-2"
            />
            <div className="flex justify-between">
              <span>1</span>
              <span className="font-medium">{questionCount} {t('quiz.questions')}</span>
              <span>{limited ? maxLimitedQuestions : 20}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <Button onClick={onStartQuiz} className="bg-eduPurple hover:bg-eduPurple-dark">
            <PencilRuler className="mr-2 h-4 w-4" />
            {t('quiz.start')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizSetup;
