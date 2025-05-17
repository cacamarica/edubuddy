
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SubjectCard from '@/components/SubjectCard';
import LearningBuddy from '@/components/LearningBuddy';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Award, ChevronLeft, Star, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { studentProgressService, AIRecommendation } from '@/services/studentProgressService';

const Lessons = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [gradeLevel, setGradeLevel] = useState<'k-3' | '4-6' | '7-9'>('k-3');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stars, setStars] = useState(0);
  const [hasActivities, setHasActivities] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  
  useEffect(() => {
    // Get grade level and studentId from location state
    if (location.state?.gradeLevel) {
      setGradeLevel(location.state.gradeLevel);
    }
    
    if (location.state?.studentId) {
      setStudentId(location.state.studentId);
      
      // Get student name if available
      if (location.state?.studentName) {
        setStudentName(location.state.studentName);
      }
    }
    
    // Load student data
    const loadStudentData = async () => {
      if (!studentId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Get subject progress
        const progressData = await studentProgressService.getSubjectProgress(studentId);
        if (progressData.length > 0) {
          // Calculate overall progress as an average
          const overallProgress = Math.round(
            progressData.reduce((sum, item) => sum + item.progress, 0) / progressData.length
          );
          setProgress(overallProgress);
          setHasActivities(true);
        }
        
        // Get quiz scores for star calculation
        const quizScores = await studentProgressService.getQuizScores(studentId);
        if (quizScores.length > 0) {
          // Calculate stars based on quiz performance
          const totalStars = quizScores.reduce((sum, quiz) => {
            return sum + Math.ceil(quiz.percentage / 20); // 1-5 stars based on percentage
          }, 0);
          setStars(totalStars);
          setHasActivities(true);
        }
        
        // Load AI recommendations for Next Steps
        await loadAIRecommendations(studentId);
        
      } catch (error) {
        console.error("Error loading student data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStudentData();
  }, [location.state]);
  
  // Load AI recommendations from database or generate new ones
  const loadAIRecommendations = async (studentId: string) => {
    if (!user) return;
    
    setIsLoadingRecommendations(true);
    
    try {
      // First try to get recommendations from the database
      const recommendations = await studentProgressService.getAIRecommendations(studentId);
      
      if (recommendations && recommendations.length > 0) {
        // Use existing recommendations
        setAiRecommendations(recommendations);
      } else {
        // Generate recommendations based on grade level if none exist
        const defaultRecommendations = getRecommendedLessons();
        
        // Save these to the database for future reference
        for (const rec of defaultRecommendations) {
          await studentProgressService.recordAIRecommendation({
            student_id: studentId,
            recommendation_type: rec.subject,
            recommendation: rec.title,
            acted_on: false,
            read: false
          });
        }
        
        // Get the newly saved recommendations
        const newRecommendations = await studentProgressService.getAIRecommendations(studentId);
        setAiRecommendations(newRecommendations);
      }
    } catch (error) {
      console.error("Error loading AI recommendations:", error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };
  
  const gradeName = {
    'k-3': language === 'id' ? 'Pemula (K-3)' : 'Early Learners (K-3)',
    '4-6': language === 'id' ? 'Menengah (4-6)' : 'Intermediate (4-6)',
    '7-9': language === 'id' ? 'Lanjut (7-9)' : 'Advanced (7-9)'
  };
  
  const handleGoBack = () => {
    // If coming from a student profile in dashboard, return to dashboard
    if (studentId && user) {
      navigate('/dashboard');
    } else {
      // Otherwise go to home page
      navigate('/');
    }
  };

  const handleGoToAILearning = () => {
    // Check if user is authenticated before allowing AI learning
    if (!user) {
      toast.error(
        language === 'id' 
          ? 'Silakan masuk untuk mengakses Pembelajaran AI'
          : 'Please sign in to access AI Learning'
      );
      navigate('/auth', { state: { gradeLevel, action: 'signin' } });
      return;
    }
    
    navigate('/ai-learning', { 
      state: { 
        gradeLevel,
        studentId,
        studentName
      } 
    });
  };

  // Handle starting a lesson and mark recommendation as acted on
  const handleStartLesson = async (subject: string, topic: string, recommendationId?: string) => {
    // Mark recommendation as acted upon if we have an id
    if (recommendationId && studentId) {
      await studentProgressService.markRecommendationAsActedOn(recommendationId);
      
      // Refresh recommendations list
      await loadAIRecommendations(studentId);
    }
    
    // Navigate to AI Learning with the selected topic
    navigate('/ai-learning', { 
      state: { 
        gradeLevel,
        subject,
        topic,
        studentId,
        studentName,
        autoStart: true
      } 
    });
  };

  // Render recommended lessons based on grade level
  const getRecommendedLessons = () => {
    switch (gradeLevel) {
      case 'k-3':
        return [
          {
            title: "Counting Fun",
            subject: "Math",
            description: "Practice counting numbers up to 20",
            color: "bg-eduPastel-blue"
          },
          {
            title: "Letter Sounds",
            subject: "English",
            description: "Learn the sounds that letters make",
            color: "bg-eduPastel-green"
          },
          {
            title: "Animal Friends",
            subject: "Science", 
            description: "Learn about different types of animals",
            color: "bg-eduPastel-yellow"
          },
          {
            title: "Shape Adventure",
            subject: "Math",
            description: "Explore different shapes all around us",
            color: "bg-eduPastel-peach"
          }
        ];
      case '4-6':
        return [
          {
            title: "Fraction Basics",
            subject: "Math",
            description: "Learn about parts of a whole",
            color: "bg-eduPastel-blue"
          },
          {
            title: "Creative Writing",
            subject: "English",
            description: "Write your own exciting stories",
            color: "bg-eduPastel-green"
          },
          {
            title: "Simple Machines",
            subject: "Science", 
            description: "Discover how levers, pulleys and more work",
            color: "bg-eduPastel-peach"
          },
          {
            title: "States of Matter",
            subject: "Science",
            description: "Learn about solids, liquids, and gases",
            color: "bg-eduPastel-yellow"
          }
        ];
      case '7-9':
        return [
          {
            title: "Algebra Fundamentals",
            subject: "Mathematics",
            description: "Learn to work with variables and equations",
            color: "bg-eduPastel-blue"
          },
          {
            title: "Essay Structure",
            subject: "English",
            description: "Master the art of writing persuasive essays",
            color: "bg-eduPastel-green"
          },
          {
            title: "Chemistry Basics",
            subject: "Science", 
            description: "Explore atoms, elements, and compounds",
            color: "bg-eduPastel-peach"
          },
          {
            title: "World Geography",
            subject: "Geography",
            description: "Learn about continents, countries, and cultures",
            color: "bg-eduPastel-yellow"
          }
        ];
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-eduPurple border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {language === 'id' ? 'Memuat pelajaran...' : 'Loading lessons...'}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Grade Header */}
        <section className="bg-eduPastel-purple py-8">
          <div className="container px-4 md:px-6">
            <Button 
              variant="ghost" 
              size="sm"
              className="mb-4"
              onClick={handleGoBack}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {language === 'id' ? 'Kembali' : 'Back'}
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold">
                  {studentName ? `${studentName} - ${gradeName[gradeLevel]}` : gradeName[gradeLevel]}
                </h1>
                <p className="text-muted-foreground">
                  {language === 'id' 
                    ? 'Pilih mata pelajaran untuk melanjutkan petualangan belajarmu!'
                    : 'Choose a subject to continue your learning adventure!'
                  }
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    {language === 'id' ? 'Progress Keseluruhan' : 'Overall Progress'}
                  </span>
                  <div className="w-48 flex items-center gap-2">
                    <Progress value={progress} className="h-2" />
                    <span className="text-sm font-medium">{progress}%</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{stars}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Award className="h-5 w-5 text-eduPurple" />
                  <span className="font-semibold">{hasActivities ? '3' : '0'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* AI Learning Banner */}
        <section className="py-6 bg-gradient-to-r from-eduPurple to-blue-600">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white">
              <div className="flex-1">
                <h2 className="text-2xl font-display font-bold mb-2">
                  {language === 'id' ? 'Petualangan Pembelajaran AI' : 'AI Learning Adventure'}
                </h2>
                <p className="opacity-90">
                  {language === 'id'
                    ? 'Buat pelajaran kustom, kuis, dan permainan tentang topik akademik dengan asisten pembelajaran AI kami!'
                    : 'Create custom lessons, quizzes, and games about academic topics with our AI learning assistant!'
                  }
                </p>
              </div>
              <Button 
                onClick={handleGoToAILearning}
                className="bg-white text-eduPurple hover:bg-gray-100"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {language === 'id' ? 'Coba Pembelajaran AI' : 'Try AI Learning'}
              </Button>
            </div>
          </div>
        </section>
        
        {/* Subject Selection */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <SubjectCard subject="math" gradeLevel={gradeLevel} hasProgress={hasActivities} />
              <SubjectCard subject="english" gradeLevel={gradeLevel} hasProgress={hasActivities} />
              <SubjectCard subject="science" gradeLevel={gradeLevel} hasProgress={hasActivities} />
            </div>
            
            {/* Recent Activity */}
            <div className="mt-12">
              <h2 className="text-2xl font-display font-bold mb-4">
                {language === 'id' ? 'Aktivitas Terbaru' : 'Recent Activity'}
              </h2>
              
              {hasActivities ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-1 divide-y">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-eduPastel-green flex items-center justify-center">
                          <Star className="h-5 w-5 text-eduPurple" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {language === 'id' ? 'Kuis Penjumlahan Selesai' : 'Addition Quiz Completed'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {language === 'id' ? 'Matematika • 2 hari yang lalu' : 'Math • 2 days ago'}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-green-600">8/10 correct</span>
                    </div>
                    
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-eduPastel-blue flex items-center justify-center">
                          <Award className="h-5 w-5 text-eduPurple" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {language === 'id' ? 'Lencana Diperoleh: Penjelajah Matematika' : 'Badge Earned: Math Explorer'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {language === 'id' ? 'Pencapaian • 3 hari yang lalu' : 'Achievements • 3 days ago'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-eduPastel-peach flex items-center justify-center">
                          <Star className="h-5 w-5 text-eduPurple" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {language === 'id' ? 'Pelajaran Selesai: Bagian Kalimat' : 'Completed Lesson: Parts of Speech'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {language === 'id' ? 'Bahasa Inggris • 4 hari yang lalu' : 'English • 4 days ago'}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-eduPurple">+5 stars</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-6 text-center">
                  <div className="mb-4 w-16 h-16 rounded-full bg-eduPastel-purple mx-auto flex items-center justify-center">
                    <Award className="h-8 w-8 text-eduPurple" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {language === 'id' ? 'Belum Ada Aktivitas' : 'No Activities Yet'}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'id' 
                      ? 'Mulai petualangan belajarmu dengan memilih pelajaran atau aktivitas.'
                      : 'Start your learning adventure by selecting a lesson or activity.'}
                  </p>
                  <Button 
                    className="mt-4 bg-eduPurple hover:bg-eduPurple-dark"
                    onClick={() => navigate('/ai-learning', { 
                      state: { 
                        gradeLevel,
                        studentId,
                        studentName
                      } 
                    })}
                  >
                    {language === 'id' ? 'Mulai Belajar' : 'Start Learning'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* Learning Recommendations */}
        <section className="py-10 bg-eduPastel-gray">
          <div className="container px-4 md:px-6">
            <h2 className="text-2xl font-display font-bold mb-6">
              {t('learning.recommendedNextSteps')}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {isLoadingRecommendations ? (
                // Loading state for recommendations
                Array(4).fill(0).map((_, index) => (
                  <div key={index} className="rounded-lg bg-gray-100 p-4 animate-pulse h-40"></div>
                ))
              ) : aiRecommendations && aiRecommendations.length > 0 ? (
                // Show AI recommendations if available
                aiRecommendations.slice(0, 4).map((recommendation, i) => {
                  const colorClasses = [
                    "bg-eduPastel-blue", 
                    "bg-eduPastel-green", 
                    "bg-eduPastel-peach", 
                    "bg-eduPastel-yellow"
                  ];
                  
                  return (
                    <div 
                      key={recommendation.id} 
                      className={`rounded-lg ${colorClasses[i % 4]} p-4 hover:shadow-md transition-shadow cursor-pointer`}
                      onClick={() => handleStartLesson(
                        recommendation.recommendation_type, 
                        recommendation.recommendation,
                        recommendation.id
                      )}
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {recommendation.recommendation_type}
                      </span>
                      <h3 className="font-display font-semibold">{recommendation.recommendation}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {language === 'id' 
                          ? 'Direkomendasikan oleh AI berdasarkan profil siswa'
                          : 'AI recommended based on student profile'
                        }
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 w-full justify-start text-eduPurple hover:text-eduPurple-dark hover:bg-white/50"
                      >
                        {t('learning.startLesson')}
                      </Button>
                    </div>
                  );
                })
              ) : (
                // Fallback to default recommendations
                getRecommendedLessons().map((item, i) => (
                  <div 
                    key={i} 
                    className={`rounded-lg ${item.color} p-4 hover:shadow-md transition-shadow cursor-pointer`}
                    onClick={() => navigate('/ai-learning', { 
                      state: { 
                        gradeLevel, 
                        subject: item.subject, 
                        topic: item.title,
                        studentId,
                        studentName,
                        autoStart: true
                      } 
                    })}
                  >
                    <span className="text-xs font-medium text-muted-foreground">{item.subject}</span>
                    <h3 className="font-display font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 w-full justify-start text-eduPurple hover:text-eduPurple-dark hover:bg-white/50"
                    >
                      {t('learning.startLesson')}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
        
        {/* Learning Buddy */}
        <LearningBuddy />
      </main>
      
      <Footer />
    </div>
  );
};

export default Lessons;
