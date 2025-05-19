import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateLessonImage } from '@/utils/imageSearchUtils';

interface LessonContentProps {
  chapter: {
    heading: string;
    text: string;
    image?: {
      url: string;
      alt: string;
      caption?: string;
      searchQuery?: string;
    };
  };
  subject?: string;
  topic?: string;
  onNext: () => void;
  onPrevious: () => void;
  showPrevious: boolean;
  chapterIndex: number;
  totalChapters: number;
}

const LessonContent: React.FC<LessonContentProps> = ({
  chapter,
  subject = '',
  topic = '',
  onNext,
  onPrevious,
  showPrevious,
  chapterIndex,
  totalChapters
}) => {
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);
  const [isLoadingBetterImage, setIsLoadingBetterImage] = useState(false);
  const [imageLoadRetries, setImageLoadRetries] = useState(0);

  // Convert any line breaks in the text to paragraphs
  const renderTextWithParagraphs = (text: string) => {
    return text.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-4">
        {paragraph.trim()}
      </p>
    ));
  };

  // Reset image state when chapter changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setEnhancedImageUrl(null);
    setIsLoadingBetterImage(true);
    setImageLoadRetries(0);
  }, [chapter.heading]);

  // Fetch a better image for this chapter using Google image search
  useEffect(() => {
    const fetchBetterImage = async () => {
      // Don't try to fetch if we've already exceeded retry attempts
      if (imageLoadRetries > 2) {
        console.log(`[Image] Exceeded max retries for chapter ${chapter.heading}`);
        setIsLoadingBetterImage(false);
        return;
      }
      
      try {
        setIsLoadingBetterImage(true);
        
        // Prioritize well-formed search query
        const searchTerm = chapter.image?.searchQuery || 
          `${subject} ${topic} ${chapter.heading} educational illustration`;
        
        console.log(`[Image] Searching for better image with query: ${searchTerm}`);
        
        // Get better image using our utility
        const betterImage = await generateLessonImage(
          subject,
          topic,
          chapter.heading
        );
        
        if (betterImage && betterImage.url) {
          // If it's a placeholder image with dicebear.com, don't show it as an improvement
          const isPlaceholder = betterImage.url.includes('dicebear.com') || 
                              betterImage.url.includes('placeholder') ||
                              !betterImage.url.startsWith('http');
          
          const isDifferent = !chapter.image?.url || 
                              betterImage.url !== chapter.image.url;
                           
          if (!isPlaceholder && isDifferent) {
            console.log(`[Image] Found better image for chapter: ${chapter.heading}`);
            setEnhancedImageUrl(betterImage.url);
            setImageLoadRetries(0); // Reset retries on success
          } else {
            console.log(`[Image] No better image found or still using placeholder`);
            // If we got a placeholder but the chapter has a URL, use the chapter URL
            if (isPlaceholder && chapter.image?.url && chapter.image.url.startsWith('http')) {
              setEnhancedImageUrl(chapter.image.url);
            }
          }
        }
      } catch (error) {
        console.error(`[Image] Error fetching better image for "${chapter.heading}":`, error);
        // Increment retry counter
        setImageLoadRetries(prev => prev + 1);
      } finally {
        setIsLoadingBetterImage(false);
      }
    };
    
    // Only fetch if we don't already have a good image
    if (!enhancedImageUrl) {
      fetchBetterImage();
    }
  }, [chapter, subject, topic, enhancedImageUrl, imageLoadRetries]);

  // Handle image error
  const handleImageError = () => {
    console.log(`[Image] Error loading image for chapter: ${chapter.heading}`);
    setImageError(true);
    setImageLoaded(false);
    
    // Try to fetch a new image if we haven't exceeded retries
    if (imageLoadRetries < 3) {
      setEnhancedImageUrl(null); // Clear the URL to trigger a new fetch
      setImageLoadRetries(prev => prev + 1);
    }
  };

  // Determine which image URL to use
  const imageUrl = enhancedImageUrl || (chapter.image?.url || '');
  const hasValidImage = imageUrl && imageUrl.startsWith('http') && !imageError;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold font-display">{chapter.heading}</h2>
        <p className="text-sm text-muted-foreground">
          {t('lesson.chapter') || 'Chapter'} {chapterIndex + 1} {t('lesson.of') || 'of'} {totalChapters}
        </p>
      </div>

      {(hasValidImage || isLoadingBetterImage) && (
        <div className="my-6 text-center relative">
          {(isLoadingBetterImage || !imageLoaded) && (
            <div className="w-full h-48 bg-gray-100 animate-pulse rounded-md flex items-center justify-center">
              <span className="text-gray-400">{t('lesson.loadingImage') || 'Loading image...'}</span>
            </div>
          )}
          {hasValidImage && (
            <img
              src={imageUrl}
              alt={chapter.image?.alt || chapter.heading}
              className={`rounded-md mx-auto max-w-full max-h-80 object-contain ${imageLoaded ? '' : 'hidden'}`}
              onLoad={() => setImageLoaded(true)}
              onError={handleImageError}
            />
          )}
          {imageLoaded && chapter.image?.caption && (
            <p className="text-sm text-center text-gray-500 mt-2">
              {chapter.image.caption}
            </p>
          )}
        </div>
      )}

      <div className="space-y-4 leading-relaxed text-base">
        {renderTextWithParagraphs(chapter.text)}
      </div>

      <div className="flex justify-between mt-8">
        {showPrevious ? (
          <Button onClick={onPrevious} variant="outline" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t('lesson.previous') || 'Previous'}
          </Button>
        ) : (
          <div />
        )}
        <Button onClick={onNext} className="bg-eduPurple hover:bg-eduPurple-dark flex items-center">
          {chapterIndex < totalChapters - 1 ? (t('lesson.next') || 'Next') : (t('lesson.finish') || 'Finish')}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="flex justify-center space-x-1 pt-4">
        {Array.from({ length: totalChapters }).map((_, index) => (
          <div 
            key={index}
            className={`h-1.5 rounded-full ${
              index === chapterIndex 
                ? 'w-4 bg-eduPurple' 
                : 'w-1.5 bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default LessonContent;
