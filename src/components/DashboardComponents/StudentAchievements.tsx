import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import { 
  Award, 
  Star, 
  CheckCircle2, 
  Trophy, 
  BookOpen, 
  Medal, 
  Target, 
  Brain, 
  Flame, 
  Zap,
  Lock
} from 'lucide-react';
import { studentProgressService, LearningActivity } from '@/services/studentProgressService';
import { badgeService, StudentBadge } from '@/services/badgeService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StudentAchievementsProps {
  studentId: string;
}

// Predefined achievement badges - all possible achievements a student could earn
const PREDEFINED_BADGES = [
  {
    id: 'first-quiz',
    name: 'First Quiz',
    description: 'Completed your first quiz',
    type: 'quiz',
    icon: <BookOpen className="w-6 h-6" />
  },
  {
    id: 'quiz-starter',
    name: 'Quiz Starter',
    description: 'Completed 5 quizzes',
    type: 'quiz',
    icon: <CheckCircle2 className="w-6 h-6" />
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    description: 'Achieved perfect score on 3 quizzes',
    type: 'quiz',
    icon: <Trophy className="w-6 h-6" />
  },
  {
    id: 'streak-week',
    name: 'Weekly Streak',
    description: 'Studied for 7 consecutive days',
    type: 'streak',
    icon: <Flame className="w-6 h-6" />
  },
  {
    id: 'streak-month',
    name: 'Monthly Achiever',
    description: 'Studied for 30 consecutive days',
    type: 'streak',
    icon: <Zap className="w-6 h-6" />
  },
  {
    id: 'subject-explorer',
    name: 'Subject Explorer',
    description: 'Studied 3 different subjects',
    type: 'subject',
    icon: <Target className="w-6 h-6" />
  },
  {
    id: 'math-wizard',
    name: 'Math Wizard',
    description: 'Completed 10 math activities',
    type: 'subject',
    icon: <Brain className="w-6 h-6" />
  },
  {
    id: 'science-explorer',
    name: 'Science Explorer',
    description: 'Completed 10 science activities',
    type: 'subject',
    icon: <Star className="w-6 h-6" />
  },
  {
    id: 'perfect-score',
    name: 'Perfect Score',
    description: 'Got 100% on a difficult quiz',
    type: 'achievement',
    icon: <Medal className="w-6 h-6" />
  }
];

const StudentAchievements: React.FC<StudentAchievementsProps> = ({ studentId }) => {
  const [earnedBadges, setEarnedBadges] = useState<StudentBadge[]>([]);
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const { language } = useLanguage();
  
  // Function to determine if a badge should be earned based on activities
  const calculateEarnedBadges = () => {
    // Keep track of which badges should be earned based on real data
    const earnedBadgeIds = new Set<string>();
    
    // Count metrics
    const quizCount = activities.filter(a => a.activity_type === 'quiz').length;
    const perfectQuizCount = activities.filter(a => a.activity_type === 'quiz' && a.progress === 100).length;
    const mathActivities = activities.filter(a => a.subject?.toLowerCase().includes('math')).length;
    const scienceActivities = activities.filter(a => a.subject?.toLowerCase().includes('science')).length;
    
    // Count unique subjects
    const uniqueSubjects = new Set<string>();
    activities.forEach(a => {
      if (a.subject) {
        uniqueSubjects.add(a.subject.toLowerCase());
      }
    });
    
    // First Quiz badge
    if (quizCount >= 1) {
      earnedBadgeIds.add('first-quiz');
    }
    
    // Quiz Starter badge
    if (quizCount >= 5) {
      earnedBadgeIds.add('quiz-starter');
    }
    
    // Quiz Master badge
    if (perfectQuizCount >= 3) {
      earnedBadgeIds.add('quiz-master');
    }
    
    // Subject Explorer badge
    if (uniqueSubjects.size >= 3) {
      earnedBadgeIds.add('subject-explorer');
    }
    
    // Math Wizard badge
    if (mathActivities >= 10) {
      earnedBadgeIds.add('math-wizard');
    }
    
    // Science Explorer badge
    if (scienceActivities >= 10) {
      earnedBadgeIds.add('science-explorer');
    }
    
    // Perfect Score badge
    if (perfectQuizCount >= 1) {
      earnedBadgeIds.add('perfect-score');
    }
    
    return earnedBadgeIds;
  };
  
  useEffect(() => {
    const loadData = async () => {
      if (!studentId) return;
      
      setIsLoadingBadges(true);
      setIsLoadingActivities(true);
      
      try {
        // Load badges
        const badgeData = await badgeService.fetchStudentBadges(studentId);
        setEarnedBadges(badgeData);
        
        // Load activities to calculate earned badges
        const activityData = await studentProgressService.getLearningActivities(studentId);
        setActivities(activityData);
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setIsLoadingBadges(false);
        setIsLoadingActivities(false);
      }
    };
    
    loadData();
  }, [studentId]);
  
  // Function to check if a badge has been earned
  const isBadgeEarned = (badgeId: string) => {
    // Check if the badge is in the database
    const storedBadge = earnedBadges.some(badge => 
      badge.badge?.name === badgeId || badge.badge?.id === badgeId
    );
    
    // Also check if the badge should be earned based on activities
    const calculatedEarnedBadges = calculateEarnedBadges();
    const shouldBeEarned = calculatedEarnedBadges.has(badgeId);
    
    return storedBadge || shouldBeEarned;
  };
  
  if (isLoadingBadges || isLoadingActivities) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          {language === 'id' ? 'Lencana Prestasi' : 'Achievement Badges'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 place-items-center">
          {PREDEFINED_BADGES.map((badge) => {
            const isEarned = isBadgeEarned(badge.id);
            
            return (
              <TooltipProvider key={badge.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="flex flex-col items-center text-center space-y-2 relative"
                    >
                      <div 
                        className={`flex items-center justify-center w-16 h-16 rounded-full border-2 
                          ${isEarned 
                            ? 'bg-amber-100 border-amber-300 text-amber-700' 
                            : 'bg-gray-100 border-gray-200 text-gray-400 opacity-50'
                          }`}
                      >
                        {isEarned ? badge.icon : <Lock className="w-5 h-5" />}
                      </div>
                      <p className={`text-sm font-medium ${isEarned ? '' : 'text-gray-500'}`}>
                        {badge.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isEarned ? 
                          (earnedBadges.find(b => b.badge?.name === badge.id || b.badge?.id === badge.id)?.earned_at ?
                            new Date(earnedBadges.find(b => b.badge?.name === badge.id || b.badge?.id === badge.id)?.earned_at || '').toLocaleDateString() :
                            language === 'id' ? 'Diperoleh' : 'Earned') :
                          language === 'id' ? 'Belum diperoleh' : 'Locked'}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{badge.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentAchievements;
