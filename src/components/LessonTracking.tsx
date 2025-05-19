import React, { useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { supabase } from '@/integrations/supabase/client';

interface LessonTrackingProps {
  lessonSubject: string;
  lessonTopic: string;
  lessonGradeLevel: string;
  progress: number;
  isComplete: boolean;
  lessonId?: string;
}

const LessonTracking: React.FC<LessonTrackingProps> = ({
  lessonSubject,
  lessonTopic,
  lessonGradeLevel,
  progress,
  isComplete,
  lessonId
}) => {
  const { user } = useAuth();
  const { selectedProfile } = useStudentProfile();

  useEffect(() => {
    const trackProgress = async () => {
      if (!user || !selectedProfile?.id) {
        console.log('No user or selected profile, skipping progress tracking');
        return;
      }

      try {
        console.log('Tracking progress:', {
          studentId: selectedProfile.id,
          subject: lessonSubject,
          topic: lessonTopic,
          progress,
          isComplete,
          lessonId
        });

        const now = new Date().toISOString();
        
        // Check for existing record
        const { data: existingData, error: fetchError } = await supabase
          .from('learning_activities')
          .select('*')
          .eq('student_id', selectedProfile.id)
          .eq('subject', lessonSubject)
          .eq('topic', lessonTopic)
          .eq('activity_type', 'lesson')
          .order('last_interaction_at', { ascending: false })
          .limit(1);
        
        if (fetchError) {
          console.error('Error fetching existing record:', fetchError);
          return;
        }
        
        if (existingData && existingData.length > 0) {
          // Update existing record if progress has increased
          const existingRecord = existingData[0];
          const existingProgress = existingRecord.progress || 0;
          console.log('Found existing record:', {
            id: existingRecord.id,
            existingProgress,
            newProgress: progress
          });

          if (progress > existingProgress || isComplete) {
            const { error: updateError } = await supabase
              .from('learning_activities')
              .update({
                progress: progress,
                completed: isComplete,
                last_interaction_at: now,
                completed_at: isComplete ? now : null,
                lesson_id: lessonId || null,
                grade_level: lessonGradeLevel
              })
              .eq('id', existingRecord.id);

            if (updateError) {
              console.error('Error updating record:', updateError);
            } else {
              console.log('Successfully updated progress record');
            }
          } else {
            console.log('Progress not increased, skipping update');
          }
        } else {
          console.log('No existing record found, creating new record');
          // Create new record
          const { error: insertError } = await supabase
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
              completed_at: isComplete ? now : null,
              lesson_id: lessonId || null
            }]);

          if (insertError) {
            console.error('Error creating new record:', insertError);
          } else {
            console.log('Successfully created new progress record');
          }
        }
      } catch (error) {
        console.error('Error tracking lesson progress:', error);
      }
    };
    
    trackProgress();
  }, [user, selectedProfile?.id, lessonSubject, lessonTopic, lessonGradeLevel, progress, isComplete, lessonId]);
  
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
