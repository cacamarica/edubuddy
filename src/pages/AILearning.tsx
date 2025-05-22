import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AILesson from '@/components/AILesson';
import AIQuiz from '@/components/AIQuiz';
import AIGame from '@/components/AIGame';
import LearningBuddy from '@/components/LearningBuddy';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Student, convertToStudent } from '@/types/learning';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LearningContent from '@/components/LearningComponents/LearningContent';
import { Skeleton } from '@/components/ui/skeleton';
import StudentProfile from '@/components/StudentProfile';
import { LogIn, BookOpen, PencilRuler, Gamepad, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { fixStudentProfilesMappings } from '@/utils/databaseMigration';
import { toast } from 'sonner';

// Interface for needed props
interface LearningContentComponentProps {
  gradeLevel: 'k-3' | '4-6' | '7-9';
  subject: string;
  topic: string;
  subtopic?: string;
  student?: Student;
  autoStart?: boolean;
  recommendationId?: string;
}

interface AIQuizProps {
  gradeLevel: 'k-3' | '4-6' | '7-9';
  subject: string;
  topic: string;
  subtopic?: string;
  studentId?: string;
  autoStart?: boolean;
  recommendationId?: string;
  onComplete?: (score: number) => void;
}

interface AIGameProps {
  gradeLevel: 'k-3' | '4-6' | '7-9';
  subject: string;
  topic: string;
  subtopic?: string;
  studentId?: string;
  studentName?: string;
  autoStart?: boolean;
  recommendationId?: string;
}

const AILearning = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isParent, isStudent } = useAuth();
  const { language, t } = useLanguage();
  
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('lesson');
  const [isShowingProfile, setIsShowingProfile] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  
  // Extract data from location.state
  const gradeLevel = location.state?.gradeLevel || 'k-3';
  const subject = location.state?.subject || 'Math';
  const topic = location.state?.topic || 'General Knowledge';
  const subtopic = location.state?.subtopic || '';
  const autoStart = location.state?.autoStart || false;
  const isNewLesson = location.state?.isNewLesson || false;
  
  // Note: We're using the studentId from location.state, not currentStudent.id
  const studentId = location.state?.studentId;
  const studentName = location.state?.studentName || 'Student';
  
  // Redirect if studentId is missing
  React.useEffect(() => {
    if (!location.state?.studentId) {
      navigate('/dashboard');
    }
  }, [location.state, navigate]);
  
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setLoadError(null);
      
      try {
        // Run database migration to fix potential constraint issues
        await fixStudentProfilesMappings();
        
        // If no user is logged in, just set loading to false
        if (!user) {
          setLoading(false);
          return;
        }
        
        // If we have a studentId from location state, fetch that student's data first
        if (studentId) {
          try {
            const { data: profile, error } = await supabase
              .from('students')
              .select('*')
              .eq('id', studentId)
              .single();
            
            if (error) throw error;
            
            if (profile) {
              const studentData: Student = {
                id: profile.id,
                name: profile.name,
                age: profile.age || 10,
                grade_level: profile.grade_level || gradeLevel,
                parent_id: profile.parent_id || user.id,
                created_at: profile.created_at || new Date().toISOString(),
                avatar_url: profile.avatar_url || undefined
              };
              
              setCurrentStudent(studentData);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('Error fetching student profile:', error);
            toast.error(language === 'id' 
              ? 'Gagal memuat profil siswa' 
              : 'Failed to load student profile');
          }
        }
        
        if (isStudent) {
          // For student users, create their profile for the learning session
          try {
            // If we're a student user, we are the current student
            const { data: profile } = await supabase
              .from('students')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (profile) {
              const studentData: Student = {
                id: profile.id,
                name: profile.name,
                age: profile.age || 10,
                grade_level: profile.grade_level || 'k-3',
                parent_id: profile.parent_id || '',
                created_at: profile.created_at || new Date().toISOString(),
                avatar_url: profile.avatar_url || undefined
              };
              
              setCurrentStudent(studentData);
            } else {
              // Create a default profile for demo
              const defaultStudent: Student = {
                id: user.id,
                name: user.user_metadata?.full_name || 'Student',
                age: 10,
                grade_level: gradeLevel || 'k-3',
                parent_id: '',
                created_at: new Date().toISOString(),
                avatar_url: undefined
              };
              
              setCurrentStudent(defaultStudent);
            }
          } catch (error) {
            console.error('Error fetching student profile:', error);
            // Create a default profile for demo
            const defaultStudent: Student = {
              id: user.id,
              name: user.user_metadata?.full_name || 'Student',
              age: 10,
              grade_level: gradeLevel || 'k-3',
              parent_id: '',
              created_at: new Date().toISOString(),
              avatar_url: undefined
            };
            
            setCurrentStudent(defaultStudent);
          }
        } else if (isParent && !studentId) {
          // For parent users without a selected student, fetch all students and select the first one
          try {
            const { data: students } = await supabase
              .from('students')
              .select('*')
              .eq('parent_id', user.id);
            
            if (students && students.length > 0) {
              const firstStudent = students[0];
              const studentData: Student = {
                id: firstStudent.id,
                name: firstStudent.name,
                age: firstStudent.age || 10,
                grade_level: firstStudent.grade_level || 'k-3',
                parent_id: firstStudent.parent_id || user.id,
                created_at: firstStudent.created_at || new Date().toISOString(),
                avatar_url: firstStudent.avatar_url || undefined
              };
              setCurrentStudent(studentData);
            } else {
              setIsShowingProfile(true);
            }
          } catch (error) {
            console.error('Error fetching students:', error);
            setIsShowingProfile(true);
          }
        }
      } catch (error) {
        console.error('Error initializing learning page:', error);
        setLoadError(language === 'id' 
          ? 'Terjadi kesalahan saat memuat halaman pembelajaran' 
          : 'An error occurred while loading the learning page');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [user, isParent, isStudent, studentId, gradeLevel, language]);
  
  const handleStudentChange = (student: Student) => {
    setCurrentStudent(student);
  };
  
  // Handler function to reset content
  const handleResetContent = () => {
    // Reset the content and reload
    navigate(0);
  };

  // Handler for quiz completion
  const handleQuizComplete = (score: number) => {
    // Just a placeholder - in a real implementation this would update badges or stars
    console.log(`Quiz completed with score: ${score}`);
    toast.success(
      language === 'id' 
        ? `Kuis selesai dengan skor: ${score}` 
        : `Quiz completed with score: ${score}`
    );
  };
  
  // Handle lesson completion
  const handleLessonComplete = () => {
    toast.success(
      language === 'id' 
        ? 'Pelajaran selesai!' 
        : 'Lesson completed!'
    );
    // Additional completion logic could be added here
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    console.log(`Tab changed to: ${value}`);
  };

  // Display title with subtopic if available
  const displayTitle = subtopic ? `${topic}: ${subtopic}` : topic;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">{language === 'id' ? 'Masuk untuk mengakses pelajaran' : 'Sign in to access lessons'}</h2>
            <p className="mb-6 text-gray-600">
              {language === 'id' 
                ? 'Silakan masuk atau buat akun untuk mengakses pengalaman belajar AI yang dipersonalisasi.'
                : 'Please sign in or create an account to access our personalized AI learning experience.'}
            </p>
            <Button 
              onClick={() => navigate('/auth', { state: { returnUrl: location.pathname + location.search }})}
              className="inline-flex items-center"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {language === 'id' ? 'Masuk / Daftar' : 'Sign In / Register'}
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="bg-gradient-to-b from-eduPurple-light/30 to-white">
        <div className="container mx-auto p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold font-display">{subject} - {displayTitle}</h1>
              {currentStudent && (
                <p className="text-eduPurple">{language === 'id' ? 'Belajar sebagai:' : 'Learning as:'} {currentStudent.name}</p>
              )}
            </div>
            <div className="mt-2 md:mt-0">
              <Badge variant="outline" className="mr-2">
                {gradeLevel === 'k-3' ? 'K-3' : (gradeLevel === '4-6' ? t('topic.grade46') || 'Grade 4-6' : t('topic.grade79') || 'Grade 7-9')}
              </Badge>
              <Badge>{subject}</Badge>
            </div>
          </div>
          
          {/* Error state */}
          {loadError && (
            <div className="bg-white p-6 rounded-lg shadow-md text-center my-8">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-red-600 mb-2">{language === 'id' ? 'Kesalahan Pembelajaran AI' : 'AI Learning Error'}</h2>
              <p className="mb-4">{loadError}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-eduPurple hover:bg-eduPurple-dark"
              >
                {language === 'id' ? 'Coba Lagi' : 'Try Again'}
              </Button>
            </div>
          )}
          
          {/* Tab Navigation - only show if no error */}
          {!loadError && (
            <Tabs 
              defaultValue={selectedTab} 
              onValueChange={handleTabChange}
              className="mb-6"
            >
              <div className="border-b mb-4">
                <TabsList className="w-full rounded-none bg-transparent h-auto p-0 justify-start mb-[-1px]">
                  <TabsTrigger 
                    value="lesson" 
                    className="flex items-center gap-2 px-5 py-3 rounded-t-lg border-b-2 border-transparent data-[state=active]:border-eduPurple data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:text-eduPurple mb-[-1px]"
                  >
                    <BookOpen className="h-4 w-4" />
                    {language === 'id' ? 'Pelajaran' : 'Lesson'}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="quiz" 
                    className="flex items-center gap-2 px-5 py-3 rounded-t-lg border-b-2 border-transparent data-[state=active]:border-eduPurple data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:text-eduPurple mb-[-1px]"
                  >
                    <PencilRuler className="h-4 w-4" />
                    {language === 'id' ? 'Kuis' : 'Quiz'}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="game" 
                    className="flex items-center gap-2 px-5 py-3 rounded-t-lg border-b-2 border-transparent data-[state=active]:border-eduPurple data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:text-eduPurple mb-[-1px]"
                  >
                    <Gamepad className="h-4 w-4" />
                    {language === 'id' ? 'Permainan' : 'Game'}
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {loading ? (
                <div className="p-4">
                  <Skeleton className="h-8 w-1/3 mb-4" />
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-4" />
                  <Skeleton className="h-64 w-full rounded-md" />
                </div>
              ) : (
                <TabsContent value={selectedTab} className="m-0 p-0">
                  {selectedTab === 'lesson' && (
                    <AILesson
                      subject={subject}
                      gradeLevel={gradeLevel}
                      topic={topic}
                      subtopic={subtopic}
                      studentId={currentStudent?.id}
                      onComplete={handleLessonComplete}
                    />
                  )}
                  {selectedTab === 'quiz' && (
                    <AIQuiz
                      subject={subject}
                      gradeLevel={gradeLevel}
                      topic={topic}
                      subtopic={subtopic}
                      studentId={currentStudent?.id}
                      onComplete={handleQuizComplete}
                    />
                  )}
                  {selectedTab === 'game' && (
                    <AIGame
                      subject={subject}
                      gradeLevel={gradeLevel}
                      topic={topic}
                      subtopic={subtopic}
                      studentId={currentStudent?.id}
                      studentName={currentStudent?.name}
                    />
                  )}
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </div>
      {/* Learning Buddy floats independently, no need for props */}
      <LearningBuddy />
      <Footer />
    </div>
  );
};

export default AILearning;
