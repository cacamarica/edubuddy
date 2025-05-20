import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ArrowLeftCircle, CheckCircle2, PartyPopper } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { studentProgressService } from '@/services/studentProgressService';
import { toast } from 'sonner';
import { useConfettiStore } from '@/stores/ConfettiStore';
import { badgeService } from '@/services/badgeService';

interface LocationState {
  studentId: string;
  subject: string;
  topic: string;
  correctAnswers: number;
  totalQuestions: number;
}

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  subject: string;
  topic: string;
  questions: any[];
  answers: (number | null)[];
  onRestartQuiz: () => void;
  onNewQuiz: () => void;
}

const QuizResults: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { studentId, subject, topic, correctAnswers, totalQuestions } = location.state as LocationState;
  const { user } = useAuth();
  const { language } = useLanguage();
  const { launch } = useConfettiStore();
  
  const [starsEarned, setStarsEarned] = useState(0);
  const [isPerfectScore, setIsPerfectScore] = useState(false);
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Calculate stars earned based on the score
    const scorePercentage = (correctAnswers / totalQuestions) * 100;
    let earnedStars = 0;
    
    if (scorePercentage >= 90) {
      earnedStars = 5;
    } else if (scorePercentage >= 75) {
      earnedStars = 4;
    } else if (scorePercentage >= 60) {
      earnedStars = 3;
    } else if (scorePercentage >= 40) {
      earnedStars = 2;
    } else if (scorePercentage >= 20) {
      earnedStars = 1;
    }
    
    setStarsEarned(earnedStars);
    setIsPerfectScore(scorePercentage === 100);
    
    // Launch confetti if it's a perfect score
    if (scorePercentage === 100) {
      launch();
    }
  }, [correctAnswers, totalQuestions, launch]);
  
  const checkCompletion = async () => {
    setIsLoading(true);
    try {
      const quizScores = await studentProgressService.getQuizScores(studentId);
      const completed = quizScores.some(score => score.subject === subject && score.topic === topic);
      setHasCompletedQuiz(completed);
    } catch (error) {
      console.error("Error checking quiz completion:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // Check if the student has completed this quiz before
    checkCompletion();
  }, [studentId, subject, topic]);
  
  const handleFinish = () => {
    if (studentId && subject && topic) {
      // Record the completed quiz activity
      studentProgressService.recordActivity({
        student_id: studentId,
        activity_type: 'quiz',
        subject: subject,
        topic: topic,
        completed: true,
        progress: 100,
        stars_earned: starsEarned
      });
      
      // Calculate the score percentage
      const scorePercentage = (correctAnswers / totalQuestions) * 100;
      
      // Record the quiz score
      studentProgressService.recordQuizScore({
        student_id: studentId,
        subject: subject,
        topic: topic,
        score: correctAnswers,
        max_score: totalQuestions,
        percentage: scorePercentage
      });
    }
    
    // Check if the student earned a badge for completing the quiz
    if (starsEarned === 5) {
      // Award a badge for perfect score
      badgeService.fetchStudentBadges(studentId).then(existingBadges => {
        const hasPerfectScoreBadge = existingBadges.some(badge => badge.badge?.name === 'Perfect Quiz Score');
        
        if (!hasPerfectScoreBadge) {
          // Award the badge to the student
          badgeService.awardBadge({
            studentId: studentId,
            name: 'Perfect Quiz Score',
            description: language === 'id' ? 
              'Mendapatkan skor sempurna dalam kuis!' : 
              'Achieved a perfect score on a quiz!',
            type: 'achievement',
            imageUrl: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=perfect-score'
          });
          toast.success(language === 'id' ? 
            'Selamat! Anda mendapatkan lencana karena mendapatkan skor sempurna!' : 
            'Congratulations! You earned a badge for getting a perfect score!');
        }
      });
    }
    
    navigate('/dashboard');
  };
  
  const handleRetry = () => {
    navigate('/quiz', {
      state: {
        studentId: studentId,
        subject: subject,
        topic: topic
      }
    });
  };
  
  return (
    <div className="container mx-auto mt-8">
      <Card className="max-w-md mx-auto">
        <CardHeader className="flex flex-col items-center space-y-2">
          <CardTitle className="text-2xl font-bold">
            {language === 'id' ? 'Hasil Kuis' : 'Quiz Results'}
          </CardTitle>
          <CardDescription>
            {language === 'id' ? 'Selamat telah menyelesaikan kuis!' : 'Congratulations on completing the quiz!'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center space-y-4">
          {isPerfectScore && (
            <div className="w-full flex justify-center">
              <PartyPopper className="h-12 w-12 text-yellow-500 animate-bounce" />
            </div>
          )}
          
          <div className="text-4xl font-bold">
            {correctAnswers} / {totalQuestions}
          </div>
          
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={`h-6 w-6 ${index < starsEarned ? 'text-yellow-500' : 'text-gray-300'}`}
              />
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground">
            {language === 'id'
              ? `Anda mendapatkan ${starsEarned} bintang!`
              : `You earned ${starsEarned} stars!`}
          </p>
          
          {isPerfectScore && (
            <Badge variant="outline" className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              {language === 'id' ? 'Skor Sempurna!' : 'Perfect Score!'}
            </Badge>
          )}
          
          {hasCompletedQuiz && (
            <Badge variant="destructive" className="gap-1.5">
              <ArrowLeftCircle className="h-4 w-4" />
              {language === 'id' ? 'Kuis ini sudah diselesaikan' : 'This quiz has already been completed'}
            </Badge>
          )}
          
          <div className="flex space-x-4">
            <Button onClick={handleFinish} className="bg-eduPurple hover:bg-eduPurple-dark">
              {language === 'id' ? 'Selesai' : 'Finish'}
            </Button>
            <Button variant="outline" onClick={handleRetry}>
              {language === 'id' ? 'Coba Lagi' : 'Retry'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizResults;
