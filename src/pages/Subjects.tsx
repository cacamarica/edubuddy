
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SubjectCard from '@/components/SubjectCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Subjects = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [gradeLevel, setGradeLevel] = useState<'k-3' | '4-6' | '7-9'>('k-3');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [hasActivities, setHasActivities] = useState(false);

  useEffect(() => {
    // Get grade level and studentId from location state
    if (location.state?.gradeLevel) {
      setGradeLevel(location.state.gradeLevel);
    }
    
    if (location.state?.studentId) {
      setStudentId(location.state.studentId);
    }
    
    if (location.state?.hasActivities) {
      setHasActivities(location.state.hasActivities);
    }
  }, [location.state]);

  const gradeName = {
    'k-3': language === 'id' ? 'Pemula (K-3)' : 'Early Learners (K-3)',
    '4-6': language === 'id' ? 'Menengah (4-6)' : 'Intermediate (4-6)',
    '7-9': language === 'id' ? 'Lanjut (7-9)' : 'Advanced (7-9)'
  };
  
  const handleGoBack = () => {
    navigate('/lessons', { 
      state: { 
        gradeLevel,
        studentId
      } 
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        <section className="py-8">
          <div className="container px-4 md:px-6">
            <div className="mb-10">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={handleGoBack}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-3xl font-display font-bold">
                    {language === 'id' ? 'Semua Mata Pelajaran' : 'All Subjects'}
                  </h1>
                  <p className="text-muted-foreground">
                    {gradeName[gradeLevel]}
                  </p>
                </div>
              </div>
            </div>
            
            {/* All Subjects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <SubjectCard subject="math" gradeLevel={gradeLevel} hasProgress={hasActivities} studentId={studentId || undefined} />
              <SubjectCard subject="english" gradeLevel={gradeLevel} hasProgress={hasActivities} studentId={studentId || undefined} />
              <SubjectCard subject="science" gradeLevel={gradeLevel} hasProgress={hasActivities} studentId={studentId || undefined} />
              <SubjectCard subject="history" gradeLevel={gradeLevel} hasProgress={hasActivities} studentId={studentId || undefined} />
              <SubjectCard subject="computer" gradeLevel={gradeLevel} hasProgress={hasActivities} studentId={studentId || undefined} />
              <SubjectCard subject="art" gradeLevel={gradeLevel} hasProgress={hasActivities} studentId={studentId || undefined} />
              <SubjectCard subject="music" gradeLevel={gradeLevel} hasProgress={hasActivities} studentId={studentId || undefined} />
              <SubjectCard subject="geography" gradeLevel={gradeLevel} hasProgress={hasActivities} studentId={studentId || undefined} />
              <SubjectCard subject="social" gradeLevel={gradeLevel} hasProgress={hasActivities} studentId={studentId || undefined} />
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Subjects;
