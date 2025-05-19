
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAIEducationContent } from '@/services/aiEducationService';
import LessonContent from '@/components/LessonContent';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AILessonProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  studentId?: string;
  limitProgress?: boolean;
  recommendationId?: string;
  onComplete?: () => void; // Add onComplete callback
}

const AILesson: React.FC<AILessonProps> = ({ 
  subject, 
  gradeLevel, 
  topic,
  studentId,
  limitProgress = false,
  recommendationId,
  onComplete
}) => {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [lessonContent, setLessonContent] = useState<any>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [lessonStarted, setLessonStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingNewContent, setLoadingNewContent] = useState(false);
  
  // Function to get lesson content from cached or new API call
  const fetchLessonContent = useCallback(async (refreshContent = false) => {
    setLoading(true);
    try {
      // First check if we have the lesson in supabase cache
      if (!refreshContent && studentId) {
        const { data: cachedLesson } = await supabase
          .from('lesson_materials')
          .select('*')
          .eq('subject', subject)
          .eq('topic', topic)
          .eq('grade_level', gradeLevel)
          .maybeSingle();
        
        if (cachedLesson) {
          setLessonContent({
            title: cachedLesson.title,
            introduction: cachedLesson.introduction,
            mainContent: cachedLesson.chapters,
            funFacts: cachedLesson.fun_facts,
            activity: cachedLesson.activity,
            conclusion: cachedLesson.conclusion,
            summary: cachedLesson.summary
          });
          
          // Check if we have lesson progress for this student
          if (studentId) {
            const { data: lessonProgress } = await supabase
              .from('lesson_progress')
              .select('current_chapter, is_completed')
              .eq('student_id', studentId)
              .eq('lesson_id', cachedLesson.id)
              .maybeSingle();
              
            if (lessonProgress) {
              setCurrentChapter(lessonProgress.current_chapter);
              
              // If the lesson was already completed, mark it as such
              if (lessonProgress.is_completed && onComplete) {
                onComplete();
              }
            }
          }
          
          setLoading(false);
          return;
        }
      }
      
      // If no cached lesson or refresh requested, call AI service
      const result = await getAIEducationContent({
        contentType: 'lesson',
        subject,
        gradeLevel,
        topic,
        language
      });
      
      if (result?.content) {
        setLessonContent(result.content);
        
        // Cache the lesson in supabase
        if (studentId) {
          const { data: insertedLesson } = await supabase
            .from('lesson_materials')
            .insert({
              subject,
              topic,
              grade_level: gradeLevel,
              title: result.content.title || topic,
              introduction: result.content.introduction || '',
              chapters: result.content.mainContent || [],
              fun_facts: result.content.funFacts || [],
              activity: result.content.activity || null,
              conclusion: result.content.conclusion || '',
              summary: result.content.summary || ''
            })
            .select()
            .single();
            
          // Create initial lesson progress record
          if (insertedLesson) {
            await supabase
              .from('lesson_progress')
              .insert({
                student_id: studentId,
                lesson_id: insertedLesson.id,
                current_chapter: 0,
                is_completed: false
              });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching lesson content:', error);
    } finally {
      setLoading(false);
    }
  }, [subject, gradeLevel, topic, language, studentId]);

  // Load initial content
  useEffect(() => {
    fetchLessonContent();
    
    // Mark recommendation as acted on if it exists
    if (recommendationId) {
      supabase
        .from('ai_recommendations')
        .update({ acted_on: true })
        .eq('id', recommendationId)
        .then(({ error }) => {
          if (error) console.error('Error updating recommendation:', error);
        });
    }
  }, [fetchLessonContent, recommendationId]);

  useEffect(() => {
    // Calculate progress based on current chapter and total chapters
    if (lessonContent && lessonContent.mainContent) {
      const totalChapters = lessonContent.mainContent.length;
      const newProgress = totalChapters > 0 
        ? Math.min(Math.round((currentChapter / totalChapters) * 100), 100)
        : 0;
      setProgress(newProgress);
      
      // Update lesson progress in supabase if studentId is available
      if (studentId && lessonStarted) {
        supabase.from('lesson_progress')
          .update({ 
            current_chapter: currentChapter,
            is_completed: currentChapter >= lessonContent.mainContent.length
          })
          .match({ 
            student_id: studentId, 
            lesson_id: lessonContent.id 
          })
          .then(({ error }) => {
            if (error) console.error('Error updating lesson progress:', error);
          });
      }
      
      // Call onComplete callback if lesson is completed
      if (currentChapter >= lessonContent.mainContent.length && onComplete) {
        onComplete();
      }
    }
  }, [currentChapter, lessonContent, studentId, lessonStarted, onComplete]);

  // Handle next chapter click
  const handleNextChapter = () => {
    if (!lessonStarted) {
      setLessonStarted(true);
    }
    
    if (lessonContent && lessonContent.mainContent) {
      if (currentChapter < lessonContent.mainContent.length) {
        setCurrentChapter(currentChapter + 1);
      }
    }
  };

  // Handle previous chapter click
  const handlePreviousChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1);
    }
  };

  // Show loading state
  if (loading || !lessonContent) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  // Show introduction if lesson not started
  if (!lessonStarted) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold font-display mb-3">{lessonContent.title || topic}</h1>
        <p className="text-lg mb-6">{lessonContent.introduction}</p>
        <Button onClick={handleNextChapter} className="bg-eduPurple hover:bg-eduPurple-dark">
          {t('lesson.startLesson')}
        </Button>
      </div>
    );
  }
  
  // Check if we're at the end of the lesson
  const isLessonComplete = currentChapter >= (lessonContent.mainContent?.length || 0);

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">{t('lesson.progress')}</h4>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main lesson content */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {isLessonComplete ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-display">{t('lesson.congratulations')}</h2>
            <p className="text-lg">{lessonContent.conclusion || t('lesson.completedMessage')}</p>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">{t('lesson.summary')}</h3>
              <p>{lessonContent.summary || t('lesson.noSummary')}</p>
            </div>
            
            {lessonContent.funFacts && lessonContent.funFacts.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">{t('lesson.funFacts')}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {lessonContent.funFacts.map((fact: string, index: number) => (
                      <li key={index}>{fact}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            
            {lessonContent.activity && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">{t('lesson.activity')}</h3>
                  <h4 className="text-lg font-medium">{lessonContent.activity.title}</h4>
                  <p>{lessonContent.activity.instructions}</p>
                  
                  {lessonContent.activity.image && (
                    <div className="mt-4">
                      <img 
                        src={lessonContent.activity.image.url} 
                        alt={lessonContent.activity.image.alt || "Activity illustration"} 
                        className="rounded-md max-w-full mx-auto"
                      />
                      <p className="text-sm text-center text-gray-500 mt-2">
                        {lessonContent.activity.image.caption || ""}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
            
            <div className="flex justify-between mt-6">
              <Button onClick={handlePreviousChapter} variant="outline">
                {t('lesson.previous')}
              </Button>
              <Button 
                onClick={() => fetchLessonContent(true)} 
                variant="outline"
                disabled={loadingNewContent}
              >
                {loadingNewContent ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('lesson.loading')}
                  </>
                ) : (
                  t('lesson.startOver')
                )}
              </Button>
            </div>
          </div>
        ) : (
          <LessonContent 
            chapter={lessonContent.mainContent[currentChapter]}
            onNext={handleNextChapter}
            onPrevious={handlePreviousChapter}
            showPrevious={currentChapter > 0}
            chapterIndex={currentChapter}
            totalChapters={lessonContent.mainContent.length}
          />
        )}
      </div>
    </div>
  );
};

export default AILesson;
