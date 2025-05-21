import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';

// Animation themes with their respective emojis and messages
const animationThemes = [
  {
    name: 'dinosaur',
    emoji: '🦖',
    companions: ['🦕', '🌋', '🌴', '🌿', '🦎'],
    message: {
      en: 'Dinosaurs are searching for knowledge...',
      id: 'Dinosaurus sedang mencari pengetahuan...'
    },
    roadElements: ['🪨', '🌵', '🌳'],
    backgroundStyle: 'bg-gradient-to-b from-amber-50 to-yellow-100'
  },
  {
    name: 'ufo',
    emoji: '🛸',
    companions: ['👽', '✨', '🌠', '🔭', '🚀'],
    message: {
      en: 'UFOs are collecting cosmic wisdom...',
      id: 'UFO sedang mengumpulkan kebijaksanaan kosmik...'
    },
    roadElements: ['☁️', '🌤️', '🐦'],
    backgroundStyle: 'bg-gradient-to-b from-indigo-50 to-blue-100'
  },
  {
    name: 'robot',
    emoji: '🤖',
    companions: ['⚙️', '💻', '📡', '🔌', '🧰'],
    message: {
      en: 'Robots are processing information...',
      id: 'Robot sedang memproses informasi...'
    },
    roadElements: ['🔩', '💾', '🔋'],
    backgroundStyle: 'bg-gradient-to-b from-slate-50 to-slate-200'
  },
  {
    name: 'ocean',
    emoji: '🐠',
    companions: ['🐙', '🐬', '🌊', '🦈', '🐚'],
    message: {
      en: 'Diving deep into the ocean of knowledge...',
      id: 'Menyelam ke dalam lautan pengetahuan...'
    },
    roadElements: ['🌊', '🐚', '🐙'],
    backgroundStyle: 'bg-gradient-to-b from-blue-50 to-cyan-100'
  },
  {
    name: 'space',
    emoji: '🚀',
    companions: ['🌌', '🪐', '🌟', '☄️', '🌓'],
    message: {
      en: 'Traveling through the cosmos of education...',
      id: 'Menjelajahi kosmos pendidikan...'
    },
    roadElements: ['🌠', '💫', '⭐'],
    backgroundStyle: 'bg-gradient-to-b from-slate-800 to-blue-900'
  },
  {
    name: 'magical',
    emoji: '🧙',
    companions: ['✨', '🔮', '📚', '🧪', '🪄'],
    message: {
      en: 'Casting educational spells...',
      id: 'Merapalkan mantra pendidikan...'
    },
    roadElements: ['🌈', '✨', '💫'],
    backgroundStyle: 'bg-gradient-to-b from-purple-50 to-fuchsia-100'
  }
];

interface FunLoadingAnimationProps {
  message?: string;
  contentType?: 'lesson' | 'quiz' | 'game';
  fixed?: boolean; // Whether to use a fixed theme or random
  theme?: 'dinosaur' | 'ufo' | 'robot' | 'ocean' | 'space' | 'magical';
  progress?: number; // Progress percentage (0-100)
  showProgress?: boolean; // Whether to show progress bar
}

// Array of loading stage messages
const loadingStages = {
  en: [
    "Starting up...",
    "Gathering information...",
    "Processing data...",
    "Preparing content...",
    "Almost ready...",
    "Final touches..."
  ],
  id: [
    "Memulai...",
    "Mengumpulkan informasi...",
    "Memproses data...",
    "Menyiapkan konten...",
    "Hampir siap...",
    "Sentuhan akhir..."
  ]
};

const FunLoadingAnimation: React.FC<FunLoadingAnimationProps> = ({ 
  message,
  contentType,
  fixed = false,
  theme,
  progress = 0,
  showProgress = true
}) => {
  const { language } = useLanguage();
  const [selectedTheme, setSelectedTheme] = useState<typeof animationThemes[0] | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [roadElements, setRoadElements] = useState<JSX.Element[]>([]);
  const [obstacles, setObstacles] = useState<JSX.Element[]>([]);

  // Initialize theme
  useEffect(() => {
    if (fixed && theme) {
      const themeData = animationThemes.find(t => t.name === theme);
      setSelectedTheme(themeData || animationThemes[0]);
    } else {
      // Select a random theme on mount
      const randomIndex = Math.floor(Math.random() * animationThemes.length);
      setSelectedTheme(animationThemes[randomIndex]);
    }
  }, [fixed, theme]);

  // Handle automatic progress animation if no progress is provided
  useEffect(() => {
    if (progress > 0) {
      // Use the provided progress value
      setAnimationProgress(progress);
      
      // Update stage based on progress
      const stageIndex = Math.min(
        Math.floor(progress / 20),
        loadingStages[language === 'id' ? 'id' : 'en'].length - 1
      );
      setCurrentStage(stageIndex);
    } else {
      // Auto-increment progress for visual effect when no actual progress is provided
      const timer = setInterval(() => {
        setAnimationProgress(prev => {
          // Simulate slower progress at higher percentages
          const increment = prev < 70 ? 1 : 0.5;
          const newProgress = Math.min(prev + increment, 95);
          
          // Update stage based on progress
          const stageIndex = Math.min(
            Math.floor(newProgress / 20),
            loadingStages[language === 'id' ? 'id' : 'en'].length - 1
          );
          setCurrentStage(stageIndex);
          
          return newProgress;
        });
      }, 100);
      
      return () => clearInterval(timer);
    }
  }, [progress, language]);

  // Generate road elements every second
  useEffect(() => {
    if (!selectedTheme) return;
    
    // Create initial road
    const initialRoadElements: JSX.Element[] = [];
    for (let i = 0; i < 10; i++) {
      const element = selectedTheme.roadElements[Math.floor(Math.random() * selectedTheme.roadElements.length)];
      initialRoadElements.push(
        <div 
          key={`road-${i}`} 
          className="absolute text-xl animate-fade-in-out"
          style={{
            bottom: '8px',
            left: `${i * 10}%`,
            opacity: 0.7,
            animation: `fade-in-out ${(Math.random() * 3) + 5}s infinite`
          }}
        >
          {element}
        </div>
      );
    }
    setRoadElements(initialRoadElements);
    
    // Generate new obstacles
    const timer = setInterval(() => {
      const now = Date.now();
      const newObstacles = [...obstacles];
      
      // Remove old obstacles
      while (newObstacles.length > 0 && newObstacles[0].key === undefined) {
        newObstacles.shift();
      }
      
      // Add a new obstacle
      if (selectedTheme.name === 'ufo') {
        // Flying birds for UFO theme
        const randomBird = Math.random() > 0.5 ? '🐦' : '🕊️';
        newObstacles.push(
          <div
            key={`obstacle-${now}`}
            className="absolute text-xl animate-fly-across"
            style={{
              right: '-50px',
              top: `${Math.random() * 50 + 20}%`,
              animation: `fly-across ${(Math.random() * 2) + 3}s linear`
            }}
          >
            {randomBird}
          </div>
        );
      } else if (selectedTheme.name === 'space') {
        // Asteroids for space theme
        const randomAsteroid = Math.random() > 0.5 ? '☄️' : '🌠';
        newObstacles.push(
          <div
            key={`obstacle-${now}`}
            className="absolute text-xl animate-diagonal-across"
            style={{
              right: '-50px',
              top: `${Math.random() * 60}%`,
              animation: `diagonal-across ${(Math.random() * 3) + 4}s linear`
            }}
          >
            {randomAsteroid}
          </div>
        );
      } else {
        // Ground obstacles for other themes
        const obstaclePool = ['🌵', '🪨', '🌳', '🍄'];
        const randomObstacle = obstaclePool[Math.floor(Math.random() * obstaclePool.length)];
        newObstacles.push(
          <div
            key={`obstacle-${now}`}
            className="absolute text-xl animate-obstacle"
            style={{
              right: '-50px',
              bottom: '8px',
              animation: `obstacle ${(Math.random() * 2) + 5}s linear`
            }}
          >
            {randomObstacle}
          </div>
        );
      }
      
      setObstacles(newObstacles);
    }, 2000);
    
    return () => clearInterval(timer);
  }, [selectedTheme, obstacles]);

  // If no theme is selected yet, show a default loading animation
  if (!selectedTheme) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-eduPurple border-t-transparent rounded-full"></div>
          <p className="text-center font-display text-lg mt-4">Loading...</p>
          {showProgress && (
            <div className="w-full max-w-md mt-6">
              <Progress value={45} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Generate content type specific message
  let typeMessage = '';
  if (contentType) {
    if (language === 'id') {
      typeMessage = contentType === 'lesson' ? 'pelajaran' : 
                    contentType === 'quiz' ? 'kuis' : 'permainan';
      typeMessage = `Menyiapkan ${typeMessage} untukmu...`;
    } else {
      typeMessage = `Preparing your ${contentType}...`;
    }
  }

  // Get current stage message
  const stageMessage = loadingStages[language === 'id' ? 'id' : 'en'][currentStage];

  // Use provided message, or default to theme message
  const displayMessage = message || (language === 'id' ? selectedTheme.message.id : selectedTheme.message.en);

  return (
    <Card>
      <CardContent className={`pt-6 flex flex-col items-center justify-center h-80 ${selectedTheme.backgroundStyle} relative overflow-hidden`}>
        {/* Road or background */}
        <div className="absolute bottom-0 left-0 right-0 h-12">
          {selectedTheme.name === 'ocean' ? (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-blue-300 opacity-60 rounded-t-xl"></div>
          ) : selectedTheme.name === 'space' ? (
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-slate-700 opacity-60"></div>
          ) : (
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-amber-200 opacity-60"></div>
          )}
        </div>
        
        {/* Road elements */}
        {roadElements}
        
        {/* Obstacles */}
        {obstacles}

        {/* Main moving character */}
        <div className="relative w-full h-40 mb-8 overflow-hidden">
          {selectedTheme.name === 'ufo' || selectedTheme.name === 'space' ? (
            // Flying characters (UFO or rocket)
            <div className="absolute top-1/3 transform -translate-y-1/2 animate-float-horizontal">
              <span className="text-6xl">{selectedTheme.emoji}</span>
            </div>
          ) : (
            // Running characters (dinosaur, robot, etc.)
            <div className="absolute bottom-0 transform -translate-y-1/2 animate-run">
              <span className="text-6xl">{selectedTheme.emoji}</span>
            </div>
          )}
          
          {/* Background elements */}
          <div className="absolute left-[20%] top-[30%] animate-float">
            <span className="text-3xl">{selectedTheme.companions[0]}</span>
          </div>
          <div className="absolute left-[60%] top-[10%] animate-float-delay">
            <span className="text-3xl">{selectedTheme.companions[1]}</span>
          </div>
          <div className="absolute left-[80%] top-[60%] animate-float-slow">
            <span className="text-3xl">{selectedTheme.companions[2]}</span>
          </div>
          
          {/* Additional dynamic elements based on theme */}
          {selectedTheme.name === 'space' && (
            <>
              <div className="absolute left-[15%] top-[5%] animate-twinkle">
                <span className="text-xl">⭐</span>
              </div>
              <div className="absolute left-[45%] top-[15%] animate-twinkle-delay">
                <span className="text-xl">⭐</span>
              </div>
              <div className="absolute left-[75%] top-[25%] animate-twinkle">
                <span className="text-sm">⭐</span>
              </div>
            </>
          )}
          
          {selectedTheme.name === 'magical' && (
            <>
              <div className="absolute left-[30%] top-[40%] animate-magic">
                <span className="text-xl">✨</span>
              </div>
              <div className="absolute left-[50%] top-[20%] animate-magic-delay">
                <span className="text-xl">✨</span>
              </div>
            </>
          )}
        </div>
        
        {/* Loading message */}
        <p className={`text-center font-display text-lg ${selectedTheme.name === 'space' ? 'text-white' : ''}`}>{displayMessage}</p>
        {typeMessage && <p className={`text-center text-muted-foreground ${selectedTheme.name === 'space' ? 'text-blue-200' : ''}`}>{typeMessage}</p>}
        
        {/* Stage message */}
        <p className={`text-center text-sm mt-2 ${selectedTheme.name === 'space' ? 'text-blue-300' : 'text-eduPurple/70'}`}>
          {stageMessage}
        </p>
        
        {/* Progress bar */}
        {showProgress && (
          <div className="w-full max-w-md mt-4">
            <Progress 
              value={animationProgress} 
              className={`h-2 ${selectedTheme.name === 'space' ? 'bg-blue-900' : 'bg-eduPurple/10'}`} 
            />
            <p className={`text-xs text-right mt-1 ${selectedTheme.name === 'space' ? 'text-blue-300' : 'text-muted-foreground'}`}>
              {Math.round(animationProgress)}%
            </p>
          </div>
        )}
        
        {/* Loading indicator dots */}
        <div className={`mt-2 flex items-center gap-1 ${!showProgress ? 'mb-3' : ''}`}>
          <div className={`h-2 w-2 rounded-full ${selectedTheme.name === 'space' ? 'bg-blue-300' : 'bg-eduPurple'} animate-pulse`}></div>
          <div className={`h-2 w-2 rounded-full ${selectedTheme.name === 'space' ? 'bg-blue-300' : 'bg-eduPurple'} animate-pulse delay-300`}></div>
          <div className={`h-2 w-2 rounded-full ${selectedTheme.name === 'space' ? 'bg-blue-300' : 'bg-eduPurple'} animate-pulse delay-600`}></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FunLoadingAnimation; 