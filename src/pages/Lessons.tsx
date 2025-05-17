
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SubjectCard from '@/components/SubjectCard';
import LearningBuddy from '@/components/LearningBuddy';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Award, ChevronLeft, Star, Sparkles } from 'lucide-react';

const Lessons = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [gradeLevel, setGradeLevel] = useState<'k-3' | '4-6' | '7-9'>('k-3');
  const [progress, setProgress] = useState(0);
  const [stars, setStars] = useState(0);
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    // Get grade level from location state or default to 'k-3'
    if (location.state?.gradeLevel) {
      setGradeLevel(location.state.gradeLevel);
    }
    
    // Simulate loading user data
    setTimeout(() => {
      setProgress(30);
      setStars(12);
      setLoaded(true);
    }, 1000);
  }, [location.state]);
  
  const gradeName = {
    'k-3': 'Early Learners (K-3)',
    '4-6': 'Intermediate (4-6)',
    '7-9': 'Advanced (7-9)'
  };
  
  const handleGoBack = () => {
    navigate('/');
  };

  const handleGoToAILearning = () => {
    navigate('/ai-learning', { state: { gradeLevel } });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Grade Header */}
        <section className="bg-eduPastel-purple py-8">
          <div className="container px-4 md:px-6">
            <Button 
              variant="ghost" 
              size="sm"
              className="mb-4"
              onClick={handleGoBack}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold">{gradeName[gradeLevel]}</h1>
                <p className="text-muted-foreground">Choose a subject to continue your learning adventure!</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Overall Progress</span>
                  <div className="w-48 flex items-center gap-2">
                    <Progress value={progress} className="h-2" />
                    <span className="text-sm font-medium">{progress}%</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{stars}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Award className="h-5 w-5 text-eduPurple" />
                  <span className="font-semibold">3</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* AI Learning Banner */}
        <section className="py-6 bg-gradient-to-r from-eduPurple to-blue-600">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white">
              <div className="flex-1">
                <h2 className="text-2xl font-display font-bold mb-2">AI Learning Adventure</h2>
                <p className="opacity-90">Create custom lessons, quizzes, and games about any topic with our AI learning assistant!</p>
              </div>
              <Button 
                onClick={handleGoToAILearning}
                className="bg-white text-eduPurple hover:bg-gray-100"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Try AI Learning
              </Button>
            </div>
          </div>
        </section>
        
        {/* Subject Selection */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <SubjectCard subject="math" gradeLevel={gradeLevel} />
              <SubjectCard subject="english" gradeLevel={gradeLevel} />
              <SubjectCard subject="science" gradeLevel={gradeLevel} />
            </div>
            
            {/* Recent Activity */}
            <div className="mt-12">
              <h2 className="text-2xl font-display font-bold mb-4">Recent Activity</h2>
              
              {loaded ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-1 divide-y">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-eduPastel-green flex items-center justify-center">
                          <Star className="h-5 w-5 text-eduPurple" />
                        </div>
                        <div>
                          <p className="font-medium">Addition Quiz Completed</p>
                          <p className="text-sm text-muted-foreground">Math • 2 days ago</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-green-600">8/10 correct</span>
                    </div>
                    
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-eduPastel-blue flex items-center justify-center">
                          <Award className="h-5 w-5 text-eduPurple" />
                        </div>
                        <div>
                          <p className="font-medium">Badge Earned: Math Explorer</p>
                          <p className="text-sm text-muted-foreground">Achievements • 3 days ago</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-eduPastel-peach flex items-center justify-center">
                          <Star className="h-5 w-5 text-eduPurple" />
                        </div>
                        <div>
                          <p className="font-medium">Completed Lesson: Parts of Speech</p>
                          <p className="text-sm text-muted-foreground">English • 4 days ago</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-eduPurple">+5 stars</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 rounded-lg border border-dashed">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-muted h-10 w-10"></div>
                    <div className="flex-1 space-y-6 py-1">
                      <div className="h-2 bg-muted rounded"></div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="h-2 bg-muted rounded col-span-2"></div>
                          <div className="h-2 bg-muted rounded col-span-1"></div>
                        </div>
                        <div className="h-2 bg-muted rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* Learning Recommendations */}
        <section className="py-10 bg-eduPastel-gray">
          <div className="container px-4 md:px-6">
            <h2 className="text-2xl font-display font-bold mb-6">Recommended Next Steps</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Counting Fun",
                  subject: "Math",
                  description: "Practice counting numbers up to 20",
                  color: "bg-eduPastel-blue"
                },
                {
                  title: "Letter Sounds",
                  subject: "English",
                  description: "Learn the sounds that letters make",
                  color: "bg-eduPastel-green"
                },
                {
                  title: "Animal Friends",
                  subject: "Science", 
                  description: "Learn about different types of animals",
                  color: "bg-eduPastel-peach"
                },
                {
                  title: "Shape Adventure",
                  subject: "Math",
                  description: "Explore different shapes all around us",
                  color: "bg-eduPastel-yellow"
                }
              ].map((item, i) => (
                <div key={i} className={`rounded-lg ${item.color} p-4 hover:shadow-md transition-shadow`}>
                  <span className="text-xs font-medium text-muted-foreground">{item.subject}</span>
                  <h3 className="font-display font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 w-full justify-start text-eduPurple hover:text-eduPurple-dark hover:bg-white/50"
                  >
                    Start Lesson
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Learning Buddy */}
        <LearningBuddy />
      </main>
      
      <Footer />
    </div>
  );
};

export default Lessons;
