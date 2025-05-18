
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Spinner } from '@/components/ui/spinner';

interface SubjectProgressChartProps {
  subjectProgress: any[];
  isLoading: boolean;
  language: string;
}

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
    <div className="w-full">
      {chartData.length > 0 ? (
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
      ) : (
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">
            {language === 'id' ? 'Belum ada data kemajuan mata pelajaran.' : 'No subject progress data yet.'}
          </p>
        </div>
      )}
      
      {/* List View of Subject Progress */}
      <div className="mt-8 space-y-4">
        <h4 className="font-semibold text-lg">
          {language === 'id' ? 'Detail Kemajuan Mata Pelajaran' : 'Subject Progress Details'}
        </h4>
        <div className="space-y-3">
          {chartData.length > 0 ? (
            chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                <span className="font-medium">{item.subject}</span>
                <div className="flex items-center gap-4">
                  <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        item.progress >= 70 ? 'bg-green-500' : 
                        item.progress >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="font-semibold w-10 text-right">{item.progress}%</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">
              {language === 'id' ? 'Belum ada data kemajuan.' : 'No progress data available.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectProgressChart;
