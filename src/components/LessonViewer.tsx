
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import FunLoadingAnimation from '@/components/FunLoadingAnimation';
import { BookOpen, Lightbulb, FileEdit } from 'lucide-react';

interface LessonViewerProps {
  subject: string;
  topic: string;
  subtopic?: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  student?: any;
  summary: string;
  videoUrl?: string;
  images: { url: string; alt: string; caption?: string }[];
  onStoryMode?: () => void;
  storyModeActive?: boolean;
  storyContent?: string;
  loading?: boolean;
}

const LessonViewer: React.FC<LessonViewerProps> = ({
  subject,
  topic,
  subtopic,
  gradeLevel,
  student,
  summary,
  videoUrl,
  images,
  onStoryMode,
  storyModeActive = false,
  storyContent,
  loading = false
}) => {
  const { t, language } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Debug logs
  console.log('[LessonViewer] props:', { subject, topic, subtopic, gradeLevel, summary, storyModeActive, storyContent });

  // Loading animation progress simulation with faster progression
  useEffect(() => {
    if (loading) {
      const timer = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 95) {
            clearInterval(timer);
            return prev;
          }
          // Faster progress increments
          return Math.min(prev + 5, 95);
        });
      }, 50); // Reduced interval time for faster animation
      
      return () => clearInterval(timer);
    } else {
      setLoadingProgress(100);
    }
  }, [loading]);

  // TTS using browser speechSynthesis
  const handleReadAloud = (text: string) => {
    if (!window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    
    // Try to set a reasonable voice and rate
    utterance.rate = 1.0;
    try {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.includes(language === 'id' ? 'id' : 'en')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    } catch (e) {
      console.error('Error setting voice:', e);
    }
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Select appropriate theme based on topic - simplified for performance
  const getAnimationTheme = () => {
    const topicLower = topic.toLowerCase();
    if (topicLower.includes('space') || topicLower.includes('planet')) 
      return 'space';
    if (topicLower.includes('ocean') || topicLower.includes('water'))
      return 'ocean';
    if (topicLower.includes('robot') || topicLower.includes('machine'))
      return 'robot';
    return 'ufo'; // default theme
  };

  if (loading) {
    return (
      <FunLoadingAnimation
        contentType="lesson"
        theme={getAnimationTheme()}
        message={language === 'id' ? 
          `Mempersiapkan pelajaran ${subtopic || topic}...` : 
          `Preparing your ${subtopic || topic} lesson...`}
        progress={loadingProgress}
        showProgress={true}
      />
    );
  }

  // Determine what content to show based on whether storyMode is active
  const contentToShow = storyModeActive && storyContent ? storyContent : summary;

  return (
    <div className="space-y-6">
      {/* Header section with improved subtopic visibility */}
      <div className="bg-gradient-to-r from-eduPastel-blue to-eduPastel-purple p-4 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            {subtopic ? (
              <>
                <div className="text-sm text-gray-600 mb-1 flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  {topic}
                </div>
                <h2 className="text-2xl font-bold flex items-center">
                  <FileEdit className="h-5 w-5 mr-2 text-eduPurple" />
                  {subtopic}
                </h2>
              </>
            ) : (
              <h2 className="text-2xl font-bold flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                {topic}
              </h2>
            )}
            <p className="text-sm text-gray-600 mt-1">{subject} • {t(`grades.${gradeLevel}`)}</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => handleReadAloud(contentToShow)} 
              disabled={isSpeaking}
              size="sm"
              className="whitespace-nowrap"
            >
              {isSpeaking ? t('lesson.reading') : t('lesson.readAloud')}
            </Button>
            
            {onStoryMode && (
              <Button 
                variant={storyModeActive ? 'default' : 'outline'} 
                onClick={onStoryMode}
                size="sm"
                className="whitespace-nowrap"
              >
                {storyModeActive ? t('lesson.storyModeOn') : t('lesson.storyMode')}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content - simplified rendering for better performance */}
      <div className="bg-white p-5 rounded-lg shadow-sm">
        <div className="text-base md:text-lg space-y-4 leading-relaxed font-sans">
          {contentToShow.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className={idx === 0 ? "first-paragraph" : ""}>{paragraph}</p>
          ))}
        </div>
      </div>
      
      {/* Learning objectives - for subtopic focus */}
      {subtopic && (
        <div className="bg-eduPastel-yellow p-4 rounded-lg">
          <h3 className="flex items-center text-lg font-semibold mb-2">
            <Lightbulb className="h-5 w-5 mr-2 text-amber-600" />
            {t('lesson.keyPoints') || 'Key Learning Points'}
          </h3>
          <ul className="list-disc pl-5 space-y-2 font-sans">
            <li>Understanding the core concepts of {subtopic}</li>
            <li>Learning how {subtopic} relates to {topic}</li>
            <li>Applying knowledge of {subtopic} to solve problems</li>
          </ul>
        </div>
      )}
      
      {/* Only show images if explicitly provided and needed */}
      {images && images.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">{t('lesson.visualResources') || 'Visual Resources'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.slice(0, 2).map((img, idx) => (
              <div key={idx} className="group relative">
                <img 
                  src={img.url} 
                  alt={img.alt} 
                  className="rounded-md shadow-md object-cover w-full aspect-square" 
                  loading="lazy"
                />
                {img.caption && <p className="text-xs text-muted-foreground mt-1">{img.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonViewer;
