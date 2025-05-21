import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingQuizProps {
  progress?: number;
  maxDuration?: number;
  onForceComplete?: () => void;
}

const LoadingQuiz: React.FC<LoadingQuizProps> = ({ 
  progress = 50,
  maxDuration = 15000,
  onForceComplete
}) => {
  const { t, language } = useLanguage();
  const [displayProgress, setDisplayProgress] = useState(progress);
  const [showForceButton, setShowForceButton] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Auto-advance progress and handle force completion
  useEffect(() => {
    setDisplayProgress(progress);
    let currentProgress = progress;
    
    // Status update function
    const updateStatus = (message: string) => {
      console.log('LoadingQuiz status:', message);
      setStatusMessage(message);
    };
    
    // More frequent updates for better feedback
    const autoProgressInterval = setInterval(() => {
      if (currentProgress < 99) {
        // Make progress slow down as it gets higher to feel more realistic
        const increment = currentProgress < 70 ? 2 : 
                          currentProgress < 85 ? 1 : 0.5;
        
        currentProgress += increment;
        setDisplayProgress(Math.min(currentProgress, 99));
        
        // Update status messages based on progress
        if (currentProgress > 85 && !statusMessage.includes('finalizing')) {
          updateStatus('Finalizing questions...');
        } else if (currentProgress > 70 && !statusMessage.includes('processing')) {
          updateStatus('Processing content...');
        }
      } else {
        clearInterval(autoProgressInterval);
      }
    }, 200);
    
    // Show force button after 5 seconds
    const forceButtonTimeout = setTimeout(() => {
      setShowForceButton(true);
      updateStatus('Taking longer than expected...');
    }, 5000);
    
    // Force completion after maximum duration
    const forceCompleteTimeout = setTimeout(() => {
      clearInterval(autoProgressInterval);
      setDisplayProgress(100);
      if (onForceComplete) {
        updateStatus('Force completing quiz load...');
        onForceComplete();
      }
      console.log('LoadingQuiz: Force-completing after timeout');
    }, maxDuration);
    
    return () => {
      clearInterval(autoProgressInterval);
      clearTimeout(forceButtonTimeout);
      clearTimeout(forceCompleteTimeout);
    };
  }, [progress, maxDuration, onForceComplete, statusMessage]);

  // Handle force complete button click
  const handleForceComplete = () => {
    setDisplayProgress(100);
    if (onForceComplete) {
      onForceComplete();
    }
  };
  
  // Get message based on progress
  const getMessage = () => {
    if (displayProgress < 30) {
      return language === 'id' ? 
        'Menyiapkan pertanyaan kuis...' : 
        'Preparing quiz questions...';
    }
    
    if (displayProgress >= 30 && displayProgress < 70) {
      return language === 'id' ? 
        'Membuat kuis yang menyenangkan...' : 
        'Creating a fun quiz for you...';
    }
    
    return language === 'id' ? 
      'Hampir selesai...' : 
      'Almost ready...';
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto">
      <div className="bg-eduPastel-yellow/20 rounded-xl w-full p-8 relative overflow-hidden">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="flex items-center justify-around w-full">
              <div className="text-4xl">🧙‍♂️</div>
              <div className="text-4xl">🔮</div>
            </div>
            <div className="flex items-center justify-center mt-4 mb-4">
              <div className="text-4xl">📚</div>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-center">{getMessage()}</h3>
          <p className="text-gray-600 text-center">Preparing your quiz...</p>
          
          {statusMessage && (
            <p className="text-eduPurple text-center text-sm italic">{statusMessage}</p>
          )}
          
          <Progress value={displayProgress} className="w-full bg-eduPastel-purple/30" />
          <div className="flex justify-between w-full">
            <p>{displayProgress.toFixed(0)}%</p>
            {displayProgress >= 95 && (
              <div className="animate-spin">
                <Loader2 className="h-4 w-4 text-eduPurple" />
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center w-full overflow-hidden">
            <div className="flex space-x-2 text-2xl animate-pulse">
              {['🌵', '🌳', '🪨', '🪨', '🌵', '🪨', '🪨', '🌵', '🪨'].map((emoji, i) => (
                <span key={i}>{emoji}</span>
              ))}
            </div>
          </div>
          
          {showForceButton && (
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleForceComplete}
                className="text-xs"
              >
                {language === 'id' ? 'Lanjutkan ke kuis' : 'Continue to quiz'}
              </Button>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {language === 'id' 
                  ? 'Klik tombol di atas jika pemuatan terlalu lama' 
                  : 'Click the button above if loading takes too long'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingQuiz;
