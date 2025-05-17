
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { studentProgressService, StudentBadge } from '@/services/studentProgressService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import PaginatedBadges from './PaginatedBadges';

interface StudentAchievementsProps {
  studentId: string;
}

const StudentAchievements: React.FC<StudentAchievementsProps> = ({ studentId }) => {
  const [badges, setBadges] = useState<StudentBadge[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);
  const { language } = useLanguage();
  
  useEffect(() => {
    const fetchBadges = async () => {
      if (!studentId) return;
      
      setIsLoadingBadges(true);
      const data = await studentProgressService.getStudentBadges(studentId);
      setBadges(data);
      setIsLoadingBadges(false);
    };
    
    fetchBadges();
  }, [studentId]);
  
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{language === 'id' ? 'Pencapaian' : 'Achievements'}</CardTitle>
          <CardDescription>
            {language === 'id' ? 'Lencana yang diperoleh siswa' : 'Badges earned by the student'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaginatedBadges 
            badges={badges} 
            isLoading={isLoadingBadges}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAchievements;
