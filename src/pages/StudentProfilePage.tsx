import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StudentProfile from '@/components/StudentProfile';
import { toast } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useNavigate } from 'react-router-dom';

// Fallback component to show when StudentProfile fails to load
const StudentProfileFallback = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  return (
    <Card>
      <CardContent className="text-center py-8">
        <h3 className="text-lg font-medium mb-4">
          {language === 'id' ? 'Terjadi kesalahan' : 'An error occurred'}
        </h3>
        <p className="mb-4">
          {language === 'id' 
            ? 'Tidak dapat memuat profil siswa. Silakan coba lagi.' 
            : 'Could not load student profile. Please try again.'}
        </p>
        <Button onClick={() => navigate('/')}>
          {language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
        </Button>
      </CardContent>
    </Card>
  );
};

// Mock student data for development
const MOCK_STUDENT = {
  id: "mock-student-id",
  name: "Student User",
  age: 10,
  grade_level: "4-6" as const,
  auth_id: "auth-user-id",
};

// Interface for student data
interface StudentData {
  id: string;
  name: string;
  age?: number;
  grade_level?: string;
  auth_id?: string;
  [key: string]: any;
}

const StudentProfilePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const { user, isStudent } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  // Fetch student data
  useEffect(() => {
    const getStudentData = async () => {
      if (!user || !isStudent) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // For development, use mock data to bypass Supabase client issues
        // In production, this would be a real API call to fetch student data
        
        // Simulate API request delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Use mock data
        const studentRecord = {
          ...MOCK_STUDENT,
          auth_id: user.id
        };
        
        setStudentData(studentRecord);
      } catch (error) {
        console.error('Error in getStudentData:', error);
        toast.error(language === 'id'
          ? 'Terjadi kesalahan saat memuat profil'
          : 'An error occurred while loading profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    getStudentData();
  }, [user, isStudent, language]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-6 flex-grow">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/')}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              {language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
            </Button>
            <h1 className="text-2xl font-bold">
              {language === 'id' ? 'Profil Siswa' : 'Student Profile'}
            </h1>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>{language === 'id' ? 'Profil Saya' : 'My Profile'}</CardTitle>
              <CardDescription>
                {language === 'id'
                  ? 'Lihat dan perbarui informasi profil kamu'
                  : 'View and update your profile information'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>              ) : studentData ? (
                <ErrorBoundary fallback={<StudentProfileFallback />}>
                  <StudentProfile 
                    student={studentData} 
                    readOnly={true} /* Student views their own profile in read-only mode */
                  />
                </ErrorBoundary>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'id'
                    ? 'Profil siswa tidak ditemukan. Hubungi orang tua kamu.'
                    : 'Student profile not found. Please contact your parent.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StudentProfilePage;
