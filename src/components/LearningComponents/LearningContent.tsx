
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
import { supabase } from '@/integrations/supabase/client';

export interface LearningContentProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onReset: () => void;
  onQuizComplete: (score: number) => void;
  recommendationId?: string; // Add recommendationId to track source
  student?: any; // Allow passing student object
}

interface StudentInfo {
  id: string;
  name: string;
  age: number;
  gradeLevel: 'k-3' | '4-6' | '7-9';
}

const LearningContent: React.FC<LearningContentProps> = ({
  subject,
  gradeLevel,
  topic,
  activeTab,
  onTabChange,
  onReset,
  onQuizComplete,
  recommendationId,
  student
}) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // State for progress limitation and student info
  const [showLimitedContentWarning, setShowLimitedContentWarning] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  
  // Get student ID from URL or state
  const getStudentId = () => {
    return searchParams.get('studentId') || 
           (location.state && location.state.studentId) || 
           '';
  };

  // Fetch student information if studentId is provided
  useEffect(() => {
    const fetchStudentInfo = async () => {
      const studentId = getStudentId();
      
      if (studentId) {
        const { data, error } = await supabase
          .from('students')
          .select('id, name, age, grade_level')
          .eq('id', studentId)
          .single();
          
        if (!error && data) {
          setStudentInfo({
            id: data.id,
            name: data.name,
            age: data.age || 6,
            gradeLevel: data.grade_level as 'k-3' | '4-6' | '7-9'
          });
        }
      }
    };
    
    fetchStudentInfo();
  }, [searchParams]);

  // Show warning if user is not logged in
  useEffect(() => {
    if (!user) {
      setShowLimitedContentWarning(true);
    }
  }, [user]);

  // Use student's grade level if available
  const effectiveGradeLevel = studentInfo?.gradeLevel || gradeLevel;
  const studentId = studentInfo?.id || (student ? student.id : '');
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold">
            {t('learning.learningAbout')} {topic} <span className="text-muted-foreground">({subject})</span>
          </h2>
          {studentInfo && (
            <p className="text-sm text-eduPurple mt-1">
              {t('topic.personalizedFor')} {studentInfo.name} ({studentInfo.age} {t('topic.years')}, {t('topic.grade')} {studentInfo.gradeLevel})
            </p>
          )}
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={onReset}
        >
          {t('learning.newTopic')}
        </Button>
      </div>
      
      {showLimitedContentWarning && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-medium text-yellow-800">{t('learning.limitedAccessWarning')}</span>
              <p className="text-yellow-700">{t('learning.limitedAccessDescription')}</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/auth', { state: { action: 'signin' } })} className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              {t('auth.signIn')}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lesson" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">{t('lesson')}</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-2">
            <PencilRuler className="h-4 w-4" />
            <span className="hidden sm:inline">{t('quiz')}</span>
          </TabsTrigger>
          <TabsTrigger value="game" className="flex items-center gap-2">
            <Gamepad className="h-4 w-4" />
            <span className="hidden sm:inline">{t('game')}</span>
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="lesson">
            <AILesson 
              subject={subject} 
              gradeLevel={effectiveGradeLevel} 
              topic={topic}
              limitProgress={!user}
              studentId={studentId}
              recommendationId={recommendationId}
            />
          </TabsContent>
          <TabsContent value="quiz">
            <AIQuiz 
              subject={subject} 
              gradeLevel={effectiveGradeLevel} 
              topic={topic}
              onComplete={(score) => onQuizComplete(score)}
              limitProgress={!user}
              studentId={studentId}
              recommendationId={recommendationId}
            />
          </TabsContent>
          <TabsContent value="game">
            <AIGame 
              subject={subject} 
              gradeLevel={effectiveGradeLevel} 
              topic={topic}
              limitProgress={!user}
              studentId={studentId}
              recommendationId={recommendationId}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default LearningContent;
