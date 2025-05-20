import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Spinner } from '@/components/ui/spinner';
import { Book, Calculator, Beaker, Globe, PenTool, Puzzle, Brain, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SubjectProgressChartProps {
  subjectProgress: any[];
  isLoading: boolean;
  language: string;
}

// Map subjects to their corresponding icons
const SubjectIcon = ({ subject }: { subject: string }) => {
  const iconProps = { className: "h-5 w-5 mr-3", strokeWidth: 2 };
  
  switch (subject.toLowerCase()) {
    case 'math':
      return <Calculator {...iconProps} />;
    case 'science':
      return <Beaker {...iconProps} />;
    case 'social studies':
    case 'history':
    case 'geography':
      return <Globe {...iconProps} />;
    case 'language':
    case 'english':
    case 'literature':
      return <BookOpen {...iconProps} />;
    case 'arts':
      return <PenTool {...iconProps} />;
    case 'logic':
    case 'puzzles':
      return <Puzzle {...iconProps} />;
    case 'critical thinking':
      return <Brain {...iconProps} />;
    default:
      return <Book {...iconProps} />;
  }
};

// Get color based on progress percentage
const getProgressColor = (progress: number) => {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 60) return 'bg-emerald-500';
  if (progress >= 40) return 'bg-yellow-500';
  if (progress >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

const SubjectProgressChart: React.FC<SubjectProgressChartProps> = ({ subjectProgress, isLoading, language }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // Format data for the chart
  const chartData = subjectProgress.map(subject => ({
    subject: subject.subject,
    progress: subject.progress,
  }));

  return (
    <div className="w-full space-y-5">
      {chartData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'id' ? 'Grafik Kemajuan' : 'Progress Chart'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar 
                    dataKey="progress" 
                    fill="#8884d8" 
                    name={language === 'id' ? 'Kemajuan (%)' : 'Progress (%)'}
                    label={{ position: 'top', formatter: (value: number) => `${value}%` }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'id' ? 'Grafik Kemajuan' : 'Progress Chart'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-40">
              <p className="text-muted-foreground">
                {language === 'id' ? 'Belum ada data kemajuan mata pelajaran.' : 'No subject progress data yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* List View of Subject Progress with Icons */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'id' ? 'Detail Kemajuan Mata Pelajaran' : 'Subject Progress Details'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {chartData.length > 0 ? (
              chartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center">
                    <SubjectIcon subject={item.subject} />
                    <span className="font-medium">{item.subject}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressColor(item.progress)}`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="font-semibold w-12 text-right">{item.progress}%</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">
                {language === 'id' ? 'Belum ada data kemajuan.' : 'No progress data available.'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubjectProgressChart;
