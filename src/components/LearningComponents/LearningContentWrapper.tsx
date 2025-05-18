
import { useState, useEffect } from 'react';
import LearningContent from './LearningContent';
import LessonTracking from '@/components/LessonTracking';

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
  
  // Update tracking information when tabs change
  useEffect(() => {
    if (activeTab === 'quiz' && !isComplete) {
      setProgress(75); // When user reaches quiz tab
    } else if (activeTab === 'activity' && !isComplete) {
      setProgress(50); // When user reaches activity tab
    } else if (!isComplete) {
      setProgress(25); // Just started the lesson
    }
  }, [activeTab, isComplete]);
  
  // Handle lesson completion
  const handleLessonComplete = () => {
    setIsComplete(true);
    setProgress(100);
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
        subject={subject}
        topic={topic}
        gradeLevel={gradeLevel}
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
