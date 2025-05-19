
import { useState, useEffect } from 'react';
import LearningContent from './LearningContent';
import LessonTracking from '@/components/LessonTracking';
import { supabase } from '@/integrations/supabase/client';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface LearningContentWrapperProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onReset: () => void;
  onQuizComplete?: (score: number) => void;
  recommendationId?: string;
}

const LearningContentWrapper = ({
  subject,
  gradeLevel,
  topic,
  activeTab,
  onTabChange,
  onReset,
  onQuizComplete,
  recommendationId
}: LearningContentWrapperProps) => {
  const { language } = useLanguage();
  const { selectedProfile } = useStudentProfile();
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [studentId, setStudentId] = useState<string | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get student ID from URL or state and check for existing progress
  useEffect(() => {
    const checkProgress = async () => {
      // Get student from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const studentIdFromUrl = urlParams.get('studentId');
      
      // Get student ID from selected profile or URL
      const effectiveStudentId = selectedProfile?.id || studentIdFromUrl || undefined;
      setStudentId(effectiveStudentId);
      
      if (effectiveStudentId) {
        // Check if there's existing progress
        try {
          const { data: activities, error } = await supabase
            .from('learning_activities')
            .select('*')
            .eq('student_id', effectiveStudentId)
            .eq('subject', subject)
            .eq('topic', topic)
            .eq('completed', true);
            
          if (error) {
            console.error('Error fetching learning activities:', error);
            return;
          }
            
          if (activities && activities.length > 0) {
            setIsComplete(true);
            setProgress(100);
          }
        } catch (error) {
          console.error('Error in checkProgress:', error);
        }
      }
      
      setIsInitialized(true);
    };
    
    checkProgress();
  }, [subject, topic, selectedProfile]);
  
  // Update tracking information when tabs change
  useEffect(() => {
    if (!isInitialized) return;
    
    if (activeTab === 'quiz' && !isComplete) {
      setProgress(75); // When user reaches quiz tab
    } else if (activeTab === 'game' && !isComplete) {
      setProgress(50); // When user reaches game tab
    } else if (!isComplete) {
      setProgress(25); // Just started the lesson
    }
  }, [activeTab, isComplete, isInitialized]);
  
  // Handle lesson completion
  const handleLessonComplete = () => {
    setIsComplete(true);
    setProgress(100);
    
    // Record in supabase if we have a student ID
    if (studentId) {
      supabase.from('learning_activities').insert({
        student_id: studentId,
        activity_type: 'learning_path_completed',
        subject: subject,
        topic: topic,
        progress: 100,
        completed: true,
        last_interaction_at: new Date().toISOString() // Convert Date to ISO string
      }).then(({ error }) => {
        if (error) {
          console.error('Error recording learning activity:', error);
          toast.error(language === 'id' 
            ? 'Gagal menyimpan progress pembelajaran' 
            : 'Failed to save learning progress');
        }
      });
    } else {
      console.log('No student ID available, progress will not be saved');
    }
  };
  
  // Handle quiz completion with updated tracking
  const handleQuizComplete = (score: number) => {
    if (onQuizComplete) {
      onQuizComplete(score);
    }
    // Mark lesson as complete after taking the quiz
    handleLessonComplete();
  };
  
  return (
    <>
      <LessonTracking 
        lessonSubject={subject}
        lessonTopic={topic}
        lessonGradeLevel={gradeLevel}
        isComplete={isComplete}
        progress={progress}
      />
      <LearningContent 
        subject={subject}
        gradeLevel={gradeLevel}
        topic={topic}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onReset={onReset}
        onQuizComplete={handleQuizComplete}
        recommendationId={recommendationId}
      />
    </>
  );
};

export default LearningContentWrapper;
