
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AIQuiz from '@/components/AIQuiz';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import QuizStartCard from '@/components/QuizComponents/QuizStartCard';
import { Button } from '@/components/ui/button';
import { BookText, ChevronLeft } from 'lucide-react';

const Quiz = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { selectedProfile } = useStudentProfile();
  const [quizStarted, setQuizStarted] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  // Define common subjects for quiz selection
  const subjects = [
    { id: 'math', name: language === 'id' ? 'Matematika' : 'Math', 
      topics: ['Numbers', 'Shapes', 'Addition', 'Subtraction', 'Multiplication', 'Division'] },
    { id: 'science', name: language === 'id' ? 'Sains' : 'Science', 
      topics: ['Living Things', 'Materials', 'Earth', 'Space', 'Energy'] },
    { id: 'english', name: language === 'id' ? 'Bahasa Inggris' : 'English', 
      topics: ['Reading', 'Writing', 'Grammar', 'Vocabulary'] }
  ];

  // Reset state when navigating away
  useEffect(() => {
    return () => {
      setQuizStarted(false);
      setSelectedSubject("");
      setSelectedTopic("");
    };
  }, []);

  // Handle starting a quiz
  const handleStartQuiz = () => {
    if (selectedSubject && selectedTopic) {
      setQuizStarted(true);
    }
  };

  // Handle subject selection
  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedTopic("");
  };

  // Handle topic selection
  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
  };

  // Determine grade level based on student profile
  const getGradeLevel = () => {
    if (selectedProfile?.gradeLevel) {
      return selectedProfile.gradeLevel as 'k-3' | '4-6' | '7-9';
    }
    return 'k-3';
  };

  // Get display name for selected subject
  const getSelectedSubjectName = () => {
    const subject = subjects.find(s => s.id === selectedSubject);
    return subject ? subject.name : selectedSubject;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {!quizStarted ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">
                  {language === 'id' ? 'Kuis Pembelajaran' : 'Learning Quiz'}
                </h1>
                <p className="text-gray-600">
                  {language === 'id' 
                    ? 'Pilih mata pelajaran dan topik untuk memulai kuis!'
                    : 'Choose a subject and topic to start a quiz!'}
                </p>
              </div>

              {!selectedSubject ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">
                    {language === 'id' ? 'Pilih Mata Pelajaran' : 'Select a Subject'}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {subjects.map((subject) => (
                      <Card 
                        key={subject.id} 
                        className={`p-4 cursor-pointer hover:border-primary transition-all ${
                          selectedSubject === subject.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => handleSubjectSelect(subject.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <BookText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{subject.name}</h3>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : !selectedTopic ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-6">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedSubject("")}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {language === 'id' ? 'Kembali' : 'Back'}
                    </Button>
                    <h2 className="text-xl font-semibold">
                      {language === 'id' ? `Topik ${getSelectedSubjectName()}` : `${getSelectedSubjectName()} Topics`}
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {subjects.find(s => s.id === selectedSubject)?.topics.map((topic) => (
                      <Card 
                        key={topic} 
                        className={`p-4 cursor-pointer hover:border-primary transition-all ${
                          selectedTopic === topic ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => handleTopicSelect(topic)}
                      >
                        <h3 className="font-medium">{topic}</h3>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <QuizStartCard
                  subject={getSelectedSubjectName()}
                  topic={selectedTopic}
                  onStartQuiz={handleStartQuiz}
                  onCancelQuiz={() => setSelectedTopic("")}
                  gradeLevel={getGradeLevel()}
                />
              )}
            </>
          ) : (
            <div>
              <Button 
                variant="ghost" 
                className="mb-4" 
                onClick={() => setQuizStarted(false)}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {language === 'id' ? 'Kembali' : 'Back'}
              </Button>
              
              <AIQuiz
                subject={getSelectedSubjectName()}
                gradeLevel={getGradeLevel()}
                topic={selectedTopic}
                onComplete={(score) => {
                  // Navigate to results page with state
                  navigate('/quiz/results', {
                    state: {
                      subject: getSelectedSubjectName(),
                      topic: selectedTopic,
                      score
                    }
                  });
                }}
                studentId={selectedProfile?.id}
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Quiz;
