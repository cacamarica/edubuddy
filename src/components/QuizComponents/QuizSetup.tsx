import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { PencilRuler, LogIn, Undo2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface QuizSetupProps {
  topic: string;
  subject: string;
  questionCount: number;
  onQuestionCountChange: (count: number) => void;
  onStartQuiz: () => void;
  onResumePreviousQuiz?: () => void;
  hasSavedProgress?: boolean;
  limited?: boolean;
  gradeLevel?: 'k-3' | '4-6' | '7-9';
}

// Helper function to format grade level for display
const formatGradeLevel = (gradeLevel: string, language: string): string => {
  switch(gradeLevel) {
    case 'k-3':
      return language === 'id' ? 'Kelas K-3' : 'Grades K-3';
    case '4-6':
      return language === 'id' ? 'Kelas 4-6' : 'Grades 4-6';
    case '7-9':
      return language === 'id' ? 'Kelas 7-9' : 'Grades 7-9';
    default:
      return '';
  }
};

const QuizSetup: React.FC<QuizSetupProps> = ({
  topic,
  subject,
  questionCount,
  onQuestionCountChange,
  onStartQuiz,
  onResumePreviousQuiz,
  hasSavedProgress = false,
  limited = false,
  gradeLevel = 'k-3'
}) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  // Calculate max allowed questions for limited access
  const maxLimitedQuestions = Math.max(10, Math.floor(60 * 0.3)); // 30% of 60 questions
  
  // Format strings for a cleaner display
  const formattedGradeLevel = formatGradeLevel(gradeLevel, language);
  const topicDisplay = topic || (language === 'id' ? 'Topik ini' : 'This topic');
  const subjectDisplay = subject || (language === 'id' ? 'Mata pelajaran ini' : 'This subject');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-display">
          {language === 'id' ? 'Kuis:' : 'Quiz:'} {topicDisplay}
        </CardTitle>
        <CardDescription className="flex flex-col">
          <span>{subjectDisplay} • {formattedGradeLevel}</span>
          <span className="mt-1">
            {language === 'id' 
              ? `Uji pengetahuan Anda tentang ${topicDisplay}` 
              : `Test your knowledge about ${topicDisplay}`}
          </span>
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

        {hasSavedProgress && onResumePreviousQuiz && (
          <div className="bg-eduPastel-blue p-4 rounded-lg mb-4">
            <h3 className="font-semibold font-display text-lg mb-2">
              {language === 'id' ? 'Progres Tersimpan Ditemukan' : 'Saved Progress Found'}
            </h3>
            <p className="mb-4">
              {language === 'id' 
                ? 'Anda memiliki kuis yang belum selesai tentang topik ini. Ingin melanjutkan dari mana Anda tinggalkan?' 
                : 'You have an unfinished quiz on this topic. Would you like to continue where you left off?'}
            </p>
            <Button 
              onClick={onResumePreviousQuiz}
              variant="default"
              className="bg-eduPurple hover:bg-eduPurple-dark w-full flex items-center justify-center gap-2"
            >
              <Undo2 className="h-4 w-4" />
              {language === 'id' ? 'Lanjutkan Kuis' : 'Continue Quiz'}
            </Button>
          </div>
        )}
      
        <div>
          <h3 className="font-semibold text-lg mb-4">
            {language === 'id' ? 'Jumlah Pertanyaan' : 'Number of Questions'}
          </h3>
          <div className="flex flex-col gap-4">
            <Slider
              value={[questionCount]}
              min={10}
              max={limited ? maxLimitedQuestions : 60}
              step={5}
              onValueChange={(values) => onQuestionCountChange(values[0])}
              className="mx-2"
            />
            <div className="flex justify-between">
              <span>10</span>
              <span className="font-medium">
                {questionCount} {language === 'id' ? 'pertanyaan' : 'questions'}
              </span>
              <span>{limited ? maxLimitedQuestions : 60}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <Button onClick={onStartQuiz} className="bg-eduPurple hover:bg-eduPurple-dark">
            <PencilRuler className="mr-2 h-4 w-4" />
            {hasSavedProgress 
              ? (language === 'id' ? 'Mulai Kuis Baru' : 'Start New Quiz') 
              : (language === 'id' ? 'Mulai Kuis' : 'Start Quiz')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizSetup;
