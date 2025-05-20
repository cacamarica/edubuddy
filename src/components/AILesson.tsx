import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAIEducationContent } from '@/services/aiEducationService';
import LessonContent from '@/components/LessonContent';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, Loader2, Brain, CircleHelp, MessageCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { useLearningBuddy } from '@/contexts/LearningBuddyContext';
import { normalizeLessonContent } from '@/utils/lessonUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const { sendMessage, toggleOpen } = useLearningBuddy(); // Add Learning Buddy context
  const [loading, setLoading] = useState(true);
  const [lessonContent, setLessonContent] = useState<any>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [lessonStarted, setLessonStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingNewContent, setLoadingNewContent] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Track which concepts the user has interacted with
  const [discussedConcepts, setDiscussedConcepts] = useState<string[]>([]);
  const [showInteractionSuggestions, setShowInteractionSuggestions] = useState(false);
  const interactionTimerRef = useRef<any>(null);
  
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
      
      try {
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
        
        if (!result || !result.content) {
          throw new Error('No content received from AI service');
        }
        
        const normalized = normalizeLessonContent(result?.content);
        console.log('[AI] Normalized response:', normalized);
        
        if (!normalized) {
          throw new Error('Failed to normalize AI content');
        }
        
        setLoadingProgress(70); // Normalization complete
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
      } catch (aiError) {
        console.error('[AI] Error during content generation:', aiError);
        if (retryCount < 2) {
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
          throw aiError; // Re-throw to handle in the outer catch
        }
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
      
      // Clear any loading state
      setLoadingProgress(0);
      setLoading(false);
      setLoadingNewContent(false);
      
      // Show a more user-friendly error
      toast.error(language === 'id'
        ? 'Terjadi kesalahan saat memuat pelajaran. Silakan coba lagi.'
        : 'Error occurred while loading the lesson. Please try again.');
      
      // Return without setting lesson content - the UI will show error state
      return;
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

  // Function to extract key concepts from current chapter
  const extractKeyConcepts = useCallback(() => {
    if (!lessonContent || !lessonContent.mainContent || lessonContent.mainContent.length === 0) {
      return [];
    }
    
    const currentContent = lessonContent.mainContent[currentChapter];
    if (!currentContent) return [];
    
    // Extract concepts using a simple approach (could be improved with NLP)
    const content = currentContent.content || '';
    
    // Find terms that might be important based on formatting indicators like bold or headers
    const boldTerms = (content.match(/\*\*([^*]+)\*\*/g) || [])
      .map(term => term.replace(/\*\*/g, ''));
    
    // Find terms from headings
    const headingTerms = (content.match(/#{1,3} ([^\n]+)/g) || [])
      .map(term => term.replace(/^#{1,3} /, ''));
    
    // Combine all potential concepts and filter out duplicates
    const allConcepts = [...boldTerms, ...headingTerms]
      .filter(term => term.length > 3) // Filter out very short terms
      .map(term => term.trim())
      .filter((term, index, self) => self.indexOf(term) === index); // Remove duplicates
    
    // Take a maximum of 3 concepts
    return allConcepts.slice(0, 3);
  }, [lessonContent, currentChapter]);

  // Generate suggested questions based on current chapter
  const getSuggestedQuestions = useCallback(() => {
    const concepts = extractKeyConcepts();
    if (concepts.length === 0) return [];
    
    // Generate a question for each concept
    return concepts.map(concept => {
      // Vary the question formats
      const questionFormats = [
        `Can you explain "${concept}" in simpler terms?`,
        `Why is "${concept}" important in ${subject}?`,
        `How does "${concept}" relate to ${topic}?`,
        `Can you give me an example of "${concept}"?`,
        `What would happen if "${concept}" didn't exist?`
      ];
      
      // Select a random question format
      const randomIndex = Math.floor(Math.random() * questionFormats.length);
      return questionFormats[randomIndex];
    });
  }, [extractKeyConcepts, subject, topic]);

  // Handle asking Learning Buddy a question
  const handleAskBuddy = (question: string) => {
    toggleOpen(); // Open the Learning Buddy panel
    
    // Add a slight delay to ensure the buddy is open
    setTimeout(() => {
      sendMessage(question);
      
      // Extract the concept from the question and add to discussed concepts
      const conceptMatch = question.match(/"([^"]+)"/);
      if (conceptMatch && conceptMatch[1]) {
        setDiscussedConcepts(prev => [...prev, conceptMatch[1]]);
      }
    }, 300);
  };
  
  // Set up a timer to suggest interactions after a period of inactivity
  useEffect(() => {
    if (lessonContent && lessonStarted && !loading) {
      // Clear any existing timer
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current);
      }
      
      // Set new timer to show suggestions after 45 seconds of reading
      interactionTimerRef.current = setTimeout(() => {
        setShowInteractionSuggestions(true);
      }, 45000);
      
      // Clean up on unmount or when chapter changes
      return () => {
        if (interactionTimerRef.current) {
          clearTimeout(interactionTimerRef.current);
        }
      };
    }
  }, [lessonContent, lessonStarted, loading, currentChapter]);
  
  // Hide suggestions when user interacts with the lesson
  const hideInteractionSuggestions = () => {
    setShowInteractionSuggestions(false);
    
    // Reset the timer for future suggestions
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
    
    interactionTimerRef.current = setTimeout(() => {
      setShowInteractionSuggestions(true);
    }, 60000); // Longer timeout after dismissal
  };

  // Show loading state with more informative UI
  if (loading || !lessonContent) {
    return (
      <div className="w-full bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <Loader2 className="animate-spin h-12 w-12 text-eduPurple mb-4" />
          <div className="text-lg font-medium text-center">
            {t('lesson.loadingLesson') || 'Loading your personalized lesson...'}
          </div>
          <p className="text-muted-foreground text-center max-w-sm">
            {t('lesson.aiGenerating') || 'Our AI is creating an engaging learning experience just for you!'}
          </p>
          
          {loadingProgress > 0 && (
            <div className="w-full max-w-md space-y-2">
              <Progress value={loadingProgress} className="h-2 bg-muted" />
              <p className="text-xs text-muted-foreground text-center">
                {loadingProgress}% {getLoadingStageText(loadingProgress)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // A helper function to get appropriate loading stage text based on progress
  function getLoadingStageText(progress: number): string {
    if (language === 'id') {
      if (progress < 20) return 'Memulai...';
      if (progress < 40) return 'Memeriksa konten tersimpan...';
      if (progress < 60) return 'Meminta AI untuk membuat konten...';
      if (progress < 80) return 'Memproses konten pembelajaran...';
      if (progress < 100) return 'Hampir selesai...';
      return 'Selesai!';
    } else {
      if (progress < 20) return 'Starting...';
      if (progress < 40) return 'Checking saved content...';
      if (progress < 60) return 'Requesting AI to generate content...';
      if (progress < 80) return 'Processing learning content...';
      if (progress < 100) return 'Almost done...';
      return 'Complete!';
    }
  }

  // Defensive: If lessonContent or mainContent is missing, show an improved error UI
  if (!lessonContent?.mainContent || !Array.isArray(lessonContent.mainContent) || lessonContent.mainContent.length === 0) {
    return (
      <div className="w-full bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col items-center text-center py-8">
          <div className="bg-red-50 p-4 rounded-full mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-2">
            {t('lesson.errorLoadingLesson') || 'Error loading lesson'}
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            {t('lesson.noLessonContent') || 'We encountered an issue loading the AI learning content. This might be due to high demand or a temporary connectivity issue.'}
          </p>
          <Button 
            onClick={() => fetchLessonContent(true)}
            className="bg-eduPurple hover:bg-eduPurple-dark"
          >
            {t('lesson.retry') || 'Try Again'}
          </Button>
        </div>
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
          <div>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>
                  {t('lesson.chapter') || 'Chapter'} {currentChapter + 1}/{lessonContent.mainContent?.length || 0}
                </span>
                <span>
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            {/* Chapter content */}
            <div>
              <h2 className="text-xl font-bold mb-4">
                {lessonContent.mainContent?.[currentChapter]?.title || ''}
              </h2>
              
              <div className="prose max-w-none mb-6">
                <LessonContent content={lessonContent.mainContent?.[currentChapter]?.content || ''} />
              </div>
              
              {/* Learning Buddy integration */}
              {showInteractionSuggestions && getSuggestedQuestions().length > 0 && (
                <div className="mt-2 mb-6 p-4 bg-eduPurple/5 border border-eduPurple/10 rounded-lg relative">
                  <button 
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    onClick={hideInteractionSuggestions}
                  >
                    <span className="sr-only">Close</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-eduPurple/10 p-2 rounded-full flex-shrink-0">
                      <Brain className="h-5 w-5 text-eduPurple" />
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-eduPurple mb-2">Ask your Learning Buddy</h4>
                      <p className="text-sm mb-3">Have questions about this topic? Your Learning Buddy can help explain!</p>
                      
                      <div className="space-y-2">
                        {getSuggestedQuestions().map((question, index) => (
                          <Button 
                            key={index}
                            variant="outline" 
                            size="sm"
                            className="mr-2 mb-2 border-eduPurple/20 hover:bg-eduPurple/5 text-left"
                            onClick={() => handleAskBuddy(question)}
                          >
                            <MessageCircle className="h-3 w-3 mr-2 flex-shrink-0" /> 
                            <span className="truncate">{question}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Navigation buttons */}
              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePreviousChapter}
                  disabled={currentChapter === 0}
                  className="flex items-center"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {t('lesson.previous') || 'Previous'}
                </Button>
                
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          onClick={() => {
                            toggleOpen();
                            setTimeout(() => {
                              sendMessage(`Can you summarize what I'm learning about "${lessonContent.mainContent?.[currentChapter]?.title}" in ${subject}?`);
                            }, 300);
                          }}
                        >
                          <Brain className="h-5 w-5 text-eduPurple" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ask your Learning Buddy</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Button
                    onClick={handleNextChapter}
                    disabled={currentChapter >= (lessonContent.mainContent?.length || 0) - 1}
                    className="flex items-center"
                  >
                    {currentChapter >= (lessonContent.mainContent?.length || 0) - 1
                      ? (language === 'id' ? 'Selesaikan Pelajaran' : 'Complete Lesson')
                      : (language === 'id' ? 'Berikutnya' : 'Next')}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AILesson;
