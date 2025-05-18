import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from "@/components/ui/slider"
import { Circle, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { studentProgressService } from '@/services/studentProgressService';
import { useStudentProfile } from '@/contexts/StudentProfileContext';

interface LessonState {
  subject: string;
  topic: string;
  gradeLevel: string;
  studentId?: string;
}

const LessonTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { selectedProfile } = useStudentProfile();
  
  const [starsEarned, setStarsEarned] = useState(0);
  const [lessonProgress, setLessonProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const lessonState = location.state as LessonState;
  const { subject, topic, gradeLevel } = lessonState || { subject: '', topic: '', gradeLevel: '' };
  const studentId = selectedProfile?.id;
  
  useEffect(() => {
    if (!lessonState) {
      // Redirect to home if lesson state is not available
      navigate('/');
    }
  }, [lessonState, navigate]);
  
  const handleProgressChange = (value: number[]) => {
    setLessonProgress(value[0]);
  };
  
  const handleStarsChange = (value: number[]) => {
    setStarsEarned(value[0]);
  };
  
  const handleLessonCompleted = useCallback(() => {
    if (!studentId || !subject || !topic) return;
    
    const activityData = {
      student_id: studentId,
      activity_type: 'lesson',
      subject,
      topic,
      completed: true,
      progress: 100,
      stars_earned: starsEarned
    };
    
    studentProgressService.recordActivity(activityData)
      .then((result) => {
        if (result) {
          console.log("Lesson completion recorded successfully");
          toast.success(language === 'id' ? 'Pelajaran selesai!' : 'Lesson completed!');
        } else {
          console.error("Failed to record lesson completion");
        }
      })
      .catch((error) => {
        console.error("Error recording lesson completion:", error);
      });
  }, [studentId, subject, topic, starsEarned, language]);
  
  const handleFinishLesson = () => {
    handleLessonCompleted();
    navigate('/dashboard');
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {language === 'id' ? 'Lacak Pelajaran' : 'Track Lesson'}
          </CardTitle>
          <CardDescription>
            {language === 'id' ? 'Lacak progres dan bintang yang diperoleh dalam pelajaran ini' : 'Track progress and stars earned in this lesson'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {language === 'id' ? 'Subjek' : 'Subject'}: {subject}
            </h3>
            <h3 className="text-lg font-semibold">
              {language === 'id' ? 'Topik' : 'Topic'}: {topic}
            </h3>
            <h3 className="text-lg font-semibold">
              {language === 'id' ? 'Tingkat Kelas' : 'Grade Level'}: {gradeLevel}
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="lesson-progress" className="text-sm font-medium">
                  {language === 'id' ? 'Progres Pelajaran' : 'Lesson Progress'} ({lessonProgress}%)
                </label>
                <Circle className="h-4 w-4 text-gray-500" />
              </div>
              <Slider
                id="lesson-progress"
                defaultValue={[0]}
                max={100}
                step={1}
                aria-label="Lesson progress"
                value={[lessonProgress]}
                onValueChange={handleProgressChange}
                className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="stars-earned" className="text-sm font-medium">
                  {language === 'id' ? 'Bintang yang Diperoleh' : 'Stars Earned'} ({starsEarned})
                </label>
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
              <Slider
                id="stars-earned"
                defaultValue={[0]}
                max={5}
                step={1}
                aria-label="Stars earned"
                value={[starsEarned]}
                onValueChange={handleStarsChange}
                className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              />
            </div>
          </div>
          
          <Button className="w-full bg-eduPurple hover:bg-eduPurple-dark" onClick={handleFinishLesson}>
            {language === 'id' ? 'Selesaikan Pelajaran' : 'Finish Lesson'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonTracking;

