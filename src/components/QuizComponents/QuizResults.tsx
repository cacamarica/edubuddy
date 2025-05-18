import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, CheckCircle, Award, RotateCcw } from 'lucide-react';
import { QuizQuestion } from './QuizQuestionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { studentProgressService } from '@/services/studentProgressService';
import { badgeService } from '@/services/badgeService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { playSound } from '@/utils/SoundEffects';
import Badge from '@/components/Badge';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Ensure score doesn't exceed total questions
  const validatedScore = Math.min(score, totalQuestions);
  
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
          score: validatedScore, // Use validated score
          max_score: totalQuestions,
          percentage: totalQuestions > 0 ? Math.round((validatedScore / totalQuestions) * 100) : 0
        });
        
        // Record learning activity
        await studentProgressService.recordActivity({
          student_id: student.id,
          activity_type: 'quiz',
          subject,
          topic,
          completed: true,
          progress: 100,
          stars_earned: validatedScore, // Use validated score
          last_interaction_at: new Date().toISOString()
        });
          console.log('Quiz results saved to database');
        
        // Award badges based on performance
        // 1. First Quiz Badge
        await badgeService.checkAndAwardBadges({
          studentId: student.id,
          badgeType: "quiz_completion_first"
        });
        
        // 2. Subject-specific Quiz Badge
        await badgeService.checkAndAwardBadges({
          studentId: student.id,
          badgeType: "quiz_completion_5",
          subject
        });
        
        // 3. Perfect Score Badge
        if (validatedScore === totalQuestions) {
          await badgeService.checkAndAwardBadges({
            studentId: student.id,
            badgeType: "quiz_perfect_score",
            score: validatedScore,
            totalQuestions
          });
        }
      } catch (error) {
        console.error('Error saving quiz results:', error);
      }
    };
    
    saveQuizResults();
    
    // Play celebration sound on component mount
    if (audioRef.current) {
      audioRef.current.volume = 0.5; // Set volume to 50%
      audioRef.current.play().catch(err => {
        console.log("Audio autoplay was prevented:", err);
        // We'll let the user know they can click to celebrate
        toast.info(t('quiz.clickToCelebrate'), {
          action: {
            label: t('quiz.celebrate'),
            onClick: () => audioRef.current?.play(),
          },
        });
      });
    }
  }, [validatedScore, totalQuestions, subject, topic, user, t]);
  
  // Get the badge images based on performance
  const getBadgeImageUrl = (performance: 'excellent' | 'good' | 'try-again') => {
    // Default badge URLs using DiceBear API, can be replaced with actual badge images
    switch(performance) {
      case 'excellent':
        return `https://api.dicebear.com/7.x/shapes/svg?seed=excellence-${subject.toLowerCase()}&backgroundColor=fef3c7`;
      case 'good':
        return `https://api.dicebear.com/7.x/shapes/svg?seed=good-${subject.toLowerCase()}&backgroundColor=d1fae5`;
      default:
        return `https://api.dicebear.com/7.x/shapes/svg?seed=practice-${subject.toLowerCase()}&backgroundColor=e0e7ff`;
    }
  };
  
  // Determine performance level
  const performanceLevel = 
    validatedScore >= totalQuestions * 0.8 ? 'excellent' :
    validatedScore >= totalQuestions * 0.6 ? 'good' : 'try-again';
  
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
          {validatedScore >= totalQuestions * 0.8 ? (
            <div className="h-24 w-24 rounded-full bg-yellow-100 flex items-center justify-center">
              <Star className="h-16 w-16 text-yellow-500 fill-yellow-500" />
            </div>
          ) : validatedScore >= totalQuestions * 0.6 ? (
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
              {validatedScore} / {totalQuestions}
            </p>
            <p className="text-muted-foreground">
              {validatedScore >= totalQuestions * 0.8
                ? t('quiz.amazing')
                : validatedScore >= totalQuestions * 0.6
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
              <p className="text-sm font-medium mt-1">{validatedScore} {t('quiz.stars')}</p>
            </div>
            
            {validatedScore >= totalQuestions * 0.8 && (
              <div className="flex flex-col items-center">
                <div className="badge h-12 w-12 overflow-hidden rounded-full">
                  <img 
                    src={getBadgeImageUrl('excellent')} 
                    alt={`${subject} ${t('quiz.badge')}`}
                    className="w-full h-full object-cover" 
                  />
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
      
      {/* Audio element for celebration sound */}
      <audio 
        ref={audioRef}
        src="https://cdn.freesound.org/previews/536/536782_11861866-lq.mp3" 
        preload="auto"
        className="hidden"
      />
    </Card>
  );
};

export default QuizResults;
