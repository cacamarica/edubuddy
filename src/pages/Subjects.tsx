
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SubjectCard from '@/components/SubjectCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';

const Subjects = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { selectedProfile } = useStudentProfile();
  const [gradeLevel, setGradeLevel] = useState<'k-3' | '4-6' | '7-9'>('k-3');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [hasActivities, setHasActivities] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  
  // Predefined allowed educational subjects
  const ALLOWED_SUBJECTS = [
    'math', 'mathematics', 'science', 'biology', 'chemistry', 'physics',
    'english', 'language', 'reading', 'writing', 'literature',
    'history', 'geography', 'social studies', 'art', 'music',
    'computer', 'computer science', 'coding', 'technology',
    'physical education', 'health', 'astronomy', 'environment'
  ];

  useEffect(() => {
    // Get grade level and studentId from location state
    if (location.state?.gradeLevel) {
      setGradeLevel(location.state.gradeLevel);
    }
    
    // Use student ID from location state or from the selected profile
    if (location.state?.studentId) {
      setStudentId(location.state.studentId);
    } else if (selectedProfile?.id) {
      setStudentId(selectedProfile.id);
    }
    
    if (location.state?.hasActivities) {
      setHasActivities(location.state.hasActivities);
    }
  }, [location.state, selectedProfile]);

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

  const handleCustomSubjectSubmit = () => {
    if (!customSubject.trim()) {
      toast.error(language === 'id' ? 'Subjek tidak boleh kosong' : 'Subject cannot be empty');
      return;
    }

    const normalized = customSubject.toLowerCase();
    
    // Check if the subject is appropriate and educational
    const isEducational = ALLOWED_SUBJECTS.some(allowedSubject => 
      normalized.includes(allowedSubject) || 
      allowedSubject.includes(normalized)
    );

    // Check for inappropriate keywords
    const inappropriateKeywords = ['violent', 'adult', 'game', 'play', 'gun', 'weapon'];
    const hasInappropriate = inappropriateKeywords.some(keyword => normalized.includes(keyword));

    if (!isEducational || hasInappropriate) {
      toast.error(
        language === 'id' 
          ? 'Mohon masukkan subjek pendidikan yang sesuai' 
          : 'Please enter an appropriate educational subject'
      );
      return;
    }

    // Navigate to topics page with the custom subject
    navigate('/topics', {
      state: {
        subject: customSubject,
        gradeLevel,
        studentId,
        isCustomSubject: true
      }
    });
    
    setShowDialog(false);
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
              
              {!studentId && selectedProfile === null && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-amber-700">
                    {language === 'id' 
                      ? 'Tidak ada profil siswa yang dipilih. Progres pembelajaran tidak akan disimpan.' 
                      : 'No student profile selected. Learning progress won\'t be saved.'}
                  </p>
                </div>
              )}
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
              
              {/* Custom Subject Card */}
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Card className="shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border-t-4 text-purple-500 border-purple-500 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-eduPastel-purple text-white p-3 rounded-full w-12 h-12 flex items-center justify-center text-xl">
                          <Plus />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-xl mb-1">
                            {language === 'id' ? 'Buat Pelajaran Kustom' : 'Create Custom Subject'}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {language === 'id' ? 'Pilih topik pendidikan apa pun' : 'Choose any educational topic'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {language === 'id' ? 'Buat Mata Pelajaran Kustom' : 'Create Custom Subject'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">
                        {language === 'id' ? 'Nama Mata Pelajaran' : 'Subject Name'}
                      </Label>
                      <Input 
                        id="subject"
                        placeholder={language === 'id' ? 'contoh: Biologi' : 'example: Biology'}
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {language === 'id' 
                          ? 'Masukkan topik pendidikan yang sesuai untuk anak-anak' 
                          : 'Enter appropriate educational topics for children'}
                      </p>
                    </div>
                    <Button 
                      onClick={handleCustomSubjectSubmit} 
                      className="w-full bg-eduPurple hover:bg-eduPurple-dark"
                    >
                      {language === 'id' ? 'Buat dan Lanjutkan' : 'Create and Continue'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Subjects;
