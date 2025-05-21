import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LearningBuddy from '@/components/LearningBuddy';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Star, Award, BookOpen, Brain, Gamepad } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { supabase } from '@/integrations/supabase/client';
import AIQuiz from '@/components/AIQuiz';
import { fetchQuizQuestions } from '@/services/quiz.service';
import { Skeleton } from '@/components/ui/skeleton';
import FunLoadingAnimation from '@/components/FunLoadingAnimation';
import { useLanguage } from '@/contexts/LanguageContext';
import LoadingQuiz from '@/components/QuizComponents/LoadingQuiz';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// Sample math questions for grade K-3 - keep as fallback
const mathQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What comes after 5?",
    options: ["4", "5", "6", "7"],
    correctAnswer: 2,
    explanation: "After 5 comes 6! When we count, we go 1, 2, 3, 4, 5, 6, 7, 8, 9, 10!"
  },
  {
    id: 2,
    question: "How many sides does a triangle have?",
    options: ["2", "3", "4", "5"],
    correctAnswer: 1,
    explanation: "A triangle has 3 sides! That's why it's called a tri-angle. 'Tri' means three!"
  },
  {
    id: 3,
    question: "What is 3 + 2?",
    options: ["4", "5", "6", "7"],
    correctAnswer: 1,
    explanation: "3 + 2 = 5! When we add 3 things and 2 more things, we get 5 things total!"
  },
  {
    id: 4,
    question: "Which shape has 4 equal sides?",
    options: ["Triangle", "Circle", "Rectangle", "Square"],
    correctAnswer: 3,
    explanation: "A square has 4 equal sides! All sides of a square are the same length."
  },
  {
    id: 5,
    question: "What is 10 - 5?",
    options: ["3", "4", "5", "6"],
    correctAnswer: 2,
    explanation: "10 - 5 = 5! When we take away 5 things from 10 things, we have 5 things left."
  }
];

// Define subjects and topics by grade level
const subjectsByGradeLevel = {
  'k-3': [
    {
      name: 'Math',
      topics: ['Numbers', 'Shapes', 'Addition', 'Subtraction', 'Patterns']
    },
    {
      name: 'Science',
      topics: ['Plants', 'Animals', 'Weather', 'Earth', 'Living Things']
    },
    {
      name: 'English',
      topics: ['Letters', 'Reading', 'Writing', 'Stories', 'Comprehension']
    }
  ],
  '4-6': [
    {
      name: 'Math',
      topics: ['Fractions', 'Decimals', 'Multiplication', 'Division', 'Geometry']
    },
    {
      name: 'Science',
      topics: ['Ecosystems', 'Solar System', 'Matter', 'Energy', 'Living Things']
    },
    {
      name: 'English',
      topics: ['Grammar', 'Vocabulary', 'Comprehension', 'Writing', 'Literature']
    }
  ],
  '7-9': [
    {
      name: 'Math',
      topics: ['Algebra', 'Geometry', 'Statistics', 'Equations', 'Functions']
    },
    {
      name: 'Science',
      topics: ['Chemistry', 'Physics', 'Biology', 'Earth Science', 'Living Things']
    },
    {
      name: 'English',
      topics: ['Literature', 'Essays', 'Rhetoric', 'Analysis', 'Creative Writing']
    }
  ]
};

const Quiz = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedProfile } = useStudentProfile();
  const { language } = useLanguage();
  
  // Initial loading state
  const [initialLoading, setInitialLoading] = useState(true);
  const [aiQuizLoading, setAiQuizLoading] = useState(false);
  
  // Quiz selection states
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<'k-3' | '4-6' | '7-9'>('k-3');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<{name: string, topics: string[]}[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [showAIQuiz, setShowAIQuiz] = useState(false);
  
  // Error state
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Recommendations
  const [recommendations, setRecommendations] = useState<{subject: string, topic: string, reason: string}[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  // For the traditional quiz
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  // Simulate initial loading to show animation
  useEffect(() => {
    // Show loading animation for a minimum of 2 seconds
    const timer = setTimeout(() => {
      // Only turn off initial loading if we're not also loading the AIQuiz
      if (!aiQuizLoading) {
        setInitialLoading(false);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [aiQuizLoading]);
  
  // Update available subjects when grade level changes
  useEffect(() => {
    setAvailableSubjects(subjectsByGradeLevel[selectedGradeLevel]);
    
    // Reset subject and topic selections when grade changes
    setSelectedSubject('');
    setSelectedTopic('');
    
    // Try to load personalized recommendations
    loadPersonalizedRecommendations();
  }, [selectedGradeLevel]);
  
  // Update available topics when subject changes
  useEffect(() => {
    if (selectedSubject) {
      const subjectData = availableSubjects.find(s => s.name === selectedSubject);
      if (subjectData) {
        setAvailableTopics(subjectData.topics);
      } else {
        setAvailableTopics([]);
      }
    } else {
      setAvailableTopics([]);
    }
  }, [selectedSubject, availableSubjects]);
  
  // Load personalized recommendations based on student profile and history
  const loadPersonalizedRecommendations = async () => {
    if (!user || !selectedProfile) {
      // Default recommendations for non-logged in users
      setRecommendations([
        { subject: 'Math', topic: 'Addition', reason: 'Popular topic for this grade level' },
        { subject: 'Science', topic: 'Living Things', reason: 'Engaging content with visual learning' }
      ]);
      return;
    }
    
    setLoadingRecommendations(true);
    
    try {
      // Get student's quiz history
      const { data: quizHistory } = await supabase
        .from('learning_activities')
        .select('*')
        .eq('student_id', selectedProfile.id)
        .eq('activity_type', 'quiz')
        .order('completed_at', { ascending: false })
        .limit(10);
      
      // Get student's lesson history
      const { data: lessonHistory } = await supabase
        .from('learning_activities')
        .select('*')
        .eq('student_id', selectedProfile.id)
        .eq('activity_type', 'lesson_completed')
        .order('completed_at', { ascending: false })
        .limit(10);
      
      // Simple algorithm for recommendations:
      // 1. Topics student has completed lessons for but not taken quizzes on
      // 2. Topics student struggled with in previous quizzes (< 70% score)
      // 3. Popular topics for their grade level
      
      const recommendations: {subject: string, topic: string, reason: string}[] = [];
      
      // Find lessons completed without quizzes
      if (lessonHistory && quizHistory) {
        const lessonTopics = lessonHistory.map(l => ({subject: l.subject, topic: l.topic}));
        const quizTopics = quizHistory.map(q => ({subject: q.subject, topic: q.topic}));
        
        const lessonWithoutQuiz = lessonTopics.filter(l => 
          !quizTopics.some(q => q.subject === l.subject && q.topic === l.topic)
        );
        
        lessonWithoutQuiz.slice(0, 2).forEach(l => {
          recommendations.push({
            subject: l.subject,
            topic: l.topic,
            reason: 'Based on your completed lessons'
          });
        });
        
        // Find topics student struggled with
        const lowScoreQuizzes = quizHistory.filter(q => 
          q.stars_earned && q.stars_earned < 3 && q.completed
        );
        
        if (lowScoreQuizzes.length > 0) {
          lowScoreQuizzes.slice(0, 1).forEach(q => {
            if (!recommendations.some(r => r.subject === q.subject && r.topic === q.topic)) {
              recommendations.push({
                subject: q.subject,
                topic: q.topic,
                reason: 'Practice to improve your score'
              });
            }
          });
        }
      }
      
      // Add default recommendations if we don't have enough
      if (recommendations.length < 3) {
        const defaultRecs = [
          { subject: 'Math', topic: selectedGradeLevel === 'k-3' ? 'Addition' : 
                               selectedGradeLevel === '4-6' ? 'Fractions' : 'Algebra', 
            reason: 'Popular topic for your grade' },
          { subject: 'Science', topic: 'Living Things', 
            reason: 'Interactive content with fun activities' }
        ];
        
        for (const rec of defaultRecs) {
          if (!recommendations.some(r => r.subject === rec.subject && r.topic === rec.topic)) {
            recommendations.push(rec);
            if (recommendations.length >= 3) break;
          }
        }
      }
      
      setRecommendations(recommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      
      // Fallback recommendations
      setRecommendations([
        { subject: 'Math', topic: 'Addition', reason: 'Popular topic for this grade level' },
        { subject: 'Science', topic: 'Living Things', reason: 'Engaging content with visual learning' }
      ]);
    } finally {
      setLoadingRecommendations(false);
    }
  };
  
  // Fetch quiz questions based on subject, topic and grade level
  const fetchQuestions = async () => {
    if (!selectedSubject || !selectedTopic) return;
    
    setLoadingQuestions(true);
    
    try {
      // Try to get questions from AI quiz system
      const aiQuestions = await fetchQuizQuestions({
        subject: selectedSubject,
        gradeLevel: selectedGradeLevel,
        topic: selectedTopic,
        questionCount: 5,
        includeLessonContent: true,
        specificSubtopics: selectedTopic.toLowerCase().includes('living things') ? [
          'characteristics of living things',
          'classification of organisms',
          'life processes',
          'adaptation and evolution'
        ] : undefined
      });
      
      if (aiQuestions && aiQuestions.length > 0) {
        // Transform to local format
        const formattedQuestions = aiQuestions.map((q, index) => ({
          id: index,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || 'Good job!'
        }));
        
        setQuestions(formattedQuestions);
      } else {
        // Fallback to sample questions
        console.log('Using fallback questions');
        setQuestions(mathQuestions);
      }
      
      // Initialize answers array
      setAnswers(new Array(5).fill(null));
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setQuizComplete(false);
      
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load quiz questions. Using sample questions instead.');
      setQuestions(mathQuestions);
    } finally {
      setLoadingQuestions(false);
    }
  };
  
  const handleStartQuiz = () => {
    setLoadError(null);
    if (selectedSubject && selectedTopic) {
      setAiQuizLoading(true);
      setShowAIQuiz(true);
    } else {
      toast.error(language === 'id' ? 'Silakan pilih mata pelajaran dan topik terlebih dahulu' : 'Please select a subject and topic first');
    }
  };
  
  const handleRecommendationClick = (subject: string, topic: string) => {
    setSelectedGradeLevel(selectedProfile?.grade_level as 'k-3' | '4-6' | '7-9' || 'k-3');
    setSelectedSubject(subject);
    
    // Need to update available topics first
    const subjectData = subjectsByGradeLevel[selectedProfile?.grade_level as 'k-3' | '4-6' | '7-9' || 'k-3'].find(s => s.name === subject);
    if (subjectData) {
      setAvailableTopics(subjectData.topics);
      
      // Then set the topic if it's available
      if (subjectData.topics.includes(topic)) {
        setSelectedTopic(topic);
      }
    }
  };
  
  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    
    // Update answers array
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };
  
  const handleCheckAnswer = () => {
    setShowFeedback(true);
    
    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
    
    if (isCorrect) {
      toast.success("Great job! That's correct! ✨", {
        position: "bottom-right",
      });
    }
  };
  
  const handleNextQuestion = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz complete
      const correctAnswers = answers.filter(
        (answer, index) => answer === questions[index].correctAnswer
      ).length;
      setScore(correctAnswers);
      setQuizComplete(true);
      
      // Show confetti for good scores
      if (correctAnswers >= questions.length * 0.6) {
        toast.success(`Quiz complete! You got ${correctAnswers} out of ${questions.length} correct!`, {
          position: "top-center",
          duration: 5000,
        });
      }
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]);
      setShowFeedback(false);
    }
  };
  
  const handleRestartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers(new Array(questions.length).fill(null));
    setShowFeedback(false);
    setQuizComplete(false);
  };
  
  const handleGoBack = () => {
    navigate('/lessons');
  };
  
  const handleQuizError = (error: string) => {
    setLoadError(error);
    toast.error(error);
    setAiQuizLoading(false);
    // Return to quiz selection after error
    setTimeout(() => {
      setShowAIQuiz(false);
    }, 3000);
  };
  
  const handleQuizComplete = (score: number) => {
    toast.success(language === 'id' 
      ? `Kuis selesai! Skor Anda: ${score} poin!` 
      : `Quiz completed! You scored ${score} points!`);
    
    setAiQuizLoading(false);
    
    // Return to quiz selection after a delay
    setTimeout(() => {
      setShowAIQuiz(false);
      loadPersonalizedRecommendations(); // Refresh recommendations
    }, 5000);
  };
  
  // Modify the Quiz of the Day useEffect to skip the loading screen entirely
  useEffect(() => {
    if (location.state) {
      const { subject, topic, gradeLevel, isQuizOfTheDay } = location.state;
      
      // Check if this is a Quiz of the Day navigation
      if (isQuizOfTheDay && subject && topic && gradeLevel) {
        console.log('Starting Quiz of the Day:', { subject, topic, gradeLevel });
        
        // First clear any previous state
        setLoadError(null);
        
        // Set the states immediately
        setSelectedGradeLevel(gradeLevel as 'k-3' | '4-6' | '7-9');
        setSelectedSubject(subject);
        setSelectedTopic(topic);
        
        // BYPASS LOADING SCREEN COMPLETELY - immediately show the AIQuiz
        setInitialLoading(false);
        setAiQuizLoading(false);
        setShowAIQuiz(true);
        
        console.log('Bypassing loading screens to display quiz directly');
      }
    }
  }, [location.state]);
  
  // Add a debugging log for render conditions
  useEffect(() => {
    console.log('Quiz render state:', {
      initialLoading,
      aiQuizLoading,
      showAIQuiz,
      selectedSubject,
      selectedTopic
    });
  }, [initialLoading, aiQuizLoading, showAIQuiz, selectedSubject, selectedTopic]);
  
  // If in initial loading state or AIQuiz is loading, show fun loading animation
  if (initialLoading || aiQuizLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <LoadingQuiz progress={75} maxDuration={5000} />
        </main>
        <Footer />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center space-y-4">
            <div className="rounded-full bg-muted h-12 w-12"></div>
            <div className="h-4 bg-muted rounded w-48"></div>
            <div className="h-2 bg-muted rounded w-64"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <section className="bg-gradient-to-r from-eduPastel-purple to-eduPastel-blue py-8">
          <div className="container px-4 md:px-6">
            <Button 
              variant="ghost" 
              size="sm"
              className="mb-4 bg-white/50 hover:bg-white/80"
              onClick={() => navigate('/lessons')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {language === 'id' ? 'Kembali ke Pelajaran' : 'Back to Lessons'}
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold">{language === 'id' ? 'Pusat Kuis' : 'Quiz Center'}</h1>
                <p className="text-muted-foreground">
                  {language === 'id' 
                    ? 'Uji pengetahuan Anda dengan kuis interaktif!' 
                    : 'Test your knowledge with interactive quizzes!'}
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* MODIFIED: First check if we should show AIQuiz, then check loading states */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            {showAIQuiz ? (
              // Show the AIQuiz when a quiz is selected and started
              <AIQuiz
                subject={selectedSubject}
                gradeLevel={selectedGradeLevel}
                topic={selectedTopic}
                onComplete={handleQuizComplete}
                studentId={selectedProfile?.id}
              />
            ) : initialLoading || aiQuizLoading ? (
              <div className="flex items-center justify-center">
                <LoadingQuiz progress={75} maxDuration={5000} />
              </div>
            ) : (
              <div className="max-w-5xl mx-auto">
                <Tabs defaultValue="select" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="select">Select a Quiz</TabsTrigger>
                    <TabsTrigger value="recommended">Recommended</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="select" className="p-4 bg-white rounded-md shadow-sm">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h2 className="text-xl font-semibold mb-4">Choose Your Quiz</h2>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="grade-level">Grade Level</Label>
                            <Select
                              value={selectedGradeLevel}
                              onValueChange={(value: 'k-3' | '4-6' | '7-9') => setSelectedGradeLevel(value)}
                            >
                              <SelectTrigger id="grade-level">
                                <SelectValue placeholder="Select grade level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="k-3">K-3 (Early Elementary)</SelectItem>
                                <SelectItem value="4-6">4-6 (Upper Elementary)</SelectItem>
                                <SelectItem value="7-9">7-9 (Middle School)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="subject">Subject</Label>
                            <Select
                              value={selectedSubject}
                              onValueChange={setSelectedSubject}
                            >
                              <SelectTrigger id="subject">
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableSubjects.map(subject => (
                                  <SelectItem key={subject.name} value={subject.name}>
                                    {subject.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="topic">Topic</Label>
                            <Select
                              value={selectedTopic}
                              onValueChange={setSelectedTopic}
                              disabled={!selectedSubject}
                            >
                              <SelectTrigger id="topic">
                                <SelectValue placeholder={selectedSubject ? "Select topic" : "Select subject first"} />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTopics.map(topic => (
                                  <SelectItem key={topic} value={topic}>
                                    {topic}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <Button 
                            onClick={handleStartQuiz} 
                            disabled={!selectedSubject || !selectedTopic}
                            className="w-full mt-4 bg-eduPurple hover:bg-eduPurple/90"
                          >
                            Start Quiz
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-eduPastel-yellow/30 p-6 rounded-lg border border-eduPastel-yellow/50">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <BookOpen className="h-5 w-5 mr-2 text-amber-600" />
                          Quiz Preview
                        </h3>
                        
                        {selectedSubject && selectedTopic ? (
                          <div>
                            <p className="mb-3">You're about to start a quiz on:</p>
                            <div className="bg-white p-4 rounded-md mb-4">
                              <p className="font-medium">{selectedSubject}: {selectedTopic}</p>
                              <p className="text-sm text-gray-600">Grade Level: {selectedGradeLevel === 'k-3' ? 'Early Elementary' : 
                                                 selectedGradeLevel === '4-6' ? 'Upper Elementary' : 'Middle School'}</p>
                            </div>
                            <p className="text-sm">This quiz will test your knowledge about {selectedTopic.toLowerCase()} with adaptive questions that match your grade level.</p>
                          </div>
                        ) : (
                          <div className="text-gray-500 italic">
                            <p>Select a subject and topic to see quiz details</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="recommended" className="p-4 bg-white rounded-md shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Recommended Quizzes</h2>
                    
                    {loadingRecommendations ? (
                      <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : recommendations.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {recommendations.map((rec, idx) => (
                          <Card key={idx} className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader className="p-4">
                              <CardTitle className="text-lg">{rec.subject}: {rec.topic}</CardTitle>
                              <CardDescription>{rec.reason}</CardDescription>
                            </CardHeader>
                            <CardFooter className="p-4 pt-0">
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => {
                                  handleRecommendationClick(rec.subject, rec.topic);
                                  // Switch to select tab
                                  const selectTab = document.querySelector('button[value="select"]') as HTMLButtonElement;
                                  if (selectTab) selectTab.click();
                                }}
                              >
                                <Brain className="h-4 w-4 mr-2" />
                                Take This Quiz
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-muted p-4 rounded-md text-center">
                        <p>No personalized recommendations available yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">Complete more lessons to get recommendations!</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
            
            {/* Show error message if there's a loading error */}
            {loadError && (
              <div className="max-w-5xl mx-auto mt-8 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 font-medium">{language === 'id' ? "Terjadi kesalahan:" : "An error occurred:"} {loadError}</p>
                <Button 
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setLoadError(null);
                    setShowAIQuiz(false);
                    setAiQuizLoading(false);
                  }}
                >
                  {language === 'id' ? "Kembali ke pilihan kuis" : "Return to quiz selection"}
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Quiz;
