import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { studentProgressService, LearningActivity } from '@/services/studentProgressService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import PaginatedActivities from './PaginatedActivities';

interface RecentActivitiesProps {
  studentId: string;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ studentId }) => {
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const { language } = useLanguage();
  
  useEffect(() => {
    const fetchActivities = async () => {
      if (!studentId) return;
      
      setIsLoadingActivities(true);
      const data = await studentProgressService.getLearningActivities(studentId); // Fixed parameter count
      
      // Process to remove duplicates
      const uniqueActivitiesMap = new Map<string, LearningActivity>();
      
      data.forEach(activity => {
        // Create a unique key for this activity
        const activityKey = `${activity.activity_type}-${activity.subject}-${activity.topic}`;
        
        if (!uniqueActivitiesMap.has(activityKey)) {
          uniqueActivitiesMap.set(activityKey, activity);
        } else {
          // If this activity already exists, keep the more recent one
          const existingActivity = uniqueActivitiesMap.get(activityKey)!;
          const existingDate = new Date(existingActivity.last_interaction_at || '');
          const currentDate = new Date(activity.last_interaction_at || '');
          
          if (currentDate > existingDate) {
            uniqueActivitiesMap.set(activityKey, activity);
          }
        }
      });
      
      // Convert map values back to array and sort by date
      const uniqueActivities = Array.from(uniqueActivitiesMap.values())
        .sort((a, b) => {
          const dateA = new Date(a.last_interaction_at || '');
          const dateB = new Date(b.last_interaction_at || '');
          return dateB.getTime() - dateA.getTime();
        });
      
      setActivities(uniqueActivities);
      setIsLoadingActivities(false);
    };
    
    fetchActivities();
  }, [studentId]);
  
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{language === 'id' ? 'Aktivitas Pembelajaran' : 'Learning Activities'}</CardTitle>
          <CardDescription>
            {language === 'id' ? 'Riwayat pembelajaran siswa' : 'Learning history of the student'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaginatedActivities 
            activities={activities} 
            isLoading={isLoadingActivities}
            pageSize={5}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default RecentActivities;
