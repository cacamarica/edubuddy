import React, { useState, useEffect } from 'react';
import { searchVideos } from '@/services/videoSearchService';
import { searchImages } from '@/services/imageSearchService';
import YouTubeEmbed from '@/components/YouTubeEmbed';

interface LessonSummaryVideoProps {
  lessonContent: any;
  subject: string;
  topic: string;
}

const LessonSummaryVideo: React.FC<LessonSummaryVideoProps> = ({
  lessonContent,
  subject,
  topic
}) => {
  const [videoId, setVideoId] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [videoLoadError, setVideoLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setVideoLoadError(false);

    // Extract all content from the lesson for comprehensive analysis
    const extractAllContent = () => {
      let allContent = '';
      
      // Add title and introduction
      allContent += `${lessonContent.title || topic} `;
      allContent += `${lessonContent.introduction || ''} `;
      
      // Add all chapter content
      if (lessonContent.mainContent && Array.isArray(lessonContent.mainContent)) {
        lessonContent.mainContent.forEach((chapter: any) => {
          allContent += `${chapter.heading || chapter.title || ''} `;
          allContent += `${chapter.content || chapter.text || ''} `;
        });
      }
      
      // Add conclusion and summary
      allContent += `${lessonContent.conclusion || ''} `;
      allContent += `${lessonContent.summary || ''} `;
      
      return allContent;
    };

    // Get the comprehensive content
    const allLessonContent = extractAllContent();
    
    // Create focused search query with educational context
    const videoSearchQuery = `${subject}: ${topic} educational video for students`;
    
    // Call our enhanced video search service with the full lesson content
    searchVideos(videoSearchQuery, allLessonContent)
      .then(result => {
        if (isMounted && result && result.videoId) {
          console.log(`Found video for "${topic}": ${result.title}`);
          setVideoId(result.videoId);
          setVideoTitle(result.title);
          setIsLoading(false);
        } else {
          // Video not found
          setVideoLoadError(true);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error("Error in lesson video search:", err);
        if (isMounted) {
          setVideoLoadError(true);
          setIsLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [lessonContent, subject, topic]);

  // Handle video loading errors
  const handleVideoError = () => {
    console.log("Video error detected, removing video section");
    setVideoLoadError(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-pulse flex flex-col items-center">
          <div className="bg-gray-300 h-32 w-full max-w-xl rounded-md"></div>
          <div className="bg-gray-300 h-4 w-40 mt-3 rounded"></div>
        </div>
      </div>
    );
  }

  // If video fails to load or is unavailable, render nothing
  if (videoLoadError || !videoId) {
    return null;
  }

  // Only show video if it's available and no errors
  return (
    <div className="my-8" id="summary-video-container">
      <h3 className="text-xl font-bold mb-4 text-center">Educational Video</h3>
      <div className="max-w-2xl mx-auto">
        <YouTubeEmbed 
          videoId={videoId}
          title={videoTitle || `Educational video about ${topic}`}
          className="rounded-lg shadow-lg"
          onError={() => {
            handleVideoError();
            // Remove the entire container immediately
            const container = document.getElementById('summary-video-container');
            if (container) {
              container.remove();
            }
          }}
        />
        <p className="text-sm text-gray-500 italic text-center mt-3">
          {videoTitle || `Educational video about ${topic} in ${subject}`}
        </p>
      </div>
    </div>
  );
};

export default LessonSummaryVideo; 