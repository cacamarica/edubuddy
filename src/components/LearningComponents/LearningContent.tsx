
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BookOpen, PencilRuler, Gamepad, LogIn } from 'lucide-react';
import AILesson from '../AILesson';
import AIQuiz from '../AIQuiz';
import AIGame from '../AIGame';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';

interface LearningContentProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onReset: () => void;
  onQuizComplete: (score: number) => void;
}

const LearningContent: React.FC<LearningContentProps> = ({
  subject,
  gradeLevel,
  topic,
  activeTab,
  onTabChange,
  onReset,
  onQuizComplete,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // State for progress limitation
  const [showLimitedContentWarning, setShowLimitedContentWarning] = useState(false);
  
  // Show warning if user is not logged in
  useEffect(() => {
    if (!user) {
      setShowLimitedContentWarning(true);
    }
  }, [user]);

  // Get student ID from URL or state for passing to the AILesson component
  const getStudentId = () => {
    const studentId = searchParams.get('studentId') || 
                     (location.state && location.state.studentId) || 
                     '';
    return studentId;
  };
  
  const translations = {
    learningAbout: language === 'id' ? 'Belajar Tentang' : 'Learning About',
    newTopic: language === 'id' ? 'Topik Baru' : 'New Topic',
    lesson: language === 'id' ? 'Pelajaran' : 'Lesson',
    quiz: language === 'id' ? 'Kuis' : 'Quiz',
    game: language === 'id' ? 'Permainan' : 'Game',
    recommendedNextSteps: language === 'id' ? 'Langkah Selanjutnya yang Direkomendasikan' : 'Recommended Next Steps',
    startLesson: language === 'id' ? 'Mulai Pelajaran' : 'Start Lesson',
    limitedAccessWarning: language === 'id' ? 'Akses Terbatas' : 'Limited Access',
    limitedAccessDescription: language === 'id' 
      ? 'Anda hanya dapat mengakses 30% konten. Masuk untuk mengakses semua konten.'
      : 'You can only access 30% of content. Sign in to unlock all content.',
    signIn: language === 'id' ? 'Masuk' : 'Sign In'
  };
  
  const handleSignIn = () => {
    navigate('/auth', { state: { action: 'signin' } });
  };
  
  // Set the URL parameters to include the student ID
  useEffect(() => {
    const studentId = getStudentId();
    if (studentId) {
      // Update URL with student ID if not already present
      if (!searchParams.has('studentId')) {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('studentId', studentId);
        navigate({
          pathname: location.pathname,
          search: newSearchParams.toString()
        }, { replace: true });
      }
    }
  }, [location, navigate, searchParams]);
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">
          {translations.learningAbout} {topic} <span className="text-muted-foreground">({subject})</span>
        </h2>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={onReset}
        >
          {translations.newTopic}
        </Button>
      </div>
      
      {showLimitedContentWarning && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-medium text-yellow-800">{translations.limitedAccessWarning}</span>
              <p className="text-yellow-700">{translations.limitedAccessDescription}</p>
            </div>
            <Button variant="outline" onClick={handleSignIn} className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              {translations.signIn}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lesson" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">{translations.lesson}</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-2">
            <PencilRuler className="h-4 w-4" />
            <span className="hidden sm:inline">{translations.quiz}</span>
          </TabsTrigger>
          <TabsTrigger value="game" className="flex items-center gap-2">
            <Gamepad className="h-4 w-4" />
            <span className="hidden sm:inline">{translations.game}</span>
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="lesson">
            <AILesson 
              subject={subject} 
              gradeLevel={gradeLevel} 
              topic={topic}
              limitProgress={!user}
            />
          </TabsContent>
          <TabsContent value="quiz">
            <AIQuiz 
              subject={subject} 
              gradeLevel={gradeLevel} 
              topic={topic}
              onComplete={(score) => onQuizComplete(score)}
              limitProgress={!user}
            />
          </TabsContent>
          <TabsContent value="game">
            <AIGame 
              subject={subject} 
              gradeLevel={gradeLevel} 
              topic={topic}
              limitProgress={!user}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default LearningContent;
