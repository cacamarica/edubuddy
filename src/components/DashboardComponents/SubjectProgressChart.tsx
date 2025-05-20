import React, { useState, useCallback } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, TooltipProps } from 'recharts';
import { Spinner } from '@/components/ui/spinner';
import { 
  Book, 
  Calculator, 
  Beaker, 
  Globe, 
  PenTool, 
  Puzzle, 
  Brain, 
  BookOpen,
  GraduationCap,
  Code,
  Music,
  FlaskConical,
  HeartPulse
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import useLearningGradeLevel from '@/hooks/useLearningGradeLevel';

interface SubjectProgressChartProps {
  subjectProgress: any[];
  isLoading: boolean;
  language: string;
}

// Map subjects to their corresponding icons
const SubjectIcon = ({ subject }: { subject: string }) => {
  const iconProps = { className: "h-5 w-5 mr-3", strokeWidth: 2 };
  const s = subject.toLowerCase();
  
  if (s.includes('math') || s.includes('algebra') || s.includes('geometry')) {
    return <Calculator {...iconProps} />;
  }
  if (s.includes('science') || s.includes('biology')) {
    return <FlaskConical {...iconProps} />;
  }
  if (s.includes('physics') || s.includes('chemistry')) {
    return <Beaker {...iconProps} />;
  }
  if (s.includes('social') || s.includes('history')) {
    return <GraduationCap {...iconProps} />;
  }
  if (s.includes('geography') || s.includes('world')) {
    return <Globe {...iconProps} />;
  }
  if (s.includes('language') || s.includes('english') || s.includes('literature') || s.includes('reading')) {
    return <BookOpen {...iconProps} />;
  }
  if (s.includes('art') || s.includes('drawing') || s.includes('painting')) {
    return <PenTool {...iconProps} />;
  }
  if (s.includes('computer') || s.includes('programming') || s.includes('coding')) {
    return <Code {...iconProps} />;
  }
  if (s.includes('music')) {
    return <Music {...iconProps} />;
  }
  if (s.includes('logic') || s.includes('puzzles')) {
    return <Puzzle {...iconProps} />;
  }
  if (s.includes('health')) {
    return <HeartPulse {...iconProps} />;
  }
  if (s.includes('critical')) {
    return <Brain {...iconProps} />;
  }
  
  // Default
  return <Book {...iconProps} />;
};

// Get color based on progress percentage
const getProgressColor = (progress: number) => {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 60) return 'bg-emerald-500';
  if (progress >= 40) return 'bg-yellow-500';
  if (progress >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-lg rounded-md border border-gray-200">
        <p className="font-semibold">{label}</p>
        <p className="text-md text-primary">{`Progress: ${payload[0].value}%`}</p>
        <div className="mt-1 text-xs text-muted-foreground">
          Click for topic details
        </div>
      </div>
    );
  }

  return null;
};

// Normalize subject names to prevent duplicates (e.g., Math and Mathematics)
const normalizeSubjectName = (subject: string): string => {
  const lowerSubject = subject.toLowerCase().trim();
  
  // Map different variations to standardized names
  if (lowerSubject === 'mathematics' || lowerSubject === 'math') return 'Math';
  if (lowerSubject === 'arts' || lowerSubject === 'art') return 'Art';
  if (lowerSubject === 'computer' || lowerSubject === 'computer science' || lowerSubject === 'programming' || lowerSubject === 'coding') return 'Computer Science';
  if (lowerSubject === 'language arts' || lowerSubject === 'english' || lowerSubject === 'reading') return 'English';
  if (lowerSubject === 'social studies' || lowerSubject === 'social science' || lowerSubject === 'history') return 'Social Studies';
  if (lowerSubject === 'science' || lowerSubject === 'natural science') return 'Science';
  if (lowerSubject === 'health' || lowerSubject === 'physical education' || lowerSubject === 'pe') return 'Health';
  
  // If no specific mapping, capitalize first letter
  return subject.charAt(0).toUpperCase() + subject.slice(1);
};

const SubjectProgressChart: React.FC<SubjectProgressChartProps> = ({ subjectProgress, isLoading, language }) => {
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [showTopicsDialog, setShowTopicsDialog] = useState(false);
  const { gradeLevel } = useLearningGradeLevel();

  // Consolidate duplicate subjects (like Math and Mathematics)
  const consolidateSubjects = useCallback(() => {
    const subjectMap = new Map();
    
    subjectProgress.forEach(subject => {
      const normalizedName = normalizeSubjectName(subject.subject);
      
      if (subjectMap.has(normalizedName)) {
        // If we already have this subject, use the higher progress value
        const existing = subjectMap.get(normalizedName);
        if (subject.progress > existing.progress) {
          subjectMap.set(normalizedName, { ...subject, subject: normalizedName });
        }
      } else {
        // Otherwise add it with the normalized name
        subjectMap.set(normalizedName, { ...subject, subject: normalizedName });
      }
    });
    
    return Array.from(subjectMap.values());
  }, [subjectProgress]);

  // Format data for the chart
  const chartData = consolidateSubjects();

  // Get topic suggestions for the selected subject
  const { getTopicSuggestionsForSubject } = useLearningGradeLevel();
  
  // Handle click on a subject bar or list item
  const handleSubjectClick = (subject: any) => {
    setSelectedSubject(subject);
    setShowTopicsDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {chartData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'id' ? 'Grafik Kemajuan' : 'Progress Chart'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 400 }} className="cursor-pointer">
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const clickedSubject = data.activePayload[0].payload;
                      handleSubjectClick(clickedSubject);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
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
      ) :
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
      }
      
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
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => handleSubjectClick(item)}
                >
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

      {/* Topics Dialog */}
      <Dialog open={showTopicsDialog} onOpenChange={setShowTopicsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSubject && (
                <>
                  <SubjectIcon subject={selectedSubject.subject} />
                  {selectedSubject.subject} {language === 'id' ? 'Topik' : 'Topics'}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {language === 'id' 
                ? 'Detail topik dan kemajuan untuk mata pelajaran ini' 
                : 'Topic details and progress for this subject'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Overall Progress */}
            <div className="flex justify-between items-center p-2 bg-accent/50 rounded-md">
              <span className="font-medium">{language === 'id' ? 'Kemajuan Keseluruhan' : 'Overall Progress'}</span>
              <span className="font-bold">{selectedSubject?.progress}%</span>
            </div>

            {/* Topics List */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">{language === 'id' ? 'Topik Terkait' : 'Related Topics'}</h4>
              
              {selectedSubject && getTopicSuggestionsForSubject(selectedSubject.subject).map((topic: string, index: number) => {
                // Mock progress for individual topics (in a real app, this would come from the backend)
                const topicProgress = Math.floor(Math.random() * 100);
                
                return (
                  <div key={index} className="flex items-center justify-between p-2 border-b last:border-0">
                    <span className="text-sm">{topic}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(topicProgress)}`}
                          style={{ width: `${topicProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{topicProgress}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowTopicsDialog(false)}>
              {language === 'id' ? 'Tutup' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubjectProgressChart;
