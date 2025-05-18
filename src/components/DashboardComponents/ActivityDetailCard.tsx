
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Book, Check, Clock, Award, Star, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { LearningActivity } from '@/services/studentProgressService';

interface ActivityDetailCardProps {
  activity: LearningActivity;
}

const ActivityDetailCard: React.FC<ActivityDetailCardProps> = ({ activity }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const isCompleted = activity.completed || activity.progress === 100;
  
  // Calculate the formatted date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', options);
  };
  
  // Handle continue or view activity
  const handleActivityAction = () => {
    if (activity.activity_type === 'quiz') {
      navigate(`/quiz?subject=${activity.subject}&topic=${activity.topic}`);
    } else if (activity.activity_type === 'lesson') {
      navigate(`/lessons?subject=${activity.subject}&topic=${activity.topic}`);
    }
  };
  
  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          {/* Activity Info */}
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <div className={`rounded-full p-1 mr-2 ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                {isCompleted ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <h3 className="font-medium">
                {activity.subject} - {activity.topic}
              </h3>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <Book className="h-3 w-3 mr-1" />
              <span>
                {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
              </span>
              <span className="mx-2">•</span>
              <span>{formatDate(activity.last_interaction_at)}</span>
            </div>
            
            {/* Progress indicators */}
            {typeof activity.progress === 'number' && (
              <div className="flex items-center">
                <div className="w-full max-w-[200px] h-2 bg-gray-100 rounded-full mr-2">
                  <div 
                    className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${activity.progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{activity.progress}%</span>
              </div>
            )}
            
            {/* Stars earned if available */}
            {activity.stars_earned && activity.stars_earned > 0 && (
              <div className="flex items-center mt-1">
                <Award className="h-3.5 w-3.5 mr-1 text-yellow-500" />
                <span className="text-xs">
                  {language === 'id' ? 'Bintang diperoleh: ' : 'Stars earned: '}
                  <span className="font-medium">{activity.stars_earned}</span>
                </span>
              </div>
            )}
          </div>
          
          {/* Action button */}
          <Button 
            variant={isCompleted ? "outline" : "default"}
            size="sm"
            className="mt-3 sm:mt-0"
            onClick={handleActivityAction}
          >
            {isCompleted ? (
              <>
                {language === 'id' ? 'Lihat Kembali' : 'Review'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                {language === 'id' ? 'Lanjutkan' : 'Continue'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
        
        {/* Completion details if activity is completed */}
        {isCompleted && activity.completed_at && (
          <div className="px-4 py-2 bg-gray-50 border-t">
            <div className="flex items-center text-xs text-muted-foreground">
              <Check className="h-3 w-3 mr-1 text-green-500" />
              <span>
                {language === 'id' ? 'Selesai pada: ' : 'Completed on: '}
                {formatDate(activity.completed_at)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityDetailCard;
