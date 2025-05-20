import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';

interface LessonContentProps {
  content: string;
}

const LessonContent: React.FC<LessonContentProps> = ({ content }) => {
  const { t } = useLanguage();

  // If the content is markdown, render it with ReactMarkdown
  if (content.includes('#') || content.includes('**') || content.includes('*')) {
    return (
      <div className="lesson-content prose max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2" {...props} />,
            p: ({ node, ...props }) => <p className="mb-4" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4" {...props} />,
            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
            img: ({ node, ...props }) => (
              <div className="my-4 flex justify-center">
                <img className="rounded-md max-h-80 object-contain" {...props} />
              </div>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // Otherwise, render it as plain text with paragraphs
  return (
    <div className="space-y-4 leading-relaxed text-base">
      {content.split('\n\n').map((paragraph, index) => (
        <p key={index} className="mb-4">
          {paragraph.trim()}
        </p>
      ))}
    </div>
  );
};

export default LessonContent;
