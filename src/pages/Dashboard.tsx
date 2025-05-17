
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PieChart, LineChart, BarChart, Trophy, CalendarDays, UserPlus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StudentProfileSelector from '@/components/DashboardComponents/StudentProfileSelector';
import StudentProgressSummary from '@/components/DashboardComponents/StudentProgressSummary';
import RecentActivities from '@/components/DashboardComponents/RecentActivities';
import AIRecommendations from '@/components/DashboardComponents/AIRecommendations';
import StudentProfile from '@/components/StudentProfile';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
  };
  
  const translations = {
    dashboard: language === 'id' ? 'Dasbor' : 'Dashboard',
    overview: language === 'id' ? 'Ringkasan' : 'Overview',
    analytics: language === 'id' ? 'Analitik' : 'Analytics',
    progress: language === 'id' ? 'Kemajuan' : 'Progress',
    achievements: language === 'id' ? 'Pencapaian' : 'Achievements',
    profiles: language === 'id' ? 'Profil' : 'Profiles',
    selectStudent: language === 'id' ? 'Pilih Siswa' : 'Select Student',
    overview_desc: language === 'id' ? 'Ringkasan kegiatan belajar siswa' : 'Summary of student learning activities',
    manageProfiles: language === 'id' ? 'Kelola Profil Siswa' : 'Manage Student Profiles',
    backToDashboard: language === 'id' ? 'Kembali ke Dasbor' : 'Back to Dashboard',
    accountSettings: language === 'id' ? 'Pengaturan Akun' : 'Account Settings',
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow py-8">
        <div className="container px-4 md:px-6">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">{translations.dashboard}</h1>
              <p className="text-muted-foreground">{translations.overview_desc}</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate('/account-settings')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {translations.accountSettings}
              </Button>
              
              <Button 
                onClick={() => setShowStudentProfile(true)} 
                className="bg-eduPurple hover:bg-eduPurple-dark flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {translations.manageProfiles}
              </Button>
            </div>
          </div>
          
          <div className="grid gap-6">
            {showStudentProfile ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold font-display">{translations.manageProfiles}</h2>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowStudentProfile(false)}
                  >
                    {translations.backToDashboard}
                  </Button>
                </div>
                <StudentProfile 
                  onStudentChange={(student) => {
                    handleStudentChange(student.id);
                    setShowStudentProfile(false);
                  }}
                  currentStudentId={selectedStudentId}
                />
              </>
            ) : (
              <>
                <StudentProfileSelector 
                  onStudentChange={handleStudentChange} 
                  initialStudentId={selectedStudentId} 
                />
                
                {selectedStudentId ? (
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-4 w-full md:w-auto">
                      <TabsTrigger value="overview" className="flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        <span className="hidden sm:inline">{translations.overview}</span>
                      </TabsTrigger>
                      <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <BarChart className="h-4 w-4" />
                        <span className="hidden sm:inline">{translations.analytics}</span>
                      </TabsTrigger>
                      <TabsTrigger value="progress" className="flex items-center gap-2">
                        <LineChart className="h-4 w-4" />
                        <span className="hidden sm:inline">{translations.progress}</span>
                      </TabsTrigger>
                      <TabsTrigger value="achievements" className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        <span className="hidden sm:inline">{translations.achievements}</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-6">
                      <TabsContent value="overview" className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <StudentProgressSummary studentId={selectedStudentId} />
                          <AIRecommendations studentId={selectedStudentId} />
                        </div>
                        <RecentActivities studentId={selectedStudentId} />
                      </TabsContent>
                      
                      <TabsContent value="analytics">
                        <Card>
                          <CardHeader>
                            <CardTitle>{language === 'id' ? 'Analisa Pembelajaran' : 'Learning Analytics'}</CardTitle>
                            <CardDescription>
                              {language === 'id' ? 'Analisa mendalam tentang pola pembelajaran' : 'In-depth analysis of learning patterns'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="grid gap-6">
                            <div className="p-6 border rounded-md flex flex-col items-center justify-center">
                              <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                              <p className="text-center text-muted-foreground">
                                {language === 'id' 
                                  ? 'Analisa akan tersedia setelah lebih banyak data terkumpul.' 
                                  : 'Analytics will be available once more data is collected.'}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="progress">
                        <div className="grid gap-6">
                          <Card>
                            <CardHeader>
                              <CardTitle>{language === 'id' ? 'Detail Kemajuan' : 'Detailed Progress'}</CardTitle>
                              <CardDescription>
                                {language === 'id' ? 'Kemajuan lengkap dari waktu ke waktu' : 'Complete progress over time'}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="h-80">
                              <StudentProgressSummary studentId={selectedStudentId} />
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="achievements">
                        <Card>
                          <CardHeader>
                            <CardTitle>{language === 'id' ? 'Pencapaian Siswa' : 'Student Achievements'}</CardTitle>
                            <CardDescription>
                              {language === 'id' ? 'Lencana dan pencapaian pembelajaran' : 'Badges and learning achievements'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <RecentActivities studentId={selectedStudentId} />
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </div>
                  </Tabs>
                ) : (
                  <Card className="py-12">
                    <CardContent>
                      <div className="text-center text-muted-foreground">
                        {language === 'id' 
                          ? 'Pilih profil siswa untuk melihat dasbor' 
                          : 'Select a student profile to view the dashboard'}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
