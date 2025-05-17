import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Settings, UserPlus, Users, ChevronLeft, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { studentProgressService } from '@/services/studentProgressService';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RecentActivities from '@/components/DashboardComponents/RecentActivities';
import PaginatedActivities from '@/components/DashboardComponents/PaginatedActivities';
import AIRecommendations from '@/components/DashboardComponents/AIRecommendations';
import StudentProgressSummary from '@/components/DashboardComponents/StudentProgressSummary';
import StudentProfileSelector from '@/components/DashboardComponents/StudentProfileSelector';
import StudentProfile from '@/components/StudentProfile';
import StudentAchievements from '@/components/DashboardComponents/StudentAchievements';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Spinner } from '@/components/ui/spinner';
import { useStudentProfile } from '@/contexts/StudentProfileContext';

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

  // Derive currentStudentId from the context's selectedProfile
  const currentStudentId = selectedProfile?.id;

  const getValidGradeLevel = (grade?: string): GradeLevel => {
    const validGrades: GradeLevel[] = ['k-3', '4-6', '7-9'];
    if (grade && validGrades.includes(grade as GradeLevel)) {
      return grade as GradeLevel;
    }
    // Add more sophisticated mapping logic here if needed,
    // e.g., mapping "Grade 1" to "k-3"
    return 'k-3'; // Default fallback
  };

  const handleStudentChange = (studentId: string) => {
    // Called by StudentProfileSelector, which provides only the studentId.
    // We update the selectedProfile in the context.
    // A more robust solution would involve StudentProfileSelector providing the name and gradeLevel as well,
    // or fetching the student's details here.
    if (studentId) {
      // Assuming gradeLevel might not be immediately available or needs to be fetched/updated separately.
      // For now, retain existing gradeLevel or set to undefined if not present.
      setSelectedProfile({ 
        id: studentId, 
        name: selectedProfile?.name || 'Selected Student',
        gradeLevel: selectedProfile?.gradeLevel // This should ideally be populated correctly
      });
    } else {
      setSelectedProfile(null);
    }
  };
  
  const handleShowStudentProfile = () => {
    setIsLoading(true);
    setShowStudentProfile(true);
    // Simulate small load time to show transition
    setTimeout(() => setIsLoading(false), 800);
  };
  
  const handleBackToDashboard = () => {
    setShowStudentProfile(false);
  };

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
                onStudentChange={(student) => { // student is {id, name}
                  if (student) {
                    setSelectedProfile(student);
                  }
                }} 
                currentStudentId={currentStudentId}
              />
            )}
          </ErrorBoundary>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold">
              {language === 'id' ? 'Dasbor' : 'Dashboard'}
            </h1>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleShowStudentProfile}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                {language === 'id' ? 'Kelola Profil Siswa' : 'Manage Student Profiles'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/account-settings'}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {language === 'id' ? 'Pengaturan Akun' : 'Account Settings'}
              </Button>
            </div>
          </div>
          
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">
              {language === 'id' ? 'Pilih Siswa' : 'Select Student'}
            </h2>
            <div className="max-w-md">
              <StudentProfileSelector 
                onStudentChange={handleStudentChange}
                initialStudentId={currentStudentId} // This is now selectedProfile?.id
              />
            </div>
          </div>
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">
                {language === 'id' ? 'Ikhtisar' : 'Overview'}
              </TabsTrigger>
              <TabsTrigger value="activities">
                {language === 'id' ? 'Aktivitas' : 'Activities'}
              </TabsTrigger>
              <TabsTrigger value="achievements">
                {language === 'id' ? 'Pencapaian' : 'Achievements'}
              </TabsTrigger>
              <TabsTrigger value="recommendations">
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
                <div className="flex flex-col space-y-1.5 p-6 pb-2">
                  <h3 className="font-semibold text-lg leading-none tracking-tight">
                    {language === 'id' ? 'Semua Aktivitas' : 'All Activities'}
                  </h3>
                </div>
                <div className="p-6 pt-0">
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
                    <div className="activities-wrapper">
                      <RecentActivities studentId={currentStudentId} />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Achievements Tab Content */}
            <TabsContent value="achievements">
              <div className="border rounded-lg bg-card text-card-foreground shadow">
                <div className="flex flex-col space-y-1.5 p-6 pb-2">
                  <h3 className="font-semibold text-lg leading-none tracking-tight">
                    {language === 'id' ? 'Pencapaian' : 'Achievements'}
                  </h3>
                </div>
                <div className="p-6 pt-0">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : !currentStudentId ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {language === 'id' 
                        ? 'Pilih siswa untuk melihat pencapaian' 
                        : 'Select a student to view achievements'}
                    </div>
                  ) : (
                    <div className="achievements-wrapper">
                      <StudentAchievements studentId={currentStudentId} />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Recommendations Tab Content */}
            <TabsContent value="recommendations">
              <div className="border rounded-lg bg-card text-card-foreground shadow">
                <div className="flex flex-col space-y-1.5 p-6 pb-2">
                  <h3 className="font-semibold text-lg leading-none tracking-tight">
                    {language === 'id' ? 'Rekomendasi AI' : 'AI Recommendations'}
                  </h3>
                </div>
                <div className="p-6 pt-0">
                  {!currentStudentId ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {language === 'id' 
                        ? 'Pilih siswa untuk melihat rekomendasi' 
                        : 'Select a student to view recommendations'}
                    </div>
                  ) : (
                    <div className="recommendations-wrapper">
                      <AIRecommendations 
                        studentId={currentStudentId} 
                        gradeLevel={getValidGradeLevel(selectedProfile?.gradeLevel)} 
                      />
                    </div>
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
