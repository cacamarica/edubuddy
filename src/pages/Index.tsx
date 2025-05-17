
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GradeSelector from '@/components/GradeSelector';
import LearningBuddy from '@/components/LearningBuddy';
import { Button } from '@/components/ui/button';
import { Award, BookOpen, School, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(true);
  
  useEffect(() => {
    // Welcome toast on first visit
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setTimeout(() => {
        toast.success("Welcome to EduBuddy! Start your learning adventure today!", {
          position: "bottom-right",
          duration: 5000,
        });
        localStorage.setItem('hasVisited', 'true');
      }, 1500);
    }
  }, []);
  
  const handleGetStarted = () => {
    setShowWelcome(false);
    
    // Scroll to grade selector
    document.getElementById('grade-selector')?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        {showWelcome && (
          <section className="bg-gradient-to-b from-eduPastel-purple to-white py-16">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex items-center justify-center mb-4 space-x-2 animate-bounce-small">
                  <School className="h-10 w-10 text-eduPurple" />
                  <BookOpen className="h-10 w-10 text-eduPurple" />
                  <Star className="h-10 w-10 text-eduPurple" />
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tighter">
                  <span className="text-eduPurple">Learning</span> is an 
                  <span className="text-eduPurple-dark"> Adventure!</span>
                </h1>
                
                <p className="max-w-[600px] text-lg md:text-xl text-muted-foreground">
                  Discover the joy of learning with interactive lessons, fun quizzes, 
                  and exciting games designed for students ages 5-15.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 min-[400px]:gap-6">
                  <Button 
                    size="lg"
                    className="bg-eduPurple hover:bg-eduPurple-dark text-lg font-display"
                    onClick={handleGetStarted}
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-eduPurple text-eduPurple hover:bg-eduPurple/10 hover:text-eduPurple-dark text-lg font-display"
                    onClick={() => navigate('/about')}
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* Features Section */}
        <section className="py-12 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-eduPastel-yellow">
                <Award className="h-12 w-12 text-eduPurple mb-4" />
                <h3 className="text-xl font-display font-bold mb-2">Interactive Lessons</h3>
                <p className="text-muted-foreground">
                  Engaging lessons that make learning fun with animations, stories, and interactive elements.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-eduPastel-green">
                <BookOpen className="h-12 w-12 text-eduPurple mb-4" />
                <h3 className="text-xl font-display font-bold mb-2">Fun Quizzes</h3>
                <p className="text-muted-foreground">
                  Test your knowledge with colorful quizzes that provide instant feedback and encouragement.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-eduPastel-blue">
                <Star className="h-12 w-12 text-eduPurple mb-4" />
                <h3 className="text-xl font-display font-bold mb-2">Learning Buddy</h3>
                <p className="text-muted-foreground">
                  Get help anytime from your friendly AI learning assistant who explains concepts in simple terms.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Grade Selector Section */}
        <section id="grade-selector" className="py-12 bg-eduPastel-gray">
          <div className="container px-4 md:px-6">
            <GradeSelector />
          </div>
        </section>
        
        {/* For Parents Section */}
        <section className="py-12 bg-white">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-display font-bold mb-4">For Parents & Teachers</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Track your child's progress, view completed lessons, and see where they might need extra help.
                Our parent dashboard gives you all the insights you need.
              </p>
              <Button 
                className="bg-eduPurple hover:bg-eduPurple-dark"
                onClick={() => navigate('/dashboard')}
              >
                View Dashboard
              </Button>
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

export default Index;
