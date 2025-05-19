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
import { normalizeLessonContent } from '@/utils/lessonUtils';

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
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Get the effective student ID (from props or context)
  const effectiveStudentId = studentId || selectedProfile?.id;
  
  // Function to get lesson content from cached or new API call
  const fetchLessonContent = useCallback(async (refreshContent = false) => {
    setLoading(true);
    setLoadingProgress(10); // Start progress
    // Define a notification ID to prevent duplicate toasts
    const notificationId = 'ai-lesson-toast';
    
    try {
      console.log('[AI] Requesting lesson:', { subject, topic, gradeLevel, language });
      toast.info(
        language === 'id' 
          ? 'Mempersiapkan pelajaran khusus untuk Anda...' 
          : 'Preparing your personalized lesson...', 
        { id: notificationId }
      );
      
      // Try to load from DB
      if (!refreshContent && effectiveStudentId) {
        setLoadingProgress(20); // DB check started
        const { data: cachedLesson, error: lessonError } = await supabase
          .from('lesson_materials')
          .select('*')
          .eq('subject', subject)
          .eq('topic', topic)
          .eq('grade_level', gradeLevel)
          .maybeSingle();
        if (lessonError) console.error('[DB] Error fetching cached lesson:', lessonError);
        console.log('[DB] Raw cached lesson:', cachedLesson);
        setLoadingProgress(30); // DB check complete
        const normalized = normalizeLessonContent(cachedLesson || null);
        console.log('[DB] Normalized cached lesson:', normalized);
        if (normalized) {
          setLessonId(cachedLesson?.id || null);
          setLessonContent(normalized);
          setLoadingProgress(100); // Complete
          setLoading(false);
          return;
        } else if (cachedLesson && cachedLesson.id) {
          console.warn('[DB] Malformed cached lesson, deleting...');
          await supabase.from('lesson_materials').delete().eq('id', cachedLesson.id);
        }
      }
      
      // Request from AI
      setLoadingProgress(40); // Starting AI request
      toast.info(
        language === 'id' 
          ? 'Meminta AI untuk membuat konten pembelajaran...' 
          : 'Asking our AI to generate learning content...', 
        { id: notificationId }
      );
      
      const result = await getAIEducationContent({
        contentType: 'lesson',
        subject,
        gradeLevel,
        topic,
        language: language === 'id' ? 'id' : 'en'
      });
      
      setLoadingProgress(60); // AI response received
      toast.info(
        language === 'id' 
          ? 'Memproses konten pembelajaran...' 
          : 'Processing learning content...', 
        { id: notificationId }
      );
      
      console.log('[AI] Raw response:', result);
      const normalized = normalizeLessonContent(result?.content);
      console.log('[AI] Normalized response:', normalized);
      
      setLoadingProgress(70); // Normalization complete
      if (normalized) {
        setLessonContent(normalized);
        // Save to DB
        if (effectiveStudentId) {
          setLoadingProgress(80); // DB save started
          toast.info(
            language === 'id' 
              ? 'Menyimpan pelajaran ke database...' 
              : 'Saving lesson to database...', 
            { id: notificationId }
          );
          try {
            // First, ensure any existing lessons are removed to avoid conflicts
            console.log('[DB] Checking for existing lessons before saving...');
            const { data: existingLessons, error: findError } = await supabase
              .from('lesson_materials')
              .select('id')
              .eq('subject', subject)
              .eq('topic', topic)
              .eq('grade_level', gradeLevel);
            
            if (findError) {
              console.error('[DB] Error finding existing lessons:', findError);
            } else if (existingLessons && existingLessons.length > 0) {
              console.log('[DB] Found existing lessons, removing:', existingLessons);
              // Delete existing lessons first
              const { error: deleteError } = await supabase
                .from('lesson_materials')
                .delete()
                .in('id', existingLessons.map(lesson => lesson.id));
              
              if (deleteError) {
                console.error('[DB] Error deleting existing lessons:', deleteError);
              } else {
                console.log('[DB] Successfully deleted existing lessons');
              }
            }
            
            // Now insert the new lesson (after deletion completed)
            console.log('[DB] Saving normalized lesson to database');
            const lessonData = {
              subject,
              topic,
              grade_level: gradeLevel,
              title: normalized.title || topic,
              introduction: normalized.introduction || '',
              chapters: normalized.mainContent || [],
              fun_facts: normalized.funFacts || [],
              activity: normalized.activity || null,
              conclusion: normalized.conclusion || '',
              summary: normalized.summary || '',
              updated_at: new Date().toISOString() // Add updated timestamp
            };

            // Use upsert with onConflict to handle the unique constraint
            const { data: upsertedLesson, error: upsertError } = await supabase
              .from('lesson_materials')
              .upsert(lessonData, { 
                onConflict: 'subject,topic,grade_level'
              })
              .select()
              .single();

            if (upsertError) {
              console.error('[DB] Error upserting lesson:', upsertError);
            } else if (upsertedLesson) {
              console.log('[DB] Lesson saved successfully:', upsertedLesson);
              setLessonId(upsertedLesson.id);
              
              // Create initial progress record
              const { error: progressError } = await supabase
                .from('lesson_progress')
                .upsert({
                  student_id: effectiveStudentId,
                  lesson_id: upsertedLesson.id,
                  current_chapter: 0,
                  is_completed: false,
                  last_read_at: new Date().toISOString()
                }, {
                  onConflict: 'student_id,lesson_id'
                });
              
              if (progressError) {
                console.error('[DB] Error creating lesson progress:', progressError);
              } else {
                console.log('[DB] Created/updated lesson progress record');
              }
            }
          } catch (dbError) {
            console.error('[DB] Unexpected error saving lesson:', dbError);
            // Continue with the lesson in memory even if DB save fails
            console.log('[DB] Continuing with in-memory lesson despite DB error');
          }
          setLoadingProgress(90); // DB save complete
        }
      } else if (retryCount < 2) {
        toast.info(language === 'id' 
          ? `Mencoba lagi (${retryCount + 1}/3)...` 
          : `Retrying (${retryCount + 1}/3)...`);
        console.log('[AI] Retry attempt', retryCount + 1);
        setRetryCount(retryCount + 1);
        await fetchLessonContent(true);
        return;
      } else {
        toast.error(language === 'id' 
          ? 'Gagal memuat pelajaran setelah beberapa percobaan' 
          : 'Failed to load lesson after several attempts');
      }
      
      setLoadingProgress(100); // Complete
      toast.success(
        language === 'id' 
          ? 'Pelajaran siap!' 
          : 'Lesson ready!', 
        { id: notificationId }
      );
      
    } catch (error) {
      console.error('[AI/DB] Error fetching lesson content:', error);
      if (retryCount < 2) {
        toast.info(language === 'id' 
          ? `Mencoba lagi karena kesalahan (${retryCount + 1}/3)...` 
          : `Retrying due to error (${retryCount + 1}/3)...`);
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
    // Guard: Only proceed if lessonContent and mainContent are valid
    if (!lessonContent || !Array.isArray(lessonContent.mainContent) || lessonContent.mainContent.length === 0) {
      return;
    }
    // Calculate progress based on current chapter and total chapters
    const totalChapters = lessonContent.mainContent.length;
    const newProgress = Math.min(Math.round((currentChapter / totalChapters) * 100), 100);
    console.log('Progress calculation:', {
      currentChapter,
      totalChapters,
      newProgress,
      lessonStarted,
      lessonId
    });
    setProgress(newProgress);
    // Update lesson progress in supabase if studentId is available
    if (effectiveStudentId && lessonStarted && lessonId) {
      console.log('Updating lesson progress in database');
      const isCompleted = currentChapter >= lessonContent.mainContent.length && newProgress >= 100;
      console.log('Completion status:', {
        isCompleted,
        currentChapter,
        totalChapters,
        progress: newProgress
      });
      supabase.from('lesson_progress')
        .update({ 
          current_chapter: currentChapter,
          is_completed: isCompleted
        })
        .eq('student_id', effectiveStudentId)
        .eq('lesson_id', lessonId)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating lesson progress:', error);
          } else {
            console.log('Successfully updated lesson progress');
          }
        });
      // Record learning activity for tracking
      if (isCompleted) {
        console.log('Recording completed lesson activity');
        supabase.from('learning_activities')
          .insert({
            student_id: effectiveStudentId,
            activity_type: 'lesson_completed',
            subject: subject,
            topic: topic,
            lesson_id: lessonId,
            progress: 100,
            completed: true,
            last_interaction_at: new Date().toISOString() 
          })
          .then(({ error }) => {
            if (error) {
              console.error('Error recording learning activity:', error);
            } else {
              console.log('Successfully recorded completed lesson activity');
            }
          });
      }
    }
    // Call onComplete callback if lesson is completed
    if (currentChapter >= lessonContent.mainContent.length && newProgress >= 100 && onComplete) {
      console.log('Lesson completed, calling onComplete callback');
      onComplete();
    }
  }, [currentChapter, lessonContent, effectiveStudentId, lessonStarted, lessonId, onComplete, subject, topic, gradeLevel]);

  // Handle next chapter click
  const handleNextChapter = () => {
    if (!lessonStarted) {
      setLessonStarted(true);
    }
    if (lessonContent && Array.isArray(lessonContent.mainContent)) {
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
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 p-6 bg-white rounded-lg shadow-md">
        <Loader2 className="animate-spin h-12 w-12 text-eduPurple mb-4" />
        <div className="text-lg font-medium text-center">
          {t('lesson.loadingLesson') || 'Loading your personalized lesson...'}
        </div>
        <p className="text-muted-foreground text-center mb-2">
          {t('lesson.aiGenerating') || 'Our AI is creating an engaging learning experience just for you!'}
        </p>
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-5/6 mx-auto" />
        </div>
        <Progress className="w-full max-w-md" value={loadingProgress} />
      </div>
    );
  }

  // Defensive: If lessonContent or mainContent is missing, show error UI
  if (!lessonContent || !lessonContent.mainContent || !Array.isArray(lessonContent.mainContent)) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">{t('lesson.errorLoadingLesson') || 'Error loading lesson'}</h2>
        <p className="mb-4">{t('lesson.noLessonContent') || 'Lesson content is unavailable or corrupted. Please try again later.'}</p>
        <Button onClick={() => fetchLessonContent(true)}>{t('lesson.retry') || 'Retry'}</Button>
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
          {t('lesson.startLesson') || 'Start Lesson'}
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
          <h4 className="font-medium">{t('lesson.progress') || 'Progress'}</h4>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main lesson content */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {isLessonComplete ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-display">{t('lesson.congratulations') || 'Congratulations!'}</h2>
            <p className="text-lg">{lessonContent.conclusion || t('lesson.completedMessage') || 'You have completed this lesson!'}</p>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">{t('lesson.summary') || 'Summary'}</h3>
              <p>{lessonContent.summary || t('lesson.noSummary') || 'No summary available for this lesson.'}</p>
            </div>
            
            {lessonContent.funFacts && lessonContent.funFacts.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">{t('lesson.funFacts') || 'Fun Facts'}</h3>
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
                  <h3 className="text-xl font-semibold">{t('lesson.activity') || 'Activity'}</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">{lessonContent.activity.title}</h4>
                    <p>{lessonContent.activity.instructions}</p>
                    {lessonContent.activity.image && (
                      <div className="mt-4 text-center">
                        <img 
                          src={lessonContent.activity.image.url} 
                          alt={lessonContent.activity.image.alt || "Activity illustration"} 
                          className="mx-auto max-h-64 rounded-md"
                        />
                        {lessonContent.activity.image.caption && (
                          <p className="text-sm text-gray-500 mt-2">{lessonContent.activity.image.caption}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={() => setCurrentChapter(0)} 
                variant="outline" 
                className="mr-3"
              >
                {t('lesson.restartLesson') || 'Restart Lesson'}
              </Button>
              <Button 
                onClick={() => {
                  if (onComplete) onComplete();
                }}
                className="bg-eduPurple hover:bg-eduPurple-dark"
              >
                {t('lesson.backToDashboard') || 'Back to Dashboard'}
              </Button>
            </div>
          </div>
        ) : (
          <LessonContent 
            chapter={lessonContent.mainContent[currentChapter]}
            subject={subject}
            topic={topic}
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
