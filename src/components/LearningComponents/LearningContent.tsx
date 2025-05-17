
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BookOpen, PencilRuler, Gamepad } from 'lucide-react';
import AILesson from '../AILesson';
import AIQuiz from '../AIQuiz';
import AIGame from '../AIGame';
import { useLanguage } from '@/contexts/LanguageContext';

interface LearningContentProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onReset: () => void;
  onQuizComplete: (score: number) => void;
}

const LearningContent: React.FC<LearningContentProps> = ({
  subject,
  gradeLevel,
  topic,
  activeTab,
  onTabChange,
  onReset,
  onQuizComplete,
}) => {
  const { language } = useLanguage();
  
  const translations = {
    learningAbout: language === 'id' ? 'Belajar Tentang' : 'Learning About',
    newTopic: language === 'id' ? 'Topik Baru' : 'New Topic',
    lesson: language === 'id' ? 'Pelajaran' : 'Lesson',
    quiz: language === 'id' ? 'Kuis' : 'Quiz',
    game: language === 'id' ? 'Permainan' : 'Game',
    recommendedNextSteps: language === 'id' ? 'Langkah Selanjutnya yang Direkomendasikan' : 'Recommended Next Steps',
    startLesson: language === 'id' ? 'Mulai Pelajaran' : 'Start Lesson'
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">
          {translations.learningAbout} {topic} <span className="text-muted-foreground">({subject})</span>
        </h2>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={onReset}
        >
          {translations.newTopic}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lesson" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">{translations.lesson}</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-2">
            <PencilRuler className="h-4 w-4" />
            <span className="hidden sm:inline">{translations.quiz}</span>
          </TabsTrigger>
          <TabsTrigger value="game" className="flex items-center gap-2">
            <Gamepad className="h-4 w-4" />
            <span className="hidden sm:inline">{translations.game}</span>
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="lesson">
            <AILesson 
              subject={subject} 
              gradeLevel={gradeLevel} 
              topic={topic}
            />
          </TabsContent>
          <TabsContent value="quiz">
            <AIQuiz 
              subject={subject} 
              gradeLevel={gradeLevel} 
              topic={topic}
              onComplete={(score) => onQuizComplete(score)}
            />
          </TabsContent>
          <TabsContent value="game">
            <AIGame 
              subject={subject} 
              gradeLevel={gradeLevel} 
              topic={topic}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default LearningContent;
