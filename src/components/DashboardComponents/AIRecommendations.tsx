
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb, CheckCircle, ArrowRight } from 'lucide-react';
import { studentProgressService, AIRecommendation } from '@/services/studentProgressService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import { useNavigate } from 'react-router-dom';

interface AIRecommendationsProps {
  studentId: string;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ studentId }) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      const data = await studentProgressService.getAIRecommendations(studentId);
      setRecommendations(data);
      setIsLoading(false);
      
      // Mark all as read
      for (const rec of data) {
        if (rec.id && !rec.read) {
          await studentProgressService.markRecommendationAsRead(rec.id);
        }
      }
    };
    
    if (studentId) {
      fetchRecommendations();
    }
  }, [studentId]);
  
  const handleRecommendationAction = async (rec: AIRecommendation, navigationPath?: string) => {
    if (rec.id) {
      await studentProgressService.markRecommendationAsActedOn(rec.id);
      
      // Update the local state
      setRecommendations(prevRecs => 
        prevRecs.map(item => 
          item.id === rec.id ? { ...item, acted_on: true } : item
        )
      );
    }
    
    // Navigate if path provided
    if (navigationPath) {
      navigate(navigationPath);
    }
  };
    
  // If there are no real recommendations, create some examples
  const ensureRecommendations = () => {
    if (recommendations.length === 0 && !isLoading) {
      // Create mock recommendations for demonstration
      const mockRecommendations = [
        {
          id: 'mock-1',
          student_id: studentId,
          recommendation_type: 'topic_suggestion',
          recommendation: language === 'id' 
            ? 'Berdasarkan aktivitas belajarmu, kami sarankan untuk berlatih soal Matematika tentang Perkalian.' 
            : 'Based on your learning activity, we recommend practicing Math problems on Multiplication.',
          created_at: new Date().toISOString(),
          read: true,
          acted_on: false
        },
        {
          id: 'mock-2',
          student_id: studentId,
          recommendation_type: 'practice_suggestion',
          recommendation: language === 'id'
            ? 'Sepertinya kamu perlu lebih banyak latihan di pelajaran IPA tentang Tata Surya.'
            : 'It seems you need more practice in Science about the Solar System.',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          read: true,
          acted_on: false
        },
        {
          id: 'mock-3',
          student_id: studentId,
          recommendation_type: 'topic_suggestion',
          recommendation: language === 'id'
            ? 'Kami melihat kemajuan yang bagus di pelajaran Bahasa Inggris! Coba lanjutkan dengan mempelajari topik "Simple Past Tense".'
            : 'We see good progress in your English learning! Try continuing with the "Simple Past Tense" topic.',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          read: true,
          acted_on: false
        }
      ];
      
      return mockRecommendations;
    }
    
    return recommendations;
  };
  
  const displayRecommendations = ensureRecommendations();

  return (
    <div className="h-full">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-medium">{language === 'id' ? 'Rekomendasi AI' : 'AI Recommendations'}</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {language === 'id' ? 'Saran pembelajaran berdasarkan aktivitas siswa' : 'Personalized learning suggestions based on student activity'}
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Spinner size="lg" />
        </div>
      ) : displayRecommendations.length > 0 ? (
        <div className="space-y-4">
          {displayRecommendations.map((rec) => (
            <div 
              key={rec.id} 
              className={`p-4 rounded-lg border ${rec.acted_on ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}
            >
              <div className="flex gap-3 items-start">
                {rec.acted_on ? (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-2 flex-1">
                  <p className={rec.acted_on ? 'text-muted-foreground' : ''}>{rec.recommendation}</p>
                  
                  {!rec.acted_on && rec.recommendation_type === 'topic_suggestion' && (
                    <Button 
                      size="sm" 
                      className="w-full sm:w-auto mt-2"
                      onClick={() => handleRecommendationAction(rec, '/ai-learning')}
                    >
                      {language === 'id' ? 'Mulai Pelajaran' : 'Start Lesson'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  
                  {!rec.acted_on && rec.recommendation_type === 'practice_suggestion' && (
                    <Button 
                      size="sm" 
                      className="w-full sm:w-auto mt-2"
                      onClick={() => handleRecommendationAction(rec, '/quiz')}
                    >
                      {language === 'id' ? 'Latihan Soal' : 'Practice Quiz'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          {language === 'id' 
            ? 'Belum ada rekomendasi. Lanjutkan pembelajaran untuk mendapatkan saran yang dipersonalisasi!' 
            : 'No recommendations yet. Continue learning to get personalized suggestions!'}
        </div>
      )}
    </div>
  );
};

export default AIRecommendations;
