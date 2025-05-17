import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { studentProgressService, TopicQuizHistory, DetailedQuizAttempt } from '@/services/studentProgressService'; // Import service and types
import { Spinner } from '@/components/ui/spinner'; // Import Spinner
import { toast } from 'sonner'; // For error feedback

const DetailedQuizHistoryPage: React.FC = () => {
  const { studentId, topicId } = useParams<{ studentId: string; topicId: string }>();
  const location = useLocation(); // Keep for potential state passing if needed for topicName initially
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [quizHistory, setQuizHistory] = useState<TopicQuizHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If topicName is passed via state, use it, otherwise it will be fetched.
  const initialTopicName = location.state?.topicName || (language === 'id' ? 'Memuat Detail Kuis...' : 'Loading Quiz Details...');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!studentId || !topicId) {
        setError(language === 'id' ? 'ID Siswa atau ID Topik tidak ditemukan.' : 'Student ID or Topic ID missing.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const historyData = await studentProgressService.getDetailedQuizHistoryByTopic(studentId, topicId);
        if (historyData) {
          setQuizHistory(historyData);
        } else {
          // If historyData is null but no error thrown by service, it means function might have returned null (e.g. on its own error handling)
          // The service itself toasts errors, but we can set a local error state too.
          setError(language === 'id' ? 'Tidak dapat memuat riwayat kuis.' : 'Could not load quiz history.');
        }
      } catch (err: any) {
        console.error("Error fetching detailed quiz history:", err);
        setError(err.message || (language === 'id' ? 'Terjadi kesalahan saat mengambil data.' : 'An error occurred while fetching data.'));
        toast.error(language === 'id' ? 'Gagal memuat riwayat kuis.' : 'Failed to load quiz history.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [studentId, topicId, language]);

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col"><Header />
        <div className="container mx-auto px-4 py-6 flex-grow flex items-center justify-center"><Spinner size="lg" /></div>
      <Footer /></div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-6 flex-grow">
        <Button variant="outline" size="sm" onClick={handleBack} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />{language === 'id' ? 'Kembali' : 'Back'}</Button>
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'id' ? 'Riwayat Kuis Lengkap untuk Topik:' : 'Detailed Quiz History for Topic:'} {quizHistory?.topicName || initialTopicName}
            </CardTitle>
            {quizHistory?.attempts && quizHistory.attempts.length > 0 && quizHistory.attempts[0].quiz_title && (
                <CardDescription>
                    {language === 'id' ? 'Kuis: ' : 'Quiz: '} {quizHistory.attempts[0].quiz_title}
                </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-red-600 bg-red-50 p-4 rounded-md flex items-center"><AlertTriangle className="mr-2 h-5 w-5" />{error}</div>
            )}
            {!error && quizHistory && quizHistory.attempts.length > 0 ? (
              <ul className="space-y-4">
                {quizHistory.attempts.map((attempt: DetailedQuizAttempt, index: number) => (
                  <li key={index} className="p-4 border rounded-md bg-gray-50/50
                    hover:shadow-md transition-shadow
                  ">
                    <p className="font-semibold text-gray-800">{attempt.question_text}</p>
                    <p className={`my-1 ${attempt.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                      {language === 'id' ? 'Jawaban Anda: ' : 'Your Answer: '} <span className="font-medium">{attempt.student_answer}</span>
                    </p>
                    {!attempt.is_correct && (
                      <p className="text-blue-700">
                        {language === 'id' ? 'Jawaban Benar: ' : 'Correct Answer: '} <span className="font-medium">{attempt.correct_answer}</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {language === 'id' ? 'Dijawab pada: ' : 'Answered on: '} {new Date(attempt.attempted_at).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}
                    </p>
                  </li>
                ))}
              </ul>
            ) : !error ? (
              <p>{language === 'id' ? 'Tidak ada riwayat kuis untuk topik ini.' : 'No quiz history available for this topic.'}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default DetailedQuizHistoryPage;
