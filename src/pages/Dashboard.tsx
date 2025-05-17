
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
  const [currentStudentId, setCurrentStudentId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  const { user } = useAuth();
  
  const handleStudentChange = (studentId: string) => {
    setCurrentStudentId(studentId);
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
                onStudentChange={(student) => setCurrentStudentId(student.id)} 
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
                initialStudentId={currentStudentId}
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
              {!currentStudentId ? (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {language === 'id' ? 'Ikhtisar Siswa' : 'Student Overview'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      {language === 'id' 
                        ? 'Pilih siswa untuk melihat ikhtisar' 
                        : 'Select a student to view overview'}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <StudentProgressSummary studentId={currentStudentId} />
              )}
            </TabsContent>
            
            {/* Activities Tab Content */}
            <TabsContent value="activities">
              {/* Activities tab showing just activities */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === 'id' ? 'Semua Aktivitas' : 'All Activities'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : currentStudentId ? (
                    <RecentActivities studentId={currentStudentId} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {language === 'id' 
                        ? 'Pilih siswa untuk melihat aktivitas' 
                        : 'Select a student to view activities'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements Tab Content */}
            <TabsContent value="achievements">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === 'id' ? 'Pencapaian' : 'Achievements'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : currentStudentId ? (
                    <StudentAchievements studentId={currentStudentId} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {language === 'id' 
                        ? 'Pilih siswa untuk melihat pencapaian' 
                        : 'Select a student to view achievements'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Recommendations Tab Content */}
            <TabsContent value="recommendations">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === 'id' ? 'Rekomendasi AI' : 'AI Recommendations'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : currentStudentId ? (
                    <AIRecommendations studentId={currentStudentId || ''} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {language === 'id' 
                        ? 'Pilih siswa untuk melihat rekomendasi' 
                        : 'Select a student to view recommendations'}
                    </div>
                  )}
                </CardContent>
              </Card>
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
