import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { getAIEducationContent } from '@/services/aiEducationService';
import { BookOpen, Star, Image, ArrowLeft, ArrowRight, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface AILessonProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  onComplete?: () => void;
}

interface LessonImage {
  url: string;
  alt: string;
  caption?: string;
}

interface LessonContentSection {
  heading: string;
  text: string;
  image?: LessonImage;
}

interface LessonContent {
  title: string;
  introduction: string;
  mainContent: LessonContentSection[];
  funFacts: string[];
  activity: {
    title: string;
    instructions: string;
    image?: LessonImage;
  };
  conclusion?: string;
  summary?: string;
  images?: LessonImage[];
}

const AILesson = ({ subject, gradeLevel, topic, onComplete }: AILessonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [readingTime, setReadingTime] = useState('10-15 minutes');
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Calculating the maximum allowed section for non-logged in users (30% of content)
  const getMaxAllowedSection = () => {
    if (!lessonContent) return 0;
    if (user) return lessonContent.mainContent.length - 1; // No limit for logged in users
    
    // For non-logged in users, limit to 30% of the content (at least 1 section)
    return Math.max(0, Math.floor(lessonContent.mainContent.length * 0.3) - 1);
  };

  const generateLesson = async () => {
    setIsLoading(true);
    try {
      const result = await getAIEducationContent({
        contentType: 'lesson',
        subject,
        gradeLevel,
        topic
      });
      
      // Process the content to ensure it has the right format
      const processedContent = {
        ...result.content,
        // Ensure all sections have the expected properties
        mainContent: result.content.mainContent.map((section: any) => ({
          ...section,
          // Process image if it exists but doesn't have the right format
          image: section.image 
            ? (section.image.url 
                ? section.image 
                : { url: section.image, alt: `Image for ${section.heading}` })
            : null
        }))
      };

      // Process activity image if needed
      if (processedContent.activity && processedContent.activity.image && 
          !processedContent.activity.image.url && typeof processedContent.activity.image === 'string') {
        processedContent.activity.image = {
          url: processedContent.activity.image,
          alt: `Image for ${processedContent.activity.title} activity`
        };
      }
      
      setLessonContent(processedContent);
      
      // Estimate reading time based on content length
      const totalText = 
        processedContent.introduction + 
        processedContent.mainContent.reduce((acc: string, section: LessonContentSection) => acc + section.text, '') +
        (processedContent.conclusion || '');
      
      // Rough estimate: average reading speed is ~200-250 words per minute
      const wordCount = totalText.split(/\s+/).length;
      const minutes = Math.ceil(wordCount / 200);
      
      setReadingTime(`${minutes}-${minutes + 5} minutes`);
      
    } catch (error) {
      console.error("Failed to generate lesson:", error);
      toast.error("Oops! We couldn't create your lesson right now. Please try again!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextSection = () => {
    const maxAllowedSection = getMaxAllowedSection();
    
    if (lessonContent) {
      // Check if the user can proceed to the next section
      if (currentSection < lessonContent.mainContent.length - 1) {
        // Check if they've reached their limit (for non-logged in users)
        if (currentSection >= maxAllowedSection && !user) {
          // Show login prompt for non-logged in users who hit the limit
          toast.info(
            language === 'id'
              ? 'Masuk untuk mengakses seluruh pelajaran'
              : 'Sign in to access the full lesson',
            {
              duration: 5000,
              action: {
                label: language === 'id' ? 'Masuk' : 'Sign In',
                onClick: () => navigate('/auth', { state: { action: 'signin' } }),
              },
            }
          );
          return;
        }
        
        // If they can proceed, go to the next section
        setCurrentSection(currentSection + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Mark lesson as completed
        setLessonCompleted(true);
        toast.success("You completed the lesson! Great job!", {
          icon: <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />,
        });
        if (onComplete) onComplete();
      }
    }
  };

  const handlePrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-center text-muted-foreground">
            This comprehensive lesson will take approximately {readingTime} to complete and includes images 
            and activities to help you understand {topic}.
          </p>
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
          <div className="space-y-6">
            {lessonContent.summary && (
              <div className="bg-eduPastel-blue p-4 rounded-lg">
                <h3 className="font-semibold font-display text-lg">Summary</h3>
                <p>{lessonContent.summary}</p>
              </div>
            )}
            
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
              <p className="mb-4">{lessonContent.activity.instructions}</p>
              
              {lessonContent.activity.image && (
                <div className="mt-4 flex flex-col items-center">
                  <div className="w-full max-w-md rounded-lg overflow-hidden">
                    <img 
                      src={lessonContent.activity.image.url} 
                      alt={lessonContent.activity.image.alt} 
                      className="w-full h-auto object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80";
                        target.alt = "Placeholder image - original image failed to load";
                      }}
                    />
                  </div>
                  {lessonContent.activity.image.caption && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {lessonContent.activity.image.caption}
                    </p>
                  )}
                </div>
              )}
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

  // Extract the current section for easier access
  const currentSectionContent = lessonContent.mainContent[currentSection];
  const maxAllowedSection = getMaxAllowedSection();
  const isLastViewableSection = !user && currentSection >= maxAllowedSection;

  // Split the text into paragraphs for better readability
  const paragraphs = currentSectionContent.text.split('\n\n');

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl md:text-2xl font-display">{lessonContent.title}</CardTitle>
          <span className="text-sm text-muted-foreground bg-eduPastel-purple px-2 py-1 rounded-full">
            Reading time: {readingTime}
          </span>
        </div>
        {currentSection === 0 && (
          <CardDescription className="mt-4">{lessonContent.introduction}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <h3 className="font-semibold font-display text-xl">{currentSectionContent.heading}</h3>
          
          {/* For sections with images that relate directly to the beginning of the text */}
          {currentSectionContent.image && currentSectionContent.text.length > 400 && (
            <div className="my-6 flex flex-col items-center">
              <div className="w-full rounded-lg overflow-hidden shadow-md bg-white p-2">
                <div className="relative aspect-video">
                  <img 
                    src={currentSectionContent.image.url} 
                    alt={currentSectionContent.image.alt || "Lesson illustration"}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80";
                      target.alt = "Placeholder image - original image failed to load";
                    }}
                  />
                </div>
                {currentSectionContent.image.caption && (
                  <p className="text-sm text-center text-muted-foreground mt-2 italic">
                    {currentSectionContent.image.caption}
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div className="prose max-w-none">
            {paragraphs.map((paragraph, idx) => {
              // If there's an image and we're in the middle of the text, place it here
              const isMiddleParagraph = paragraphs.length > 3 && idx === Math.floor(paragraphs.length / 2);
              
              return (
                <React.Fragment key={idx}>
                  <p className="my-4">{paragraph}</p>
                  
                  {/* For sections with images that relate to the middle of the text */}
                  {isMiddleParagraph && currentSectionContent.image && currentSectionContent.text.length <= 400 && (
                    <div className="my-6 flex flex-col items-center">
                      <div className="w-full rounded-lg overflow-hidden shadow-md bg-white p-2">
                        <div className="relative aspect-video">
                          <img 
                            src={currentSectionContent.image.url} 
                            alt={currentSectionContent.image.alt || "Lesson illustration"}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80";
                              target.alt = "Placeholder image - original image failed to load";
                            }}
                          />
                        </div>
                        <div className="bg-eduPastel-blue bg-opacity-20 p-2 rounded-b-lg">
                          <p className="text-sm text-center font-medium">
                            {currentSectionContent.image.caption || `Visual aid for ${currentSectionContent.heading}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          
          {currentSection === lessonContent.mainContent.length - 1 && lessonContent.conclusion && (
            <div className="mt-8 border-t pt-4">
              <h3 className="font-semibold font-display text-lg">Conclusion</h3>
              <p>{lessonContent.conclusion}</p>
            </div>
          )}
          
          {/* Free vs. Premium Content Divider */}
          {!user && currentSection === maxAllowedSection && (
            <div className="mt-8 border-t pt-6 text-center">
              <div className="bg-eduPastel-purple p-4 rounded-lg">
                <h3 className="font-semibold font-display text-lg mb-2">
                  {language === 'id' ? 'Dapatkan Akses Penuh' : 'Get Full Access'}
                </h3>
                <p className="mb-4">
                  {language === 'id' 
                    ? 'Masuk untuk melanjutkan pelajaran dan akses semua fitur!' 
                    : 'Sign in to continue this lesson and access all features!'}
                </p>
                <Button 
                  onClick={() => navigate('/auth', { state: { action: 'signin' } })}
                  className="bg-eduPurple hover:bg-eduPurple-dark"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {language === 'id' ? 'Masuk Sekarang' : 'Sign In Now'}
                </Button>
              </div>
            </div>
          )}
          
          <div className="w-full bg-muted h-2 rounded-full mt-8">
            <div 
              className="bg-eduPurple h-2 rounded-full" 
              style={{ width: `${((currentSection + 1) / lessonContent.mainContent.length) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Section {currentSection + 1} of {lessonContent.mainContent.length}</span>
            <span>{Math.round(((currentSection + 1) / lessonContent.mainContent.length) * 100)}% complete</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-6 border-t mt-6">
        <Button 
          onClick={handlePrevSection}
          disabled={currentSection === 0}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button 
          onClick={handleNextSection}
          className={`flex items-center gap-2 ${isLastViewableSection ? 'bg-gray-400 hover:bg-gray-500' : 'bg-eduPurple hover:bg-eduPurple-dark'}`}
          disabled={isLastViewableSection}
        >
          {currentSection < lessonContent.mainContent.length - 1 ? (
            <>
              Next
              <ArrowRight className="h-4 w-4" />
            </>
          ) : "Complete Lesson"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AILesson;
