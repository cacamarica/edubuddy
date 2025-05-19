
import { useState, useEffect } from 'react';
import LearningContent from './LearningContent';
import LessonTracking from '@/components/LessonTracking';
import { supabase } from '@/integrations/supabase/client';

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
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [studentId, setStudentId] = useState<string | undefined>(undefined);
  
  // Get student ID from URL or state and check for existing progress
  useEffect(() => {
    const checkProgress = async () => {
      // Get student from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const studentIdFromUrl = urlParams.get('studentId');
      
      if (studentIdFromUrl) {
        setStudentId(studentIdFromUrl);
        
        // Check if there's existing progress
        const { data: activities } = await supabase
          .from('learning_activities')
          .select('*')
          .eq('student_id', studentIdFromUrl)
          .eq('subject', subject)
          .eq('topic', topic)
          .eq('completed', true);
          
        if (activities && activities.length > 0) {
          setIsComplete(true);
          setProgress(100);
        }
      }
    };
    
    checkProgress();
  }, [subject, topic]);
  
  // Update tracking information when tabs change
  useEffect(() => {
    if (activeTab === 'quiz' && !isComplete) {
      setProgress(75); // When user reaches quiz tab
    } else if (activeTab === 'game' && !isComplete) {
      setProgress(50); // When user reaches game tab
    } else if (!isComplete) {
      setProgress(25); // Just started the lesson
    }
  }, [activeTab, isComplete]);
  
  // Handle lesson completion
  const handleLessonComplete = () => {
    setIsComplete(true);
    setProgress(100);
    
    // Record in supabase if we have a student ID
    if (studentId) {
      supabase.from('learning_activities').insert([{
        student_id: studentId,
        activity_type: 'learning_path_completed',
        subject: subject,
        topic: topic,
        progress: 100,
        completed: true
      }]);
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
