
// filepath: g:\eduBuddy\edubuddy\src\pages\Lessons.tsx
import { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SubjectCard from '@/components/SubjectCard';
import LearningBuddy from '@/components/LearningBuddy';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Award, ChevronLeft, ChevronRight, Star, Sparkles, BookOpen, Medal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { studentProgressService, AIRecommendation, LearningActivity, QuizScore } from '@/services/studentProgressService';
// Remove the User import from "../integrations/supabase/types" since it doesn't exist
import { StudentProfileContext } from '../contexts/StudentProfileContext';
import { validateStudentId as importedValidateStudentId } from '../lib/utils';

const Lessons = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { selectedProfile, setSelectedProfile } = useContext(StudentProfileContext);
  const [gradeLevel, setGradeLevel] = useState<'k-3' | '4-6' | '7-9'>('k-3');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stars, setStars] = useState(0);
  const [hasActivities, setHasActivities] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recentActivities, setRecentActivities] = useState<(LearningActivity | QuizScore)[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  
  useEffect(() => {
    console.log('Primary Effect: Initializing student identity and grade level.');
    setIsLoading(true);

    let determinedStudentId: string | null = null;
    let determinedStudentName: string | null = null;
    let determinedGradeLevel: 'k-3' | '4-6' | '7-9' = 'k-3'; // Default grade

    // 1. Check location.state
    if (location.state) {
      if (location.state.gradeLevel) {
        determinedGradeLevel = location.state.gradeLevel;
      }
      const idFromLocation = importedValidateStudentId(location.state.studentId);
      if (idFromLocation) {
        determinedStudentId = idFromLocation;
        determinedStudentName = location.state.studentName || null;
        console.log('Primary Effect: Using studentId from location.state:', determinedStudentId);
      }
    }

    // 2. Check selectedProfile if not found in location.state
    if (!determinedStudentId && selectedProfile) {
      const idFromProfile = importedValidateStudentId(selectedProfile.id);
      if (idFromProfile) {
        determinedStudentId = idFromProfile;
        determinedStudentName = selectedProfile.name || null;
        console.log('Primary Effect: Using studentId from selectedProfile:', determinedStudentId);
      }
    }

    // 3. Check localStorage if not found yet
    if (!determinedStudentId) {
      const storedProfileStr = localStorage.getItem('selectedStudentProfile');
      if (storedProfileStr) {
        let potentialId: string | null = null;
        let potentialName: string | null = null;
        try {
          const parsed = JSON.parse(storedProfileStr);
          if (parsed && typeof parsed.id === 'string') {
            potentialId = parsed.id;
            potentialName = parsed.name || null;
            // If selectedProfile is not set in context, update it from localStorage
            if (!selectedProfile && setSelectedProfile) {
              setSelectedProfile(parsed);
            }
          } else if (typeof parsed === 'string') { // Handles case where localStorage stores just the ID string after JSON.parse (e.g. "\"uuid-string\"")
            potentialId = parsed;
          }
        } catch (e) {
          // If not a JSON string, assume storedProfileStr is the ID itself
          potentialId = storedProfileStr;
        }
        
        const idFromStorage = importedValidateStudentId(potentialId);
        if (idFromStorage) {
          determinedStudentId = idFromStorage;
          if (potentialName) determinedStudentName = potentialName; // Only use name if parsed from object
          console.log('Primary Effect: Using studentId from localStorage:', determinedStudentId);
        }
      }
    }

    // Set the determined values
    setGradeLevel(determinedGradeLevel);
    setStudentName(determinedStudentName);

    if (determinedStudentId) {
      setStudentId(determinedStudentId);
      // setIsLoading(false); // loadStudentData will set this after fetching
    } else {
      console.error('Primary Effect: No valid studentId resolved. Redirecting to dashboard.');
      setStudentId(null);
      setIsLoading(false); // Stop loading as we are redirecting
      navigate('/dashboard');
    }
  }, [location.state, selectedProfile, user, navigate, setSelectedProfile]);

  useEffect(() => {
    const loadStudentData = async () => {
      // If studentId is null, it's not determined yet. Don't log error, just return.
      if (!studentId) {
        return;
      }
      // If studentId is not null, but not a string, then it's an actual issue.
      if (typeof studentId !== 'string') {
        console.error('loadStudentData: studentId has an invalid type:', studentId);
        setIsLoading(false); // Stop loading as we can't proceed.
        return;
      }

      setIsLoading(true);

      try {
        console.log('Fetching data for studentId:', studentId);

        // Get subject progress
        const progressData = await studentProgressService.getSubjectProgress(studentId);

        // Get learning activities to determine weights for subjects
        const activities = await studentProgressService.getLearningActivities(studentId);

        let hasProgressOrQuizData = false;
        if (progressData.length > 0) {
          const subjectActivityCounts = activities.reduce((counts, activity) => {
            const subject = activity.subject.toLowerCase();
            counts[subject] = (counts[subject] || 0) + 1;
            return counts;
          }, {});
          let totalProgress = 0;
          let totalWeight = 0;
          progressData.forEach(item => {
            const subject = item.subject.toLowerCase();
            const weight = subjectActivityCounts[subject] || 1;
            totalProgress += item.progress * weight;
            totalWeight += weight;
          });
          const overallProgress = totalWeight > 0 
            ? Math.round(totalProgress / totalWeight)
            : 0;
          setProgress(overallProgress);
          hasProgressOrQuizData = true;
        } else {
          setProgress(0); // Reset progress if no data
        }

        const quizScores = await studentProgressService.getQuizScores(studentId);
        if (quizScores.length > 0) {
          const totalQuizzes = quizScores.length;
          const excellentQuizzes = quizScores.filter(quiz => quiz.percentage >= 80).length;
          const goodQuizzes = quizScores.filter(quiz => quiz.percentage >= 60 && quiz.percentage < 80).length;
          const totalStars = (excellentQuizzes * 3) + goodQuizzes;
          setStars(totalStars);
          hasProgressOrQuizData = true;
        } else {
          setStars(0); // Reset stars if no data
        }

        if (hasProgressOrQuizData) {
          setHasActivities(true);
        }

        await loadRecentActivities(studentId);
        await loadAIRecommendations(studentId);

      } catch (error) {
        console.error('Error loading student data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentData();
  }, [studentId, user]); // Added user to dependencies

  // Load recent activities from learning_activities and quiz_scores
  const loadRecentActivities = async (studentId: string) => {
    if (!user) return;

    setIsLoadingActivities(true);

    try {
      // Fetch recent learning activities
      const activities = await studentProgressService.getLearningActivities(studentId, 5);

      // Fetch recent quiz scores
      const quizzes = await studentProgressService.getQuizScores(studentId, 5);

      // Combine and sort by date (most recent first)
      const combined = [
        ...activities.map(a => ({ 
          ...a, 
          type: 'activity', 
          sortDate: a.last_interaction_at || a.completed_at || a.started_at || new Date().toISOString() 
        })),
        ...quizzes.map(q => ({ 
          ...q, 
          type: 'quiz', 
          sortDate: q.completed_at || new Date().toISOString() 
        }))
      ];

      combined.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

      // Take only the 3 most recent activities
      setRecentActivities(combined.slice(0, 3));

      // Update the hasActivities flag if there are activities
      if (combined.length > 0) {
        setHasActivities(true);
      }
    } catch (error) {
      console.error("Error loading recent activities:", error);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // Load AI recommendations from database or generate new ones
  const loadAIRecommendations = async (studentId: string) => {
    if (!user) return;
    
    setIsLoadingRecommendations(true);
    
    try {
      // First try to get recommendations from the database
      const recommendations = await studentProgressService.getAIRecommendations(studentId);
      
      if (recommendations && recommendations.length > 0) {
        // Use existing recommendations
        setAiRecommendations(recommendations.filter(rec => !rec.acted_on));
      }
      
      // If we have fewer than 4 recommendations or they're all acted upon, generate new ones
      if (!recommendations || recommendations.filter(rec => !rec.acted_on).length < 4) {
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
        setAiRecommendations(newRecommendations.filter(rec => !rec.acted_on));
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
            description: "Learn the sounds of different letters",
            color: "bg-eduPastel-green"
          },
          {
            title: "Animal Friends",
            subject: "Science",
            description: "Discover different types of animals",
            color: "bg-eduPastel-peach"
          },
          {
            title: "Shape Adventure",
            subject: "Math",
            description: "Learn about different shapes",
            color: "bg-eduPastel-yellow"
          }
        ];
      case '4-6':
        return [
          {
            title: "Fractions Basics",
            subject: "Math",
            description: "Understanding parts of a whole",
            color: "bg-eduPastel-blue"
          },
          {
            title: "Parts of Speech",
            subject: "English",
            description: "Learn about nouns, verbs, and more",
            color: "bg-eduPastel-green"
          },
          {
            title: "Simple Machines",
            subject: "Science",
            description: "Discover how machines help us work",
            color: "bg-eduPastel-peach"
          },
          {
            title: "Multiplication",
            subject: "Math",
            description: "Practice multiplication tables",
            color: "bg-eduPastel-yellow"
          }
        ];
      case '7-9':
        return [
          {
            title: "Algebra Foundations",
            subject: "Math",
            description: "Introduction to variables and expressions",
            color: "bg-eduPastel-blue"
          },
          {
            title: "Essay Writing",
            subject: "English",
            description: "Learn to write structured essays",
            color: "bg-eduPastel-green"
          },
          {
            title: "Chemistry Basics",
            subject: "Science",
            description: "Explore atoms, elements and compounds",
            color: "bg-eduPastel-peach"
          },
          {
            title: "Geometry Concepts",
            subject: "Math",
            description: "Angles, shapes, and spatial reasoning",
            color: "bg-eduPastel-yellow"
          }
        ];
      default:
        return [];
    }
  };
  
  const handleProfileSwitch = (newProfile) => {
    if (user.accountType === 'student') {
      toast.error(
        language === 'id' 
          ? 'Akun siswa tidak dapat mengganti profil.' 
          : 'Student accounts cannot switch profiles.'
      );
      return;
    }
  
    setSelectedProfile(newProfile);
    localStorage.setItem('selectedStudentProfile', JSON.stringify(newProfile));
  };
  
  const renderRecommendedNextSteps = () => {
    if (isLoadingRecommendations) {
      return Array(4).fill(0).map((_, index) => (
        <div key={index} className="rounded-lg bg-gray-100 p-4 animate-pulse h-40"></div>
      ));
    }
  
    if (aiRecommendations && aiRecommendations.length > 0) {
      return aiRecommendations.slice(0, 4).map((recommendation, i) => {
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
            <h3 className="font-bold mb-1">{recommendation.recommendation}</h3>
            <p className="text-sm mb-2">{recommendation.recommendation_type}</p>
            <Button size="sm" variant="secondary" className="w-full mt-2">
              {language === 'id' ? 'Mulai' : 'Start'}
            </Button>
          </div>
        );
      });
    }
  
    return getRecommendedLessons().map((lesson, i) => (
      <div 
        key={i} 
        className={`rounded-lg ${lesson.color} p-4 hover:shadow-md transition-shadow cursor-pointer`}
        onClick={() => handleStartLesson(lesson.subject, lesson.title)}
      >
        <h3 className="font-bold mb-1">{lesson.title}</h3>
        <p className="text-sm mb-2">{lesson.subject}</p>
        <p className="text-xs text-gray-600 mb-3">{lesson.description}</p>
        <Button size="sm" variant="secondary" className="w-full">
          {language === 'id' ? 'Mulai' : 'Start'}
        </Button>
      </div>
    ));
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
                    {language === 'id' ? 'Pelajaran' : 'Lessons'}
                  </h1>
                  <p className="text-muted-foreground">
                    {gradeName[gradeLevel]} {studentName ? `- ${studentName}` : ''}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Progress overview */}
            {hasActivities && (
              <div className="mb-12">
                <div className="bg-gradient-to-r from-eduPurple-light to-eduPurple rounded-lg p-6 text-white">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0">
                      <h2 className="text-xl font-semibold mb-2">
                        {language === 'id' ? 'Kemajuan Belajar' : 'Learning Progress'}
                      </h2>
                      <p className="text-white/90">
                        {language === 'id' 
                          ? `Kamu telah menyelesaikan ${progress}% pelajaran. Lanjutkan!`
                          : `You've completed ${progress}% of your lessons. Keep going!`}
                      </p>
                      
                      <div className="mt-4">
                        <Progress value={progress} className="h-2 bg-white/30" />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="bg-white/20 h-14 w-14 rounded-full flex items-center justify-center">
                        <Star className="h-8 w-8 text-yellow-300 fill-yellow-300" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold">{stars}</div>
                        <div className="text-sm text-white/80">
                          {language === 'id' ? 'Bintang' : 'Stars'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
              {/* Subjects */}
            <div>
              <h2 className="text-2xl font-display font-bold mb-4">
                {language === 'id' ? 'Mata Pelajaran' : 'Subjects'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <SubjectCard subject="math" gradeLevel={gradeLevel} hasProgress={hasActivities} studentId={studentId || undefined} />
                <SubjectCard subject="english" gradeLevel={gradeLevel} hasProgress={hasActivities} studentId={studentId || undefined} />
                <SubjectCard subject="science" gradeLevel={gradeLevel} hasProgress={hasActivities} studentId={studentId || undefined} />
                <SubjectCard subject="history" gradeLevel={gradeLevel} hasProgress={hasActivities} studentId={studentId || undefined} />
                <SubjectCard subject="computer" gradeLevel={gradeLevel} hasProgress={hasActivities} studentId={studentId || undefined} />
                <SubjectCard subject="art" gradeLevel={gradeLevel} hasProgress={hasActivities} studentId={studentId || undefined} />
              </div>
              
              <div className="mt-6">
                <button 
                  onClick={() => navigate('/subjects', { state: { studentId, gradeLevel, hasActivities } })} 
                  className="text-eduPurple hover:text-eduPurple-dark font-medium flex items-center"
                >
                  {language === 'id' ? 'Lihat Semua Mata Pelajaran' : 'View All Subjects'}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Button onClick={handleGoToAILearning} className="bg-eduPurple hover:bg-eduPurple-dark">
                <Sparkles className="mr-2 h-4 w-4" />
                {language === 'id' ? 'Jelajahi Semua Topik dengan AI Learning' : 'Explore All Topics with AI Learning'}
              </Button>
            </div>

            {/* Recent Activity */}
            <div className="mt-12">
              <h2 className="text-2xl font-display font-bold mb-4">
                {language === 'id' ? 'Aktivitas Terbaru' : 'Recent Activity'}
              </h2>
              
              {hasActivities && recentActivities.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-1 divide-y">
                    {isLoadingActivities ? (
                      <div className="p-8 flex justify-center">
                        <p>{language === 'id' ? 'Memuat aktivitas...' : 'Loading activities...'}</p>
                      </div>
                    ) : (
                      recentActivities.map((activity: any, index) => {
                        // Format the date
                        const activityDate = new Date(activity.sortDate);
                        const daysPassed = Math.floor((new Date().getTime() - activityDate.getTime()) / (1000 * 3600 * 24));
                        
                        let dateText = '';
                        if (daysPassed === 0) {
                          dateText = language === 'id' ? 'Hari ini' : 'Today';
                        } else if (daysPassed === 1) {
                          dateText = language === 'id' ? 'Kemarin' : 'Yesterday';
                        } else {
                          dateText = language === 'id' 
                            ? `${daysPassed} hari yang lalu` 
                            : `${daysPassed} days ago`;
                        }
                        
                        // Quiz activity
                        if (activity.type === 'quiz') {
                          return (
                            <div key={`activity-${index}`} className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-eduPastel-green flex items-center justify-center">
                                  <Medal className="h-5 w-5 text-eduPurple" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {language === 'id' 
                                      ? `Kuis ${activity.topic} Selesai`
                                      : `${activity.topic} Quiz Completed`}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {language === 'id'
                                      ? `${activity.subject} • ${dateText}`
                                      : `${activity.subject} • ${dateText}`}
                                  </p>
                                </div>
                              </div>
                              <span className="text-sm font-medium text-green-600">
                                {`${Math.round(activity.score)}/${Math.round(activity.max_score)} (${Math.round(activity.percentage)}%)`}
                              </span>
                            </div>
                          );
                        }
                        
                        // Learning activity
                        else {
                          return (
                            <div key={`activity-${index}`} className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-eduPastel-peach flex items-center justify-center">
                                  <BookOpen className="h-5 w-5 text-eduPurple" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {language === 'id'
                                      ? `${activity.completed ? 'Pelajaran Selesai' : 'Pelajaran Dimulai'}: ${activity.topic}`
                                      : `${activity.completed ? 'Completed' : 'Started'} Lesson: ${activity.topic}`}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {language === 'id'
                                      ? `${activity.subject} • ${dateText}`
                                      : `${activity.subject} • ${dateText}`}
                                  </p>
                                </div>
                              </div>
                              {activity.stars_earned && (
                                <span className="text-sm font-medium text-eduPurple">+{activity.stars_earned} stars</span>
                              )}
                            </div>
                          );
                        }
                      })
                    )}
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
              {renderRecommendedNextSteps()}
            </div>
          </div>
        </section>
        
        {/* Learning Buddy */}
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8">
          <LearningBuddy />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Lessons;
