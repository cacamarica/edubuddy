import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Lightbulb, 
  ArrowRight, 
  Calculator, 
  FlaskConical, 
  BookOpen, 
  GraduationCap,
  Globe,
  PenTool,
  Code,
  Brain,
  Music,
  Atom,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { studentProgressService, AIRecommendation } from '@/services/studentProgressService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useStudentProfile } from '@/contexts/StudentProfileContext';

interface EnhancedAIRecommendationsProps {
  studentId: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
}

// Map subjects to their corresponding icons
const SubjectIcon = ({ subject }: { subject: string }) => {
  const iconProps = { className: "h-5 w-5", strokeWidth: 2 };
  const s = subject.toLowerCase();
  
  if (s.includes('math') || s.includes('algebra') || s.includes('geometry')) {
    return <Calculator {...iconProps} />;
  }
  if (s.includes('science') || s.includes('biology')) {
    return <FlaskConical {...iconProps} />;
  }
  if (s.includes('physics') || s.includes('chemistry')) {
    return <Atom {...iconProps} />;
  }
  if (s.includes('social') || s.includes('history')) {
    return <GraduationCap {...iconProps} />;
  }
  if (s.includes('geography') || s.includes('world')) {
    return <Globe {...iconProps} />;
  }
  if (s.includes('language') || s.includes('english') || s.includes('literature') || s.includes('reading')) {
    return <BookOpen {...iconProps} />;
  }
  if (s.includes('art') || s.includes('drawing') || s.includes('painting')) {
    return <PenTool {...iconProps} />;
  }
  if (s.includes('computer') || s.includes('programming') || s.includes('coding')) {
    return <Code {...iconProps} />;
  }
  if (s.includes('music')) {
    return <Music {...iconProps} />;
  }
  if (s.includes('critical')) {
    return <Brain {...iconProps} />;
  }
  
  // Default
  return <FileText {...iconProps} />;
};

// Normalize recommendation type and topic to prevent duplicates
const normalizeRecommendation = (recommendation: AIRecommendation): AIRecommendation => {
  const recType = recommendation.recommendation_type.toLowerCase().trim();
  const topic = recommendation.recommendation.toLowerCase().trim();
  
  // Normalize recommendation type
  let normalizedType = recommendation.recommendation_type;
  if (recType.includes('math') || recType.includes('algebra') || recType.includes('geometry')) {
    normalizedType = 'Math';
  } else if (recType.includes('science') || recType.includes('biology') || recType.includes('chemistry') || recType.includes('physics')) {
    normalizedType = 'Science';
  } else if (recType.includes('english') || recType.includes('language') || recType.includes('reading')) {
    normalizedType = 'English';
  } else if (recType.includes('history') || recType.includes('social studies')) {
    normalizedType = 'Social Studies';
  } else if (recType.includes('art')) {
    normalizedType = 'Art';
  } else if (recType.includes('computer') || recType.includes('programming')) {
    normalizedType = 'Computer Science';
  }
  
  return {
    ...recommendation,
    recommendation_type: normalizedType
  };
};

const EnhancedAIRecommendations: React.FC<EnhancedAIRecommendationsProps> = ({ studentId, gradeLevel }) => {
  const [allRecommendations, setAllRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectedProfile } = useStudentProfile();
  
  // Items per page
  const itemsPerPage = 3;
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!studentId) return;
    
      setIsLoading(true);
      try {
        const data = await studentProgressService.getAIRecommendations(studentId);
        
        // If no real recommendations are available, use sample ones for testing
        if (data.length === 0) {
          console.log("No real recommendations available, using samples");
          const sampleRecs = studentProgressService.generateSampleAIRecommendations(studentId);
          setAllRecommendations(sampleRecs);
        } else {
          setAllRecommendations(data);
        }
        
        // Mark recommendations as read
        for (const rec of data) {
          if (rec.id && !rec.read) {
            await studentProgressService.markRecommendationAsRead(rec.id.toString());
          }
        }
      } catch (error) {
        console.error("Failed to load AI recommendations:", error);
        
        // Use sample recommendations on error
        const sampleRecs = studentProgressService.generateSampleAIRecommendations(studentId);
        setAllRecommendations(sampleRecs);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [studentId]);
  
  // Deduplicate and normalize recommendations
  const recommendations = useMemo(() => {
    // First normalize all recommendations
    const normalizedRecs = allRecommendations.map(rec => normalizeRecommendation(rec));
    
    // Then deduplicate by topic and type
    const uniqueRecs = new Map<string, AIRecommendation>();
    
    normalizedRecs.forEach(rec => {
      const key = `${rec.recommendation_type.toLowerCase()}-${rec.recommendation.toLowerCase()}`;
      
      if (!uniqueRecs.has(key)) {
        uniqueRecs.set(key, rec);
      }
    });
    
    return Array.from(uniqueRecs.values());
  }, [allRecommendations]);
  
  // Calculate pagination
  const totalPages = Math.ceil(recommendations.length / itemsPerPage);
  const currentRecommendations = recommendations.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );
  
  const handleStartLesson = async (rec: AIRecommendation) => {
    if (rec.id) {
      await studentProgressService.markRecommendationAsActedOn(rec.id.toString());
      setAllRecommendations(prevRecs => 
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

  // Get color scheme based on subject
  const getSubjectColor = (subject: string) => {
    const s = subject?.toLowerCase() || '';
    if (s.includes('math')) return 'bg-blue-100 border-blue-300';
    if (s.includes('science')) return 'bg-green-100 border-green-300';
    if (s.includes('english') || s.includes('language')) return 'bg-yellow-100 border-yellow-300';
    if (s.includes('history') || s.includes('social')) return 'bg-red-100 border-red-300';
    if (s.includes('art')) return 'bg-purple-100 border-purple-300';
    if (s.includes('computer')) return 'bg-cyan-100 border-cyan-300';
    return 'bg-gray-100 border-gray-300';
  };

  // Helper function to generate explanation data for recommendations
  const getExplanationData = (rec: AIRecommendation) => {
    // If the recommendation already has reason and impact data, use those
    if (rec.reason && rec.learning_impact) {
      return { reason: rec.reason, learningImpact: rec.learning_impact };
    }

    // Generate sample reason based on subject
    let reason = '';
    let learningImpact = '';
    const subject = rec.recommendation_type.toLowerCase();

    if (subject.includes('math')) {
      reason = language === 'id' 
        ? 'Berdasarkan analisis kuis terakhir, Anda menunjukkan kesulitan dengan konsep ini.'
        : 'Based on analysis of your recent quizzes, you showed difficulty with this concept.';
      
      learningImpact = language === 'id'
        ? 'Peningkatan 15-20% dalam skor matematika.'
        : 'Expected 15-20% improvement in math scores.';
    } 
    else if (subject.includes('science')) {
      reason = language === 'id'
        ? 'Topik ini adalah dasar untuk konsep ilmiah yang lebih kompleks.'
        : 'This topic is foundational for more complex scientific concepts.';
      
      learningImpact = language === 'id'
        ? 'Memperkuat pengetahuan sains dasar untuk proyek mendatang.'
        : 'Strengthens core science knowledge for upcoming projects.';
    }
    else if (subject.includes('english')) {
      reason = language === 'id'
        ? 'Keterampilan membaca dan pemahaman Anda menunjukkan potensi untuk ditingkatkan.'
        : 'Your reading and comprehension skills show potential for improvement.';
      
      learningImpact = language === 'id'
        ? 'Peningkatan kosakata dan kemampuan pemahaman membaca.'
        : 'Enhanced vocabulary and reading comprehension abilities.';
    }
    else {
      reason = language === 'id'
        ? 'Disarankan untuk memperluas pengetahuan Anda dalam kurikulum pembelajaran.'
        : 'Suggested to expand your knowledge in the learning curriculum.';
      
      learningImpact = language === 'id'
        ? 'Peningkatan pemahaman secara keseluruhan.'
        : 'Improved overall comprehension.';
    }

    return { reason, learningImpact };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              {language === 'id' 
                ? 'Belum ada rekomendasi pembelajaran personal tersedia.' 
                : 'No personalized learning recommendations available yet.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h2 className="text-xl font-semibold tracking-tight">
          {language === 'id' ? 'Rekomendasi Pembelajaran Pintar' : 'Smart Learning Recommendations'}
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {currentRecommendations.map((rec, index) => {
          const { reason, learningImpact } = getExplanationData(rec);
          const colorClass = getSubjectColor(rec.recommendation_type);
          
          return (
            <Card 
              key={rec.id || index} 
              className={`border-2 overflow-hidden hover:shadow-md transition-shadow ${colorClass}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <SubjectIcon subject={rec.recommendation_type} />
                    <CardTitle className="text-lg">{rec.recommendation}</CardTitle>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(rec.created_at || '').toLocaleDateString()}</p>
              </CardHeader>
              
              <CardContent className="space-y-3 pb-1">
                <div>
                  <h4 className="text-sm font-semibold mb-1">
                    {language === 'id' ? 'Mengapa Direkomendasikan:' : 'Why Recommended:'}
                  </h4>
                  <p className="text-sm text-muted-foreground">{reason}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold mb-1">
                    {language === 'id' ? 'Dampak Pembelajaran:' : 'Learning Impact:'}
                  </h4>
                  <p className="text-sm text-muted-foreground">{learningImpact}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="font-normal text-xs">
                    {rec.recommendation_type}
                  </Badge>
                </div>
              </CardContent>
              
              <CardFooter className="pt-2">
                <Button 
                  onClick={() => handleStartLesson(rec)} 
                  className="w-full"
                >
                  {language === 'id' ? 'Mulai Belajar' : 'Take Action'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {language === 'id' ? 'Sebelumnya' : 'Previous'}
          </Button>
          
          <div className="text-sm">
            {language === 'id' 
              ? `Halaman ${currentPage} dari ${totalPages}` 
              : `Page ${currentPage} of ${totalPages}`}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            {language === 'id' ? 'Selanjutnya' : 'Next'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default EnhancedAIRecommendations;
