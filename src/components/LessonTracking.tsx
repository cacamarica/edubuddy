import React, { useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useStudentProfile } from '@/contexts/StudentProfileContext';

interface LessonTrackingProps {
  lessonSubject: string;
  lessonTopic: string;
  lessonGradeLevel: 'k-3' | '4-6' | '7-9';
  isComplete: boolean;
  progress: number;
}

const LessonTracking: React.FC<LessonTrackingProps> = ({
  lessonSubject,
  lessonTopic,
  lessonGradeLevel,
  isComplete,
  progress
}) => {
  const { user } = useAuth();
  const { selectedProfile } = useStudentProfile();
  
  // Track lesson progress in the database
  useEffect(() => {
    const trackProgress = async () => {
      // Only track progress for logged-in users with a selected student profile
      if (!user || !selectedProfile?.id) return;
      
      try {
        // Check if we already have a record for this lesson
        const { data: existingData, error: fetchError } = await supabase
          .from('learning_activities')
          .select('id, progress')
          .eq('student_id', selectedProfile.id)
          .eq('subject', lessonSubject)
          .eq('topic', lessonTopic)
          .eq('completed', false)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (fetchError) throw fetchError;
        
        const now = new Date().toISOString();
        
        if (existingData && existingData.length > 0) {
          // Update existing record if progress has increased
          const existingRecord = existingData[0];
          if (progress > existingRecord.progress || isComplete) {
            await supabase
              .from('learning_activities')
              .update({
                progress: progress,
                completed: isComplete,
                last_interaction_at: now,
                completed_at: isComplete ? now : null
              })
              .eq('id', existingRecord.id);
          }
        } else {
          // Create new record
          await supabase
            .from('learning_activities')
            .insert([{
              student_id: selectedProfile.id,
              subject: lessonSubject,
              topic: lessonTopic,
              grade_level: lessonGradeLevel,
              activity_type: 'lesson',
              progress: progress,
              completed: isComplete,
              started_at: now,
              last_interaction_at: now,
              completed_at: isComplete ? now : null
            }]);
        }
      } catch (error) {
        console.error('Error tracking lesson progress:', error);
      }
    };
    
    trackProgress();
  }, [user, selectedProfile?.id, lessonSubject, lessonTopic, lessonGradeLevel, progress, isComplete]);
  
  return (
    <div className="w-full mb-6">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium">
          {isComplete ? 'Lesson Complete!' : 'Lesson Progress'}
        </div>
        <div className="text-sm text-muted-foreground">
          {progress}%
        </div>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

export default LessonTracking;
