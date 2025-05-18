
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Book, Calculator, Beaker, Globe, PenTool, Puzzle, Brain, BookOpen } from 'lucide-react';
import { studentProgressService, AIRecommendation } from '@/services/studentProgressService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface EnhancedAIRecommendationsProps {
  studentId: string;
  gradeLevel: string;
}

interface RecommendationExtended extends AIRecommendation {
  subject?: string;
  topic?: string;
  activityType?: string;
  reasoning?: string;
  expectedImpact?: string;
}

// Map subjects to their corresponding icons
const SubjectIcon = ({ subject }: { subject: string }) => {
  const iconProps = { className: "h-5 w-5 mr-2", strokeWidth: 2 };
  
  switch (subject.toLowerCase()) {
    case 'math':
    case 'mathematics':
      return <Calculator {...iconProps} />;
    case 'science':
      return <Beaker {...iconProps} />;
    case 'social studies':
    case 'history':
    case 'geography':
      return <Globe {...iconProps} />;
    case 'language':
    case 'english':
    case 'literature':
    case 'reading':
    case 'language arts':
      return <BookOpen {...iconProps} />;
    case 'arts':
    case 'art':
      return <PenTool {...iconProps} />;
    case 'logic':
    case 'puzzles':
    case 'computer':
    case 'computer science':
    case 'technology':
      return <Puzzle {...iconProps} />;
    case 'critical thinking':
      return <Brain {...iconProps} />;
    default:
      return <Book {...iconProps} />;
  }
};

const EnhancedAIRecommendations: React.FC<EnhancedAIRecommendationsProps> = ({ studentId, gradeLevel }) => {
  const [recommendations, setRecommendations] = useState<RecommendationExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!studentId) return;
      
      setIsLoading(true);
      try {
        // Get real recommendations from database
        const data = await studentProgressService.getAIRecommendations(studentId);
        
        // Process each recommendation to extract subject, topic, etc.
        const processedRecs = data.map(rec => {
          // Parse the recommendation text to extract subject, topic, etc.
          // This assumes the recommendation has some structure we can identify
          const parsedRec: RecommendationExtended = {...rec};
          
          // Example format: "lesson:Math:Algebra" or "quiz:Science:Plants"
          if (rec.recommendation.includes(':')) {
            const parts = rec.recommendation.split(':');
            if (parts.length >= 3) {
              parsedRec.activityType = parts[0].trim();
              parsedRec.subject = parts[1].trim();
              
              // The rest might contain topic and reasoning
              const remaining = parts.slice(2).join(':').split('|');
              parsedRec.topic = remaining[0].trim();
              
              if (remaining.length > 1) {
                parsedRec.reasoning = remaining[1].trim();
              }
              
              if (remaining.length > 2) {
                parsedRec.expectedImpact = remaining[2].trim();
              }
            }
          } else {
            // Default display values if we can't parse the recommendation
            const subjectOptions = ['Math', 'Science', 'Language', 'Social Studies'];
            parsedRec.subject = subjectOptions[Math.floor(Math.random() * subjectOptions.length)];
            parsedRec.topic = 'Recommended Topic';
            parsedRec.activityType = Math.random() > 0.5 ? 'lesson' : 'quiz';
          }
          
          return parsedRec;
        });
        
        // If no recommendations, create some for demo based on grade level
        if (processedRecs.length === 0) {
          const demoRecs = getGradeLevelRecommendations(gradeLevel, studentId);
          setRecommendations(demoRecs);
        } else {
          setRecommendations(processedRecs);
        }
      } catch (error) {
        console.error('Error fetching AI recommendations:', error);
        toast.error(language === 'id' ? 'Gagal memuat rekomendasi' : 'Failed to load recommendations');
        
        // If error, provide grade-appropriate demo recommendations
        const demoRecs = getGradeLevelRecommendations(gradeLevel, studentId);
        setRecommendations(demoRecs);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [studentId, language, gradeLevel]);
  
  // Generate recommendations based on grade level
  const getGradeLevelRecommendations = (grade: string, studId: string): RecommendationExtended[] => {
    // Default recommendations by age/grade group
    if (grade === 'k-3' || grade.toLowerCase().includes('k-3')) {
      return [
        {
          id: `demo-k3-1-${Date.now()}`,
          student_id: studId,
          recommendation_type: 'Math',
          recommendation: 'lesson:Math:Counting Fun|Based on recent activities|Will build a strong number foundation',
          created_at: new Date().toISOString(),
          read: false,
          acted_on: false,
          subject: 'Math',
          topic: 'Counting Fun',
          activityType: 'lesson',
          reasoning: 'Based on recent activities',
          expectedImpact: 'Will build a strong number foundation'
        },
        {
          id: `demo-k3-2-${Date.now()}`,
          student_id: studId,
          recommendation_type: 'Reading',
          recommendation: 'lesson:Reading:Alphabet Adventures|To improve letter recognition|Helps with early reading skills',
          created_at: new Date().toISOString(),
          read: false,
          acted_on: false,
          subject: 'Reading',
          topic: 'Alphabet Adventures',
          activityType: 'lesson',
          reasoning: 'To improve letter recognition',
          expectedImpact: 'Helps with early reading skills'
        },
        {
          id: `demo-k3-3-${Date.now()}`,
          student_id: studId,
          recommendation_type: 'Science',
          recommendation: 'quiz:Science:Animal Friends|To test knowledge of animals|Will encourage scientific curiosity',
          created_at: new Date().toISOString(),
          read: false,
          acted_on: false,
          subject: 'Science',
          topic: 'Animal Friends',
          activityType: 'quiz',
          reasoning: 'To test knowledge of animals',
          expectedImpact: 'Will encourage scientific curiosity'
        }
      ];
    } else if (grade === '4-6' || grade.toLowerCase().includes('4-6')) {
      return [
        {
          id: `demo-46-1-${Date.now()}`,
          student_id: studId,
          recommendation_type: 'Math',
          recommendation: 'lesson:Math:Fractions Basics|Foundational for math success|Will help with advanced math concepts',
          created_at: new Date().toISOString(),
          read: false,
          acted_on: false,
          subject: 'Math',
          topic: 'Fractions Basics',
          activityType: 'lesson',
          reasoning: 'Foundational for math success',
          expectedImpact: 'Will help with advanced math concepts'
        },
        {
          id: `demo-46-2-${Date.now()}`,
          student_id: studId,
          recommendation_type: 'Science',
          recommendation: 'quiz:Science:Simple Machines|To reinforce science lessons|Supports problem-solving abilities',
          created_at: new Date().toISOString(),
          read: false,
          acted_on: false,
          subject: 'Science',
          topic: 'Simple Machines',
          activityType: 'quiz',
          reasoning: 'To reinforce science lessons',
          expectedImpact: 'Supports problem-solving abilities'
        },
        {
          id: `demo-46-3-${Date.now()}`,
          student_id: studId,
          recommendation_type: 'Language Arts',
          recommendation: 'lesson:Language Arts:Reading Comprehension|To strengthen literacy skills|Will improve comprehension across subjects',
          created_at: new Date().toISOString(),
          read: false,
          acted_on: false,
          subject: 'Language Arts',
          topic: 'Reading Comprehension',
          activityType: 'lesson',
          reasoning: 'To strengthen literacy skills',
          expectedImpact: 'Will improve comprehension across subjects'
        }
      ];
    } else { // 7-9 or any other grade level
      return [
        {
          id: `demo-79-1-${Date.now()}`,
          student_id: studId,
          recommendation_type: 'Math',
          recommendation: 'lesson:Mathematics:Algebra Foundations|Based on curriculum requirements|Critical for high school math success',
          created_at: new Date().toISOString(),
          read: false,
          acted_on: false,
          subject: 'Mathematics',
          topic: 'Algebra Foundations',
          activityType: 'lesson',
          reasoning: 'Based on curriculum requirements',
          expectedImpact: 'Critical for high school math success'
        },
        {
          id: `demo-79-2-${Date.now()}`,
          student_id: studId,
          recommendation_type: 'Science',
          recommendation: 'quiz:Science:Chemistry Basics|To test understanding of scientific concepts|Builds foundation for advanced sciences',
          created_at: new Date().toISOString(),
          read: false,
          acted_on: false,
          subject: 'Science',
          topic: 'Chemistry Basics',
          activityType: 'quiz',
          reasoning: 'To test understanding of scientific concepts',
          expectedImpact: 'Builds foundation for advanced sciences'
        },
        {
          id: `demo-79-3-${Date.now()}`,
          student_id: studId,
          recommendation_type: 'Language Arts',
          recommendation: 'lesson:English:Essay Writing|To develop critical writing skills|Prepares for high school and college assignments',
          created_at: new Date().toISOString(),
          read: false,
          acted_on: false,
          subject: 'English',
          topic: 'Essay Writing',
          activityType: 'lesson',
          reasoning: 'To develop critical writing skills',
          expectedImpact: 'Prepares for high school and college assignments'
        },
        {
          id: `demo-79-4-${Date.now()}`,
          student_id: studId,
          recommendation_type: 'Computer Science',
          recommendation: 'lesson:Computer Science:Programming Basics|To build technology literacy|Essential skill for future careers',
          created_at: new Date().toISOString(),
          read: false,
          acted_on: false,
          subject: 'Computer Science',
          topic: 'Programming Basics',
          activityType: 'lesson',
          reasoning: 'To build technology literacy',
          expectedImpact: 'Essential skill for future careers'
        }
      ];
    }
  };

  const handleRecommendationClick = async (recommendation: RecommendationExtended) => {
    try {
      // Mark recommendation as read and acted on
      if (recommendation.id && !recommendation.id.toString().includes('demo')) {
        await studentProgressService.markRecommendationAsRead(recommendation.id.toString());
        await studentProgressService.markRecommendationAsActedOn(recommendation.id.toString());
      }
      
      // Navigate based on activity type
      if (recommendation.activityType === 'lesson' && recommendation.subject && recommendation.topic) {
        navigate(`/lessons?subject=${recommendation.subject}&topic=${recommendation.topic}`);
      } else if (recommendation.activityType === 'quiz' && recommendation.subject && recommendation.topic) {
        navigate(`/quiz?subject=${recommendation.subject}&topic=${recommendation.topic}`);
      } else {
        // Default to subjects page
        navigate('/subjects');
      }
    } catch (error) {
      console.error('Error handling recommendation click:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {recommendations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {language === 'id' 
              ? 'Belum ada rekomendasi pembelajaran untuk siswa ini.' 
              : 'No learning recommendations yet for this student.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recommendations.map((rec, index) => (
            <Card key={rec.id || `rec-${index}`} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-start mb-3">
                    <div className={`p-2 rounded-lg ${
                      rec.subject?.toLowerCase().includes('math') ? 'bg-blue-100' :
                      rec.subject?.toLowerCase().includes('science') ? 'bg-green-100' :
                      rec.subject?.toLowerCase().includes('language') || 
                      rec.subject?.toLowerCase().includes('english') || 
                      rec.subject?.toLowerCase().includes('reading') ? 'bg-purple-100' :
                      rec.subject?.toLowerCase().includes('computer') ? 'bg-cyan-100' :
                      'bg-amber-100'
                    } mr-3`}>
                      <SubjectIcon subject={rec.subject || 'General'} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {rec.activityType === 'lesson' 
                          ? (language === 'id' ? 'Pelajaran: ' : 'Lesson: ') 
                          : (language === 'id' ? 'Kuis: ' : 'Quiz: ')}
                        {rec.subject} - {rec.topic}
                      </h3>
                    </div>
                  </div>
                  
                  {/* Reasoning and Expected Impact sections - highlighted */}
                  {rec.reasoning && (
                    <div className="text-sm mt-3 p-2 bg-gray-50 rounded-md">
                      <p className="font-medium text-gray-700">
                        {language === 'id' ? 'Alasan: ' : 'Why this is recommended:'}
                      </p>
                      <p className="text-muted-foreground">
                        {rec.reasoning}
                      </p>
                    </div>
                  )}
                  
                  {rec.expectedImpact && (
                    <div className="text-sm mt-2 p-2 bg-blue-50 rounded-md">
                      <p className="font-medium text-blue-700">
                        {language === 'id' ? 'Dampak Pembelajaran: ' : 'Learning Impact:'}
                      </p>
                      <p className="text-muted-foreground">
                        {rec.expectedImpact}
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => handleRecommendationClick(rec)}
                  >
                    {language === 'id' ? 'Mulai' : 'Start'} 
                    {rec.activityType === 'lesson'
                      ? (language === 'id' ? ' Pelajaran' : ' Lesson')
                      : (language === 'id' ? ' Kuis' : ' Quiz')
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedAIRecommendations;
