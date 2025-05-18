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
import { supabase } from '@/integrations/supabase/client';
import AIStudentReport from './AIStudentReport';
import SubjectProgressChart from './SubjectProgressChart';
import { fixStudentProfilesMappings } from '@/utils/databaseMigration';

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
  const [studentInfo, setStudentInfo] = useState<{ name: string, gradeLevel: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [reportErrorMsg, setReportErrorMsg] = useState<string | null>(null);
  
  // Fetch student information
  useEffect(() => {
    const fetchStudentInfo = async () => {
      if (!studentId) return;
      
      try {
        const { data, error } = await supabase
          .from('students')
          .select('name, grade_level')
          .eq('id', studentId)
          .single();
          
        if (error) {
          console.error('Error fetching student info:', error);
        } else if (data) {
          setStudentInfo({
            name: data.name,
            gradeLevel: data.grade_level
          });
        }
      } catch (error) {
        console.error('Error in student info fetch:', error);
      }
    };
    
    fetchStudentInfo();
  }, [studentId]);
  
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
  
  // Run database migrations to fix potential constraint issues
  useEffect(() => {
    const runMigration = async () => {
      try {
        await fixStudentProfilesMappings();
      } catch (error) {
        console.error('Error running database migration:', error);
      }
    };
    
    runMigration();
  }, []);
  
  // Prepare data for pie chart
  const pieChartData = subjectProgress.map(subject => ({
    name: subject.subject,
    value: subject.progress
  }));
  
  // Colors for pie chart segments
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#ff8042'];
  
  // Helper function to check if there's enough data for a meaningful report
  const hasEnoughDataForReport = () => {
    // Check if we have at least some minimum amount of data
    return subjectProgress.length >= 2 || 
           (subjectProgress.length > 0 && subjectProgress.some(subject => subject.progress > 30));
  };
  
  const handleRefreshReport = async () => {
    if (!studentId) return;
    
    setIsLoadingReport(true);
    setReportErrorMsg(null);
    try {
      // Get the actual student information
      const gradeLevel = studentInfo?.gradeLevel || 'k-3';
      const studentName = studentInfo?.name || "Student";
      
      // Force refresh the AI summary report
      const report = await studentProgressService.getAISummaryReport(
        studentId, 
        gradeLevel,
        studentName,
        true // Force refresh
      );
      
      setAIReport(report);
      toast.success(language === 'id' ? 'Laporan berhasil diperbarui' : 'Report refreshed successfully');
    } catch (error) {
      console.error('Error refreshing AI report:', error);
      toast.error(language === 'id' ? 'Gagal memperbarui laporan' : 'Failed to refresh report');
      setReportErrorMsg(language === 'id' ? 
        'Terjadi kesalahan saat memperbarui laporan. Coba lagi nanti.' : 
        'There was an error refreshing the report. Please try again later.');
      
      // Still show a fallback report even on refresh error
      const fallbackReport = studentProgressService.generateFallbackReport(
        studentInfo?.name || "Student",
        studentInfo?.gradeLevel || "k-3"
      );
      setAIReport(fallbackReport);
    } finally {
      setIsLoadingReport(false);
    }
  };
  
  useEffect(() => {
    const fetchAIReport = async () => {
      if (!studentId) return;
      
      setIsLoadingReport(true);
      setReportErrorMsg(null);
      try {
        // Use the actual student information
        const gradeLevel = studentInfo?.gradeLevel || 'k-3';
        const studentName = studentInfo?.name || "Student";
        
        console.log("Fetching AI report for student:", studentId, "grade:", gradeLevel, "name:", studentName);
        
        // If we've already retried 3 times, use a fallback report
        if (retryCount >= 3) {
          console.log("Maximum retry count reached, using fallback report");
          
          const fallbackReport = studentProgressService.generateFallbackReport(
            studentName,
            gradeLevel
          );
          
          setAIReport(fallbackReport);
          setReportErrorMsg(language === 'id' ? 
            'Menggunakan laporan sederhana karena layanan AI tidak tersedia.' : 
            'Using a simple report as the AI service is currently unavailable.');
            
          setIsLoadingReport(false);
          return;
        }
        
        const report = await studentProgressService.getAISummaryReport(
          studentId, 
          gradeLevel,
          studentName,
          false
        );
        
        console.log("AI Report fetched:", report);
        
        // Set the report only if we have enough data or if a report was generated
        if (report && (hasEnoughDataForReport() || report.overallSummary)) {
          setAIReport(report);
          setRetryCount(0); // Reset retry counter on success
        } else {
          console.log("Not enough data for a meaningful AI report");
          setAIReport(null);
        }
      } catch (error) {
        console.error('Error fetching AI report:', error);
        
        // Increment retry counter
        setRetryCount(prev => prev + 1);
        
        // Set error message
        setReportErrorMsg(language === 'id' ? 
          'Gagal menghubungi layanan AI. Mencoba dengan data dasar.' : 
          'Failed to contact AI service. Trying with basic data.');
          
        // Don't show a toast on every retry
        if (retryCount === 0) {
          toast.error(language === 'id' ? 'Gagal memuat laporan AI' : 'Failed to load AI report');
        }
        
        // If this is the last retry, use a fallback report
        if (retryCount >= 2) {
          const fallbackReport = studentProgressService.generateFallbackReport(
            studentInfo?.name || "Student",
            studentInfo?.gradeLevel || "k-3"
          );
          setAIReport(fallbackReport);
        } else {
          setAIReport(null);
        }
      } finally {
        setIsLoadingReport(false);
      }
    };
    
    if (studentInfo) {
      fetchAIReport();
    }
  }, [studentId, language, studentInfo, retryCount]);
  
  // Helper function to generate fallback chart data when the service is unavailable
  const generateFallbackChartData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - (i * 15));
      
      data.push({
        date: date.toISOString(),
        score: Math.min(100, Math.max(0, 60 + (6 - i) * 3 + (Math.floor(Math.random() * 8) - 4)))
      });
    }
    
    return data;
  };
  
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
              {reportErrorMsg && (
                <div className="mb-4 text-sm text-amber-600 bg-amber-50 py-2 px-3 rounded border border-amber-200">
                  {reportErrorMsg}
                </div>
              )}
              <AIStudentReport 
                report={aiReport} 
                isExpanded={showFullReport} 
                toggleExpanded={() => setShowFullReport(!showFullReport)}
                isLoading={isLoadingReport}
              />
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
