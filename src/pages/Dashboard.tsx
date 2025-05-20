import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Users, ChevronLeft, Settings, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StudentProfileSelector from '@/components/DashboardComponents/StudentProfileSelector';
import StudentProfile from '@/components/StudentProfile';
import StudentAchievements from '@/components/DashboardComponents/StudentAchievements';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Spinner } from '@/components/ui/spinner';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { Student, StudentProfile as StudentProfileType, convertToStudent } from '@/types/learning';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Import our enhanced components
import EnhancedRecentActivities from '@/components/DashboardComponents/EnhancedRecentActivities';
import EnhancedAIRecommendations from '@/components/DashboardComponents/EnhancedAIRecommendations';
import StudentProgressSummary from '@/components/DashboardComponents/StudentProgressSummary';

type GradeLevel = 'k-3' | '4-6' | '7-9';

// Fallback component to show when StudentProfile fails to load
const StudentProfileFallback = ({ onBack }: { onBack: () => void }) => {
  const { language } = useLanguage();
  return (
    <Card>
      <CardContent className="text-center py-8">
        <h3 className="text-lg font-medium mb-4">
          {language === 'id' ? 'Terjadi kesalahan' : 'An error occurred'}
        </h3>
        <p className="mb-4">
          {language === 'id' 
            ? 'Tidak dapat memuat profil siswa. Silakan coba lagi.' 
            : 'Could not load student profiles. Please try again.'}
        </p>
        <Button onClick={onBack}>
          {language === 'id' ? 'Kembali ke Dasbor' : 'Back to Dashboard'}
        </Button>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  const { user } = useAuth();
  const { selectedProfile, setSelectedProfile } = useStudentProfile();
  const navigate = useNavigate();

  // Derive currentStudentId from the context's selectedProfile
  const currentStudentId = selectedProfile?.id;

  const getValidGradeLevel = (grade?: string): GradeLevel => {
    const validGrades: GradeLevel[] = ['k-3', '4-6', '7-9'];
    if (grade && validGrades.includes(grade as GradeLevel)) {
      return grade as GradeLevel;
    }
    return 'k-3'; // Default fallback
  };

  const handleStudentChange = async (studentId: string) => {
    if (studentId) {
      try {
        // Fetch the complete student data from Supabase to ensure we have accurate data
        const { data: studentData, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();
          
        if (error) {
          console.error('Error fetching student data:', error);
          return;
        }
        
        if (studentData) {
          // Convert database format to StudentProfile format with correct grade level
          const studentProfile: StudentProfileType = {
            id: studentData.id,
            name: studentData.name,
            age: studentData.age || 10,
            gradeLevel: studentData.grade_level, // This ensures we use the correct grade from the database
            parentId: studentData.parent_id || user?.id || '',
            createdAt: studentData.created_at || new Date().toISOString(),
            avatarUrl: studentData.avatar_url || undefined
          };
          setSelectedProfile(studentProfile);
        }
      } catch (error) {
        console.error('Error in student profile fetch:', error);
      }
    } else {
      setSelectedProfile(null);
    }
  };
  
  const handleNavigateToStudentProfiles = () => {
    navigate('/manage-student-profiles');
  };
  
  const handleBackToDashboard = () => {
    setShowStudentProfile(false);
  };

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user) return; // Handle null user
      try {
        const { data: students } = await supabase
          .from('students')
          .select('*')
          .eq('parent_id', user.id);
        
        if (students && students.length > 0) {
          const firstStudent = students[0];
          const studentProfile: StudentProfileType = {
            id: firstStudent.id,
            name: firstStudent.name,
            age: firstStudent.age || 10,
            gradeLevel: firstStudent.grade_level || 'k-3',
            parentId: firstStudent.parent_id || user.id,
            createdAt: firstStudent.created_at || new Date().toISOString(),
            avatarUrl: firstStudent.avatar_url || undefined
          };
          setSelectedProfile(studentProfile);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    if (!selectedProfile) {
      fetchStudents();
    }
  }, [user, selectedProfile]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-6 flex-grow">
        {showStudentProfile ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBackToDashboard} 
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                {language === 'id' ? 'Kembali ke Dasbor' : 'Back to Dashboard'}
              </Button>
              <h1 className="text-2xl font-bold">
                {language === 'id' ? 'Kelola Profil Siswa' : 'Manage Student Profile'}
              </h1>
            </div>
            <ErrorBoundary fallback={<StudentProfileFallback onBack={handleBackToDashboard} />}>
              {isLoading ? (
                <Card>
                  <CardContent className="flex justify-center items-center py-12">
                    <Spinner size="lg" />
                  </CardContent>
                </Card>
              ) : (
                <StudentProfile 
                  student={selectedProfile ? convertToStudent(selectedProfile) : undefined} 
                  currentStudentId={currentStudentId}
                />
              )}
            </ErrorBoundary>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dashboard Header */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <h1 className="text-2xl font-bold">
                  {language === 'id' ? 'Dasbor' : 'Dashboard'}
                </h1>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleNavigateToStudentProfiles}
                    size="sm"
                    className="flex items-center"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    <span>{language === 'id' ? 'Profil Siswa' : 'Student Profiles'}</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/account-settings'}
                    size="sm"
                    className="flex items-center"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    <span>{language === 'id' ? 'Pengaturan Akun' : 'Account Settings'}</span>
                  </Button>
                </div>
              </div>
              
              {/* Student Selector */}
              <Card className="border rounded-lg shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">
                    {language === 'id' ? 'Pilih Siswa' : 'Select Student'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StudentProfileSelector 
                    onStudentChange={handleStudentChange}
                    initialStudentId={currentStudentId}
                  />
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="w-full flex sm:w-auto justify-between sm:justify-start">
                <TabsTrigger value="overview" className="flex-1 sm:flex-initial">
                  {language === 'id' ? 'Ikhtisar' : 'Overview'}
                </TabsTrigger>
                <TabsTrigger value="activities" className="flex-1 sm:flex-initial">
                  {language === 'id' ? 'Aktivitas' : 'Activities'}
                </TabsTrigger>
                <TabsTrigger value="achievements" className="flex-1 sm:flex-initial">
                  {language === 'id' ? 'Pencapaian' : 'Achievements'}
                </TabsTrigger>
                <TabsTrigger value="recommendations" className="flex-1 sm:flex-initial">
                  {language === 'id' ? 'Rekomendasi' : 'Recommendations'}
                </TabsTrigger>
              </TabsList>
              
              {/* Overview Tab Content */}
              <TabsContent value="overview" className="space-y-4">
                <div className="border rounded-lg bg-card text-card-foreground shadow">
                  <div className="flex flex-col space-y-1.5 p-6 pb-2">
                    <h3 className="font-semibold text-lg leading-none tracking-tight">
                      {language === 'id' ? 'Ikhtisar Siswa' : 'Student Overview'}
                    </h3>
                  </div>
                  <div className="p-6 pt-0">
                    {!currentStudentId ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {language === 'id' 
                          ? 'Pilih siswa untuk melihat ikhtisar' 
                          : 'Select a student to view overview'}
                      </div>
                    ) : isLoading ? (
                      <div className="flex justify-center py-8">
                        <Spinner />
                      </div>
                    ) : (
                      <div className="student-progress-wrapper">
                        <StudentProgressSummary studentId={currentStudentId} />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {/* Activities Tab Content */}
              <TabsContent value="activities">
                <div className="border rounded-lg bg-card text-card-foreground shadow">
                  <div className="p-6">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Spinner />
                      </div>
                    ) : !currentStudentId ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {language === 'id' 
                          ? 'Pilih siswa untuk melihat aktivitas' 
                          : 'Select a student to view activities'}
                      </div>
                    ) : (
                      <EnhancedRecentActivities studentId={currentStudentId} />
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Achievements Tab Content */}
              <TabsContent value="achievements">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : !currentStudentId ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card p-6">
                    {language === 'id' 
                      ? 'Pilih siswa untuk melihat pencapaian' 
                      : 'Select a student to view achievements'}
                  </div>
                ) : (
                  <StudentAchievements studentId={currentStudentId} />
                )}
              </TabsContent>
              
              {/* Recommendations Tab Content */}
              <TabsContent value="recommendations">
                <div className="border rounded-lg bg-card text-card-foreground shadow">
                  <div className="p-6">
                    {!currentStudentId ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {language === 'id' 
                          ? 'Pilih siswa untuk melihat rekomendasi' 
                          : 'Select a student to view recommendations'}
                      </div>
                    ) : (
                      <EnhancedAIRecommendations 
                        studentId={currentStudentId} 
                        gradeLevel={getValidGradeLevel(selectedProfile?.gradeLevel)} 
                      />
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
