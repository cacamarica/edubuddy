import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, CheckCircle, Award, RotateCcw } from 'lucide-react';
import { QuizQuestion } from './QuizQuestionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { studentProgressService } from '@/services/studentProgressService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client'; // Add this import

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  subject: string;
  topic: string;
  questions: QuizQuestion[];
  answers: (number | null)[];
  onRestartQuiz: () => void;
  onNewQuiz: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  score,
  totalQuestions,
  subject,
  topic,
  questions,
  answers,
  onRestartQuiz,
  onNewQuiz,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // Save quiz results to database when completed
  useEffect(() => {
    const saveQuizResults = async () => {
      // Only save if user is logged in
      if (!user) return;
      
      try {
        // Get the current student
        const { data: students } = await supabase
          .from('students')
          .select('*')
          .eq('parent_id', user.id)
          .limit(1);
          
        if (!students || students.length === 0) return;
        const student = students[0];
        
        // Record quiz score
        await studentProgressService.recordQuizScore({
          student_id: student.id,
          subject,
          topic,
          score,
          max_score: totalQuestions,
          percentage: Math.round((score / totalQuestions) * 100)
        });
        
        // Record learning activity
        await studentProgressService.recordActivity({
          student_id: student.id,
          activity_type: 'quiz',
          subject,
          topic,
          completed: true,
          progress: 100,
          stars_earned: score,
          completed_at: new Date().toISOString()
        });
        
        console.log('Quiz results saved to database');
      } catch (error) {
        console.error('Error saving quiz results:', error);
      }
    };
    
    saveQuizResults();
  }, [score, totalQuestions, subject, topic, user]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl md:text-3xl font-display">
          {t('quiz.complete')}
        </CardTitle>
        <CardDescription>
          {t('quiz.completed')}
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
                ? t('quiz.amazing')
                : score >= totalQuestions * 0.6
                  ? t('quiz.great')
                  : t('quiz.good')}
            </p>
          </div>
        </div>
        
        <div className="grid gap-2">
          <h3 className="text-lg font-semibold">{t('quiz.earned')}</h3>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex flex-col items-center">
              <div className="badge h-12 w-12 bg-eduPurple text-white flex items-center justify-center rounded-full">
                <Star className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium mt-1">{score} {t('quiz.stars')}</p>
            </div>
            
            {score >= totalQuestions * 0.8 && (
              <div className="flex flex-col items-center">
                <div className="badge h-12 w-12 bg-eduPurple text-white flex items-center justify-center rounded-full">
                  <Award className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium mt-1">{subject} {t('quiz.badge')}</p>
              </div>
            )}
          </div>
        </div>
        
        {answers.some((answer, index) => answer !== questions[index]?.correctAnswer) && (
          <div className="bg-eduPastel-blue p-4 rounded-lg">
            <h3 className="font-semibold mb-2">{t('quiz.review')}</h3>
            <ul className="list-disc pl-5 space-y-1">
              {answers.map((answer, index) => {
                const question = questions[index];
                if (question && answer !== question.correctAnswer) {
                  return (
                    <li key={index}>
                      <span className="font-medium">{question.question}</span>
                      <p className="text-sm text-muted-foreground">
                        {t('quiz.correctAnswer')} {question.options[question.correctAnswer]}
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
          {t('quiz.tryAgain')}
        </Button>
        <Button
          className="bg-eduPurple hover:bg-eduPurple-dark"
          onClick={onNewQuiz}
        >
          {t('quiz.newQuiz')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizResults;
