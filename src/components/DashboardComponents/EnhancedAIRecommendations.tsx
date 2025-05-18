
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Book, Calculator, Flask, Globe, PenTool, Puzzle, Brain, BookOpen } from 'lucide-react';
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
      return <Calculator {...iconProps} />;
    case 'science':
      return <Flask {...iconProps} />;
    case 'social studies':
    case 'history':
    case 'geography':
      return <Globe {...iconProps} />;
    case 'language':
    case 'english':
    case 'literature':
      return <BookOpen {...iconProps} />;
    case 'arts':
      return <PenTool {...iconProps} />;
    case 'logic':
    case 'puzzles':
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
        
        // If no recommendations, create some for demo
        if (processedRecs.length === 0) {
          const demoRecs = [
            {
              id: 'demo-1',
              student_id: studentId,
              recommendation_type: 'suggested_lesson',
              recommendation: 'lesson:Math:Multiplication|Based on your recent quiz results|Will improve your calculation speed',
              created_at: new Date().toISOString(),
              read: false,
              acted_on: false,
              subject: 'Math',
              topic: 'Multiplication',
              activityType: 'lesson',
              reasoning: 'Based on your recent quiz results',
              expectedImpact: 'Will improve your calculation speed'
            },
            {
              id: 'demo-2',
              student_id: studentId,
              recommendation_type: 'suggested_quiz',
              recommendation: 'quiz:Science:Plants|To reinforce what you learned in lessons|Will help cement your knowledge',
              created_at: new Date().toISOString(),
              read: false,
              acted_on: false,
              subject: 'Science',
              topic: 'Plants',
              activityType: 'quiz',
              reasoning: 'To reinforce what you learned in lessons',
              expectedImpact: 'Will help cement your knowledge'
            },
            {
              id: 'demo-3',
              student_id: studentId,
              recommendation_type: 'suggested_lesson',
              recommendation: 'lesson:Language:Storytelling|You showed interest in creative writing|Will enhance your narrative skills',
              created_at: new Date().toISOString(),
              read: false,
              acted_on: false,
              subject: 'Language',
              topic: 'Storytelling',
              activityType: 'lesson',
              reasoning: 'You showed interest in creative writing',
              expectedImpact: 'Will enhance your narrative skills'
            }
          ];
          
          setRecommendations(demoRecs);
        } else {
          setRecommendations(processedRecs);
        }
      } catch (error) {
        console.error('Error fetching AI recommendations:', error);
        toast.error(language === 'id' ? 'Gagal memuat rekomendasi' : 'Failed to load recommendations');
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [studentId, language]);
  
  const handleRecommendationClick = async (recommendation: RecommendationExtended) => {
    try {
      // Mark recommendation as read and acted on
      if (recommendation.id && recommendation.id.toString() !== 'demo-1' && 
          recommendation.id.toString() !== 'demo-2' && recommendation.id.toString() !== 'demo-3') {
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
        recommendations.map((rec, index) => (
          <Card key={rec.id || `rec-${index}`} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex items-start mb-3">
                  <div className={`p-2 rounded-lg ${
                    rec.subject?.toLowerCase() === 'math' ? 'bg-blue-100' :
                    rec.subject?.toLowerCase() === 'science' ? 'bg-green-100' :
                    rec.subject?.toLowerCase() === 'language' ? 'bg-purple-100' :
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
                    
                    {rec.reasoning && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {language === 'id' ? 'Alasan: ' : 'Reasoning: '}
                        {rec.reasoning}
                      </p>
                    )}
                    
                    {rec.expectedImpact && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {language === 'id' ? 'Dampak yang Diharapkan: ' : 'Expected Impact: '}
                        {rec.expectedImpact}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full"
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
        ))
      )}
    </div>
  );
};

export default EnhancedAIRecommendations;
