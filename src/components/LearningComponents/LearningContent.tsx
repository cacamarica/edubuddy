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
  onComplete?: () => void; // Add onComplete prop
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
  student,
  onComplete
}) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // State for progress limitation and student info
  const [showLimitedFeatureAlert, setShowLimitedFeatureAlert] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
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
      setShowLimitedFeatureAlert(true);
    }
  }, [user]);

  // Use student's grade level if available
  const effectiveGradeLevel = studentInfo?.gradeLevel || gradeLevel;
  const studentId = studentInfo?.id || (student ? student.id : '');
  
  // Handle tab changes and track progress
  const handleTabChange = (value: string) => {
    onTabChange(value);
    if (value === "quiz" && !quizCompleted) {
      // Track that user has moved to quiz
      trackProgress("quiz_viewed");
    } else if (value === "game") {
      // Track that user has moved to game
      trackProgress("game_viewed");
    }
  };

  // Track user progress
  const trackProgress = async (activityType: string) => {
    if (!studentId || !user) return;
    const now = new Date().toISOString();
    try {
      await supabase.from('learning_activities').insert([{
        student_id: studentId,
        activity_type: activityType,
        subject: subject || '',
        topic: topic || '',
        progress: activityType === "lesson_completed" ? 100 : 50,
        completed: activityType.includes("completed"),
        started_at: now,
        last_interaction_at: now,
        grade_level: effectiveGradeLevel || 'k-3'
      }]);
    } catch (error) {
      console.error("Error tracking progress:", error);
    }
  };

  // Handle lesson completion
  const handleLessonComplete = () => {
    setLessonCompleted(true);
    trackProgress("lesson_completed");
    // Notify parent component
    if (onComplete) {
      onComplete();
    }
  };

  // Handle quiz completion
  const handleQuizComplete = (score: number) => {
    setQuizCompleted(true);
    trackProgress("quiz_completed");
    onQuizComplete(score);
  };
  
  // Only render content for the current tab
  let content: React.ReactNode = null;
  if (activeTab === 'lesson') {
    content = (
      <AILesson
        subject={subject}
        gradeLevel={effectiveGradeLevel}
        topic={topic}
        studentId={studentId}
        recommendationId={recommendationId}
        onComplete={handleLessonComplete}
      />
    );
  } else if (activeTab === 'quiz') {
    content = (
      <AIQuiz
        subject={subject}
        gradeLevel={effectiveGradeLevel}
        topic={topic}
        onComplete={handleQuizComplete}
        limitProgress={!user}
        studentId={studentId}
        recommendationId={recommendationId}
      />
    );
  } else if (activeTab === 'game') {
    content = (
      <AIGame
        subject={subject}
        gradeLevel={effectiveGradeLevel}
        topic={topic}
        limitProgress={!user}
        studentId={studentId}
        recommendationId={recommendationId}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold">
            {t('learning.learningAbout') || 'Learning about'} {topic} <span className="text-muted-foreground">({subject})</span>
          </h2>
          {studentInfo && (
            <p className="text-sm text-eduPurple mt-1">
              {t('topic.personalizedFor') || 'Personalized for'} {studentInfo.name} ({studentInfo.age} {t('topic.years') || 'years'}, {t('topic.grade') || 'Grade'} {studentInfo.gradeLevel})
            </p>
          )}
        </div>
        {/* Only show reset button if lesson has started or there's progress */}
        {activeTab === 'lesson' && lessonCompleted && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReset}
          >
            {t('lesson.newLesson') || 'New Lesson'}
          </Button>
        )}
      </div>
      
      {showLimitedFeatureAlert && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-medium text-yellow-800">{t('learning.limitedAccessWarning') || 'Limited Access'}</span>
              <p className="text-yellow-700">{t('learning.limitedAccessDescription') || 'Sign in to save your progress and access all features.'}</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/auth', { state: { action: 'signin' } })} className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              {t('auth.signIn') || 'Sign In'}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs 
        defaultValue={activeTab} 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="mb-6"
      >
        <div className="border-b mb-4">
          <TabsList className="w-full rounded-none bg-transparent h-auto p-0 justify-start mb-[-1px]">
            <TabsTrigger 
              value="lesson" 
              className="flex items-center gap-2 px-5 py-3 rounded-t-lg border-b-2 border-transparent data-[state=active]:border-eduPurple data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:text-eduPurple mb-[-1px]"
            >
              <BookOpen className="h-4 w-4" />
              {t('learning.tabLesson') || 'Lesson'}
            </TabsTrigger>
            <TabsTrigger 
              value="quiz" 
              className="flex items-center gap-2 px-5 py-3 rounded-t-lg border-b-2 border-transparent data-[state=active]:border-eduPurple data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:text-eduPurple mb-[-1px]"
            >
              <PencilRuler className="h-4 w-4" />
              {t('learning.tabQuiz') || 'Quiz'}
            </TabsTrigger>
            <TabsTrigger 
              value="game" 
              className="flex items-center gap-2 px-5 py-3 rounded-t-lg border-b-2 border-transparent data-[state=active]:border-eduPurple data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:text-eduPurple mb-[-1px]"
            >
              <Gamepad className="h-4 w-4" />
              {t('learning.tabGame') || 'Game'}
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value={activeTab} className="m-0 p-0">
          {content}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearningContent;
