import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Gamepad, RefreshCw, Award } from 'lucide-react';
import { getAIEducationContent } from '@/services/aiEducationService';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIGameProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  limitProgress?: boolean;
  studentId?: string;
  studentName?: string;
  autoStart?: boolean;
  recommendationId?: string;
}

interface GameData {
  title: string;
  objective: string;
  instructions: string;
  materials?: string[];
  variations?: {
    easier?: string;
    harder?: string;
  };
  image?: {
    url: string;
    alt: string;
    caption?: string;
  };
}

const AIGame: React.FC<AIGameProps> = ({
  subject,
  gradeLevel,
  topic,
  limitProgress = false,
  studentId,
  studentName,
  autoStart = false,
  recommendationId
}) => {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [gameStarted, setGameStarted] = useState(autoStart);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [showLimitedFeatureAlert, setShowLimitedFeatureAlert] = useState(limitProgress);

  // Fetch game content
  const fetchGameContent = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAIEducationContent({
        contentType: 'game',
        subject,
        gradeLevel,
        topic,
        language
      });
      
      if (result?.content) {
        // Format the game data properly
        setGameData({
          title: result.content.title || `${topic} Game`,
          objective: result.content.objective || '',
          instructions: result.content.instructions || '',
          materials: result.content.materials,
          variations: result.content.variations,
          image: result.content.image || {
            url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(topic)}-game&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9,b6e3f4`,
            alt: `Game illustration for ${topic}`
          }
        });
      }
      
      // Mark recommendation as acted on if it exists
      if (recommendationId) {
        supabase
          .from('ai_recommendations')
          .update({ acted_on: true })
          .eq('id', recommendationId);
      }
    } catch (error) {
      console.error('Error fetching game content:', error);
    } finally {
      setLoading(false);
    }
  }, [subject, gradeLevel, topic, language, recommendationId]);

  // Load initial content
  useEffect(() => {
    fetchGameContent();
  }, [fetchGameContent]);

  // Track game interactions
  const trackInteraction = useCallback(() => {
    setInteractionCount(prev => prev + 1);
    
    // Record game interaction in supabase
    if (studentId && interactionCount === 0) {
      supabase.from('learning_activities').insert([{
        student_id: studentId,
        activity_type: 'game',
        subject: subject,
        topic: topic,
        progress: 25,
        completed: false
      }]);
    }
    
    // Mark as completed after several interactions
    if (interactionCount >= 3 && !gameCompleted) {
      setGameCompleted(true);
      
      if (studentId) {
        supabase.from('learning_activities').insert([{
          student_id: studentId,
          activity_type: 'game_completed',
          subject: subject,
          topic: topic,
          progress: 100,
          completed: true
        }]);
      }
    }
  }, [interactionCount, gameCompleted, studentId, subject, topic]);

  // Start the game
  const handleStartGame = () => {
    setGameStarted(true);
    trackInteraction();
  };

  // Handle completion button click
  const handleCompleteGame = () => {
    setGameCompleted(true);
    trackInteraction();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Show limited features alert
  if (showLimitedFeatureAlert) {
    return (
      <Alert className="mb-4 bg-yellow-50 border-yellow-200">
        <AlertDescription>
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{t('game.limitedFeature')}</h3>
              <p>{t('game.signInToPlay')}</p>
            </div>
            <div>
              <Button
                onClick={() => setShowLimitedFeatureAlert(false)}
                variant="default"
                className="bg-eduPurple hover:bg-eduPurple-dark"
              >
                {t('common.tryAnyway')}
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show introduction if game not started
  if (!gameStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-display">
            {gameData?.title || `${topic} ${t('game.title')}`}
          </CardTitle>
          <CardDescription>
            {t('game.description')} {topic} {t('game.in')} {subject}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {gameData?.image && (
            <div className="flex justify-center my-4">
              <img
                src={gameData.image.url}
                alt={gameData.image.alt || "Game illustration"}
                className="rounded-md max-h-40 object-contain"
              />
            </div>
          )}
          
          {gameData?.objective && (
            <div>
              <h3 className="font-semibold mb-1">{t('game.objective')}</h3>
              <p>{gameData.objective}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleStartGame} className="bg-eduPurple hover:bg-eduPurple-dark">
            <Gamepad className="mr-2 h-4 w-4" />
            {t('game.start')}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show game content
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-display">
              {gameData?.title || `${topic} ${t('game.title')}`}
            </CardTitle>
            <CardDescription>
              {t('game.forSubject')} {subject}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchGameContent}
            className="h-8 w-8"
            title={t('game.newGame')}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {gameData?.image && (
          <div className="flex justify-center my-4">
            <img
              src={gameData.image.url}
              alt={gameData.image.alt || "Game illustration"}
              className="rounded-md max-h-60 object-contain"
            />
          </div>
        )}
        
        <div>
          <h3 className="font-semibold text-lg mb-2">{t('game.howToPlay')}</h3>
          <div className="bg-gray-50 p-4 rounded-md text-gray-800">
            <p className="whitespace-pre-wrap">{gameData?.instructions}</p>
          </div>
        </div>
        
        {gameData?.materials && gameData.materials.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-2">{t('game.materials')}</h3>
            <ul className="list-disc pl-5 space-y-1">
              {gameData.materials.map((material, index) => (
                <li key={index}>{material}</li>
              ))}
            </ul>
          </div>
        )}
        
        {gameData?.variations && (
          <div>
            <h3 className="font-semibold text-lg mb-2">{t('game.variations')}</h3>
            {gameData.variations.easier && (
              <div className="mb-2">
                <h4 className="font-medium">{t('game.easier')}:</h4>
                <p>{gameData.variations.easier}</p>
              </div>
            )}
            {gameData.variations.harder && (
              <div>
                <h4 className="font-medium">{t('game.harder')}:</h4>
                <p>{gameData.variations.harder}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={trackInteraction}>
          {t('game.gotIt')}
        </Button>
        
        {!gameCompleted ? (
          <Button onClick={handleCompleteGame} className="bg-eduPurple hover:bg-eduPurple-dark">
            {t('game.finished')}
          </Button>
        ) : (
          <Button variant="outline" disabled className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            {t('game.completed')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AIGame;
