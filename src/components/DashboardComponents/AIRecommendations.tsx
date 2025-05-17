
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <CardTitle>{language === 'id' ? 'Rekomendasi AI' : 'AI Recommendations'}</CardTitle>
        </div>
        <CardDescription>
          {language === 'id' ? 'Saran pembelajaran berdasarkan aktivitas siswa' : 'Personalized learning suggestions based on student activity'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Spinner size="lg" />
          </div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div 
                key={rec.id} 
                className={`p-4 rounded-lg border ${rec.acted_on ? 'bg-gray-50' : 'bg-eduPastel-purple'}`}
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
        
        {/* Show an example recommendation if no real ones exist */}
        {!isLoading && recommendations.length === 0 && (
          <div className="mt-6 p-4 rounded-lg border border-dashed border-gray-300">
            <h4 className="font-medium text-sm mb-2">{language === 'id' ? 'Contoh Rekomendasi' : 'Example Recommendation'}</h4>
            <div className="flex gap-3 items-start">
              <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                {language === 'id' 
                  ? 'Berdasarkan aktivitas pembelajaran, kami sarankan untuk berlatih lebih banyak soal Matematika tentang Perkalian.' 
                  : 'Based on learning activities, we recommend practicing more Math problems about Multiplication.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIRecommendations;
