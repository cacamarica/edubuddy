import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Book, Calculator, Beaker, Globe, PenTool, Puzzle, Brain, BookOpen, BarChart3, SparkleIcon, Sparkles, Zap } from 'lucide-react';
import { studentProgressService, AIRecommendation } from '@/services/studentProgressService';
import { aiLearningInsightService } from '@/services/aiLearningInsightService';
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

interface RecommendationWithAI extends RecommendationExtended {
  aiGenerated?: boolean;
}

const EnhancedAIRecommendations: React.FC<EnhancedAIRecommendationsProps> = ({ studentId, gradeLevel }) => {
  const [recommendations, setRecommendations] = useState<RecommendationWithAI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'ai-enhancing' | 'loaded' | 'error'>('idle');
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!studentId) return;
      
      setIsLoading(true);
      setLoadingState('loading');
      try {
        // Get real recommendations from database
        const data = await studentProgressService.getAIRecommendations(studentId, 10); // Fetch more recommendations for better analysis
        
        // Check if we have enough data for meaningful recommendations (at least 3 data points)
        const hasEnoughData = data.length >= 3;
        
        if (!hasEnoughData) {
          console.log('Not enough learning data for personalized recommendations');
          const insufficientDataRecs = getGradeLevelRecommendations(gradeLevel, studentId);
          setRecommendations(insufficientDataRecs);
          setIsLoading(false);
          setLoadingState('loaded');
          return;
        }
        
        // Process each recommendation to extract subject, topic, etc.
        const processedRecs = data.map(rec => {
          // Parse the recommendation text to extract subject, topic, etc.
          const parsedRec: RecommendationWithAI = {...rec};
          
          // Example format: "lesson:Math:Algebra" or "quiz:Science:Plants"
          if (rec.recommendation && rec.recommendation.includes(':')) {
            const parts = rec.recommendation.split(':');
            if (parts.length >= 3) {
              parsedRec.activityType = parts[0].trim();
              parsedRec.subject = parts[1].trim();
              
              // The rest might contain topic and reasoning
              const remaining = parts.slice(2).join(':').split('|');
              parsedRec.topic = remaining[0].trim();
              
              // Extract reasoning and expected impact if available
              if (remaining.length > 1) {
                parsedRec.reasoning = remaining[1].trim();
              }
              
              if (remaining.length > 2) {
                parsedRec.expectedImpact = remaining[2].trim();
              }
            }
          } else {
            // Default display values if we can't parse the recommendation format
            parsedRec.subject = rec.recommendation_type || 'General';
            parsedRec.topic = rec.recommendation || 'Recommended Topic';
            parsedRec.activityType = rec.recommendation.toLowerCase().includes('quiz') ? 'quiz' : 'lesson';
          }
          
          return parsedRec;
        });
        
        if (processedRecs.length === 0) {
          // If still no recommendations after processing, use the insufficient data message
          const insufficientDataRecs = getGradeLevelRecommendations(gradeLevel, studentId);
          setRecommendations(insufficientDataRecs);
          setLoadingState('loaded');
        } else {
          try {
            // Get AI-enhanced insights for the recommendations
            console.log('Enhancing recommendations with AI-generated insights...');
            setLoadingState('ai-enhancing');
            
            // Track the start time for analytics
            const startTime = Date.now();
            
            // Call the enhanced AI service for better personalization
            let aiEnhancedRecs;
            try {
              // Try the new parameter style first
              aiEnhancedRecs = await aiLearningInsightService.enhanceRecommendationsWithInsights({
                recommendations: processedRecs,
                studentId,
                gradeLevel,
                language: language === 'id' ? 'id' : 'en'
              });
            } catch (paramError) {
              // Fall back to old parameter style if needed
              console.warn('Falling back to legacy parameter style for enhanceRecommendationsWithInsights');
              aiEnhancedRecs = await aiLearningInsightService.enhanceRecommendationsWithInsights(
                processedRecs,
                studentId,
                gradeLevel,
                language === 'id' ? 'id' : 'en'
              );
            }
            
            // Analytics: Track performance
            console.log(`AI insights generated in ${Date.now() - startTime}ms`);
            
            // Apply AI-generated insights to recommendations
            const enhancedRecs = aiEnhancedRecs.map(rec => ({
              ...rec,
              aiGenerated: true // Flag to indicate this is AI-generated content
            }));
            
            setRecommendations(enhancedRecs);
            setLoadingState('loaded');
          } catch (insightError) {
            console.error('Failed to get AI insights for recommendations:', insightError);
            
            // Try to get insights one by one instead of bulk processing
            try {
              const enhancedRecs = [];
              
              for (const rec of processedRecs) {
                try {
                  const personalizedInsight = await aiLearningInsightService.getPersonalizedInsight({
                    studentId,
                    subject: rec.subject,
                    topic: rec.topic,
                    activityType: rec.activityType || 'lesson',
                    gradeLevel,
                    language: language === 'id' ? 'id' : 'en'
                  });
                  
                  enhancedRecs.push({
                    ...rec,
                    reasoning: personalizedInsight?.reasoning || rec.reasoning,
                    expectedImpact: personalizedInsight?.expectedImpact || rec.expectedImpact,
                    aiGenerated: !!personalizedInsight
                  });
                } catch (individualError) {
                  console.warn('Failed to get individual insight:', individualError);
                  enhancedRecs.push(rec);
                }
              }
              
              setRecommendations(enhancedRecs);
              setLoadingState('loaded');
            } catch (secondaryError) {
              console.error('Failed to get individual AI insights:', secondaryError);
              
              // Final fallback to basic enhancement
              const basicEnhancedRecs = processedRecs.map(rec => ({
                ...rec,
                reasoning: rec.reasoning || (language === 'id' 
                  ? `Berdasarkan analisis aktivitas pembelajaran Anda di ${rec.subject || 'berbagai mata pelajaran'}`
                  : `Based on analysis of your learning activities in ${rec.subject || 'various subjects'}`),
                expectedImpact: rec.expectedImpact || (language === 'id'
                  ? `Akan membantu meningkatkan pemahaman di area ${rec.topic} dan kinerja keseluruhan Anda`
                  : `Will help improve your understanding in ${rec.topic} and your overall performance`),
                aiGenerated: false
              }));
              
              setRecommendations(basicEnhancedRecs);
              setLoadingState('loaded');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching AI recommendations:', error);
        toast.error(language === 'id' ? 'Gagal memuat rekomendasi' : 'Failed to load recommendations');
        
        // If error, show the insufficient data message
        const insufficientDataRecs = getGradeLevelRecommendations(gradeLevel, studentId);
        setRecommendations(insufficientDataRecs);
        setLoadingState('error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [studentId, language, gradeLevel]);
    // Generate recommendations based on grade level and student's learning data
  const getGradeLevelRecommendations = (grade: string, studId: string): RecommendationExtended[] => {
    // Create a single placeholder recommendation for when there's not enough data
    const notEnoughDataRecommendation: RecommendationExtended = {
      id: `insufficient-data-${Date.now()}`,
      student_id: studId,
      recommendation_type: 'Data Needed',
      recommendation: 'more-activities',
      created_at: new Date().toISOString(),
      read: false,
      acted_on: false,
      subject: 'General',
      topic: 'Continue Learning',
      activityType: 'lesson',
      reasoning: 'Not enough learning data available to generate personalized recommendations',
      expectedImpact: 'Complete more lessons and quizzes to receive tailored learning suggestions'
    };
    
    // Return the placeholder for insufficient data
    return [notEnoughDataRecommendation];
  };
  const handleRecommendationClick = async (recommendation: RecommendationWithAI) => {
    try {
      // Mark recommendation as read and acted on
      if (recommendation.id && !recommendation.id.toString().includes('demo')) {
        await studentProgressService.markRecommendationAsRead(recommendation.id.toString());
        await studentProgressService.markRecommendationAsActedOn(recommendation.id.toString());
      }
      
      // Prepare additional metadata for AI content generation
      const metadata = {
        recommendationId: recommendation.id?.toString(),
        aiGenerated: recommendation.aiGenerated || false,
        reasoning: recommendation.reasoning,
        expectedImpact: recommendation.expectedImpact,
        autoStart: true, // Automatically start generating content
        resumeExisting: true // Try to resume existing content if available
      };
      
      // Navigate based on activity type with enhanced metadata
      if (recommendation.activityType === 'lesson' && recommendation.subject && recommendation.topic) {
        // For lessons, go to AI Learning page directly
        navigate('/ai-learning', { 
          state: { 
            gradeLevel,
            subject: recommendation.subject,
            topic: recommendation.topic,
            studentId,
            recommendationId: recommendation.id?.toString(),
            aiGenerated: recommendation.aiGenerated,
            autoStart: true,
            resumeExisting: true
          }
        });
      } else if (recommendation.activityType === 'quiz' && recommendation.subject && recommendation.topic) {
        // For quizzes, go to quiz page with parameters
        navigate('/quiz', {
          state: {
            subject: recommendation.subject,
            topic: recommendation.topic,
            gradeLevel,
            studentId,
            recommendationId: recommendation.id?.toString(),
            aiGenerated: recommendation.aiGenerated,
            autoStart: true,
            resumeExisting: true
          }
        });
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
      ) : recommendations[0]?.id?.toString().includes('insufficient-data') ? (
        <div className="p-6 border rounded-lg bg-amber-50">
          <h3 className="text-lg font-medium text-amber-800 mb-2">
            {language === 'id' 
              ? 'Belum Cukup Data untuk Rekomendasi yang Dipersonalisasi' 
              : 'Not Enough Data for Personalized Recommendations'}
          </h3>
          <p className="mb-4 text-amber-700">
            {language === 'id' 
              ? 'Agar sistem AI kami dapat memberikan rekomendasi yang dipersonalisasi, siswa perlu menyelesaikan lebih banyak aktivitas pembelajaran.' 
              : 'For our AI system to provide personalized recommendations, the student needs to complete more learning activities.'}
          </p>
          <div className="flex flex-col space-y-4">
            <Card className="overflow-hidden border-amber-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-amber-800 mb-2">
                  {language === 'id' ? 'Apa yang Harus Dilakukan?' : 'What to do?'}
                </h4>
                <ul className="list-disc list-inside text-amber-700 space-y-1">
                  <li>{language === 'id' ? 'Selesaikan setidaknya 3-5 pelajaran' : 'Complete at least 3-5 lessons'}</li>
                  <li>{language === 'id' ? 'Ambil beberapa kuis untuk mengukur kemajuan' : 'Take some quizzes to measure progress'}</li>
                  <li>{language === 'id' ? 'Jelajahi berbagai mata pelajaran' : 'Explore a variety of subjects'}</li>
                </ul>
                <Button 
                  className="mt-4 bg-amber-600 hover:bg-amber-700 w-full"
                  onClick={() => navigate('/subjects')}
                >
                  {language === 'id' ? 'Mulai Belajar Sekarang' : 'Start Learning Now'}
                </Button>
              </CardContent>
            </Card>
          </div>
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
                  </div>                  {/* Reasoning and Expected Impact sections with enhanced AI indicators */}
                  {rec.reasoning && (
                    <div className={`text-sm mt-3 p-3 rounded-md shadow-sm border ${
                      rec.aiGenerated 
                        ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200' 
                        : 'bg-gradient-to-r from-gray-50 to-purple-50 border-purple-100'
                    }`}>
                      <p className="font-medium text-gray-800 flex items-center">
                        {rec.aiGenerated ? (
                          <Sparkles className="h-4 w-4 mr-1.5 text-purple-600" strokeWidth={2.5} />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-1.5 text-purple-500" strokeWidth={2} />
                        )}
                        {language === 'id' 
                          ? rec.aiGenerated ? 'Analisis AI Personal: Mengapa Direkomendasikan' : 'Analisis: Mengapa Direkomendasikan' 
                          : rec.aiGenerated ? 'Personalized AI Analysis: Why This Is Recommended' : 'Analysis: Why This Is Recommended'}
                      </p>
                      <p className={`mt-1.5 ml-1 ${rec.aiGenerated ? 'text-gray-700' : 'text-gray-600'}`}>
                        {rec.reasoning}
                      </p>
                    </div>
                  )}
                  
                  {rec.expectedImpact && (
                    <div className={`text-sm mt-2.5 p-3 rounded-md shadow-sm border ${
                      rec.aiGenerated 
                        ? 'bg-gradient-to-r from-blue-50 to-cyan-100 border-blue-200' 
                        : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100'
                    }`}>
                      <p className="font-medium flex items-center">
                        {rec.aiGenerated ? (
                          <>
                            <Zap className="h-4 w-4 mr-1.5 text-blue-600" strokeWidth={2.5} />
                            <span className="text-blue-800">
                              {language === 'id' ? 'Analisis AI Personal: Dampak Pembelajaran' : 'Personalized AI Analysis: Learning Impact'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-1.5 text-blue-500" strokeWidth={2} />
                            <span className="text-blue-700">
                              {language === 'id' ? 'Analisis: Dampak Pembelajaran' : 'Analysis: Learning Impact'}
                            </span>
                          </>
                        )}
                      </p>
                      <p className={`mt-1.5 ml-1 ${rec.aiGenerated ? 'text-blue-700' : 'text-blue-600'}`}>
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
