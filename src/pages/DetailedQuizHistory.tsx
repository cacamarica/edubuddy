import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { studentProgressService } from '@/services/studentProgressService';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface QuizHistoryProps {
  studentId?: string;
  gradeLevel?: string;
  subject?: string;
}

const DetailedQuizHistory: React.FC<QuizHistoryProps> = () => {
  const location = useLocation();
  const { studentId, gradeLevel, subject } = location.state || {};
  const [quizHistory, setQuizHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    const fetchQuizHistory = async () => {
      if (studentId && gradeLevel) {
        setIsLoading(true);
        try {
          // Pass the required parameters to the function
          const data = await studentProgressService.getDetailedQuizHistoryByTopic(
            studentId,
            gradeLevel,
            subject
          );
          setQuizHistory(data);
        } catch (error) {
          console.error('Error fetching quiz history:', error);
          toast.error('Failed to load quiz history');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchQuizHistory();
  }, [studentId, gradeLevel, subject]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {language === 'id' ? 'Riwayat Kuis' : 'Quiz History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quizHistory.length === 0 ? (
            <div className="text-center py-6">
              {language === 'id' ? 'Tidak ada riwayat kuis yang tersedia' : 'No quiz history available'}
            </div>
          ) : (
            <>
              {quizHistory.map((topic) => (
                <div key={topic.topic} className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <BookOpen className="mr-2 h-5 w-5 text-eduPurple" />
                    {language === 'id' ? 'Topik' : 'Topic'}: {topic.topicName || topic.topic}
                  </h3>
                  <div className="space-y-3">
                    {topic.attempts.map((attempt) => (
                      <div key={attempt.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{attempt.quiz_title || 'Quiz'}</h4>
                          <Badge className={attempt.is_correct ? 'bg-green-500' : 'bg-red-500'}>
                            {attempt.is_correct 
                              ? (language === 'id' ? 'Benar' : 'Correct') 
                              : (language === 'id' ? 'Salah' : 'Incorrect')}
                          </Badge>
                        </div>
                        
                        <p className="text-sm mb-1">{attempt.question_text}</p>
                        <div className="text-xs text-muted-foreground mt-2">
                          <div className="flex gap-x-4">
                            <span>
                              <strong>{language === 'id' ? 'Jawaban Anda' : 'Your answer'}:</strong>{' '}
                              <span className={attempt.is_correct ? 'text-green-600' : 'text-red-600'}>
                                {attempt.student_answer}
                              </span>
                            </span>
                            {!attempt.is_correct && (
                              <span>
                                <strong>{language === 'id' ? 'Jawaban yang benar' : 'Correct answer'}:</strong>{' '}
                                <span className="text-green-600">{attempt.correct_answer}</span>
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-gray-500">
                            {new Date(attempt.attempted_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedQuizHistory;
