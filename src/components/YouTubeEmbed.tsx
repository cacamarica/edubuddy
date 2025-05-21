import React, { useState, useEffect } from 'react';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  onError?: () => void;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ 
  videoId, 
  title = 'YouTube video player',
  className = '',
  autoplay = false,
  onError
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(true);

  // Use a ref to track the iframe element
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // Check if video is available using YouTube API
  useEffect(() => {
    const checkVideoAvailability = async () => {
      try {
        // Direct way to check availability by making a HEAD request to the thumbnail
        const img = new Image();
        img.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        
        img.onload = () => {
          // Check if the image is the default "no thumbnail" image (has a specific size pattern)
          if (img.width === 120 && img.height === 90) {
            console.log('Video unavailable - default thumbnail detected');
            handleError();
          } else {
            setCheckingAvailability(false);
          }
        };
        
        img.onerror = () => {
          console.log('Error loading thumbnail - video likely unavailable');
          handleError();
        };
      } catch (error) {
        console.error('Error checking video availability:', error);
        handleError();
      }
    };
    
    checkVideoAvailability();
    
    // Set a timeout to catch any videos that don't load within 5 seconds
    const timeoutId = setTimeout(() => {
      if (checkingAvailability && !isLoaded) {
        console.log('Video load timeout - marking as unavailable');
        handleError();
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [videoId]);

  // Create the YouTube embed URL with parameters
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0${autoplay ? '&autoplay=1' : ''}`;
  
  // Handle all error types in one place
  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      if (onError) {
        onError();
      }
    }
  };
  
  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoaded(true);
    setCheckingAvailability(false);
  };

  // Set up message listener for YouTube errors
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check if message is from YouTube
      if (event.origin.includes('youtube.com')) {
        try {
          // Some YouTube error events include JSON data
          const data = JSON.parse(event.data);
          if (data.event === 'onError' || data.info === 'videoNotFound') {
            handleError();
          }
        } catch (e) {
          // Check for string error messages
          if (typeof event.data === 'string' && 
             (event.data.includes('error') || 
              event.data.includes('not available') || 
              event.data.includes('not found'))) {
            handleError();
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onError]);

  // If error is already detected, don't render the iframe
  if (hasError) {
    return null;
  }

  return (
    <div className={`youtube-embed-container relative w-full overflow-hidden ${className}`} style={{ paddingTop: '56.25%' }}>
      <iframe
        ref={iframeRef}
        className="absolute top-0 left-0 w-full h-full rounded-md shadow-md"
        src={embedUrl}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onError={handleError}
        onLoad={handleIframeLoad}
      ></iframe>
    </div>
  );
};

export default YouTubeEmbed; 