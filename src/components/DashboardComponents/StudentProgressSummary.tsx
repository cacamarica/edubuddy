
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { studentProgressService, StudentProgress } from '@/services/studentProgressService';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';

interface StudentProgressSummaryProps {
  studentId: string;
}

const COLORS = ['#845EF7', '#FF6B6B', '#4D9DE0', '#33A1FD', '#22B8CF', '#51CF66'];

const StudentProgressSummary: React.FC<StudentProgressSummaryProps> = ({ studentId }) => {
  const [progressData, setProgressData] = useState<StudentProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();
  
  useEffect(() => {
    const fetchProgress = async () => {
      setIsLoading(true);
      const data = await studentProgressService.getSubjectProgress(studentId);
      setProgressData(data);
      setIsLoading(false);
    };
    
    if (studentId) {
      fetchProgress();
    }
  }, [studentId]);
  
  // Process data for chart
  const chartData = progressData.map((item, index) => ({
    name: item.subject,
    value: item.progress,
    color: COLORS[index % COLORS.length]
  }));
  
  // Calculate overall progress
  const overallProgress = progressData.length > 0 
    ? Math.round(progressData.reduce((sum, item) => sum + item.progress, 0) / progressData.length) 
    : 0;
    
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{language === 'id' ? 'Ringkasan Kemajuan' : 'Progress Summary'}</CardTitle>
        <CardDescription>
          {language === 'id' ? 'Kemajuan belajar berdasarkan mata pelajaran' : 'Learning progress by subject'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Spinner size="lg" />
          </div>
        ) : progressData.length > 0 ? (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {language === 'id' ? 'Kemajuan Keseluruhan' : 'Overall Progress'}
                </span>
                <span className="text-sm font-bold">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
            
            <div className="grid gap-4">
              {progressData.map((subject) => (
                <div key={subject.id} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{subject.subject}</span>
                    <span className="text-sm">{subject.progress}%</span>
                  </div>
                  <Progress value={subject.progress} className="h-2" />
                </div>
              ))}
            </div>
            
            {progressData.length >= 2 && (
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {language === 'id' 
              ? 'Belum ada data kemajuan. Mulai belajar untuk melihat perkembangan!' 
              : 'No progress data yet. Start learning to see your progress!'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentProgressSummary;
