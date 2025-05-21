import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';
import { cleanMarkdownText } from '@/utils/lessonUtils';
import { searchImages } from '@/services/imageSearchService';

interface Reference {
  title: string;
  author?: string;
  year?: string;
  url?: string;
  publicationName?: string;
  description?: string;
}

interface LessonContentProps {
  content?: string;
  title?: string;
  chapter?: any; // Full chapter object
  showReferences?: boolean;
  subject?: string;
  topic?: string;
}

const LessonContent: React.FC<LessonContentProps> = ({ content, title, chapter, showReferences = true, subject, topic }) => {
  const { t } = useLanguage();
  const [educationalImage, setEducationalImage] = useState<{url: string, alt: string} | null>(null);
  const [imageError, setImageError] = useState(false);
  
  // Get content from either direct prop or chapter object
  const contentText = content || 
                     (chapter?.content) || 
                     (chapter?.text) || 
                     '';
  
  // Extract references from chapter
  const references: Reference[] = chapter?.references || [];
  
  // Validate if an image URL is likely educational
  const validateEducationalImage = (url: string): boolean => {
    // Check for common non-educational image patterns
    const nonEducationalPatterns = [
      'music', 'concert', 'poster', 'flyer', 'advertisement', 
      'fashion', 'party', 'entertainment', 'free-your-music'
    ];
    
    // Check if URL contains any non-educational terms
    const lowercaseUrl = url.toLowerCase();
    return !nonEducationalPatterns.some(pattern => lowercaseUrl.includes(pattern));
  };
  
  // Fetch relevant educational image for content
  useEffect(() => {
    // Only search for images if we have content and a subject/topic
    if (contentText && (subject || topic)) {
      // Make the search query more specific for educational content
      const searchQuery = `${subject || ''} ${topic || ''} ${title || chapter?.title || ''} educational diagram`.trim();
      
      searchImages(searchQuery, contentText)
        .then(result => {
          if (result) {
            // Validate that the image is educational
            if (validateEducationalImage(result.url)) {
              setEducationalImage(result);
              setImageError(false);
            } else {
              console.log("Rejected non-educational image:", result.url);
              setImageError(true);
              // Try again with a more specific educational query
              return searchImages(`${topic} educational diagram illustration`, contentText);
            }
          }
          return null;
        })
        .then(secondResult => {
          if (secondResult && imageError) {
            // Validate the second result
            if (validateEducationalImage(secondResult.url)) {
              setEducationalImage(secondResult);
              setImageError(false);
            } else {
              setImageError(true);
            }
          }
        })
        .catch(error => {
          console.error("Error fetching educational image:", error);
          setImageError(true);
        });
    }
  }, [contentText, subject, topic, title, chapter?.title]);

  // Function to format long paragraphs for better readability
  const formatParagraph = (text: string) => {
    // For very long paragraphs, add some visual aids
    if (text.length < 200) return text;
    
    // Add subtle paragraph indentation for easier reading
    return text;
  };

  // Handle image load errors
  const handleImageError = () => {
    console.log("Image failed to load, removing from display");
    setImageError(true);
    setEducationalImage(null);
  };

  // Always use ReactMarkdown for consistent rendering
  const contentSection = (
    <div className="lesson-content prose max-w-3xl mx-auto">
      {title && <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-gray-200">{title}</h2>}
      {chapter?.title && !title && <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-gray-200">{chapter.title}</h2>}
      
      {/* Educational Image (if available and valid) */}
      {educationalImage && !imageError && (
        <div className="my-6 flex justify-center">
          <figure className="max-w-lg">
            <img 
              src={educationalImage.url} 
              alt={educationalImage.alt} 
              className="rounded-lg shadow-md max-h-72 object-contain mx-auto"
              onError={handleImageError}
            />
            <figcaption className="mt-2 text-sm text-center text-gray-500 italic">
              {educationalImage.alt}
            </figcaption>
          </figure>
        </div>
      )}
      
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-5 mt-8 text-eduPurple-800 pb-2 border-b border-gray-200" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-4 mt-7 text-eduPurple-700" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-3 mt-6 text-eduPurple-600" {...props} />,
          p: ({ node, children, ...props }) => {
            const content = children ? children.toString() : '';
            const isLong = content.length > 250;
            
            return (
              <p 
                className={`mb-6 ${isLong ? 'text-base mx-auto leading-7 tracking-wide' : 'text-base leading-relaxed'}`}
                style={{ 
                  maxWidth: isLong ? '95%' : 'none',
                  textAlign: 'justify', 
                  hyphens: 'auto',
                  wordSpacing: '0.05em'
                }}
                {...props} 
              />
            );
          },
          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-6 space-y-2" {...props} />,
          li: ({ node, ...props }) => <li className="mb-3 pl-1" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-eduPurple-900" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-eduPurple-700" {...props} />,
          img: ({ node, ...props }) => (
            <div className="my-6 flex justify-center">
              <img 
                className="rounded-md max-h-96 object-contain shadow-sm" 
                {...props} 
                onError={(e) => {
                  // Hide broken images
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-eduPurple-300 pl-4 italic my-6 text-gray-700 bg-gray-50 py-3 rounded-r-md" {...props} />
          ),
          code: ({ node, className, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !className || !match;
            
            return isInline ? (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />
            ) : (
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto my-6 shadow-sm">
                <code className={className} {...props} />
              </pre>
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6 rounded-md border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 bg-eduPurple-50 text-left text-sm font-medium text-eduPurple-700 uppercase tracking-wider" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-3 whitespace-normal text-sm border-b border-gray-100" {...props} />
          ),
        }}
      >
        {/* Apply pre-processing for both markdown and plain text */}
        {contentText}
      </ReactMarkdown>
    </div>
  );

  // References section
  const referencesSection = showReferences && references.length > 0 && (
    <div className="mt-8 pt-4 border-t border-gray-200">
      <h3 className="text-lg font-semibold mb-3">{t('lesson.references') || 'References'}</h3>
      <ul className="space-y-2 text-sm">
        {references.map((ref, index) => (
          <li key={index} className="text-gray-700">
            {ref.title}
            {ref.author && <span>, {ref.author}</span>}
            {ref.year && <span> ({ref.year})</span>}
            {ref.publicationName && <span>, {ref.publicationName}</span>}
            {ref.url && (
              <a href={ref.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-eduPurple hover:underline inline-flex items-center gap-1">
                <span className="text-xs">[Link]</span>
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="mt-4">
      {contentSection}
      {referencesSection}
    </div>
  );
};

export default LessonContent;
