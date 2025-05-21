import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import LanguageSelector from './LanguageSelector';
import { Menu, LogIn, LogOut, Home, BookOpen, PencilRuler, BarChart2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface StudentInfo {
  id: string;
  name: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  age?: number | null; // Updated to allow null
}

interface RecentActivity {
  subject: string;
  topic: string;
}

const Header = () => {
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<StudentInfo | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user) return;
      
      try {
        // Fetch the current student
        const { data: students, error } = await supabase
          .from('students')
          .select('id, name, age, grade_level')
          .eq('parent_id', user.id)
          .limit(1);
          
        if (error) {
          console.error('Error fetching student:', error);
          return;
        }
        
        if (students && students.length > 0) {
          setCurrentStudent({
            id: students[0].id,
            name: students[0].name,
            gradeLevel: students[0].grade_level as 'k-3' | '4-6' | '7-9',
            age: students[0].age // This can now be null
          });
          
          // Fetch most recent learning activity
          const { data: activities } = await supabase
            .from('learning_activities')
            .select('subject, topic')
            .eq('student_id', students[0].id)
            .order('last_interaction_at', { ascending: false })
            .limit(1);
            
          if (activities && activities.length > 0) {
            setRecentActivity({
              subject: activities[0].subject,
              topic: activities[0].topic
            });
          }
        }
      } catch (error) {
        console.error('Error in fetchStudentData:', error);
      }
    };
    
    fetchStudentData();
  }, [user]);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t('auth.signedOut'));
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error(t('auth.signOutError'));
    }
    
    // Close mobile menu after sign out
    setMobileMenuOpen(false);
  };
  
  const handleMobileNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };
  
  const navigateToLessons = () => {
    if (currentStudent) {
      navigate('/lessons', { 
        state: { 
          gradeLevel: currentStudent.gradeLevel || 'k-3', // Default grade level
          studentId: currentStudent.id || null // Default studentId
        }
      });
    } else {
      navigate('/lessons', {
        state: {
          gradeLevel: 'k-3', // Default grade level
          studentId: null // Default studentId
        }
      });
    }
    setMobileMenuOpen(false);
  };
  
  const navigateToQuiz = () => {
    if (currentStudent) {
      // Create a Quiz of the Day with randomized content
      const studentGradeLevel = currentStudent.gradeLevel || 'k-3';
      
      // Randomize subject
      const subjects = ['Math', 'Science', 'English'];
      const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
      
      // Topics by subject
      const topicsBySubject: Record<string, string[]> = {
        'Math': studentGradeLevel === 'k-3' 
          ? ['Numbers', 'Shapes', 'Addition', 'Subtraction', 'Patterns'] 
          : studentGradeLevel === '4-6'
            ? ['Fractions', 'Decimals', 'Multiplication', 'Division', 'Geometry']
            : ['Algebra', 'Geometry', 'Statistics', 'Equations', 'Functions'],
        'Science': studentGradeLevel === 'k-3'
          ? ['Plants', 'Animals', 'Weather', 'Earth', 'Living Things']
          : studentGradeLevel === '4-6'
            ? ['Ecosystems', 'Solar System', 'Matter', 'Energy', 'Living Things']
            : ['Chemistry', 'Physics', 'Biology', 'Earth Science', 'Living Things'],
        'English': studentGradeLevel === 'k-3'
          ? ['Letters', 'Reading', 'Writing', 'Stories', 'Comprehension']
          : studentGradeLevel === '4-6'
            ? ['Grammar', 'Vocabulary', 'Comprehension', 'Writing', 'Literature']
            : ['Literature', 'Essays', 'Rhetoric', 'Analysis', 'Creative Writing']
      };
      
      // Randomly select a topic based on subject
      const topicsForSubject = topicsBySubject[randomSubject] || ['General Knowledge'];
      const randomTopic = topicsForSubject[Math.floor(Math.random() * topicsForSubject.length)];
      
      // Navigate to quiz with randomized content
      navigate('/quiz', { 
        state: { 
          subject: randomSubject,
          topic: randomTopic,
          gradeLevel: studentGradeLevel,
          isQuizOfTheDay: true
        }
      });
      
      toast.success(language === 'id' 
        ? `Kuis Hari Ini: ${randomSubject} - ${randomTopic}` 
        : `Quiz of the Day: ${randomSubject} - ${randomTopic}`);
    } else {
      navigate('/quiz');
    }
    setMobileMenuOpen(false);
  };
  
  return (
    <header className="bg-white border-b border-b-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-full bg-eduPurple p-1">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-eduPurple-dark">
              EduBuddy
            </span>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-1">
          <nav className="flex items-center space-x-1 mr-4">
            <Button variant="ghost" asChild>
              <Link to="/" className={location.pathname === '/' ? 'text-eduPurple' : ''}>
                {t('nav.home')}
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              onClick={navigateToLessons}
              className={location.pathname === '/lessons' ? 'text-eduPurple' : ''}
            >
              {t('nav.lessons')}
            </Button>
            <Button 
              variant="ghost" 
              onClick={navigateToQuiz}
              className={location.pathname === '/quiz' ? 'text-eduPurple' : ''}
            >
              {t('nav.quiz')}
            </Button>
            {user && (
              <Button variant="ghost" asChild>
                <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'text-eduPurple' : ''}>
                  {t('nav.dashboard')}
                </Link>
              </Button>
            )}
          </nav>
          
          <div className="flex items-center space-x-2">
            <LanguageSelector />
            
            {user ? (
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('auth.signOut')}
              </Button>
            ) : (
              <Button 
                variant="primary" 
                size="sm"
                className="bg-eduPurple hover:bg-eduPurple-dark text-white flex items-center"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="h-4 w-4 mr-2" />
                {t('auth.signIn')}
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="text-xl font-display">EduBuddy</SheetTitle>
                <SheetDescription>
                  {t('nav.menu')}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-1">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => handleMobileNavigation('/')}
                >
                  <Home className="mr-2 h-4 w-4" />
                  {t('nav.home')}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={navigateToLessons}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  {t('nav.lessons')}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={navigateToQuiz}
                >
                  <PencilRuler className="mr-2 h-4 w-4" />
                  {t('nav.quiz')}
                </Button>
                {user && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => handleMobileNavigation('/dashboard')}
                  >
                    <BarChart2 className="mr-2 h-4 w-4" />
                    {t('nav.dashboard')}
                  </Button>
                )}
              </div>
              
              <div className="border-t mt-6 pt-6 space-y-4">
                <LanguageSelector />
                
                {user ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full flex items-center justify-center"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('auth.signOut')}
                  </Button>
                ) : (
                  <Button 
                    variant="primary" 
                    size="sm"
                    className="w-full bg-eduPurple hover:bg-eduPurple-dark text-white flex items-center justify-center"
                    onClick={() => handleMobileNavigation('/auth')}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    {t('auth.signIn')}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
