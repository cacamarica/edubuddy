
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import PaginatedBadges from './PaginatedBadges';
import { fetchStudentBadges, StudentBadge } from '@/services/badgeService';

interface StudentAchievementsProps {
  studentId: string;
}

const StudentAchievements: React.FC<StudentAchievementsProps> = ({ studentId }) => {
  const [badges, setBadges] = useState<StudentBadge[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);
  const { language } = useLanguage();
  
  useEffect(() => {
    const loadBadges = async () => {
      if (!studentId) return;
      
      setIsLoadingBadges(true);
      try {
        const data = await fetchStudentBadges(studentId);
        setBadges(data);
      } catch (error) {
        console.error("Error fetching badges:", error);
      } finally {
        setIsLoadingBadges(false);
      }
    };
    
    loadBadges();
  }, [studentId]);
  
  return (
    <div className="grid gap-6">
      {isLoadingBadges ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <PaginatedBadges 
          badges={badges} 
          isLoading={false}
        />
      )}
    </div>
  );
};

export default StudentAchievements;
