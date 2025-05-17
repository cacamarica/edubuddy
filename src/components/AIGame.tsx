
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAIEducationContent } from '@/services/aiEducationService';
import { Gamepad, Award } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface AIGameProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  onComplete?: () => void;
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

const AIGame = ({ subject, gradeLevel, topic, onComplete }: AIGameProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [gameContent, setGameContent] = useState<GameContent | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const { t, language } = useLanguage();

  const generateGame = async () => {
    setIsLoading(true);
    try {
      const result = await getAIEducationContent({
        contentType: 'game',
        subject,
        gradeLevel,
        topic,
        // Add language parameter to get content in the selected language
        question: language === 'id' ? 
          `Buatkan permainan dalam Bahasa Indonesia tentang ${topic} untuk tingkat ${gradeLevel}` : 
          undefined
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

  const handleStartGame = () => {
    setGameStarted(true);
    toast.success(language === 'id' ? 
      "Permainan dimulai! Selamat bersenang-senang sambil belajar!" : 
      "Game started! Have fun learning!", {
      icon: <Gamepad className="h-5 w-5" />,
    });
  };

  const handleCompleteGame = () => {
    toast.success(language === 'id' ? 
      "Kamu telah menyelesaikan permainan! Kerja bagus!" : 
      "You completed the game! Great job!", {
      icon: <Award className="h-5 w-5" />,
    });
    if (onComplete) onComplete();
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
        <CardContent className="flex justify-center">
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
