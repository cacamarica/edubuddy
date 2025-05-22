
// Update the AILearning page to support subtopic selection
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import TopicSelector from '@/components/LearningComponents/TopicSelector';
import TopicCarousel from '@/components/TopicCarousel';
import useLearningGradeLevel from '@/hooks/useLearningGradeLevel';
import { Student, convertToStudent } from '@/types/learning';
import { toast } from 'sonner';

const AILearning = () => {
  const navigate = useNavigate();
  const { selectedProfile } = useStudentProfile();
  const { language } = useLanguage();
  const [subject, setSubject] = useState('Science');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState<string>(''); // Changed from string | null to string
  const [isNormalFlow, setIsNormalFlow] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);

  // Use the learning grade level hook
  const { 
    gradeLevel, 
    setGradeLevel,
    subjectOptions,
    getTopicSuggestionsForSubject
  } = useLearningGradeLevel('k-3');

  // Fetch all students for the parent
  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedProfile) {
        setGradeLevel(selectedProfile.gradeLevel as any || 'k-3');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('parent_id', localStorage.getItem('user_id') || 'guest');
          
        if (error) {
          console.error('Error fetching students:', error);
          return;
        }
        
        if (data && data.length > 0) {
          setStudents(data.map(student => convertToStudent({
            id: student.id,
            name: student.name,
            age: student.age || 10,
            gradeLevel: student.grade_level,
            parentId: student.parent_id,
            createdAt: student.created_at,
            avatarUrl: student.avatar_url
          })));
        }
      } catch (error) {
        console.error('Error in fetchStudents:', error);
      }
    };
    
    fetchStudents();
  }, [selectedProfile, setGradeLevel]);

  // Get topic suggestions based on subject
  const topicSuggestions = getTopicSuggestionsForSubject(subject);

  // Handle topic selection
  const handleSelectTopic = useCallback((selectedTopic: string, selectedSubtopic?: string) => {
    setTopic(selectedTopic);
    if (selectedSubtopic) {
      setSubtopic(selectedSubtopic);
    } else {
      setSubtopic('');  // Using empty string instead of null
    }

    // Toggle back to normal flow
    setIsNormalFlow(true);
  }, []);

  // Handle subject change
  const handleSubjectChange = useCallback((newSubject: string) => {
    setSubject(newSubject);
    setTopic('');
    setSubtopic(''); // Using empty string instead of null
  }, []);

  // Create learning content
  const handleCreateContent = useCallback((selectedSubtopic?: string) => {
    if (!topic) {
      toast.error(language === 'id' ? 'Topik belum dipilih' : 'No topic selected');
      return;
    }

    const pathParams = new URLSearchParams({
      subject,
      topic,
      ...(selectedSubtopic ? { subtopic: selectedSubtopic } : {}), // Only add if defined
      grade: gradeLevel
    });
    
    navigate(`/ai-lesson?${pathParams.toString()}`);
  }, [subject, topic, subtopic, gradeLevel, navigate, language]);

  // Handle view topics
  const handleViewTopics = useCallback(() => {
    setIsNormalFlow(false);
  }, []);

  // Handle back click from topic carousel
  const handleBackToSelector = useCallback(() => {
    setIsNormalFlow(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">
            {language === 'id' ? 'Belajar dengan AI' : 'Learn with AI'}
          </h1>
          <p className="text-gray-600 mb-8">
            {language === 'id' 
              ? 'Pilih topik dan buat konten pembelajaran yang dipersonalisasi' 
              : 'Select a topic and create personalized learning content'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {isNormalFlow ? (
              <>
                <Card className="md:col-span-1 p-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">
                        {language === 'id' ? 'Tingkat Kelas' : 'Grade Level'}
                      </h3>
                      <div className="space-y-2">
                        <Button 
                          variant={gradeLevel === 'k-3' ? "default" : "outline"}
                          className={`w-full ${gradeLevel === 'k-3' ? "bg-eduBlue hover:bg-eduBlue-dark" : ""}`}
                          onClick={() => setGradeLevel('k-3')}
                        >
                          {language === 'id' ? 'SD Kelas 1-3' : 'Grades K-3'}
                        </Button>
                        <Button 
                          variant={gradeLevel === '4-6' ? "default" : "outline"}
                          className={`w-full ${gradeLevel === '4-6' ? "bg-eduGreen hover:bg-eduGreen-dark" : ""}`}
                          onClick={() => setGradeLevel('4-6')}
                        >
                          {language === 'id' ? 'SD Kelas 4-6' : 'Grades 4-6'}
                        </Button>
                        <Button 
                          variant={gradeLevel === '7-9' ? "default" : "outline"}
                          className={`w-full ${gradeLevel === '7-9' ? "bg-eduPurple hover:bg-eduPurple-dark" : ""}`}
                          onClick={() => setGradeLevel('7-9')}
                        >
                          {language === 'id' ? 'SMP Kelas 7-9' : 'Grades 7-9'}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        {language === 'id' ? 'Jelajahi Semua Topik' : 'Browse All Topics'}
                      </h3>
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={handleViewTopics}
                      >
                        {language === 'id' ? 'Lihat Katalog Topik' : 'View Topic Catalog'}
                      </Button>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        {language === 'id' ? 'Jenis Konten' : 'Content Types'}
                      </h3>
                      <div className="space-y-2">
                        <Button 
                          variant="default"
                          className="w-full bg-eduPastel-green hover:bg-eduPastel-green/80"
                        >
                          {language === 'id' ? 'Pelajaran' : 'Lesson'} 
                          <span className="ml-2 bg-green-700 text-white text-xs px-2 py-0.5 rounded-full">
                            {language === 'id' ? 'Aktif' : 'Active'}
                          </span>
                        </Button>
                        <Button 
                          variant="outline"
                          className="w-full opacity-70"
                          disabled
                        >
                          {language === 'id' ? 'Kuis' : 'Quiz'}
                          <span className="ml-2 bg-gray-400 text-white text-xs px-2 py-0.5 rounded-full">
                            {language === 'id' ? 'Segera' : 'Soon'}
                          </span>
                        </Button>
                        <Button 
                          variant="outline"
                          className="w-full opacity-70"
                          disabled
                        >
                          {language === 'id' ? 'Permainan Edukasi' : 'Educational Game'}
                          <span className="ml-2 bg-gray-400 text-white text-xs px-2 py-0.5 rounded-full">
                            {language === 'id' ? 'Segera' : 'Soon'}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <TopicSelector 
                  subject={subject}
                  subjectOptions={subjectOptions}
                  topicSuggestions={topicSuggestions}
                  customTopic={topic}
                  onSubjectChange={handleSubjectChange}
                  onTopicSelect={setTopic}
                  onCustomTopicChange={setTopic}
                  onCreateContent={handleCreateContent}
                  studentId={selectedProfile?.id}
                  gradeLevel={gradeLevel}
                />
              </>
            ) : (
              <div className="md:col-span-4">
                <TopicCarousel 
                  subjectName={subject}
                  topicList={topicSuggestions}
                  onSelectTopic={handleSelectTopic}
                  onBackClick={handleBackToSelector}
                  gradeLevel={gradeLevel}
                  currentGrade={selectedProfile?.gradeLevel || undefined}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AILearning;
