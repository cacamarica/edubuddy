
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AILesson from '@/components/AILesson';
import AIQuiz from '@/components/AIQuiz';
import AIGame from '@/components/AIGame';
import LearningBuddy from '@/components/LearningBuddy';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Student, convertToStudent } from '@/types/learning';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LearningContent from '@/components/LearningComponents/LearningContent';
import { Skeleton } from '@/components/ui/skeleton';
import StudentProfile from '@/components/StudentProfile';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

// Interface for needed props
interface LearningContentComponentProps {
  gradeLevel: 'k-3' | '4-6' | '7-9';
  subject: string;
  topic: string;
  student?: Student;
  autoStart?: boolean;
}

interface AIQuizProps {
  gradeLevel: 'k-3' | '4-6' | '7-9';
  subject: string;
  topic: string;
  studentId?: string;
  autoStart?: boolean;
}

interface AIGameProps {
  gradeLevel: 'k-3' | '4-6' | '7-9';
  subject: string;
  topic: string;
  studentId?: string;
  studentName?: string;
  autoStart?: boolean;
}

const AILearning = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isParent, isStudent } = useAuth();
  
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('learn');
  const [isShowingProfile, setIsShowingProfile] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  
  // Extract data from location.state
  const gradeLevel = location.state?.gradeLevel || 'k-3';
  const subject = location.state?.subject || 'Math';
  const topic = location.state?.topic || 'General Knowledge';
  const autoStart = location.state?.autoStart || false;
  const isNewLesson = location.state?.isNewLesson || false;
  
  // Note: We're using the studentId from location.state, not currentStudent.id
  const studentId = location.state?.studentId;
  const studentName = location.state?.studentName || 'Student';
  
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      
      // If no user is logged in, just set loading to false
      if (!user) {
        setLoading(false);
        return;
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
              avatar_url: profile.avatar_url
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
      } else if (isParent && studentId) {
        // For parent users, fetch the selected student profile
        try {
          const { data: profile } = await supabase
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();
          
          if (profile) {
            const studentData: Student = {
              id: profile.id,
              name: profile.name,
              age: profile.age || 10,
              grade_level: profile.grade_level || 'k-3',
              parent_id: profile.parent_id || user.id,
              created_at: profile.created_at || new Date().toISOString(),
              avatar_url: profile.avatar_url
            };
            
            setCurrentStudent(studentData);
          }
        } catch (error) {
          console.error('Error fetching student profile:', error);
        }
      }
      
      setLoading(false);
    };
    
    fetchInitialData();
  }, [user, isParent, isStudent, studentId, gradeLevel]);
  
  const handleStudentChange = (student: Student) => {
    setCurrentStudent(student);
  };
  
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Sign in to access lessons</h2>
            <p className="mb-6 text-gray-600">
              Please sign in or create an account to access our personalized AI learning experience.
            </p>
            <Button 
              onClick={() => navigate('/auth', { state: { returnUrl: location.pathname + location.search }})}
              className="inline-flex items-center"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In / Register
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
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs font-normal">
                  {gradeLevel === 'k-3' ? 'K-3rd Grade' : 
                   gradeLevel === '4-6' ? '4-6th Grade' : '7-9th Grade'}
                </Badge>
                <Badge variant="outline" className="text-xs font-normal">
                  {subject}
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{topic}</h1>
            </div>
            <div className="mt-3 md:mt-0">
              {currentStudent && (
                <div 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setIsShowingProfile(!isShowingProfile)}  
                >
                  <div className="text-right">
                    <p className="text-sm font-medium">Learning as</p>
                    <p className="font-bold">{currentStudent.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-4 flex-grow">
        {isShowingProfile ? (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="container px-4 md:px-6">
              <StudentProfile 
                student={currentStudent || undefined} 
                currentStudentId={currentStudent?.id}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3">
              {loading ? (
                <Skeleton className="h-[600px] w-full" />
              ) : (
                <>
                  {!currentStudent && !isLoadingStudents && (
                    <div className="md:col-span-3">
                      <StudentProfile 
                        onStudentChange={(student) => handleStudentChange({
                          id: student.id,
                          name: student.name,
                          grade_level: student.grade_level || 'k-3',
                          parent_id: student.parent_id || user.id,
                          created_at: student.created_at || new Date().toISOString(),
                          age: student.age,
                          avatar_url: student.avatar_url
                        })}
                      />
                    </div>
                  )}
                  
                  {currentStudent && (
                    <>
                      <Tabs 
                        defaultValue={selectedTab} 
                        value={selectedTab} 
                        onValueChange={setSelectedTab}
                        className="w-full mb-4 bg-white rounded-lg shadow"
                      >
                        <TabsList className="border-b p-0 h-auto">
                          <TabsTrigger 
                            value="learn" 
                            className="rounded-none rounded-tl-lg data-[state=active]:shadow-none py-3"
                          >
                            Learn
                          </TabsTrigger>
                          <TabsTrigger 
                            value="quiz" 
                            className="rounded-none data-[state=active]:shadow-none py-3"
                          >
                            Quiz
                          </TabsTrigger>
                          <TabsTrigger 
                            value="practice" 
                            className="rounded-none rounded-tr-lg data-[state=active]:shadow-none py-3"
                          >
                            Practice
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="learn" className="p-4">
                          <LearningContent
                            gradeLevel={gradeLevel}
                            subject={subject}
                            topic={topic}
                            activeTab="lesson"
                            onTabChange={() => {}}
                            onReset={() => {}}
                            onQuizComplete={() => {}}
                          />
                        </TabsContent>
                        
                        <TabsContent value="quiz" className="p-4">
                          <AIQuiz
                            gradeLevel={gradeLevel}
                            subject={subject}
                            topic={topic}
                            studentId={currentStudent.id}
                            limitProgress={false}
                          />
                        </TabsContent>
                        
                        <TabsContent value="practice" className="p-4">
                          <AIGame 
                            gradeLevel={gradeLevel}
                            subject={subject}
                            topic={topic}
                            studentId={currentStudent.id}
                            limitProgress={false}
                          />
                        </TabsContent>
                      </Tabs>
                    </>
                  )}
                </>
              )}
            </div>
            
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow p-4 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Learning Buddy</h2>
                <Separator className="my-3" />
                <LearningBuddy 
                  subject={subject}
                  topic={topic}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AILearning;
