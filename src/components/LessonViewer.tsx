import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface LessonViewerProps {
  subject: string;
  topic: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  student?: any;
  summary: string;
  videoUrl?: string;
  images: { url: string; alt: string; caption?: string }[];
  onStoryMode?: () => void;
  storyModeActive?: boolean;
  storyContent?: string;
}

const LessonViewer: React.FC<LessonViewerProps> = ({
  subject,
  topic,
  gradeLevel,
  student,
  summary,
  videoUrl,
  images,
  onStoryMode,
  storyModeActive = false,
  storyContent
}) => {
  const { t } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Debug logs
  console.log('[LessonViewer] props:', { subject, topic, gradeLevel, student, summary, videoUrl, images, storyModeActive, storyContent });

  // TTS using browser speechSynthesis
  const handleReadAloud = (text: string) => {
    if (!window.speechSynthesis) return;
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('lesson.title')}: {topic}</h2>
        <Button onClick={() => handleReadAloud(storyModeActive && storyContent ? storyContent : summary)} disabled={isSpeaking}>
          {isSpeaking ? t('lesson.reading') : t('lesson.readAloud')}
        </Button>
      </div>
      <p className="text-lg">{storyModeActive && storyContent ? storyContent : summary}</p>
      <div className="flex gap-4 items-center">
        <Button variant={storyModeActive ? 'primary' : 'outline'} onClick={onStoryMode}>
          {storyModeActive ? t('lesson.storyModeOn') : t('lesson.storyMode')}
        </Button>
      </div>
      {videoUrl && (
        <div className="my-4">
          <iframe
            width="100%"
            height="315"
            src={videoUrl}
            title="YouTube Kids Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, idx) => {
          console.log('[LessonViewer] Rendering image', idx, img);
          return (
            <div key={idx} className="cursor-pointer group">
              <img src={img.url} alt={img.alt} className="rounded shadow-md group-hover:scale-105 transition-transform" />
              {img.caption && <p className="text-xs text-muted-foreground mt-1">{img.caption}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LessonViewer; 