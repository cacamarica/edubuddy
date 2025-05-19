
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAIEducationContent } from '@/services/aiEducationService';
import LessonContent from '@/components/LessonContent';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useStudentProfile } from '@/contexts/StudentProfileContext';

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
  const { selectedProfile } = useStudentProfile();
  const [loading, setLoading] = useState(true);
  const [lessonContent, setLessonContent] = useState<any>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [lessonStarted, setLessonStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingNewContent, setLoadingNewContent] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Get the effective student ID (from props or context)
  const effectiveStudentId = studentId || selectedProfile?.id;
  
  // Function to get lesson content from cached or new API call
  const fetchLessonContent = useCallback(async (refreshContent = false) => {
    setLoading(true);
    try {
      console.log(`Fetching lesson content for ${topic} in ${subject} (grade: ${gradeLevel})`);
      console.log(`Student ID: ${effectiveStudentId || 'none'}`);
      
      // First check if we have the lesson in supabase cache
      if (!refreshContent && effectiveStudentId) {
        const { data: cachedLesson, error: lessonError } = await supabase
          .from('lesson_materials')
          .select('*')
          .eq('subject', subject)
          .eq('topic', topic)
          .eq('grade_level', gradeLevel)
          .maybeSingle();
        
        if (lessonError) {
          console.error('Error fetching cached lesson:', lessonError);
        }
        
        if (cachedLesson) {
          console.log('Found cached lesson:', cachedLesson.id);
          setLessonId(cachedLesson.id);
          
          setLessonContent({
            title: cachedLesson.title,
            introduction: cachedLesson.introduction,
            mainContent: cachedLesson.chapters,
            funFacts: cachedLesson.fun_facts,
            activity: cachedLesson.activity,
            conclusion: cachedLesson.conclusion,
            summary: cachedLesson.summary,
            id: cachedLesson.id
          });
          
          // Check if we have lesson progress for this student
          if (effectiveStudentId) {
            const { data: lessonProgress, error: progressError } = await supabase
              .from('lesson_progress')
              .select('current_chapter, is_completed')
              .eq('student_id', effectiveStudentId)
              .eq('lesson_id', cachedLesson.id)
              .maybeSingle();
              
            if (progressError) {
              console.error('Error fetching lesson progress:', progressError);
            }
              
            if (lessonProgress) {
              console.log('Found lesson progress:', lessonProgress);
              setCurrentChapter(lessonProgress.current_chapter);
              
              // If the lesson was already completed, mark it as such
              if (lessonProgress.is_completed && onComplete) {
                onComplete();
              }
            } else {
              console.log('No lesson progress found, creating initial record');
              // Create initial progress record if none exists
              await supabase
                .from('lesson_progress')
                .insert({
                  student_id: effectiveStudentId,
                  lesson_id: cachedLesson.id,
                  current_chapter: 0,
                  is_completed: false
                });
            }
          }
          
          setLoading(false);
          return;
        } else {
          console.log('No cached lesson found, fetching from AI service');
        }
      }
      
      // If no cached lesson or refresh requested, call AI service
      const result = await getAIEducationContent({
        contentType: 'lesson',
        subject,
        gradeLevel,
        topic,
        language: language === 'id' ? 'id' : 'en'
      });
      
      if (result?.content) {
        console.log('Received AI generated lesson content');
        setLessonContent(result.content);
        
        // Cache the lesson in supabase
        if (effectiveStudentId) {
          console.log('Caching lesson in database');
          const { data: insertedLesson, error: insertError } = await supabase
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
            
          if (insertError) {
            console.error('Error caching lesson:', insertError);
          }
            
          // Create initial lesson progress record
          if (insertedLesson) {
            console.log('Creating initial lesson progress record');
            setLessonId(insertedLesson.id);
            
            const { error: progressError } = await supabase
              .from('lesson_progress')
              .insert({
                student_id: effectiveStudentId,
                lesson_id: insertedLesson.id,
                current_chapter: 0,
                is_completed: false
              });
              
            if (progressError) {
              console.error('Error creating lesson progress:', progressError);
            }
          }
        }
      } else if (retryCount < 2) {
        // Retry up to 2 times if content is empty
        console.log(`Retry attempt ${retryCount + 1} for lesson content`);
        setRetryCount(retryCount + 1);
        await fetchLessonContent(true);
        return;
      } else {
        toast.error(language === 'id' 
          ? 'Gagal memuat pelajaran setelah beberapa percobaan' 
          : 'Failed to load lesson after several attempts');
      }
    } catch (error) {
      console.error('Error fetching lesson content:', error);
      if (retryCount < 2) {
        setRetryCount(retryCount + 1);
        await fetchLessonContent(true);
        return;
      } else {
        toast.error(language === 'id'
          ? 'Terjadi kesalahan saat memuat pelajaran'
          : 'Error occurred while loading the lesson');
      }
    } finally {
      setLoading(false);
      setLoadingNewContent(false);
    }
  }, [subject, gradeLevel, topic, language, effectiveStudentId, retryCount, onComplete]);

  // Load initial content
  useEffect(() => {
    console.log('Loading initial lesson content');
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
      if (effectiveStudentId && lessonStarted && lessonId) {
        console.log('Updating lesson progress in database');
        const isCompleted = currentChapter >= lessonContent.mainContent.length;
        
        supabase.from('lesson_progress')
          .update({ 
            current_chapter: currentChapter,
            is_completed: isCompleted
          })
          .eq('student_id', effectiveStudentId)
          .eq('lesson_id', lessonId)
          .then(({ error }) => {
            if (error) console.error('Error updating lesson progress:', error);
          });
          
        // Record learning activity for tracking
        if (isCompleted) {
          supabase.from('learning_activities')
            .insert({
              student_id: effectiveStudentId,
              activity_type: 'lesson_completed',
              subject: subject,
              topic: topic,
              lesson_id: lessonId,
              progress: 100,
              completed: true,
              last_interaction_at: new Date()
            })
            .then(({ error }) => {
              if (error) console.error('Error recording learning activity:', error);
            });
        }
      }
      
      // Call onComplete callback if lesson is completed
      if (currentChapter >= lessonContent.mainContent.length && onComplete) {
        onComplete();
      }
    }
  }, [currentChapter, lessonContent, effectiveStudentId, lessonStarted, lessonId, onComplete, subject, topic]);

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
                onClick={() => {
                  setLoadingNewContent(true);
                  fetchLessonContent(true);
                }} 
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
