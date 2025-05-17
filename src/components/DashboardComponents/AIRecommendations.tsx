import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb, CheckCircle, ArrowRight, FileText, BarChart3, HelpCircle, Check, X, RefreshCw } from 'lucide-react'; // Added RefreshCw
import { studentProgressService, AIRecommendation, AISummaryReport, QuizReviewDetail } from '@/services/studentProgressService'; // Updated imports
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
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'; // Added recharts
import { toast } from 'sonner'; // For user feedback

interface AIRecommendationsProps {
  studentId: string;
  gradeLevel: 'k-3' | '4-6' | '7-9'; 
}

// AIRecommendation interface might need to be augmented if reasoning/impact is added
// interface AIRecommendation { ... reasoning?: string; potentialImpact?: string; }


const AIRecommendations: React.FC<AIRecommendationsProps> = ({ studentId, gradeLevel }) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [summaryReport, setSummaryReport] = useState<AISummaryReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [forceRefreshReport, setForceRefreshReport] = useState(false); // For report refresh
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectedProfile } = useStudentProfile();
  
  const fetchRecommendationsAndReport = useCallback(async (shouldForceRefresh: boolean) => {
    setIsLoadingRecommendations(true);
    setIsLoadingReport(true);

    // Fetch AI Recommendations (existing logic)
    try {
      const recData = await studentProgressService.getAIRecommendations(studentId);
      setRecommendations(recData);
      for (const rec of recData) {
        if (rec.id && !rec.read) {
          await studentProgressService.markRecommendationAsRead(rec.id);
        }
      }
    } catch (error) {
      console.error("Failed to load AI recommendations:", error);
      toast.error(language === 'id' ? 'Gagal memuat rekomendasi AI' : 'Failed to load AI recommendations');
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
        // This case should ideally not happen if props are correctly passed
        setSummaryReport(null);
        console.warn("Student ID, grade level, or name missing for AI summary report fetch.");
      }
    } catch (error) {
      console.error("Failed to load AI summary report:", error);
      toast.error(language === 'id' ? 'Gagal memuat laporan ringkasan AI' : 'Failed to load AI summary report');
      setSummaryReport(null); // Ensure report is null on error
    } finally {
      setIsLoadingReport(false);
      setForceRefreshReport(false); // Reset refresh trigger
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, gradeLevel, selectedProfile?.name, language]); // Removed studentProgressService from deps as it's stable

  useEffect(() => {
    if (studentId && gradeLevel && selectedProfile?.name) {
      fetchRecommendationsAndReport(forceRefreshReport);
    }
  }, [studentId, gradeLevel, selectedProfile?.name, forceRefreshReport, fetchRecommendationsAndReport]);
  
  const handleForceRefreshReport = () => {
    setForceRefreshReport(true); // This will trigger the useEffect
  };

  // ... (handleStartLesson, ensureRecommendations, getSubjectColor remain mostly the same) ...
  // Minor update to handleStartLesson if recommendation structure changes for reasoning
  const handleStartLesson = async (rec: AIRecommendation) => {
    if (rec.id) {
      await studentProgressService.markRecommendationAsActedOn(rec.id);
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
      // Mock recommendations can be kept or removed if backend is reliable
      const mockRecommendations = [
        {
          id: 'mock-1',
          student_id: studentId,
          recommendation_type: 'Math:Multiplication',
          recommendation: language === 'id' 
            ? 'Latih soal Matematika tentang Perkalian.' 
            : 'Practice Math problems on Multiplication.',
          created_at: new Date().toISOString(),
          read: true,
          acted_on: false
        },
        // ... other mock recommendations
      ];
      // return mockRecommendations; // Uncomment if you want to keep mocks as fallback
      return []; // Or return empty if backend should always provide
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

  // Helper to format date for chart
  const formatDateForChart = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString; // fallback to original if parsing fails
    }
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
            {summaryReport.studentName && ( // Display student name and grade from report
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
            {summaryReport.knowledgeGrowthChartData && summaryReport.knowledgeGrowthChartData.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-gray-800">
                  {language === 'id' ? 'Grafik Pertumbuhan Pengetahuan (Skor Kuis)' : 'Knowledge Growth Chart (Quiz Scores)'}
                </h4>
                <div style={{ width: '100%', height: 300 }} className="bg-white p-2 rounded shadow">
                  <ResponsiveContainer>
                    <LineChart data={summaryReport.knowledgeGrowthChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDateForChart} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, language === 'id' ? 'Skor' : 'Score']}
                        labelFormatter={(label: string) => formatDateForChart(label)}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="score" stroke="#8884d8" activeDot={{ r: 8 }} name={language === 'id' ? 'Skor Rata-rata' : 'Average Score'} unit="%" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Detailed Quiz Review Section - Placeholder for Table */}
            {summaryReport.quizReview && summaryReport.quizReview.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-gray-800">
                  {language === 'id' ? 'Tinjauan Hasil Kuis' : 'Quiz Results Review'}
                </h4>
                {/* TODO: Replace Accordion with Paginated Table linking to DetailedQuizHistoryPage */}
                <Accordion type="single" collapsible className="w-full">
                  {summaryReport.quizReview.map((quiz, index) => (
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
                        {/* Link to detailed history page - to be part of table row */}
                        {/* <Button size="xs" variant="link" onClick={() => navigate(`/student/${studentId}/quiz-history/${quiz.quizId}`)}>View Full History</Button> */}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground p-4 border rounded-lg bg-gray-50">
            {language === 'id' ? 'Tidak dapat memuat laporan ringkasan saat ini atau tidak ada data.' : 'Could not load summary report at this time or no data available.'}
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
                    <p className={`text-xs text-gray-600 mb-1 ${rec.acted_on ? 'line-through' : ''}`}>{rec.recommendation}</p>
                    
                    {/* Placeholder for AI Reasoning & Impact - to be added */}
                    {/* {rec.reasoning && (
                      <div className="mt-2 text-xs text-gray-500 flex items-start">
                        <HelpCircle className="h-3 w-3 mr-1 mt-0.5 shrink-0 text-blue-500" />
                        <span><strong>Reasoning:</strong> {rec.reasoning}</span>
                      </div>
                    )}
                    {rec.potentialImpact && (
                       <div className="mt-1 text-xs text-gray-500 flex items-start">
                         <BarChart3 className="h-3 w-3 mr-1 mt-0.5 shrink-0 text-green-500" />
                         <span><strong>Impact:</strong> {rec.potentialImpact}</span>
                       </div>
                    )} */}
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
