
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LogIn, BookOpen, Star, ArrowLeft, ArrowRight, Bookmark, BookMarked, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LessonMaterial, LessonChapter, LessonProgress, lessonService } from '@/services/lessonService';
import { supabase } from '@/integrations/supabase/client';

interface AILessonProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  onComplete?: () => void;
  limitProgress?: boolean;
  studentId?: string; // Added studentId prop to the interface
}

const AILesson = ({ subject, gradeLevel, topic, onComplete, limitProgress = false }: AILessonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lessonContent, setLessonContent] = useState<LessonMaterial | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [readingTime, setReadingTime] = useState('10-15 minutes');
  const [lessonProgress, setLessonProgress] = useState<LessonProgress | null>(null);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Calculate maximum allowed chapter for non-logged in users (30% of content)
  const getMaxAllowedChapter = () => {
    if (!lessonContent) return 0;
    if (user || !limitProgress) return lessonContent.chapters.length - 1;
    
    // For non-logged in users with limitation, limit to 30% of the content (at least 1 chapter)
    return Math.max(0, Math.floor(lessonContent.chapters.length * 0.3) - 1);
  };

  // Fetch lesson content and progress
  const fetchLessonAndProgress = async () => {
    setIsLoading(true);
    try {
      // Get the lesson material
      const material = await lessonService.getLessonMaterial(subject, topic, gradeLevel);
      
      if (!material) {
        toast.error("Couldn't retrieve the lesson. Please try again later.");
        setIsLoading(false);
        return;
      }
      
      setLessonContent(material);
      
      // Estimate reading time based on content length
      const totalText = 
        material.introduction + 
        material.chapters.reduce((acc, chapter) => acc + chapter.text, '') +
        (material.conclusion || '');
      
      const wordCount = totalText.split(/\s+/).length;
      const minutes = Math.ceil(wordCount / 200);
      setReadingTime(`${minutes}-${minutes + 5} minutes`);
      
      // If user is logged in and we have a student profile, fetch progress
      if (user && window.location.pathname.includes('studentId=')) {
        // Extract student ID from URL or state
        const urlParams = new URLSearchParams(window.location.search);
        const studentId = urlParams.get('studentId');
        
        if (studentId && material.id) {
          const progress = await lessonService.getLessonProgress(studentId, material.id);
          
          if (progress) {
            setLessonProgress(progress);
            
            if (progress.is_completed) {
              setLessonCompleted(true);
            } else {
              setCurrentChapter(progress.current_chapter);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch lesson:", error);
      toast.error("Error loading the lesson. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save current progress
  const saveCurrentProgress = async () => {
    if (!user || !lessonContent?.id) return;
    
    // Extract student ID from URL or state
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('studentId');
    
    if (!studentId) return;
    
    setIsSavingProgress(true);
    
    try {
      const progress: LessonProgress = {
        student_id: studentId,
        lesson_id: lessonContent.id,
        current_chapter: currentChapter,
        is_completed: lessonCompleted,
        last_read_at: new Date().toISOString()
      };
      
      const savedProgress = await lessonService.saveProgress(progress);
      if (savedProgress) {
        setLessonProgress(savedProgress);
        toast.success("Progress saved!");
      }
    } catch (error) {
      console.error("Error saving progress:", error);
    } finally {
      setIsSavingProgress(false);
    }
  };

  // Handle generate lesson
  const generateLesson = async () => {
    await fetchLessonAndProgress();
  };

  // Navigate to next chapter
  const handleNextChapter = async () => {
    const maxAllowedChapter = getMaxAllowedChapter();
    
    if (lessonContent) {
      // Check if the user can proceed to the next chapter
      if (currentChapter < lessonContent.chapters.length - 1) {
        // Check if they've reached their limit (for non-logged in users with limitation)
        if (limitProgress && currentChapter >= maxAllowedChapter && !user) {
          // Show login prompt
          toast.info(
            language === 'id'
              ? 'Masuk untuk mengakses seluruh pelajaran'
              : 'Sign in to access the full lesson',
            {
              duration: 5000,
              action: {
                label: language === 'id' ? 'Masuk' : 'Sign In',
                onClick: () => navigate('/auth', { state: { action: 'signin' } }),
              },
            }
          );
          return;
        }
        
        // If they can proceed, go to the next chapter
        const newChapter = currentChapter + 1;
        setCurrentChapter(newChapter);
        
        // Save progress if user is logged in
        if (user && lessonContent.id) {
          await saveCurrentProgress();
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Mark lesson as completed
        setLessonCompleted(true);
        
        // Save completion status if user is logged in
        if (user && lessonContent.id) {
          const urlParams = new URLSearchParams(window.location.search);
          const studentId = urlParams.get('studentId');
          
          if (studentId) {
            await lessonService.markLessonComplete(studentId, lessonContent.id);
            
            // Update learning activity - now with proper supabase import
            await supabase
              .from('learning_activities')
              .insert([{
                student_id: studentId,
                activity_type: 'lesson',
                subject,
                topic,
                completed: true,
                progress: 100,
                stars_earned: 5,
                completed_at: new Date().toISOString()
              }]);
          }
        }
        
        toast.success("You completed the lesson! Great job!", {
          icon: <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />,
        });
        
        if (onComplete) onComplete();
      }
    }
  };

  // Navigate to previous chapter
  const handlePrevChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Save bookmark (manual save)
  const handleSaveBookmark = async () => {
    await saveCurrentProgress();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-eduPurple border-t-transparent rounded-full mb-4"></div>
          <p className="text-center font-display text-lg">Creating an amazing lesson just for you!</p>
          <p className="text-center text-muted-foreground">This might take a moment...</p>
        </CardContent>
      </Card>
    );
  }

  if (!lessonContent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-display">Let's Learn About {topic}!</CardTitle>
          <CardDescription>
            Discover exciting facts and fun activities about {topic} in {subject}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-center text-muted-foreground">
            This comprehensive lesson will take approximately {readingTime} to complete and includes images 
            and activities to help you understand {topic}.
          </p>
          <Button onClick={generateLesson} className="bg-eduPurple hover:bg-eduPurple-dark">
            <BookOpen className="mr-2 h-4 w-4" />
            Start Lesson
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (lessonCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-display">Lesson Complete! 🎉</CardTitle>
          <CardDescription>Great job learning about {topic}!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {lessonContent.summary && (
              <div className="bg-eduPastel-blue p-4 rounded-lg">
                <h3 className="font-semibold font-display text-lg">Summary</h3>
                <p>{lessonContent.summary}</p>
              </div>
            )}
            
            <div className="bg-eduPastel-yellow p-4 rounded-lg">
              <h3 className="font-semibold font-display text-lg">Fun Facts</h3>
              <ul className="list-disc pl-5 space-y-2">
                {lessonContent.fun_facts.map((fact, i) => (
                  <li key={i}>{fact}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-eduPastel-green p-4 rounded-lg">
              <h3 className="font-semibold font-display text-lg">{lessonContent.activity.title}</h3>
              <p className="mb-4">{lessonContent.activity.instructions}</p>
              
              {lessonContent.activity.image && (
                <div className="mt-4 flex flex-col items-center">
                  <div className="w-full max-w-md rounded-lg overflow-hidden">
                    <img 
                      src={lessonContent.activity.image.url} 
                      alt={lessonContent.activity.image.alt} 
                      className="w-full h-auto object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80";
                        target.alt = "Placeholder image - original image failed to load";
                      }}
                    />
                  </div>
                  {lessonContent.activity.image.caption && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {lessonContent.activity.image.caption}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => {
            setCurrentChapter(0);
            setLessonCompleted(false);
          }} className="mx-2">
            Restart Lesson
          </Button>
          <Button onClick={() => {
            setLessonContent(null);
          }} className="mx-2 bg-eduPurple hover:bg-eduPurple-dark">
            Try Another Topic
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Get the current chapter content
  const currentChapterContent = lessonContent.chapters[currentChapter];
  const maxAllowedChapter = getMaxAllowedChapter();
  const isLastViewableChapter = !user && currentChapter >= maxAllowedChapter;

  // Split the text into paragraphs for better readability
  const paragraphs = currentChapterContent.text.split('\n\n');

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl md:text-2xl font-display">{lessonContent.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Chapter {currentChapter + 1} of {lessonContent.chapters.length}: {currentChapterContent.heading}
            </p>
          </div>
          <span className="text-sm text-muted-foreground bg-eduPastel-purple px-2 py-1 rounded-full">
            Reading time: {readingTime}
          </span>
        </div>
        {currentChapter === 0 && (
          <CardDescription className="mt-4">{lessonContent.introduction}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <h3 className="font-semibold font-display text-xl">{currentChapterContent.heading}</h3>
          
          {/* Chapter image */}
          {currentChapterContent.image && (
            <div className="my-6 flex flex-col items-center">
              <div className="w-full rounded-lg overflow-hidden shadow-md bg-white p-2">
                <div className="relative aspect-video">
                  <img 
                    src={currentChapterContent.image.url} 
                    alt={currentChapterContent.image.alt || "Lesson illustration"}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80";
                      target.alt = "Placeholder image - original image failed to load";
                    }}
                  />
                </div>
                {currentChapterContent.image.caption && (
                  <p className="text-sm text-center text-muted-foreground mt-2 italic">
                    {currentChapterContent.image.caption}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Chapter content */}
          <div className="prose max-w-none">
            {paragraphs.map((paragraph, idx) => (
              <p key={idx} className="my-4">{paragraph}</p>
            ))}
          </div>
          
          {/* Show conclusion in last chapter */}
          {currentChapter === lessonContent.chapters.length - 1 && lessonContent.conclusion && (
            <div className="mt-8 border-t pt-4">
              <h3 className="font-semibold font-display text-lg">Conclusion</h3>
              <p>{lessonContent.conclusion}</p>
            </div>
          )}
          
          {/* Free vs. Premium Content Divider */}
          {!user && limitProgress && currentChapter === maxAllowedChapter && (
            <div className="mt-8 border-t pt-6 text-center">
              <div className="bg-eduPastel-purple p-4 rounded-lg">
                <h3 className="font-semibold font-display text-lg mb-2">
                  {language === 'id' ? 'Dapatkan Akses Penuh' : 'Get Full Access'}
                </h3>
                <p className="mb-4">
                  {language === 'id' 
                    ? 'Masuk untuk melanjutkan pelajaran dan akses semua fitur!' 
                    : 'Sign in to continue this lesson and access all features!'}
                </p>
                <Button 
                  onClick={() => navigate('/auth', { state: { action: 'signin' } })}
                  className="bg-eduPurple hover:bg-eduPurple-dark"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {language === 'id' ? 'Masuk Sekarang' : 'Sign In Now'}
                </Button>
              </div>
            </div>
          )}
          
          {/* Progress bar */}
          <div className="w-full mt-8">
            <Progress value={(currentChapter + 1) / lessonContent.chapters.length * 100} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>Chapter {currentChapter + 1} of {lessonContent.chapters.length}</span>
              <span>{Math.round(((currentChapter + 1) / lessonContent.chapters.length) * 100)}% complete</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-6 border-t mt-6">
        <div className="flex gap-2">
          <Button 
            onClick={handlePrevChapter}
            disabled={currentChapter === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          {user && (
            <Button 
              onClick={handleSaveBookmark}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isSavingProgress}
            >
              {isSavingProgress ? (
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : (
                <Bookmark className="h-4 w-4 mr-2" />
              )}
              Save Progress
            </Button>
          )}
        </div>
        
        <Button 
          onClick={handleNextChapter}
          className={`flex items-center gap-2 ${isLastViewableChapter ? 'bg-gray-400 hover:bg-gray-500' : 'bg-eduPurple hover:bg-eduPurple-dark'}`}
          disabled={isLastViewableChapter}
        >
          {currentChapter < lessonContent.chapters.length - 1 ? (
            <>
              Next
              <ArrowRight className="h-4 w-4" />
            </>
          ) : "Complete Lesson"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AILesson;
