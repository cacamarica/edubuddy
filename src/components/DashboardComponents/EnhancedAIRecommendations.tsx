
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Lightbulb, 
  CheckCircle, 
  ArrowRight, 
  FileText, 
  BarChart3, 
  HelpCircle, 
  Check, 
  X, 
  RefreshCw,
  Calculator,
  BookOpen,
  FlaskConical,
  Atom,
  Globe,
  Code,
  Languages,
  Music,
  Palette,
  GraduationCap
} from 'lucide-react'; 

import { studentProgressService, AIRecommendation, AISummaryReport } from '@/services/studentProgressService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import { useNavigate } from 'react-router-dom';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { toast } from 'sonner';

interface EnhancedAIRecommendationsProps {
  studentId: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
}

// Map subject names to icons
const getSubjectIcon = (subject: string) => {
  const s = subject?.toLowerCase() || '';
  if (s.includes('math')) return Calculator;
  if (s.includes('english') || s.includes('language')) return BookOpen;
  if (s.includes('science')) return FlaskConical;
  if (s.includes('physics')) return Atom;
  if (s.includes('geography') || s.includes('world')) return Globe;
  if (s.includes('computer')) return Code;
  if (s.includes('foreign') || s.includes('language')) return Languages;
  if (s.includes('music')) return Music;
  if (s.includes('art')) return Palette;
  if (s.includes('social') || s.includes('history')) return GraduationCap;
  
  // Default icon if no match
  return Lightbulb;
};

// Enrich recommendation with reasoning and impact
interface EnhancedRecommendation extends AIRecommendation {
  reasoning?: string;
  potentialImpact?: string;
  subjectIcon?: any;
}

const EnhancedAIRecommendations: React.FC<EnhancedAIRecommendationsProps> = ({ studentId, gradeLevel }) => {
  const [recommendations, setRecommendations] = useState<EnhancedRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [processedRecommendations, setProcessedRecommendations] = useState<EnhancedRecommendation[]>([]);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectedProfile } = useStudentProfile();
  
  const fetchRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true);
    try {
      const recData = await studentProgressService.getAIRecommendations(studentId);
      
      // Mark recommendations as read
      for (const rec of recData) {
        if (rec.id && !rec.read) {
          await studentProgressService.markRecommendationAsRead(rec.id);
        }
      }
      
      setRecommendations(recData);
    } catch (error) {
      console.error("Failed to load AI recommendations:", error);
      toast.error(language === 'id' ? 'Gagal memuat rekomendasi AI' : 'Failed to load AI recommendations');
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [studentId, language]);

  useEffect(() => {
    if (studentId) {
      fetchRecommendations();
    }
  }, [studentId, fetchRecommendations]);
  
  // Process recommendations to add reasoning, impact and deduplicate
  useEffect(() => {
    if (recommendations.length > 0) {
      // First, add reasoning and impact to recommendations
      const enhancedRecs = recommendations.map(rec => {
        // Extract subject from recommendation type or derive from text
        let subject = rec.recommendation_type;
        if (rec.recommendation_type.includes(':')) {
          [subject] = rec.recommendation_type.split(':', 2);
        }
        
        // Add mock reasoning and impact since these don't exist in the current data model
        const enhanced: EnhancedRecommendation = {
          ...rec,
          reasoning: `This topic is suggested because it addresses key learning needs in ${subject} for this grade level.`,
          potentialImpact: `Mastering this could improve understanding of ${subject} concepts and boost overall academic performance.`,
          subjectIcon: getSubjectIcon(subject)
        };
        return enhanced;
      });
      
      // Then deduplicate by creating a Map with subject+topic as key
      const uniqueRecommendations = new Map<string, EnhancedRecommendation>();
      
      enhancedRecs.forEach(rec => {
        // Extract subject and topic
        let subject = rec.recommendation_type;
        let topic = rec.recommendation;
        
        if (rec.recommendation_type.includes(':')) {
          [subject, topic] = rec.recommendation_type.split(':', 2);
        }
        
        const key = `${subject.toLowerCase()}-${topic.toLowerCase()}`;
        
        if (!uniqueRecommendations.has(key)) {
          uniqueRecommendations.set(key, rec);
        } else {
          // If this is a more recent unread or unacted recommendation, replace the existing one
          const existing = uniqueRecommendations.get(key)!;
          const existingDate = new Date(existing.created_at || '');
          const currentDate = new Date(rec.created_at || '');
          
          if ((!existing.read && rec.read) || (!existing.acted_on && rec.acted_on) || currentDate > existingDate) {
            uniqueRecommendations.set(key, rec);
          }
        }
      });
      
      setProcessedRecommendations(Array.from(uniqueRecommendations.values()));
    } else {
      setProcessedRecommendations([]);
    }
  }, [recommendations]);

  const handleStartLesson = async (rec: EnhancedRecommendation) => {
    if (rec.id) {
      await studentProgressService.markRecommendationAsActedOn(rec.id);
      setRecommendations(prevRecs => 
        prevRecs.map(item => 
          item.id === rec.id ? { ...item, acted_on: true } : item
        )
      );
    }

    let subject = rec.recommendation_type;
    let topic = rec.recommendation;

    if (rec.recommendation_type.includes(':')) {
      [subject, topic] = rec.recommendation_type.split(':', 2);
    } 

    navigate('/ai-learning', {
      state: {
        gradeLevel: gradeLevel,
        studentId: studentId,
        studentName: selectedProfile?.name || 'Student',
        subject: subject, 
        topic: topic,     
        autoStart: true,
        sourceRecommendationId: rec.id 
      }
    });
  };

  const getSubjectColor = (subject: string) => {
    const s = subject?.toLowerCase() || '';
    if (s.includes('math')) return 'bg-blue-100 text-blue-700';
    if (s.includes('science')) return 'bg-green-100 text-green-700';
    if (s.includes('english')) return 'bg-yellow-100 text-yellow-700';
    if (s.includes('history')) return 'bg-red-100 text-red-700';
    if (s.includes('computer')) return 'bg-purple-100 text-purple-700';
    if (s.includes('art')) return 'bg-pink-100 text-pink-700';
    if (s.includes('music')) return 'bg-cyan-100 text-cyan-700';
    if (s.includes('geography')) return 'bg-emerald-100 text-emerald-700';
    if (s.includes('foreign') || s.includes('language')) return 'bg-teal-100 text-teal-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="h-full space-y-8">
      {/* Revamped AI Learning Recommendations Section - Card Model */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-medium">
            {language === 'id' ? 'Saran Pembelajaran Berikutnya' : 'Suggested Next Steps'}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {language === 'id' 
            ? 'Pilih topik di bawah ini untuk memulai sesi belajar AI. Rekomendasi ini didasarkan pada analisis kemajuan siswa.' 
            : 'Choose a topic below to start an AI learning session. These are based on an analysis of the student\'s progress.'}
        </p>
        
        {isLoadingRecommendations ? (
          <div className="flex justify-center items-center h-32">
            <Spinner size="md" />
          </div>
        ) : processedRecommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedRecommendations.map((rec) => {
              const [subject, topicText] = rec.recommendation_type.includes(':') 
                ? rec.recommendation_type.split(':', 2) 
                : [rec.recommendation_type, rec.recommendation];
              const cardColor = getSubjectColor(subject);
              const SubjectIcon = rec.subjectIcon || getSubjectIcon(subject);

              return (
                <div 
                  key={rec.id} 
                  className={`rounded-lg shadow-md overflow-hidden flex flex-col justify-between p-4 transition-all hover:shadow-lg ${rec.acted_on ? 'bg-gray-100 opacity-70' : 'bg-white'}`}
                >
                  <div>
                    <div className="flex items-center mb-2">
                      {rec.acted_on ? (
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mr-2" />
                      ) : (
                        <SubjectIcon className="h-5 w-5 text-yellow-500 shrink-0 mr-2" />
                      )}
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${cardColor}`}>{subject}</span>
                    </div>
                    <h4 className={`font-semibold mb-1 text-gray-800 ${rec.acted_on ? 'line-through' : ''}`}>{topicText}</h4>
                    <p className={`text-xs text-gray-600 mb-1 ${rec.acted_on ? 'line-through' : ''}`}>{rec.recommendation}</p>
                    
                    {/* AI Reasoning & Impact - Enhanced Information */}
                    {rec.reasoning && (
                      <div className="mt-2 text-xs text-gray-500 flex items-start">
                        <HelpCircle className="h-3 w-3 mr-1 mt-0.5 shrink-0 text-blue-500" />
                        <span><strong>{language === 'id' ? 'Alasan:' : 'Reasoning:'}</strong> {rec.reasoning}</span>
                      </div>
                    )}
                    {rec.potentialImpact && (
                       <div className="mt-1 text-xs text-gray-500 flex items-start">
                         <BarChart3 className="h-3 w-3 mr-1 mt-0.5 shrink-0 text-green-500" />
                         <span><strong>{language === 'id' ? 'Dampak:' : 'Impact:'}</strong> {rec.potentialImpact}</span>
                       </div>
                    )}
                  </div>
                  
                  {!rec.acted_on && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full mt-3 border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => handleStartLesson(rec)}
                    >
                      {language === 'id' ? 'Mulai Belajar' : 'Start Learning'} 
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground p-4 border rounded-lg bg-gray-50">
            {language === 'id' 
              ? 'Belum ada rekomendasi. Lanjutkan pembelajaran untuk mendapatkan saran yang dipersonalisasi!' 
              : 'No recommendations yet. Continue learning to get personalized suggestions!'}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAIRecommendations;
