
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { studentProgressService } from '@/services/studentProgressService';
import { supabase } from '@/integrations/supabase/client';

interface LessonTrackingProps {
  subject: string;
  topic: string;
  gradeLevel: string;
  isComplete: boolean;
  progress: number;
}

const LessonTracking = ({ subject, topic, gradeLevel, isComplete, progress }: LessonTrackingProps) => {
  const { user } = useAuth();
  
  useEffect(() => {
    const trackLessonActivity = async () => {
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
        
        // Record learning activity
        await studentProgressService.recordActivity({
          student_id: student.id,
          activity_type: 'lesson',
          subject,
          topic,
          completed: isComplete,
          progress: progress,
          stars_earned: isComplete ? 5 : Math.floor(progress / 20), // Award stars based on progress
          completed_at: isComplete ? new Date().toISOString() : null
        });
        
        console.log('Lesson activity tracked:', { subject, topic, progress, isComplete });
      } catch (error) {
        console.error('Error tracking lesson activity:', error);
      }
    };
    
    trackLessonActivity();
  }, [user, subject, topic, gradeLevel, isComplete, progress]);
  
  // This is a tracking component that doesn't render anything visible
  return null;
};

export default LessonTracking;
