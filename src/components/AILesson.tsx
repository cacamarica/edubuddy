
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { getAIEducationContent } from '@/services/aiEducationService';
import { BookOpen, Star } from 'lucide-react';
import { toast } from 'sonner';

interface AILessonProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  onComplete?: () => void;
}

interface LessonContent {
  title: string;
  introduction: string;
  mainContent: Array<{
    heading: string;
    text: string;
  }>;
  funFacts: string[];
  activity: {
    title: string;
    instructions: string;
  };
}

const AILesson = ({ subject, gradeLevel, topic, onComplete }: AILessonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [lessonCompleted, setLessonCompleted] = useState(false);

  const generateLesson = async () => {
    setIsLoading(true);
    try {
      const result = await getAIEducationContent({
        contentType: 'lesson',
        subject,
        gradeLevel,
        topic
      });
      
      setLessonContent(result.content);
    } catch (error) {
      console.error("Failed to generate lesson:", error);
      toast.error("Oops! We couldn't create your lesson right now. Please try again!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextSection = () => {
    if (lessonContent && currentSection < lessonContent.mainContent.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      setLessonCompleted(true);
      toast.success("You completed the lesson! Great job!", {
        icon: <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />,
      });
      if (onComplete) onComplete();
    }
  };

  const handlePrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-eduPurple border-t-transparent rounded-full mb-4"></div>
          <p className="text-center font-display text-lg">Creating an amazing lesson just for you!</p>
          <p className="text-center text-muted-foreground">This might take a moment...</p>
        </CardContent>
      </Card>
    );
  }

  if (!lessonContent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-display">Let's Learn About {topic}!</CardTitle>
          <CardDescription>
            Discover exciting facts and fun activities about {topic} in {subject}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={generateLesson} className="bg-eduPurple hover:bg-eduPurple-dark">
            <BookOpen className="mr-2 h-4 w-4" />
            Start Lesson
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (lessonCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-display">Lesson Complete! 🎉</CardTitle>
          <CardDescription>Great job learning about {topic}!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-eduPastel-yellow p-4 rounded-lg">
              <h3 className="font-semibold font-display text-lg">Fun Facts</h3>
              <ul className="list-disc pl-5 space-y-2">
                {lessonContent.funFacts.map((fact, i) => (
                  <li key={i}>{fact}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-eduPastel-green p-4 rounded-lg">
              <h3 className="font-semibold font-display text-lg">{lessonContent.activity.title}</h3>
              <p>{lessonContent.activity.instructions}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => {
            setCurrentSection(0);
            setLessonCompleted(false);
          }} className="mx-2">
            Restart Lesson
          </Button>
          <Button onClick={() => {
            setLessonContent(null);
          }} className="mx-2 bg-eduPurple hover:bg-eduPurple-dark">
            Try Another Topic
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-display">{lessonContent.title}</CardTitle>
        {currentSection === 0 && <CardDescription>{lessonContent.introduction}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="font-semibold font-display text-lg">{lessonContent.mainContent[currentSection].heading}</h3>
          <p>{lessonContent.mainContent[currentSection].text}</p>
          
          <div className="w-full bg-muted h-2 rounded-full mt-6">
            <div 
              className="bg-eduPurple h-2 rounded-full" 
              style={{ width: `${((currentSection + 1) / lessonContent.mainContent.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Section {currentSection + 1} of {lessonContent.mainContent.length}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          onClick={handlePrevSection}
          disabled={currentSection === 0}
          variant="outline"
        >
          Previous
        </Button>
        <Button onClick={handleNextSection} className="bg-eduPurple hover:bg-eduPurple-dark">
          {currentSection < lessonContent.mainContent.length - 1 ? "Next" : "Complete Lesson"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AILesson;
