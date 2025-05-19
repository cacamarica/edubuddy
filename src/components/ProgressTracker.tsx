import React, { useEffect, useState } from 'react';
import { fetchStudentBadges, StudentBadge } from '@/services/badgeService';
import { studentProgressService } from '@/services/studentProgressService';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProgressTrackerProps {
  studentId: string;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ studentId }) => {
  const { t } = useLanguage();
  const [badges, setBadges] = useState<StudentBadge[]>([]);
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const badges = await fetchStudentBadges(studentId);
      setBadges(badges);
      const progress = await studentProgressService.getSubjectProgress(studentId);
      setProgress(progress);
    };
    fetchData();
  }, [studentId]);

  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-bold">{t('footer.trackProgress')}</h3>
        <div className="mt-2">{t('lesson.completed')}: {progress ? progress.length : 0}</div>
        <div className="mt-2">{t('quiz.scores')}: {/* TODO: Show quiz scores */}</div>
        <div className="mt-2">{t('quiz.streaks')}: {/* TODO: Show streaks */}</div>
        <div className="mt-2">{t('badge.earned')}: {badges.length}</div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker; 