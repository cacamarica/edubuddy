import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Gamepad, RefreshCw, Award } from 'lucide-react';
import { getAIEducationContent } from '@/services/aiEducationService';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FunLoadingAnimation from './FunLoadingAnimation';

interface AIGameProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  subtopic?: string;
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
  subtopic,
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
        subtopic,
        language,
        enhancedParams: {
          gameType: 'scientific_activity',
          useHouseholdMaterials: true,
          requireMinimalEquipment: true,
          collaborativeActivity: true,
          curriculumStandard: 'cambridge',
          focusOnSubtopic: !!subtopic,
          alignWithCurriculum: true,
          emphasizeSubtopics: subtopic ? 
            [subtopic.toLowerCase()] : 
            topic.toLowerCase().includes('living things') ? [
              'characteristics of living things',
              'classification of organisms',
              'adaptation and evolution',
              'life processes',
              'ecosystems'
            ] : undefined,
          difficultyLevel: gradeLevel === 'k-3' ? 'easy' : 
                          gradeLevel === '4-6' ? 'medium' : 'challenging',
          learningObjectives: true,
          educationalGoals: [
            `Understand key concepts in ${topic}${subtopic ? ` related to ${subtopic}` : ''}`,
            `Apply scientific thinking to ${subtopic || topic} scenarios`,
            `Develop practical skills through hands-on learning`
          ],
          alignWithGradeLevel: gradeLevel,
          gradeAppropriate: true
        }
      });
      
      if (result?.content) {
        // Format the game data properly
        setGameData({
          title: result.content.title || (subtopic ? `${topic}: ${subtopic} Game` : `${topic} Game`),
          objective: result.content.objective || '',
          instructions: result.content.instructions || '',
          materials: result.content.materials,
          variations: result.content.variations,
          image: result.content.image || {
            url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(topic + (subtopic || ''))}-game&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9,b6e3f4`,
            alt: subtopic ? `Game illustration for ${topic}: ${subtopic}` : `Game illustration for ${topic}`
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
  }, [subject, gradeLevel, topic, subtopic, language, recommendationId]);

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
      <FunLoadingAnimation 
        contentType="game"
        theme={
          topic.toLowerCase().includes('dinosaur') ? 'dinosaur' : 
          topic.toLowerCase().includes('space') ? 'space' :
          topic.toLowerCase().includes('ocean') || topic.toLowerCase().includes('water') ? 'ocean' :
          topic.toLowerCase().includes('robot') ? 'robot' :
          undefined
        }
        showProgress={true}
      />
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
            {t('game.start') || 'Start Game'} <span className="ml-1 text-yellow-200">✨</span>
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
        
        {/* Add Learning Objectives */}
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <h3 className="font-semibold text-lg mb-2 text-blue-700">Learning Objectives</h3>
          <p className="text-blue-800">While playing this game, you will learn about:</p>
          <ul className="list-disc pl-5 space-y-1 text-blue-800 mt-2">
            <li>Key concepts in {topic} ({subject})</li>
            <li>Practical applications of scientific principles</li>
            <li>How to conduct a simple scientific investigation</li>
            {topic.toLowerCase().includes('living things') && (
              <>
                <li>Characteristics that define living organisms</li>
                <li>Classification of different organisms</li>
                <li>How living things interact with their environment</li>
              </>
            )}
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold text-lg mb-2">{t('game.howToPlay')}</h3>
          <div className="bg-gray-50 p-4 rounded-md text-gray-800">
            <p className="whitespace-pre-wrap">{gameData?.instructions}</p>
          </div>
        </div>
        
        {gameData?.materials && gameData.materials.length > 0 && (
          <div className="bg-emerald-50 p-4 rounded-md border border-emerald-100">
            <h3 className="font-semibold text-lg mb-2 text-emerald-700">{t('game.materials')}</h3>
            <p className="text-sm text-emerald-700 mb-2">You'll need these simple items to play:</p>
            <ul className="list-disc pl-5 space-y-1 text-emerald-800">
              {gameData.materials.map((material, index) => (
                <li key={index} className="flex items-center">
                  <span className="mr-2">📦</span> {material}
                </li>
              ))}
            </ul>
            <p className="text-xs italic mt-3 text-emerald-600">All materials are common household or classroom items.</p>
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
