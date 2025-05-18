import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAIEducationContent } from '@/services/aiEducationService';
import { Gamepad, Award, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AIGameProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  onComplete?: () => void;
  limitProgress?: boolean;
  studentId?: string; // Added studentId prop to the interface
  recommendationId?: string; // Added recommendationId prop to track recommendation source
}

interface GameContent {
  title: string;
  objective: string;
  instructions: string[];
  materials?: string[];
  variations?: {
    easier?: string;
    harder?: string;
  };
}

const AIGame = ({ subject, gradeLevel, topic, onComplete, limitProgress = false, studentId, recommendationId }: AIGameProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [gameContent, setGameContent] = useState<GameContent | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const generateGame = async () => {
    setIsLoading(true);
    try {
      const result = await getAIEducationContent({
        contentType: 'game',
        subject,
        gradeLevel,
        topic,
        // Add language parameter to get content in the selected language
        language: language as 'en' | 'id'
      });
      
      setGameContent(result.content);
    } catch (error) {
      console.error("Failed to generate game:", error);
      toast.error(language === 'id' ? 
        "Oops! Kami tidak dapat membuat permainan saat ini. Silakan coba lagi!" : 
        "Oops! We couldn't create your game right now. Please try again!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = async () => {
    setGameStarted(true);
    
    // Track that the game was started, particularly if it's from a recommendation
    if (user && studentId && recommendationId) {
      try {
        // Import supabase
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Record that the game was started from a recommendation
        await supabase.from('learning_activities').insert([{
          student_id: studentId,
          activity_type: 'game',
          subject,
          topic,
          started_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
          completed: false,
          progress: 0,
          recommendation_id: recommendationId
        }]);
        
        // Mark the recommendation as acted upon
        await supabase
          .from('ai_recommendations')
          .update({
            acted_on: true,
            read: true,
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', recommendationId)
          .eq('student_id', studentId);
      } catch (error) {
        console.error('Error tracking game start:', error);
        // Non-critical error, don't show to user
      }
    }
    
    toast.success(
      language === 'id' ? 'Permainan dimulai!' : 'Game started!',
      { position: "bottom-right", duration: 3000 }
    );
  };

  const handleCompleteGame = async () => {
    if (onComplete) {
      onComplete();
    }
    
    // Mark the game as completed if the user is logged in
    if (user && studentId) {
      try {
        // Import supabase
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Create a summary of the game completion
        const summary = `Completed educational game about ${topic} in ${subject}. Game objective: ${gameContent?.objective}`;
        
        // Record the game completion
        await supabase.from('learning_activities').insert([{
          student_id: studentId,
          activity_type: 'game',
          subject,
          topic,
          completed: true,
          progress: 100,
          stars_earned: 3, // Standard reward for games
          completed_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
          recommendation_id: recommendationId,
          summary: summary // Store game summary
        }]);
        
        toast.success(
          language === 'id' ? 'Permainan selesai! Anda mendapatkan 3 bintang!' : 'Game completed! You earned 3 stars!',
          { position: "bottom-right", duration: 3000 }
        );
      } catch (error) {
        console.error('Error recording game completion:', error);
      }
    }
    
    // Reset for a new game
    setGameContent(null);
    setGameStarted(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-eduPurple border-t-transparent rounded-full mb-4"></div>
          <p className="text-center font-display text-lg">{t('game.creating')}</p>
          <p className="text-center text-muted-foreground">{t('game.moment')}</p>
        </CardContent>
      </Card>
    );
  }

  if (!gameContent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-display">{t('game.title')} {topic}!</CardTitle>
          <CardDescription>
            {t('game.description')} {topic} {t('game.in')} {subject}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {limitProgress && !user && (
            <div className="bg-eduPastel-purple p-4 rounded-lg mb-4">
              <h3 className="font-semibold font-display text-lg mb-2">
                {language === 'id' ? 'Akses Terbatas' : 'Limited Access'}
              </h3>
              <p className="mb-4">
                {language === 'id' 
                  ? 'Masuk untuk mengakses semua fitur permainan!' 
                  : 'Sign in to access all game features!'}
              </p>
              <Button 
                onClick={() => navigate('/auth', { state: { action: 'signin' } })}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                {language === 'id' ? 'Masuk Sekarang' : 'Sign In Now'}
              </Button>
            </div>
          )}
          <Button onClick={generateGame} className="bg-eduPurple hover:bg-eduPurple-dark">
            <Gamepad className="mr-2 h-4 w-4" />
            {t('game.create')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={gameStarted ? "border-eduPurple" : ""}>
      <CardHeader className={gameStarted ? "bg-eduPastel-purple" : ""}>
        <CardTitle className="text-xl md:text-2xl font-display">{gameContent.title}</CardTitle>
        <CardDescription>{gameContent.objective}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold font-display text-lg mb-2">{t('game.howToPlay')}</h3>
          <ol className="list-decimal pl-5 space-y-2">
            {gameContent.instructions.map((instruction, i) => (
              <li key={i}>{instruction}</li>
            ))}
          </ol>
        </div>

        {gameContent.materials && gameContent.materials.length > 0 && (
          <div>
            <h3 className="font-semibold font-display text-lg mb-2">{t('game.materials')}</h3>
            <ul className="list-disc pl-5 space-y-1">
              {gameContent.materials.map((material, i) => (
                <li key={i}>{material}</li>
              ))}
            </ul>
          </div>
        )}

        {gameContent.variations && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {gameContent.variations.easier && (
              <div className="bg-eduPastel-blue p-3 rounded-lg">
                <h4 className="font-semibold">{t('game.easier')}</h4>
                <p>{gameContent.variations.easier}</p>
              </div>
            )}
            {gameContent.variations.harder && (
              <div className="bg-eduPastel-peach p-3 rounded-lg">
                <h4 className="font-semibold">{t('game.harder')}</h4>
                <p>{gameContent.variations.harder}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardContent className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-4">
        <p className="text-yellow-800 font-medium">
          {language === 'id' 
            ? 'Beberapa fitur permainan terbatas. Masuk untuk akses penuh.' 
            : 'Some game features are limited. Sign in for full access.'}
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        {!gameStarted ? (
          <Button 
            onClick={handleStartGame} 
            className="bg-eduPurple hover:bg-eduPurple-dark"
          >
            <Gamepad className="mr-2 h-4 w-4" />
            {t('game.start')}
          </Button>
        ) : (
          <Button 
            onClick={handleCompleteGame}
            className="bg-green-600 hover:bg-green-700"
          >
            <Award className="mr-2 h-4 w-4" />
            {t('game.finished')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AIGame;
