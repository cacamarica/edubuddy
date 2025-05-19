
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LessonContentProps {
  chapter: {
    heading: string;
    text: string;
    image?: {
      url: string;
      alt: string;
      caption?: string;
    }
  };
  onNext: () => void;
  onPrevious: () => void;
  showPrevious: boolean;
  chapterIndex: number;
  totalChapters: number;
}

const LessonContent: React.FC<LessonContentProps> = ({
  chapter,
  onNext,
  onPrevious,
  showPrevious,
  chapterIndex,
  totalChapters
}) => {
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Convert any line breaks in the text to paragraphs
  const renderTextWithParagraphs = (text: string) => {
    return text.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-4">
        {paragraph.trim()}
      </p>
    ));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold font-display">{chapter.heading}</h2>
        <p className="text-sm text-muted-foreground">
          {t('lesson.chapter')} {chapterIndex + 1} {t('lesson.of')} {totalChapters}
        </p>
      </div>

      {chapter.image && !imageError && (
        <div className="my-6 text-center">
          {!imageLoaded && (
            <div className="w-full h-48 bg-gray-100 animate-pulse rounded-md flex items-center justify-center">
              <span className="text-gray-400">{t('lesson.loadingImage')}</span>
            </div>
          )}
          <img
            src={chapter.image.url}
            alt={chapter.image.alt || chapter.heading}
            className={`rounded-md mx-auto max-w-full ${imageLoaded ? '' : 'hidden'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {imageLoaded && chapter.image.caption && (
            <p className="text-sm text-center text-gray-500 mt-2">
              {chapter.image.caption}
            </p>
          )}
        </div>
      )}

      <div className="space-y-4 leading-relaxed">
        {renderTextWithParagraphs(chapter.text)}
      </div>

      <div className="flex justify-between mt-6 pt-4">
        {showPrevious ? (
          <Button onClick={onPrevious} variant="outline" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            {t('lesson.previous')}
          </Button>
        ) : (
          <div></div> {/* Empty div for spacing */}
        )}
        <Button onClick={onNext} className="bg-eduPurple hover:bg-eduPurple-dark flex items-center gap-2">
          {t('lesson.continue')}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default LessonContent;
