import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { studentProgressService, AIRecommendation } from '@/services/studentProgressService';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { BookOpen, GraduationCap, Lightbulb } from 'lucide-react';

interface RecommendationExtended extends AIRecommendation {
  actions: { label: string; onClick: () => void; }[];
  category: string;
}

interface EnhancedAIRecommendationsProps {
  studentId: string;
  gradeLevel: string;
}

const EnhancedAIRecommendations: React.FC<EnhancedAIRecommendationsProps> = ({ studentId, gradeLevel }) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationExtended | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const { language } = useLanguage();
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!studentId) return;
    
      setIsLoading(true);
      try {
        const data = await studentProgressService.getAIRecommendations(studentId);
        setRecommendations(data);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [studentId]);
  
  const handleTakeAction = (recommendation: AIRecommendation) => {
    const recommendationWithAction: RecommendationExtended = {
      ...recommendation,
      actions: [],
      category: recommendation.recommendation_type,
    };
    
    setSelectedRecommendation(recommendationWithAction);
    setShowActionDialog(true);
  };
  
  const handleCloseDialog = () => {
    setShowActionDialog(false);
    setSelectedRecommendation(null);
  };
  
  const handleRecommendationActedOn = async (recommendationId: string) => {
    try {
      await studentProgressService.markRecommendationAsActedOn(recommendationId);
      
      // Update the recommendations state to reflect the change
      setRecommendations(recommendations.map(rec => 
        rec.id === recommendationId ? { ...rec, acted_on: true } : rec
      ));
      
      toast.success(language === 'id' ? 'Rekomendasi ditandai sebagai ditindaklanjuti' : 'Recommendation marked as acted upon');
    } catch (error) {
      console.error('Error marking recommendation as acted on:', error);
      toast.error(language === 'id' ? 'Gagal menandai rekomendasi' : 'Failed to mark recommendation');
    } finally {
      handleCloseDialog();
    }
  };
  
  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="h-4 w-4 mr-2" />;
      case 'quiz':
        return <GraduationCap className="h-4 w-4 mr-2" />;
      default:
        return <Lightbulb className="h-4 w-4 mr-2" />;
    }
  };
  
  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {language === 'id' ? 'Tidak ada rekomendasi saat ini' : 'No recommendations at this time'}
        </div>
      ) : (
        <div className="grid gap-4">
          {recommendations.map((recommendation) => (
            <Card key={recommendation.id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getRecommendationIcon(recommendation.recommendation_type)}
                  {recommendation.recommendation}
                </CardTitle>
                <CardDescription>
                  {new Date(recommendation.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {language === 'id' ? 'Jenis' : 'Type'}: {recommendation.recommendation_type}
                  </p>
                  {!recommendation.acted_on && (
                    <Button 
                      size="sm" 
                      onClick={() => handleTakeAction(recommendation)}
                    >
                      {language === 'id' ? 'Tindaklanjuti' : 'Take Action'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {showActionDialog && selectedRecommendation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                {getRecommendationIcon(selectedRecommendation.recommendation_type)}
                {selectedRecommendation.recommendation}
              </CardTitle>
              <CardDescription>
                {language === 'id' ? 'Apa yang ingin kamu lakukan?' : 'What would you like to do?'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Button onClick={() => handleRecommendationActedOn(selectedRecommendation.id)}>
                {language === 'id' ? 'Tandai sebagai Selesai' : 'Mark as Done'}
              </Button>
              <Button variant="outline" onClick={handleCloseDialog}>
                {language === 'id' ? 'Batal' : 'Cancel'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnhancedAIRecommendations;
