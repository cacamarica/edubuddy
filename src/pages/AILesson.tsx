
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { BookOpen, Brain, PlayCircle } from 'lucide-react';
import { aiEducationService } from '@/services/aiEducationService';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Extended interface to match the implementation
interface ExtendedAILessonRequest {
  subject: string;
  topic: string;
  gradeLevel: string;
  studentId?: string;
}

interface ExtendedAILessonResponse {
  title: string;
  content: string;
  recommendations?: string[];
  summary?: string;
  error?: string;
  lessonId?: string;
}

const AILesson: React.FC = () => {
  const { selectedProfile } = useStudentProfile();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const subject = queryParams.get('subject') || '';
  const topic = queryParams.get('topic') || '';
  const gradeLevel = selectedProfile?.grade_level || queryParams.get('grade') || '1';
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);
  
  // Check if we have the necessary data to proceed
  useEffect(() => {
    if (!selectedProfile && !queryParams.get('skip_profile')) {
      toast.error(t('errors.no_profile_selected'), {
        description: t('errors.select_profile_first'),
      });
      navigate('/student-profile');
    }
  }, [selectedProfile, navigate, t, queryParams]);

  // Generate lesson content
  const handleGenerateLesson = async () => {
    if (!subject || !topic) {
      toast.error(t('errors.missing_params'), {
        description: t('errors.subject_topic_required'),
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Create a unique ID for the lesson to avoid duplicate toasts
      const notificationId = `generating-${subject}-${topic}`;
      
      // Show a loading toast
      toast.loading(t('lesson.generating'), {
        id: notificationId,
        description: `${subject} - ${topic}`,
      });
      
      // Generate the lesson using AI service with extended interface
      const result = await aiEducationService.generateLesson({
        subject,
        topic,
        gradeLevel,
        studentId: selectedProfile?.id || 'guest',
      } as ExtendedAILessonRequest);
      
      if (result.error) {
        toast.error(t('errors.lesson_generation_failed'), {
          id: notificationId,
          description: result.error,
        });
      } else {
        toast.success(t('lesson.generation_complete'), {
          id: notificationId,
          description: `${subject} - ${topic}`,
        });
        
        // Store the lesson ID and redirect to the lesson viewer
        if (result.lessonId) {
          setLessonId(result.lessonId || null);
          navigate(`/lessons?id=${result.lessonId}`);
        }
      }
    } catch (error: any) {
      console.error("Lesson generation error:", error);
      toast.error(t('errors.unexpected_error'), {
        description: error.message || t('errors.try_again_later'),
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle navigation to AI learning page
  const goToAILearning = () => {
    navigate('/ai-learning');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {t('ai_lesson.title')}
        </h1>
        
        <div className="max-w-3xl mx-auto">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <Brain className="w-8 h-8 text-eduPurple mr-3" />
                <h2 className="text-xl font-semibold">
                  {subject && topic ? `${subject}: ${topic}` : t('ai_lesson.create_lesson')}
                </h2>
              </div>
              
              {selectedProfile ? (
                <p className="mb-4 text-muted-foreground">
                  {t('ai_lesson.personalized_for')} {selectedProfile.name}, {t('grade')} {selectedProfile.grade_level}
                </p>
              ) : (
                <p className="mb-4 text-muted-foreground">
                  {t('ai_lesson.guest_mode')}
                </p>
              )}
              
              {(subject && topic) ? (
                <div className="space-y-4">
                  <p>{t('ai_lesson.prompt_description')}</p>
                  
                  <div className="flex flex-wrap gap-4 justify-center mt-6">
                    <Button
                      size="lg"
                      onClick={handleGenerateLesson}
                      disabled={isGenerating}
                      className="flex items-center"
                    >
                      {isGenerating ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          {t('ai_lesson.generating')}
                        </>
                      ) : (
                        <>
                          <BookOpen className="mr-2 h-5 w-5" />
                          {t('ai_lesson.generate_lesson')}
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={goToAILearning}
                      className="flex items-center"
                    >
                      <PlayCircle className="mr-2 h-5 w-5" />
                      {t('ai_lesson.explore_other_activities')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p>{t('ai_lesson.select_subject_topic_first')}</p>
                  <Button onClick={() => navigate('/subjects')}>
                    {t('ai_lesson.choose_subject')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>{t('ai_lesson.ai_disclaimer')}</p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AILesson;
