
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LearningBuddy from '@/components/LearningBuddy';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, BookOpen, PencilRuler, Gamepad, Sparkles } from 'lucide-react';
import AILesson from '@/components/AILesson';
import AIQuiz from '@/components/AIQuiz';
import AIGame from '@/components/AIGame';
import { toast } from 'sonner';

// Common subject options based on grade level
const subjectOptions = {
  'k-3': ['Math', 'Reading', 'Science', 'Social Studies'],
  '4-6': ['Math', 'Language Arts', 'Science', 'Social Studies', 'Art'],
  '7-9': ['Mathematics', 'Language Arts', 'Science', 'History', 'Geography', 'Art']
};

// Topic suggestions based on subject and grade level
const topicSuggestions = {
  'k-3': {
    'Math': ['Counting', 'Addition', 'Subtraction', 'Shapes', 'Patterns'],
    'Mathematics': ['Counting', 'Addition', 'Subtraction', 'Shapes', 'Patterns'],
    'Reading': ['Alphabet', 'Sight Words', 'Phonics', 'Story Elements', 'Rhyming'],
    'English': ['Alphabet', 'Sight Words', 'Phonics', 'Story Elements', 'Rhyming'],
    'Science': ['Animals', 'Plants', 'Weather', 'Seasons', 'Five Senses'],
    'Social Studies': ['Community Helpers', 'Maps', 'Holidays', 'Family', 'Rules']
  },
  '4-6': {
    'Math': ['Fractions', 'Decimals', 'Multiplication', 'Division', 'Measurement'],
    'Mathematics': ['Fractions', 'Decimals', 'Multiplication', 'Division', 'Measurement'],
    'Language Arts': ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing Process', 'Poetry'],
    'English': ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing Process', 'Poetry'],
    'Science': ['Life Cycles', 'Habitats', 'Simple Machines', 'Earth', 'Matter'],
    'Social Studies': ['States', 'Historical Figures', 'Government', 'Economics', 'Geography'],
    'Art': ['Color Theory', 'Famous Artists', 'Art Techniques', 'Art History', 'Crafts']
  },
  '7-9': {
    'Math': ['Algebra', 'Geometry', 'Statistics', 'Probability', 'Equations'],
    'Mathematics': ['Algebra', 'Geometry', 'Statistics', 'Probability', 'Equations'],
    'Language Arts': ['Literature Analysis', 'Essay Writing', 'Research Skills', 'Debate', 'Media Literacy'],
    'English': ['Literature Analysis', 'Essay Writing', 'Research Skills', 'Debate', 'Media Literacy'],
    'Science': ['Biology', 'Chemistry', 'Physics', 'Astronomy', 'Environmental Science'],
    'History': ['Ancient Civilizations', 'World Wars', 'Civil Rights', 'American History', 'World History'],
    'Geography': ['Continents', 'Climate Zones', 'Natural Resources', 'Population', 'Cultures'],
    'Art': ['Perspective Drawing', 'Art Movements', 'Digital Art', 'Photography', 'Sculpture']
  }
};

const AILearning = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [gradeLevel, setGradeLevel] = useState<'k-3' | '4-6' | '7-9'>(
    (location.state?.gradeLevel as 'k-3' | '4-6' | '7-9') || 'k-3'
  );
  const [subject, setSubject] = useState<string>(location.state?.subject || 'Math');
  const [topic, setTopic] = useState<string>(location.state?.topic || '');
  const [contentReady, setContentReady] = useState(false);
  const [activeTab, setActiveTab] = useState('lesson');
  const [stars, setStars] = useState(0);

  // Handle auto-start of content if navigated with specific topic
  useEffect(() => {
    if (location.state?.topic && location.state?.autoStart && !contentReady) {
      setTopic(location.state.topic);
      setContentReady(true);
      toast.success(`Starting ${location.state.topic} in ${location.state.subject}!`, {
        position: "bottom-right",
        duration: 3000,
      });
    }
  }, [location.state, contentReady]);

  // Update subject when grade level changes
  useEffect(() => {
    // If current subject is not available in the new grade level, set to first available
    if (!subjectOptions[gradeLevel].includes(subject)) {
      setSubject(subjectOptions[gradeLevel][0]);
    }
  }, [gradeLevel, subject]);

  const handleGoBack = () => {
    navigate('/lessons');
  };

  const handleTopicSelect = (suggestion: string) => {
    setTopic(suggestion);
  };

  const handleCreateContent = () => {
    if (topic.trim()) {
      setContentReady(true);
    }
  };

  const handleQuizComplete = (score: number) => {
    const newStars = stars + score;
    setStars(newStars);
  };

  const handleReset = () => {
    setContentReady(false);
    setTopic('');
  };

  const gradeName = {
    'k-3': 'Early Learners (K-3)',
    '4-6': 'Intermediate (4-6)',
    '7-9': 'Advanced (7-9)'
  };

  // Find the right topic suggestions based on subject name
  const getTopicSuggestionsForSubject = (subj: string) => {
    // Handle different naming conventions for similar subjects
    if (subj === 'Mathematics') return topicSuggestions[gradeLevel]['Math'] || [];
    if (subj === 'English') return topicSuggestions[gradeLevel]['Language Arts'] || topicSuggestions[gradeLevel]['Reading'] || [];
    return topicSuggestions[gradeLevel][subj] || [];
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <section className="bg-eduPastel-blue py-8">
          <div className="container px-4 md:px-6">
            <Button 
              variant="ghost" 
              size="sm"
              className="mb-4"
              onClick={handleGoBack}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Lessons
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold">AI Learning Adventure</h1>
                <p className="text-muted-foreground">
                  Create custom lessons, quizzes, and games about any topic!
                </p>
              </div>
              
              {stars > 0 && (
                <div className="mt-4 md:mt-0 bg-white px-4 py-2 rounded-lg shadow flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">{stars} Stars Earned</span>
                </div>
              )}
            </div>
          </div>
        </section>
        
        <section className="py-12">
          <div className="container px-4 md:px-6">
            {!contentReady ? (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl font-display">Create Your Learning Content</CardTitle>
                  <CardDescription>
                    Tell us what you want to learn about and we'll create custom content just for you!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="gradeLevel">Grade Level</Label>
                    <div className="flex flex-wrap gap-2">
                      {['k-3', '4-6', '7-9'].map((grade) => (
                        <Button 
                          key={grade}
                          type="button"
                          variant={gradeLevel === grade ? "default" : "outline"}
                          className={gradeLevel === grade ? "bg-eduPurple hover:bg-eduPurple-dark" : ""}
                          onClick={() => {
                            setGradeLevel(grade as 'k-3' | '4-6' | '7-9');
                          }}
                        >
                          {gradeName[grade as keyof typeof gradeName]}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <div className="flex flex-wrap gap-2">
                      {subjectOptions[gradeLevel].map((subjectOption) => (
                        <Button 
                          key={subjectOption}
                          type="button"
                          variant={subject === subjectOption ? "default" : "outline"}
                          className={subject === subjectOption ? "bg-eduPurple hover:bg-eduPurple-dark" : ""}
                          onClick={() => setSubject(subjectOption)}
                        >
                          {subjectOption}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Input 
                      id="topic"
                      placeholder="Enter a topic like 'Dinosaurs' or 'Addition'"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-2">Suggested topics for {subject}:</p>
                      <div className="flex flex-wrap gap-2">
                        {getTopicSuggestionsForSubject(subject)?.map((suggestion) => (
                          <Button 
                            key={suggestion}
                            variant="outline"
                            size="sm"
                            onClick={() => handleTopicSelect(suggestion)}
                            className="bg-eduPastel-purple hover:bg-eduPastel-purple/80"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button 
                    onClick={handleCreateContent} 
                    disabled={!topic.trim()}
                    className="bg-eduPurple hover:bg-eduPurple-dark"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Learning Content
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="max-w-3xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-2xl font-display font-bold">
                    Learning About: {topic} <span className="text-muted-foreground">({subject})</span>
                  </h2>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    New Topic
                  </Button>
                </div>
                
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="lesson" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span className="hidden sm:inline">Lesson</span>
                    </TabsTrigger>
                    <TabsTrigger value="quiz" className="flex items-center gap-2">
                      <PencilRuler className="h-4 w-4" />
                      <span className="hidden sm:inline">Quiz</span>
                    </TabsTrigger>
                    <TabsTrigger value="game" className="flex items-center gap-2">
                      <Gamepad className="h-4 w-4" />
                      <span className="hidden sm:inline">Game</span>
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
                        onComplete={(score) => handleQuizComplete(score)}
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
            )}
          </div>
        </section>
        
        {/* Learning Buddy */}
        <LearningBuddy />
      </main>
      
      <Footer />
    </div>
  );
};

export default AILearning;
