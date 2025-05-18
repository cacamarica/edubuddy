
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { studentProgressService, AISummaryReport } from '@/services/studentProgressService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import { BarChart3, FileText, Check, X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import AIStudentReport from './AIStudentReport';
import SubjectProgressChart from './SubjectProgressChart';

interface StudentProgressSummaryProps {
  studentId: string;
}

const StudentProgressSummary: React.FC<StudentProgressSummaryProps> = ({ studentId }) => {
  const [subjectProgress, setSubjectProgress] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiReport, setAIReport] = useState<AISummaryReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { language } = useLanguage();
  const [showFullReport, setShowFullReport] = useState(false);
  
  // Fetch subject progress
  useEffect(() => {
    const fetchProgress = async () => {
      if (!studentId) return;
      
      setIsLoading(true);
      try {
        const progress = await studentProgressService.getSubjectProgress(studentId);
        setSubjectProgress(progress);
      } catch (error) {
        console.error('Error fetching subject progress:', error);
        toast.error(language === 'id' ? 'Gagal memuat kemajuan mata pelajaran' : 'Failed to load subject progress');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProgress();
  }, [studentId, language]);
  
  // Prepare data for pie chart
  const pieChartData = subjectProgress.map(subject => ({
    name: subject.subject,
    value: subject.progress
  }));
  
  // Colors for pie chart segments
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#ff8042'];
  
  const handleRefreshReport = async () => {
    if (!studentId) return;
    
    setIsLoadingReport(true);
    try {
      // Get the grade level - in a real app, this would come from the student's data
      const gradeLevel = 'k-3'; // This should be dynamic based on the student
      
      // Force refresh the AI summary report
      const report = await studentProgressService.getAISummaryReport(
        studentId, 
        gradeLevel,
        "Student", // This should be the actual student name
        true // Force refresh
      );
      
      setAIReport(report);
      toast.success(language === 'id' ? 'Laporan berhasil diperbarui' : 'Report refreshed successfully');
    } catch (error) {
      console.error('Error refreshing AI report:', error);
      toast.error(language === 'id' ? 'Gagal memperbarui laporan' : 'Failed to refresh report');
    } finally {
      setIsLoadingReport(false);
    }
  };
  
  useEffect(() => {
    const fetchAIReport = async () => {
      if (!studentId) return;
      
      setIsLoadingReport(true);
      try {
        // Get the grade level - in a real app, this would come from the student's data
        const gradeLevel = 'k-3'; // This should be dynamic based on the student
        console.log("Fetching AI report for student:", studentId, "grade:", gradeLevel);
        
        const report = await studentProgressService.getAISummaryReport(
          studentId, 
          gradeLevel,
          "Student", // This should be the actual student name
          false
        );
        
        console.log("AI Report fetched:", report);
        setAIReport(report);
      } catch (error) {
        console.error('Error fetching AI report:', error);
        toast.error(language === 'id' ? 'Gagal memuat laporan AI' : 'Failed to load AI report');
        setAIReport(null);
      } finally {
        setIsLoadingReport(false);
      }
    };
    
    fetchAIReport();
  }, [studentId, language]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            {language === 'id' ? 'Ikhtisar' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="subjects">
            {language === 'id' ? 'Mata Pelajaran' : 'Subjects'}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-5">
          {/* AI Report Summary Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" /> 
                  {language === 'id' ? 'Laporan AI' : 'AI Report'}
                </div>
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshReport} 
                disabled={isLoadingReport}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingReport ? 'animate-spin' : ''}`} />
                {language === 'id' ? 'Perbarui' : 'Refresh'}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingReport ? (
                <div className="flex justify-center items-center h-32">
                  <Spinner size="md" />
                  <span className="ml-3 text-muted-foreground">
                    {language === 'id' ? 'Memuat laporan AI...' : 'Loading AI report...'}
                  </span>
                </div>
              ) : (
                <AIStudentReport 
                  report={aiReport} 
                  isExpanded={showFullReport} 
                  toggleExpanded={() => setShowFullReport(!showFullReport)}
                />
              )}
            </CardContent>
          </Card>
          
          {/* Overall Progress Card */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'id' ? 'Kemajuan Keseluruhan' : 'Overall Progress'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 250 }}>
                  {subjectProgress.length > 0 ? (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, value}) => `${name}: ${value}%`}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => `${value}%`} 
                          labelFormatter={(label) => label} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-muted-foreground">
                        {language === 'id' ? 'Belum ada data kemajuan.' : 'No progress data yet.'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Achievements Card */}
            <Card>
              <CardHeader>
                <CardTitle>{language === 'id' ? 'Pencapaian Terbaru' : 'Recent Achievements'}</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] overflow-auto">
                {subjectProgress.length > 0 ? (
                  <div className="space-y-3">
                    {subjectProgress.slice(0, 5).map((subject, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <span className="font-medium">{subject.subject}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${subject.progress >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {subject.progress}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-muted-foreground">
                      {language === 'id' ? 'Belum ada pencapaian.' : 'No achievements yet.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="subjects">
          <SubjectProgressChart 
            subjectProgress={subjectProgress} 
            isLoading={isLoading} 
            language={language} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentProgressSummary;
