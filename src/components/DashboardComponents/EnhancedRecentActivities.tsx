import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { studentProgressService, LearningActivity } from '@/services/studentProgressService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  PlayCircle, 
  Calculator,
  FlaskConical,
  Atom,
  Globe,
  Code,
  Languages,
  Music,
  Palette,
  GraduationCap,
  FileText
} from 'lucide-react';

interface EnhancedRecentActivitiesProps {
  studentId: string;
}

// Map subject names to icons
const getSubjectIcon = (subject: string) => {
  const s = subject?.toLowerCase() || '';
  if (s.includes('math')) return Calculator;
  if (s.includes('english') || s.includes('language')) return BookOpen;
  if (s.includes('science')) return FlaskConical;
  if (s.includes('chemistry')) return FlaskConical;
  if (s.includes('physics')) return Atom;
  if (s.includes('geography') || s.includes('world')) return Globe;
  if (s.includes('computer')) return Code;
  if (s.includes('foreign') || s.includes('language')) return Languages;
  if (s.includes('music')) return Music;
  if (s.includes('art')) return Palette;
  if (s.includes('social') || s.includes('history')) return GraduationCap;
  
  // Default icon if no match
  return FileText;
};

// Get activity type icon
const getActivityTypeIcon = (activityType: string) => {
  switch (activityType.toLowerCase()) {
    case 'lesson':
      return BookOpen;
    case 'quiz':
      return FileText;
    default:
      return Clock;
  }
};

const EnhancedRecentActivities: React.FC<EnhancedRecentActivitiesProps> = ({ studentId }) => {
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const pageSize = 5;
  
  useEffect(() => {
    const fetchActivities = async () => {
      if (!studentId) return;
      
      setIsLoading(true);
      try {
        const data = await studentProgressService.getLearningActivities(studentId);
        
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
      } catch (error) {
        console.error("Error fetching learning activities:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActivities();
  }, [studentId]);
  
  const totalPages = Math.ceil(activities.length / pageSize);
  const currentActivities = activities.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
  const handleContinueActivity = (activity: LearningActivity) => {
    navigate('/ai-learning', {
      state: {
        gradeLevel: 'k-3', // This should be dynamic based on student data
        subject: activity.subject,
        topic: activity.topic,
        studentId,
        autoStart: true,
        isNewLesson: false,
        continueFromProgress: activity.progress || 0
      }
    });
  };
  
  // Format date string to localized format
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <CardHeader className="px-0 pt-0">
        <CardTitle>{language === 'id' ? 'Aktivitas Pembelajaran' : 'Learning Activities'}</CardTitle>
        <CardDescription>
          {language === 'id' ? 'Riwayat pembelajaran siswa' : 'Learning history of the student'}
        </CardDescription>
      </CardHeader>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Spinner size="md" />
        </div>
      ) : currentActivities.length > 0 ? (
        <div className="space-y-4">
          {currentActivities.map((activity, index) => {
            const ActivityIcon = getActivityTypeIcon(activity.activity_type);
            const SubjectIcon = getSubjectIcon(activity.subject);
            const isCompleted = activity.completed || activity.progress === 100;
            
            return (
              <Card key={activity.id || index} className={`overflow-hidden ${isCompleted ? 'border-green-200' : ''}`}>
                <div className="grid grid-cols-[64px_1fr] h-full">
                  <div className={`flex items-center justify-center ${
                    activity.activity_type === 'quiz' ? 'bg-amber-100' : 
                    activity.activity_type === 'lesson' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <SubjectIcon className={`h-6 w-6 ${
                      activity.activity_type === 'quiz' ? 'text-amber-600' : 
                      activity.activity_type === 'lesson' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <ActivityIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-xs font-medium uppercase text-gray-500">
                          {activity.activity_type === 'quiz' ? (language === 'id' ? 'Kuis' : 'Quiz') : 
                           activity.activity_type === 'lesson' ? (language === 'id' ? 'Pelajaran' : 'Lesson') : 
                           activity.activity_type}
                        </span>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            {language === 'id' ? 'Selesai' : 'Completed'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(activity.last_interaction_at)}</span>
                    </div>
                    
                    <h4 className="font-semibold mb-1">{activity.subject}</h4>
                    <p className="text-sm text-gray-600 mb-3">{activity.topic}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-grow">
                        <div className="h-2 bg-gray-200 rounded-full w-full max-w-32">
                          <div 
                            className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} 
                            style={{ width: `${activity.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">{activity.progress || 0}%</span>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="ml-2"
                        onClick={() => handleContinueActivity(activity)}
                      >
                        {isCompleted ? 
                          (language === 'id' ? 'Lihat Kembali' : 'Review') : 
                          (language === 'id' ? 'Lanjutkan' : 'Continue')
                        }
                        <PlayCircle className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                {language === 'id' ? 'Sebelumnya' : 'Previous'}
              </Button>
              <div className="flex items-center text-sm">
                <span className="mx-2">
                  {language === 'id' 
                    ? `Halaman ${currentPage} dari ${totalPages}` 
                    : `Page ${currentPage} of ${totalPages}`}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                {language === 'id' ? 'Selanjutnya' : 'Next'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          {language === 'id' 
            ? 'Belum ada aktivitas pembelajaran. Mulailah belajar untuk melihat kemajuan di sini!' 
            : 'No learning activities yet. Start learning to see your progress here!'}
        </div>
      )}
    </div>
  );
};

export default EnhancedRecentActivities;
