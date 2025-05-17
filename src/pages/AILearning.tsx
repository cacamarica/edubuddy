
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LearningBuddy from '@/components/LearningBuddy';
import StudentProfile from '@/components/StudentProfile';
import { toast } from 'sonner';
import LearningHeader from '@/components/LearningComponents/LearningHeader';
import TopicSelector from '@/components/LearningComponents/TopicSelector';
import LearningContent from '@/components/LearningComponents/LearningContent';
import useLearningGradeLevel from '@/hooks/useLearningGradeLevel';
import useStarsManager from '@/hooks/useStarsManager';

interface Student {
  id: string;
  name: string;
  age: number;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  avatar?: string;
}

const AILearning = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { stars, addStars } = useStarsManager();
  
  const initialGradeLevel = (location.state?.gradeLevel as 'k-3' | '4-6' | '7-9') || 'k-3';
  const { 
    gradeLevel, 
    setGradeLevel, 
    subjectOptions, 
    getTopicSuggestionsForSubject,
    updateGradeLevelFromStudent
  } = useLearningGradeLevel(initialGradeLevel);
  
  const [subject, setSubject] = useState<string>(location.state?.subject || 'Math');
  const [topic, setTopic] = useState<string>(location.state?.topic || '');
  const [contentReady, setContentReady] = useState(false);
  const [activeTab, setActiveTab] = useState('lesson');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [customTopic, setCustomTopic] = useState('');

  // Handle auto-start of content if navigated with specific topic
  useEffect(() => {
    if (location.state?.topic && location.state?.autoStart && !contentReady) {
      setTopic(location.state.topic);
      setContentReady(true);
      toast.success(`Starting ${location.state.topic} in ${location.state.subject}!`, {
        position: "bottom-right",
        duration: 3000,
      });
    }
  }, [location.state, contentReady]);

  // Update subject when grade level changes
  useEffect(() => {
    // If current subject is not available in the new grade level, set to first available
    if (!subjectOptions.includes(subject)) {
      setSubject(subjectOptions[0]);
    }
  }, [gradeLevel, subject, subjectOptions]);

  // Update grade level when student profile changes
  useEffect(() => {
    if (currentStudent) {
      updateGradeLevelFromStudent(currentStudent);
    }
  }, [currentStudent, updateGradeLevelFromStudent]);

  const handleGoBack = () => {
    navigate('/lessons');
  };

  const handleTopicSelect = (suggestion: string) => {
    setTopic(suggestion);
    setCustomTopic('');
  };

  const handleCreateContent = () => {
    const finalTopic = customTopic.trim() ? customTopic : topic;
    if (finalTopic.trim()) {
      setTopic(finalTopic);
      setContentReady(true);
    } else {
      toast.error("Please enter a topic or select one from the suggestions");
    }
  };

  const handleQuizComplete = (score: number) => {
    addStars(score);
  };

  // Reset to topic selection
  const handleReset = () => {
    setContentReady(false);
    setTopic('');
    setCustomTopic('');
    setActiveTab('lesson');
  };

  const handleStudentChange = (student: Student) => {
    setCurrentStudent(student);
    updateGradeLevelFromStudent(student);
    setShowProfileManager(false);
  };

  const handleToggleProfileManager = () => {
    setShowProfileManager(!showProfileManager);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <LearningHeader 
          currentStudent={currentStudent}
          stars={stars}
          showProfileManager={showProfileManager}
          onToggleProfileManager={handleToggleProfileManager}
          onGoBack={handleGoBack}
        />
        
        {showProfileManager && (
          <section className="py-4">
            <div className="container px-4 md:px-6">
              <StudentProfile 
                onStudentChange={handleStudentChange} 
                currentStudentId={currentStudent?.id} 
              />
            </div>
          </section>
        )}
        
        <section className="py-8">
          <div className="container px-4 md:px-6">
            {!contentReady ? (
              <div className="grid gap-6 md:grid-cols-3">
                {!currentStudent && (
                  <div className="md:col-span-3">
                    <StudentProfile onStudentChange={handleStudentChange} />
                  </div>
                )}
                
                <TopicSelector
                  subject={subject}
                  subjectOptions={subjectOptions}
                  topicSuggestions={getTopicSuggestionsForSubject(subject)}
                  customTopic={customTopic}
                  onSubjectChange={setSubject}
                  onTopicSelect={handleTopicSelect}
                  onCustomTopicChange={setCustomTopic}
                  onCreateContent={handleCreateContent}
                />
              </div>
            ) : (
              <LearningContent
                subject={subject}
                gradeLevel={gradeLevel}
                topic={topic}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onReset={handleReset}
                onQuizComplete={handleQuizComplete}
              />
            )}
          </div>
        </section>
        
        {/* Learning Buddy */}
        <LearningBuddy />
      </main>
      
      <Footer />
    </div>
  );
};

export default AILearning;
