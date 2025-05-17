import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { studentProgressService, LearningActivity, StudentBadge } from '@/services/studentProgressService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import PaginatedActivities from './PaginatedActivities';
import PaginatedBadges from './PaginatedBadges';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RecentActivitiesProps {
  studentId: string;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ studentId }) => {
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [badges, setBadges] = useState<StudentBadge[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('activities');
  
  useEffect(() => {
    const fetchActivities = async () => {
      if (!studentId) return;
      
      setIsLoadingActivities(true);
      const data = await studentProgressService.getLearningActivities(studentId, 20); // Get more activities for pagination
      
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
    
    const fetchBadges = async () => {
      if (!studentId) return;
      
      setIsLoadingBadges(true);
      const data = await studentProgressService.getStudentBadges(studentId);
      setBadges(data);
      setIsLoadingBadges(false);
    };
    
    fetchActivities();
    fetchBadges();
  }, [studentId]);
  
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{language === 'id' ? 'Aktivitas & Pencapaian' : 'Activities & Achievements'}</CardTitle>
          <CardDescription>
            {language === 'id' ? 'Riwayat pembelajaran dan pencapaian siswa' : 'Learning history and student achievements'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="activities">
                {language === 'id' ? 'Aktivitas' : 'Activities'}
              </TabsTrigger>
              <TabsTrigger value="badges">
                {language === 'id' ? 'Lencana' : 'Badges'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="activities">
              <PaginatedActivities 
                activities={activities} 
                isLoading={isLoadingActivities}
                pageSize={5}
              />
            </TabsContent>
            
            <TabsContent value="badges">
              <PaginatedBadges 
                badges={badges} 
                isLoading={isLoadingBadges}
                pageSize={6}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecentActivities;
