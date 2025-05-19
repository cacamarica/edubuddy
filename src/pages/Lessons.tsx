import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GradeSelector from '@/components/GradeSelector';
import SubjectCard from '@/components/SubjectCard';
import TopicCarousel from '@/components/TopicCarousel';
import { Student, StudentProfile, convertToStudent } from '@/types/learning';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import useLearningGradeLevel from '@/hooks/useLearningGradeLevel';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Define Subject interface
interface Subject {
  id: string;
  name: string;
  description: string;
  color: string;
  textColor: string;
  icon: string;
}

// Enhanced data for subjects with grade-appropriate descriptions
const getSubjects = (gradeLevel: 'k-3' | '4-6' | '7-9'): Subject[] => {
  switch (gradeLevel) {
    case 'k-3':
      return [
        {
          id: 'math',
          name: 'Math',
          description: 'Learn counting, shapes, addition, and subtraction with fun games',
          color: 'bg-blue-500',
          textColor: 'text-blue-500',
          icon: '123',
        },
        {
          id: 'science',
          name: 'Science',
          description: 'Discover animals, plants, and the world around you',
          color: 'bg-green-500',
          textColor: 'text-green-500',
          icon: '🔬',
        },
        {
          id: 'reading',
          name: 'Reading',
          description: 'Learn letters, sounds, and start reading fun stories',
          color: 'bg-purple-500', 
          textColor: 'text-purple-500',
          icon: '📚',
        },
        {
          id: 'social-studies',
          name: 'Social Studies',
          description: 'Learn about family, community, and the world',
          color: 'bg-amber-500',
          textColor: 'text-amber-500',
          icon: '🏛️',
        },
      ];
    case '4-6':
      return [
        {
          id: 'math',
          name: 'Math',
          description: 'Learn multiplication, division, fractions, and problem solving',
          color: 'bg-blue-500',
          textColor: 'text-blue-500',
          icon: '123',
        },
        {
          id: 'science',
          name: 'Science',
          description: 'Explore life cycles, ecosystems, energy, and simple machines',
          color: 'bg-green-500',
          textColor: 'text-green-500',
          icon: '🔬',
        },
        {
          id: 'language-arts',
          name: 'Language Arts',
          description: 'Develop reading comprehension, writing skills, and grammar',
          color: 'bg-purple-500', 
          textColor: 'text-purple-500',
          icon: '📚',
        },
        {
          id: 'social-studies',
          name: 'Social Studies',
          description: 'Learn about states, countries, history, and geography',
          color: 'bg-amber-500',
          textColor: 'text-amber-500',
          icon: '🏛️',
        },
        {
          id: 'technology',
          name: 'Technology',
          description: 'Start coding, digital citizenship, and computer skills',
          color: 'bg-indigo-500',
          textColor: 'text-indigo-500',
          icon: '💻',
        },
      ];
    case '7-9':
    default:
      return [
        {
          id: 'math',
          name: 'Mathematics',
          description: 'Algebra, geometry, statistics, and complex problem solving',
          color: 'bg-blue-500',
          textColor: 'text-blue-500',
          icon: '123',
        },
        {
          id: 'science',
          name: 'Science',
          description: 'Physics, chemistry, biology, and scientific methods',
          color: 'bg-green-500',
          textColor: 'text-green-500',
          icon: '🔬',
        },
        {
          id: 'language-arts',
          name: 'Language Arts',
          description: 'Literature analysis, essay writing, and critical thinking',
          color: 'bg-purple-500', 
          textColor: 'text-purple-500',
          icon: '📚',
        },
        {
          id: 'history',
          name: 'History',
          description: 'World history, civilizations, and government systems',
          color: 'bg-amber-500',
          textColor: 'text-amber-500',
          icon: '🏛️',
        },
        {
          id: 'computer-science',
          name: 'Computer Science',
          description: 'Programming, algorithms, and digital creation',
          color: 'bg-indigo-500',
          textColor: 'text-indigo-500',
          icon: '💻',
        },
      ];
  }
};

const Lessons = () => {
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<'k-3' | '4-6' | '7-9'>('k-3');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [recentlyViewedTopics, setRecentlyViewedTopics] = useState<{subject: string, topic: string}[]>([]);
  const { selectedProfile } = useStudentProfile();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use the hook to get grade-appropriate subject and topic data
  const { getTopicSuggestionsForSubject } = useLearningGradeLevel(selectedGradeLevel);
  
  // Get subjects based on selected grade level
  const subjects = getSubjects(selectedGradeLevel);
  
  // Check for state from navigation
  useEffect(() => {
    if (location.state) {
      const { gradeLevel } = location.state;
      if (gradeLevel) {
        setSelectedGradeLevel(gradeLevel as 'k-3' | '4-6' | '7-9');
      }
    }
    
    // If we have a selected profile, fetch their recently viewed topics
    if (selectedProfile?.id) {
      fetchRecentTopics(selectedProfile.id);
    }
  }, [location.state, selectedProfile]);

  // Fetch recently viewed topics for the student
  const fetchRecentTopics = async (studentId: string) => {
    try {
      const { data } = await supabase
        .from('learning_activities')
        .select('subject, topic, last_interaction_at')
        .eq('student_id', studentId)
        .order('last_interaction_at', { ascending: false })
        .limit(3);
        
      if (data) {
        const uniqueTopics = data.filter((item, index, self) => 
          index === self.findIndex((t) => t.topic === item.topic && t.subject === item.subject)
        );
        
        setRecentlyViewedTopics(uniqueTopics.map(item => ({
          subject: item.subject,
          topic: item.topic
        })));
      }
    } catch (error) {
      console.error("Error fetching recent topics:", error);
    }
  };

  const handleSubjectSelect = (subjectId: string) => {
    // Find the corresponding subject
    const subject = subjects.find(s => s.id === subjectId);
    if (subject) {
      setSelectedSubject(subject.name);
    }
  };

  const handleTopicSelect = (topic: string) => {
    if (!selectedSubject) return;
    
    // Convert selectedProfile to Student interface if available
    let student: Student | undefined;
    
    if (selectedProfile) {
      student = convertToStudent(selectedProfile);
    }
    
    navigate('/ai-learning', {
      state: {
        gradeLevel: selectedGradeLevel,
        subject: selectedSubject,
        topic: topic,
        studentId: selectedProfile?.id,
        studentName: selectedProfile?.name,
        autoStart: true
      }
    });
  };

  const handleBackClick = () => {
    setSelectedSubject(null);
  };

  // Determine topics based on selected subject
  const getTopicsForSubject = () => {
    if (!selectedSubject) return [];
    return getTopicSuggestionsForSubject(selectedSubject);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Lessons</h1>
      
      {!selectedSubject ? (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-medium mb-4">Select Grade Level</h2>
            <GradeSelector 
              selectedGradeLevel={selectedGradeLevel} 
              onGradeChange={setSelectedGradeLevel}
            />
          </div>
          
          {recentlyViewedTopics.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-medium mb-4">Recently Viewed</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recentlyViewedTopics.map((item, index) => (
                  <Card 
                    key={index}
                    className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                    onClick={() => navigate('/ai-learning', {
                      state: {
                        gradeLevel: selectedGradeLevel,
                        subject: item.subject,
                        topic: item.topic,
                        studentId: selectedProfile?.id,
                        studentName: selectedProfile?.name,
                        autoStart: true
                      }
                    })}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{item.topic}</h3>
                        <p className="text-sm text-gray-500">{item.subject}</p>
                      </div>
                      <Button variant="ghost" size="sm">Continue</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h2 className="text-xl font-medium mb-4">Select Subject</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((subject) => (
                <SubjectCard 
                  key={subject.id}
                  subject={subject.name}
                  gradeLevel={selectedGradeLevel}
                  onClick={() => handleSubjectSelect(subject.id)}
                  description={subject.description}
                  color={subject.color}
                  textColor={subject.textColor}
                  iconText={subject.icon}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <TopicCarousel
          gradeLevel={selectedGradeLevel}
          subjectName={selectedSubject}
          topicList={getTopicsForSubject()}
          onSelectTopic={handleTopicSelect}
          onBackClick={handleBackClick}
          currentGrade={selectedGradeLevel}
        />
      )}
    </div>
  );
};

export default Lessons;
