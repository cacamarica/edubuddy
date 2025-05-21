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
  console.log('[LessonViewer] props:', { subject, topic, subtopic, gradeLevel, student, summary, videoUrl, images, storyModeActive, storyContent });

  // Loading animation progress simulation
  useEffect(() => {
    if (loading) {
      const timer = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 95) {
            clearInterval(timer);
            return prev;
          }
          return Math.min(prev + 1, 95);
        });
      }, 100);
      
      return () => clearInterval(timer);
    } else {
      setLoadingProgress(100);
    }
  }, [loading]);

  // TTS using browser speechSynthesis
  const handleReadAloud = (text: string) => {
    if (!window.speechSynthesis) return;
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Select appropriate theme based on topic
  const getAnimationTheme = () => {
    const topicLower = topic.toLowerCase();
    if (topicLower.includes('space') || topicLower.includes('planet') || topicLower.includes('solar')) 
      return 'space';
    if (topicLower.includes('ocean') || topicLower.includes('water') || topicLower.includes('marine'))
      return 'ocean';
    if (topicLower.includes('dinosaur') || topicLower.includes('ancient'))
      return 'dinosaur';
    if (topicLower.includes('robot') || topicLower.includes('machine') || topicLower.includes('computer'))
      return 'robot';
    if (topicLower.includes('magic') || topicLower.includes('fantasy'))
      return 'magical';
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
      
      {/* Main content */}
      <div className="bg-white p-5 rounded-lg shadow-sm">
        <div className="text-base md:text-lg space-y-4 leading-relaxed font-sans">
          {contentToShow.split('\n\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
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
      
      {/* Video and images section */}
      {videoUrl && (
        <div className="my-6 bg-eduPastel-gray p-3 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">{t('lesson.videoResource') || 'Video Resource'}</h3>
          <div className="relative aspect-video">
            <iframe
              className="absolute w-full h-full rounded-md"
              src={videoUrl}
              title={`Video about ${subtopic || topic}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
      
      {images.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">{t('lesson.visualResources') || 'Visual Resources'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img, idx) => (
              <div key={idx} className="group relative">
                <img 
                  src={img.url} 
                  alt={img.alt} 
                  className="rounded-md shadow-md group-hover:scale-105 transition-transform object-cover w-full aspect-square" 
                />
                {img.caption && <p className="text-xs text-muted-foreground mt-1">{img.caption}</p>}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-md">
                  <Button 
                    size="sm" 
                    className="bg-white text-black hover:bg-white/90"
                    onClick={() => window.open(img.url, '_blank')}
                  >
                    {t('lesson.viewImage') || 'View Full Image'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonViewer; 