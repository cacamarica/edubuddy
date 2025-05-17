import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LearningBuddy from '@/components/LearningBuddy';
import StudentProfile from '@/components/StudentProfile';
import { toast } from 'sonner';
import LearningHeader from '@/components/LearningComponents/LearningHeader';
import TopicSelector from '@/components/LearningComponents/TopicSelector';
import LearningContentWrapper from '@/components/LearningComponents/LearningContentWrapper';
import useLearningGradeLevel from '@/hooks/useLearningGradeLevel';
import useStarsManager from '@/hooks/useStarsManager';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Student {
  id: string;
  name: string;
  age: number;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  avatar?: string;
}

const AILearning = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { stars, addStars } = useStarsManager();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  const initialGradeLevel = (location.state?.gradeLevel as 'k-3' | '4-6' | '7-9') || 'k-3';
  const { 
    gradeLevel, 
    setGradeLevel, 
    subjectOptions, 
    getTopicSuggestionsForSubject,
    updateGradeLevelFromStudent
  } = useLearningGradeLevel(initialGradeLevel);
  
  const [subject, setSubject] = useState<string>(location.state?.subject || 'Math');
  const [topic, setTopic] = useState<string>(location.state?.topic || '');
  const [contentReady, setContentReady] = useState(false);
  const [activeTab, setActiveTab] = useState('lesson');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [aiUsageCount, setAiUsageCount] = useState<number>(0);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  
  // Load AI usage count from localStorage on component mount
  useEffect(() => {
    const storedCount = localStorage.getItem('aiUsageCount');
    if (storedCount) {
      setAiUsageCount(parseInt(storedCount));
    }
  }, []);

  // Update localStorage when aiUsageCount changes
  useEffect(() => {
    localStorage.setItem('aiUsageCount', aiUsageCount.toString());
  }, [aiUsageCount]);

  // Reset AI usage count when user logs in
  useEffect(() => {
    if (user && aiUsageCount > 0) {
      setAiUsageCount(0);
      localStorage.setItem('aiUsageCount', '0');
    }
  }, [user, aiUsageCount]);

  // Load real student data from Supabase when user is logged in
  useEffect(() => {
    const fetchStudents = async () => {
      if (!user) {
        return;
      }

      setIsLoadingStudents(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('parent_id', user.id);
      
      if (error) {
        console.error("Error fetching students:", error);
        toast.error(language === 'id' 
          ? "Gagal memuat data siswa" 
          : "Failed to load student data");
        setIsLoadingStudents(false);
        return;
      }

      // If there's student data and a studentId from location state, set current student
      if (data && data.length > 0) {
        if (location.state?.studentId) {
          const student = data.find(s => s.id === location.state.studentId);
          if (student) {
            const formattedStudent = {
              id: student.id,
              name: student.name,
              age: student.age || 7,
              gradeLevel: student.grade_level as 'k-3' | '4-6' | '7-9',
              avatar: location.state?.studentAvatar || '👧'
            };
            setCurrentStudent(formattedStudent);
            updateGradeLevelFromStudent(formattedStudent);
          } else if (data[0]) {
            // If specified student not found, use the first one
            const defaultStudent = {
              id: data[0].id,
              name: data[0].name,
              age: data[0].age || 7,
              gradeLevel: data[0].grade_level as 'k-3' | '4-6' | '7-9',
              avatar: '👧'
            };
            setCurrentStudent(defaultStudent);
            updateGradeLevelFromStudent(defaultStudent);
          }
        } else if (data[0]) {
          // If no studentId specified, use the first student
          const defaultStudent = {
            id: data[0].id,
            name: data[0].name,
            age: data[0].age || 7,
            gradeLevel: data[0].grade_level as 'k-3' | '4-6' | '7-9',
            avatar: '👧'
          };
          setCurrentStudent(defaultStudent);
          updateGradeLevelFromStudent(defaultStudent);
        }
      }
      
      setIsLoadingStudents(false);
    };

    fetchStudents();
  }, [user, location.state?.studentId, updateGradeLevelFromStudent, language]);

  // Handle auto-start of content if navigated with specific topic
  useEffect(() => {
    if (location.state?.topic && location.state?.autoStart && !contentReady) {
      setTopic(location.state.topic);
      setContentReady(true);
      
      // If user is not logged in, increment AI usage count
      if (!user) {
        setAiUsageCount(prev => prev + 1);
      }
      
      toast.success(`${language === 'id' ? 'Memulai' : 'Starting'} ${location.state.topic} ${language === 'id' ? 'di' : 'in'} ${location.state.subject}!`, {
        position: "bottom-right",
        duration: 3000,
      });
    }
  }, [location.state, contentReady, language, user]);

  // Update subject when grade level changes
  useEffect(() => {
    // If current subject is not available in the new grade level, set to first available
    if (!subjectOptions.includes(subject)) {
      setSubject(subjectOptions[0]);
    }
  }, [gradeLevel, subject, subjectOptions]);

  const handleGoBack = () => {
    navigate('/lessons', { 
      state: { 
        studentId: currentStudent?.id,
        studentName: currentStudent?.name,
        gradeLevel
      } 
    });
  };

  const handleTopicSelect = (suggestion: string) => {
    setTopic(suggestion);
    setCustomTopic(suggestion);
  };

  const handleCreateContent = () => {
    const finalTopic = customTopic.trim() ? customTopic : topic;
    
    // Check if non-logged in user has reached AI usage limit
    if (!user && aiUsageCount >= 2) {
      toast.error(
        language === 'id'
          ? 'Batas penggunaan AI tercapai. Silakan masuk untuk melanjutkan.'
          : 'AI usage limit reached. Please sign in to continue.',
        {
          action: {
            label: language === 'id' ? 'Masuk' : 'Sign In',
            onClick: () => navigate('/auth', { state: { action: 'signin' } }),
          },
        }
      );
      return;
    }
    
    if (finalTopic.trim()) {
      setTopic(finalTopic);
      setContentReady(true);
      
      // Increment AI usage count for non-logged in users
      if (!user) {
        setAiUsageCount(prev => prev + 1);
      }
    } else {
      toast.error(language === 'id' ? "Silakan masukkan topik atau pilih salah satu dari saran" : "Please enter a topic or select one from the suggestions");
    }
  };

  const handleQuizComplete = (score: number) => {
    addStars(score);
    
    // Here you would also save the progress to the database for logged-in users
    if (user && currentStudent) {
      // This is handled by the LessonTracking component now
    }
  };

  // Reset to topic selection
  const handleReset = () => {
    setContentReady(false);
    setTopic('');
    setCustomTopic('');
    setActiveTab('lesson');
  };

  const handleStudentChange = (student: Student) => {
    setCurrentStudent(student);
    updateGradeLevelFromStudent(student);
    setShowProfileManager(false);
  };

  const handleToggleProfileManager = () => {
    setShowProfileManager(!showProfileManager);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <LearningHeader 
          currentStudent={currentStudent}
          stars={stars}
          showProfileManager={showProfileManager}
          onToggleProfileManager={handleToggleProfileManager}
          onGoBack={handleGoBack}
        />
        
        {showProfileManager && (
          <section className="py-4">
            <div className="container px-4 md:px-6">
              <StudentProfile 
                onStudentChange={handleStudentChange} 
                currentStudentId={currentStudent?.id} 
              />
            </div>
          </section>
        )}
        
        <section className="py-8">
          <div className="container px-4 md:px-6">
            {!contentReady ? (
              <div className="grid gap-6 md:grid-cols-3">
                {!currentStudent && !isLoadingStudents && (
                  <div className="md:col-span-3">
                    <StudentProfile onStudentChange={handleStudentChange} />
                  </div>
                )}
                
                {/* AI Usage Limit Warning for non-logged in users */}
                {!user && (
                  <div className="md:col-span-3 mb-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-yellow-800">
                          {language === 'id' ? 'Penggunaan Terbatas' : 'Limited Access'}
                        </h3>
                        <p className="text-sm text-yellow-700">
                          {language === 'id'
                            ? `Anda telah menggunakan ${aiUsageCount}/2 percobaan AI. Masuk untuk akses tak terbatas.`
                            : `You've used ${aiUsageCount}/2 AI attempts. Sign in for unlimited access.`}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/auth', { state: { action: 'signin' } })}
                        className="flex items-center gap-2"
                      >
                        <LogIn className="h-4 w-4" />
                        {language === 'id' ? 'Masuk' : 'Sign In'}
                      </Button>
                    </div>
                  </div>
                )}
                
                <TopicSelector
                  subject={subject}
                  subjectOptions={subjectOptions}
                  topicSuggestions={getTopicSuggestionsForSubject(subject)}
                  customTopic={customTopic}
                  onSubjectChange={setSubject}
                  onTopicSelect={handleTopicSelect}
                  onCustomTopicChange={setCustomTopic}
                  onCreateContent={handleCreateContent}
                />
              </div>
            ) : (
              <LearningContentWrapper
                subject={subject}
                gradeLevel={gradeLevel}
                topic={topic}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onReset={handleReset}
                onQuizComplete={handleQuizComplete}
              />
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
