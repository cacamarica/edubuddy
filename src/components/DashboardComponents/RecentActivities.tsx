import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { studentProgressService, LearningActivity, StudentBadge } from '@/services/studentProgressService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';
import { BookOpen, PencilRuler, Gamepad, Award } from 'lucide-react';
import CustomBadge from '@/components/Badge';

interface RecentActivitiesProps {
  studentId: string;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ studentId }) => {
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [badges, setBadges] = useState<StudentBadge[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);
  const { language } = useLanguage();
  
  useEffect(() => {
    const fetchActivities = async () => {
      if (!studentId) return;
      
      setIsLoadingActivities(true);
      const data = await studentProgressService.getLearningActivities(studentId, 5);
      
      // Remove duplicate activities by keeping the most recent one for each topic
      const uniqueActivities = data.reduce((acc: LearningActivity[], current) => {
        const existingIndex = acc.findIndex(item => 
          item.activity_type === current.activity_type && 
          item.topic === current.topic && 
          item.subject === current.subject
        );
        
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          // Replace if current is more recent
          const existing = acc[existingIndex];
          const currentDate = new Date(current.last_interaction_at || '');
          const existingDate = new Date(existing.last_interaction_at || '');
          
          if (currentDate > existingDate) {
            acc[existingIndex] = current;
          }
        }
        
        return acc;
      }, []);
      
      // Sort by most recent first
      uniqueActivities.sort((a, b) => {
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
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'quiz':
        return <PencilRuler className="h-4 w-4 text-purple-500" />;
      case 'game':
        return <Gamepad className="h-4 w-4 text-green-500" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };
  
  const getActivityTypeText = (type: string) => {
    if (language === 'id') {
      switch (type) {
        case 'lesson': return 'Belajar';
        case 'quiz': return 'Kuis';
        case 'game': return 'Permainan';
        default: return type;
      }
    } else {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return format(date, language === 'id' ? 'dd MMM yyyy' : 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{language === 'id' ? 'Aktivitas Terbaru' : 'Recent Activities'}</CardTitle>
          <CardDescription>
            {language === 'id' ? 'Aktivitas pembelajaran terakhir' : 'Recent learning activities'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingActivities ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium">{activity.topic}</p>
                      <Badge variant="outline" className="text-xs">
                        {getActivityTypeText(activity.activity_type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.subject}</p>
                    {activity.progress !== undefined && (
                      <p className="text-xs mt-1">
                        {language === 'id' ? 'Kemajuan: ' : 'Progress: '}
                        {activity.progress}%
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(activity.last_interaction_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'id' 
                ? 'Belum ada aktivitas. Mulai belajar untuk melihat aktivitas di sini!' 
                : 'No activities yet. Start learning to see activities here!'}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <CardTitle>{language === 'id' ? 'Lencana' : 'Badges'}</CardTitle>
          </div>
          <CardDescription>
            {language === 'id' ? 'Lencana yang telah diperoleh' : 'Earned badges'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingBadges ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : badges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {badges.map((studentBadge) => (
                <div 
                  key={studentBadge.id} 
                  className="flex flex-col items-center text-center p-2 border rounded-lg"
                >
                  {studentBadge.badge?.image_url ? (
                    <CustomBadge
                      name={studentBadge.badge.name}
                      imageUrl={studentBadge.badge.image_url}
                      className="mb-2"
                    />
                  ) : (
                    <CustomBadge
                      type="trophy"
                      name={studentBadge.badge?.name || 'Badge'}
                      className="bg-eduPastel-purple text-eduPurple"
                    />
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(studentBadge.earned_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'id' 
                ? 'Belum ada lencana. Selesaikan aktivitas untuk mendapatkan lencana!' 
                : 'No badges yet. Complete activities to earn badges!'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecentActivities;
