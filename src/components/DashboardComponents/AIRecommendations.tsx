import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb, CheckCircle, ArrowRight, FileText, BarChart3, HelpCircle, Check, X, RefreshCw } from 'lucide-react';
import { studentProgressService, AIRecommendation, AISummaryReport } from '@/services/studentProgressService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Spinner } from '@/components/ui/spinner';
import { useNavigate } from 'react-router-dom';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
// Import all components from our mock file
import { 
  ResponsiveContainer, 
  LineChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Line 
} from '@/components/Charts/ChartComponents';
import { toast } from 'react-toastify';

// Time interval types for the chart
type TimeInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';
type ChartDataPoint = { date: string; score: number };

interface AIRecommendationsProps {
  studentId: string;
  gradeLevel: 'k-3' | '4-6' | '7-9'; 
}

interface QuizData {
  quizId: string;
  quizTitle: string;
  completedDate: string;
  score: number;
  maxScore: number;
  percentage: number;
  questions: Array<{
    questionText: string;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ studentId, gradeLevel }) => {  
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [summaryReport, setSummaryReport] = useState<AISummaryReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [forceRefreshReport, setForceRefreshReport] = useState(false);
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('daily');
  const [isChartLoading, setIsChartLoading] = useState(false);
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectedProfile } = useStudentProfile();
  
  const fetchRecommendationsAndReport = useCallback(async (shouldForceRefresh: boolean) => {
    setIsLoadingRecommendations(true);
    setIsLoadingReport(true);

    // Fetch AI Recommendations
    try {
      const recData = await studentProgressService.getAIRecommendations(studentId);
      
      // If no real recommendations are available, use sample ones for testing
      if (recData.length === 0) {
        console.log("No real recommendations available, using samples");
        const sampleRecs = studentProgressService.generateSampleAIRecommendations(studentId);
        setRecommendations(sampleRecs);
      } else {
        setRecommendations(recData);
      }
      
      // Mark recommendations as read
      for (const rec of recData) {
        if (rec.id && !rec.read) {
          await studentProgressService.markRecommendationAsRead(rec.id.toString());
        }
      }
    } catch (error) {
      console.error("Failed to load AI recommendations:", error);
      toast.error(language === 'id' ? 'Gagal memuat rekomendasi AI' : 'Failed to load AI recommendations');
      
      // Use sample recommendations on error
      const sampleRecs = studentProgressService.generateSampleAIRecommendations(studentId);
      setRecommendations(sampleRecs);
    } finally {
      setIsLoadingRecommendations(false);
    }

    // Fetch AI Summary Report
    try {
      if (studentId && gradeLevel && selectedProfile?.name) {
        const reportData = await studentProgressService.getAISummaryReport(studentId, gradeLevel, selectedProfile.name, shouldForceRefresh);
        setSummaryReport(reportData);
        if (shouldForceRefresh) {
          toast.success(language === 'id' ? 'Laporan berhasil diperbarui' : 'Report refreshed successfully');
        }
      } else {
        setSummaryReport(null);
        console.warn("Student ID, grade level, or name missing for AI summary report fetch.");
      }
    } catch (error) {
      console.error("Failed to load AI summary report:", error);
      toast.error(language === 'id' ? 'Gagal memuat laporan ringkasan AI' : 'Failed to load AI summary report');
      setSummaryReport(null);
    } finally {
      setIsLoadingReport(false);
      setForceRefreshReport(false);
    }
  }, [studentId, gradeLevel, selectedProfile?.name, language]);

  useEffect(() => {
    if (studentId && gradeLevel && selectedProfile?.name) {
      fetchRecommendationsAndReport(forceRefreshReport);
    }
  }, [studentId, gradeLevel, selectedProfile?.name, forceRefreshReport, fetchRecommendationsAndReport]);
  
  const handleForceRefreshReport = () => {
    setForceRefreshReport(true);
  };

  const handleStartLesson = async (rec: AIRecommendation) => {
    if (rec.id) {
      await studentProgressService.markRecommendationAsActedOn(rec.id.toString());
      setRecommendations(prevRecs => 
        prevRecs.map(item => 
          item.id === rec.id ? { ...item, acted_on: true } : item
        )
      );
    }

    let subject = rec.recommendation_type;
    let topic = rec.recommendation;

    if (rec.recommendation_type.includes(':')) {
      [subject, topic] = rec.recommendation_type.split(':', 2);
    } else {
      const commonSubjects = ['Math', 'Science', 'English', 'History', 'Art', 'Computer'];
      const foundSubject = commonSubjects.find(s => rec.recommendation.toLowerCase().includes(s.toLowerCase()));
      if (foundSubject) subject = foundSubject;
    }

    navigate('/ai-learning', {
      state: {
        gradeLevel: gradeLevel,
        studentId: studentId,
        studentName: selectedProfile?.name || 'Student',
        subject: subject, 
        topic: topic,     
        autoStart: true,
        sourceRecommendationId: rec.id 
      }
    });
  };
    
  const ensureRecommendations = () => {
    if (recommendations.length === 0 && !isLoadingRecommendations) {
      return [];
    }
    return recommendations;
  };
  
  const displayRecommendations = ensureRecommendations();

  const getSubjectColor = (subject: string) => {
    const s = subject?.toLowerCase() || '';
    if (s.includes('math')) return 'bg-blue-100 text-blue-700';
    if (s.includes('science')) return 'bg-green-100 text-green-700';
    if (s.includes('english')) return 'bg-yellow-100 text-yellow-700';
    if (s.includes('history')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Helper function to generate sample explanation data for recommendations
  const getSampleExplanationData = (rec: AIRecommendation, subject: string) => {
    // If the recommendation already has reason and impact data, use those
    if (rec.reason && rec.learning_impact) {
      return { reason: rec.reason, learningImpact: rec.learning_impact };
    }

    // Generate sample reason based on subject
    let reason = '';
    let learningImpact = '';

    if (subject.toLowerCase().includes('math')) {
      reason = language === 'id' 
        ? 'Berdasarkan analisis kuis terakhir, Anda menunjukkan kesulitan dengan konsep ini. Latihan tambahan akan membantu memperkuat pemahaman Anda.'
        : 'Based on analysis of your recent quizzes, you showed difficulty with this concept. Additional practice will help reinforce your understanding.';
      
      learningImpact = language === 'id'
        ? 'Peningkatan 15-20% dalam skor matematika dan pemahaman yang lebih baik tentang konsep aljabar dasar.'
        : 'Expected 15-20% improvement in math scores and better understanding of fundamental algebraic concepts.';
    } 
    else if (subject.toLowerCase().includes('science')) {
      reason = language === 'id'
        ? 'Topik ini adalah dasar untuk konsep ilmiah yang lebih kompleks. Anda telah menunjukkan minat pada subjek serupa.'
        : 'This topic is foundational for more complex scientific concepts. You have shown interest in similar subjects.';
      
      learningImpact = language === 'id'
        ? 'Memperkuat pengetahuan sains dasar dan mempersiapkan Anda untuk proyek sains yang akan datang dengan peningkatan kepercayaan diri 25%.'
        : 'Strengthens core science knowledge and prepares you for upcoming science projects with a 25% confidence boost.';
    }
    else if (subject.toLowerCase().includes('english')) {
      reason = language === 'id'
        ? 'Keterampilan membaca dan pemahaman Anda menunjukkan potensi untuk ditingkatkan. Topik ini akan membangun fondasi yang lebih kuat.'
        : 'Your reading and comprehension skills show potential for improvement. This topic will build a stronger foundation.';
      
      learningImpact = language === 'id'
        ? 'Peningkatan kosakata dan kemampuan pemahaman membaca, dengan peningkatan 30% dalam kecepatan pengolahan teks.'
        : 'Enhanced vocabulary and reading comprehension abilities, with a 30% increase in text processing speed.';
    }
    else {
      reason = language === 'id'
        ? 'Disarankan untuk memperluas pengetahuan Anda dan mengisi celah dalam kurikulum pembelajaran.'
        : 'Suggested to expand your knowledge and fill gaps in your learning curriculum.';
      
      learningImpact = language === 'id'
        ? 'Peningkatan pemahaman secara keseluruhan dan pengembangan keterampilan berpikir kritis.'
        : 'Improved overall comprehension and critical thinking skill development.';
    }

    return { reason, learningImpact };
  };

  // Helper to format date for chart
  const formatDateForChart = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };
  
  // Function to filter chart data based on time interval
  const getFilteredChartData = useCallback(() => {
    if (!summaryReport?.knowledgeGrowthChartData || !Array.isArray(summaryReport.knowledgeGrowthChartData)) {
      return [];
    }
    
    const data = [...summaryReport.knowledgeGrowthChartData] as ChartDataPoint[];
    const now = new Date();
    
    // Sort data by date (oldest to newest)
    data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    switch (timeInterval) {
      case 'daily':
        // Show data from the last 30 days
        return data.filter(item => {
          const date = new Date(item.date);
          return (now.getTime() - date.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        });
      case 'weekly':
        // Group by week and average scores
        const weeklyData: Record<string, { sum: number, count: number }> = {};
        data.forEach(item => {
          const date = new Date(item.date);
          // Get the week number
          const weekNumber = getWeekNumber(date);
          const weekKey = `${date.getFullYear()}-W${weekNumber}`;
          
          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { sum: 0, count: 0 };
          }
          weeklyData[weekKey].sum += item.score;
          weeklyData[weekKey].count++;
        });
        
        return Object.entries(weeklyData)
          .map(([weekKey, values]) => ({
            date: weekKey,
            score: Math.round(values.sum / values.count)
          }))
          .sort((a, b) => a.date.localeCompare(b.date)) // Ensure correct order
          .slice(-12); // Last 12 weeks
      
      case 'monthly':
        // Group by month and average scores
        const monthlyData: Record<string, { sum: number, count: number }> = {};
        data.forEach(item => {
          const date = new Date(item.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { sum: 0, count: 0 };
          }
          monthlyData[monthKey].sum += item.score;
          monthlyData[monthKey].count++;
        });
        
        return Object.entries(monthlyData)
          .map(([monthKey, values]) => ({
            date: monthKey,
            score: Math.round(values.sum / values.count)
          }))
          .sort((a, b) => a.date.localeCompare(b.date)) // Ensure correct order
          .slice(-12); // Last 12 months
      
      case 'yearly':
        // Group by year and average scores
        const yearlyData: Record<string, { sum: number, count: number }> = {};
        data.forEach(item => {
          const date = new Date(item.date);
          const yearKey = `${date.getFullYear()}`;
          
          if (!yearlyData[yearKey]) {
            yearlyData[yearKey] = { sum: 0, count: 0 };
          }
          yearlyData[yearKey].sum += item.score;
          yearlyData[yearKey].count++;
        });
        
        return Object.entries(yearlyData)
          .map(([yearKey, values]) => ({
            date: yearKey,
            score: Math.round(values.sum / values.count)
          }))
          .sort((a, b) => a.date.localeCompare(b.date)); // Ensure correct order
      
      default:
        return data;
    }
  }, [summaryReport?.knowledgeGrowthChartData, timeInterval]);
  
  // Helper function to get ISO week number
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };
  
  // Memoize the chart data to improve performance
  const chartData = React.useMemo(() => getFilteredChartData(), [getFilteredChartData]);
  
  // Custom formatter for X-axis based on time interval
  const formatXAxis = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      // Handle different formats based on time interval
      if (timeInterval === 'daily') {
        // Original format for daily
        return formatDateForChart(dateString);
      } else if (timeInterval === 'weekly') {
        // Format for weekly: "Week X"
        const parts = dateString.split('-W');
        return language === 'id' ? `Minggu ${parts[1]}` : `Week ${parts[1]}`;
      } else if (timeInterval === 'monthly') {
        // Format for monthly: "Jan 2023"
        const parts = dateString.split('-');
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
        return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', year: 'numeric' });
      } else {
        // Format for yearly: "2023"
        return dateString;
      }
    } catch (e) {
      return dateString;
    }
  };
  
  // Helper function to convert quiz review data to components
  const renderQuizReview = () => {
    if (!summaryReport?.quizReview) return null;
    
    // Generate dummy quiz data for display
    const quizData: QuizData[] = [];
    
    if (summaryReport.quizReview.topics && Array.isArray(summaryReport.quizReview.topics) && 
        summaryReport.quizReview.scores && Array.isArray(summaryReport.quizReview.scores)) {
      
      const topics = summaryReport.quizReview.topics;
      const scores = summaryReport.quizReview.scores;
      
      // Only create quiz data if both arrays exist and have content
      if (topics.length > 0 && scores.length > 0) {
        // Use the minimum length of both arrays
        const length = Math.min(topics.length, scores.length);
        
        for (let i = 0; i < length; i++) {
          quizData.push({
            quizId: `quiz-${i}`,
            quizTitle: topics[i],
            completedDate: new Date().toISOString(),
            score: scores[i],
            maxScore: 100,
            percentage: scores[i],
            questions: [
              {
                questionText: "Example question",
                studentAnswer: "Student answer",
                correctAnswer: "Correct answer",
                isCorrect: scores[i] > 70
              }
            ]
          });
        }
      }
    }
    
    if (quizData.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h4 className="font-semibold mb-2 text-gray-800">
          {language === 'id' ? 'Tinjauan Hasil Kuis' : 'Quiz Results Review'}
        </h4>
        <Accordion type="single" collapsible className="w-full">
          {quizData.map((quiz, index) => (
            <AccordionItem value={`item-${index}`} key={quiz.quizId || index}>
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex justify-between w-full pr-2">
                  <span>{quiz.quizTitle}</span>
                  <span className={`font-semibold ${quiz.percentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                    {language === 'id' ? 'Nilai': 'Score'}: {quiz.score}/{quiz.maxScore} ({quiz.percentage}%)
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs bg-white p-3 rounded-md border mt-1">
                <p className="mb-2 text-gray-600"> {language === 'id' ? 'Tanggal Selesai': 'Completed'}: {new Date(quiz.completedDate).toLocaleDateString()}</p>
                <h5 className="font-semibold mb-1 text-gray-700">{language === 'id' ? 'Detail Jawaban': 'Answer Details'}:</h5>
                <ul className="space-y-2">
                  {quiz.questions.map((q, qIndex) => (
                    <li key={qIndex} className="p-2 border-b last:border-b-0">
                      <p className="font-medium text-gray-700 mb-0.5"> {language === 'id' ? `Pertanyaan ${qIndex + 1}`: `Question ${qIndex + 1}`}: {q.questionText}</p>
                      <p className={`text-gray-600 ${q.isCorrect ? '' : 'text-red-500'}`}>
                        {language === 'id' ? 'Jawabanmu': 'Your Answer'}: {q.studentAnswer} 
                        {q.isCorrect ? <Check className="inline h-4 w-4 text-green-500 ml-1" /> : <X className="inline h-4 w-4 text-red-500 ml-1" />}
                      </p>
                      {!q.isCorrect && (
                        <p className="text-green-600">{language === 'id' ? 'Jawaban Benar': 'Correct Answer'}: {q.correctAnswer}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  };

  return (
    <div className="h-full space-y-8">
      {/* AI Summary Report Section */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" /> 
            <h3 className="text-lg font-medium">
              {language === 'id' ? 'Laporan Ringkasan AI Lengkap' : 'Full AI Summary Report'}
            </h3>
          </div>
          <Button variant="outline" size="sm" onClick={handleForceRefreshReport} disabled={isLoadingReport}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingReport ? 'animate-spin' : ''}`} />
            {language === 'id' ? 'Perbarui' : 'Refresh'}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-1">
          {language === 'id' ? 'Analisis mendalam tentang profil, kemajuan, hasil belajar, dan aktivitas siswa.' : 'In-depth analysis of the student\'s profile, progress, learning results, and activities.'}
        </p>
        {summaryReport?.generatedAt && (
          <p className="text-xs text-muted-foreground mb-4">
            {language === 'id' ? 'Laporan terakhir dibuat pada: ' : 'Report last generated: '}
            {new Date(summaryReport.generatedAt).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        )}
        {isLoadingReport ? (
          <div className="flex justify-center items-center h-40 p-4 border rounded-lg bg-gray-50">
            <Spinner size="md" />
            <p className="ml-2 text-muted-foreground">{language === 'id' ? 'Memuat laporan...' : 'Loading report...'}</p>
          </div>
        ) : summaryReport ? (
          <div className="p-4 border rounded-lg bg-gray-50 space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1 text-gray-800">{language === 'id' ? 'Ringkasan Umum' : 'Overall Summary'}</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{summaryReport.overallSummary}</p>
            </div>
            {summaryReport.studentName && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800">{language === 'id' ? 'Siswa' : 'Student'}</h4>
                  <p className="text-gray-700">{summaryReport.studentName}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{language === 'id' ? 'Tingkat Kelas' : 'Grade Level'}</h4>
                  <p className="text-gray-700">{summaryReport.gradeLevel}</p>
                </div>
              </div>
            )}
            <div>
              <h4 className="font-semibold mb-1 text-gray-800">{language === 'id' ? 'Kekuatan Utama' : 'Key Strengths'}</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                {summaryReport.strengths?.map((strength, i) => <li key={i}>{strength}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-gray-800">{language === 'id' ? 'Area Peningkatan' : 'Areas for Improvement'}</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                {summaryReport.areasForImprovement?.map((area, i) => <li key={i}>{area}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1 text-gray-800">{language === 'id' ? 'Analisis Aktivitas' : 'Activity Analysis'}</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{summaryReport.activityAnalysis}</p>
            </div>
            
            {/* Knowledge Growth Chart */}
            {summaryReport.knowledgeGrowthChartData && Array.isArray(summaryReport.knowledgeGrowthChartData) && summaryReport.knowledgeGrowthChartData.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-800">
                    {language === 'id' ? 'Grafik Pertumbuhan Pengetahuan (Skor Kuis)' : 'Knowledge Growth Chart (Quiz Scores)'}
                  </h4>
                  <div className="flex space-x-2 text-xs">
                    <button 
                      className={`px-2 py-1 rounded transition-all duration-200 ${timeInterval === 'daily' ? 'bg-purple-100 text-purple-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      onClick={() => {
                        if (timeInterval !== 'daily') {
                          setIsChartLoading(true);
                          setTimeInterval('daily');
                          // Set a small timeout to simulate the loading state and allow React to re-render
                          setTimeout(() => setIsChartLoading(false), 300);
                        }
                      }}
                      disabled={isChartLoading}
                    >
                      {language === 'id' ? 'Harian' : 'Daily'}
                    </button>
                    <button 
                      className={`px-2 py-1 rounded transition-all duration-200 ${timeInterval === 'weekly' ? 'bg-purple-100 text-purple-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      onClick={() => {
                        if (timeInterval !== 'weekly') {
                          setIsChartLoading(true);
                          setTimeInterval('weekly');
                          setTimeout(() => setIsChartLoading(false), 300);
                        }
                      }}
                      disabled={isChartLoading}
                    >
                      {language === 'id' ? 'Mingguan' : 'Weekly'}
                    </button>
                    <button 
                      className={`px-2 py-1 rounded transition-all duration-200 ${timeInterval === 'monthly' ? 'bg-purple-100 text-purple-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      onClick={() => {
                        if (timeInterval !== 'monthly') {
                          setIsChartLoading(true);
                          setTimeInterval('monthly');
                          setTimeout(() => setIsChartLoading(false), 300);
                        }
                      }}
                      disabled={isChartLoading}
                    >
                      {language === 'id' ? 'Bulanan' : 'Monthly'}
                    </button>
                    <button 
                      className={`px-2 py-1 rounded transition-all duration-200 ${timeInterval === 'yearly' ? 'bg-purple-100 text-purple-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      onClick={() => {
                        if (timeInterval !== 'yearly') {
                          setIsChartLoading(true);
                          setTimeInterval('yearly');
                          setTimeout(() => setIsChartLoading(false), 300);
                        }
                      }}
                      disabled={isChartLoading}
                    >
                      {language === 'id' ? 'Tahunan' : 'Yearly'}
                    </button>
                  </div>
                </div>
                <div style={{ width: '100%', height: 300 }} className="bg-white p-2 rounded shadow relative">
                  {isChartLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                      <Spinner size="sm" />
                      <span className="ml-2 text-sm text-gray-600">{language === 'id' ? 'Memperbarui grafik...' : 'Updating chart...'}</span>
                    </div>
                  )}
                  <ResponsiveContainer>
                    <LineChart 
                      data={chartData} 
                      margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                      className={`transition-opacity duration-300 ${isChartLoading ? 'opacity-30' : 'opacity-100'}`}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatXAxis} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, language === 'id' ? 'Skor' : 'Score']}
                        labelFormatter={(label: string) => formatXAxis(label)}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '4px', padding: '8px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}
                        wrapperStyle={{ outline: 'none' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                        name={language === 'id' ? 'Skor Rata-rata' : 'Average Score'} 
                        unit="%"
                        animationDuration={500} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Render Quiz Review Section */}
            {renderQuizReview()}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground p-4 border rounded-lg bg-gray-50">
            {language === 'id' 
              ? 'Tidak dapat memuat laporan ringkasan saat ini atau tidak ada data.' 
              : 'Could not load summary report at this time or no data available.'}
          </div>
        )}
      </div>

      {/* Revamped AI Learning Recommendations Section - Card Model */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-medium">
            {language === 'id' ? 'Saran Pembelajaran Berikutnya' : 'Suggested Next Steps'}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {language === 'id' ? 'Pilih topik di bawah ini untuk memulai sesi belajar AI. Rekomendasi ini didasarkan pada analisis kemajuan Anda.' : 'Choose a topic below to start an AI learning session. These are based on an analysis of your progress.'}
        </p>
        
        {isLoadingRecommendations ? (
          <div className="flex justify-center items-center h-32">
            <Spinner size="md" />
          </div>
        ) : displayRecommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayRecommendations.map((rec) => {
              const [subject, topicText] = rec.recommendation_type.includes(':') 
                ? rec.recommendation_type.split(':', 2) 
                : [rec.recommendation_type, rec.recommendation];
              const cardColor = getSubjectColor(subject);
              
              // Get explanation data (real or sample)
              const { reason, learningImpact } = getSampleExplanationData(rec, subject);

              return (
                <div 
                  key={rec.id} 
                  className={`rounded-lg shadow-md overflow-hidden flex flex-col justify-between p-4 transition-all hover:shadow-lg ${rec.acted_on ? 'bg-gray-100 opacity-70' : 'bg-white'}`}
                >
                  <div>
                    <div className="flex items-center mb-2">
                      {rec.acted_on ? (
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mr-2" />
                      ) : (
                        <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0 mr-2" />
                      )}
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${cardColor}`}>{subject}</span>
                    </div>
                    <h4 className={`font-semibold mb-1 text-gray-800 ${rec.acted_on ? 'line-through' : ''}`}>{topicText}</h4>
                    <p className={`text-sm text-gray-600 mb-3 ${rec.acted_on ? 'line-through' : ''}`}>{rec.recommendation}</p>
                    
                    {!rec.acted_on && (
                      <>
                        {/* Reason/Why section */}
                        {reason && (
                          <div className="mb-3">
                            <h5 className="text-xs font-medium text-gray-700 mb-1">
                              {language === 'id' ? 'Mengapa disarankan:' : 'Why recommended:'}
                            </h5>
                            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              {reason}
                            </p>
                          </div>
                        )}

                        {/* Expected impact section */}
                        {learningImpact && (
                          <div className="mb-3">
                            <h5 className="text-xs font-medium text-gray-700 mb-1">
                              {language === 'id' ? 'Dampak pembelajaran:' : 'Learning impact:'}
                            </h5>
                            <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                              {learningImpact}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {!rec.acted_on && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full mt-3 border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => handleStartLesson(rec)}
                    >
                      {language === 'id' ? 'Mulai Belajar' : 'Start Learning'} 
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground p-4 border rounded-lg bg-gray-50">
            {language === 'id' 
              ? 'Belum ada rekomendasi. Lanjutkan pembelajaran untuk mendapatkan saran yang dipersonalisasi!' 
              : 'No recommendations yet. Continue learning to get personalized suggestions!'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommendations;
