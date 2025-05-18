
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GradeSelector from '@/components/GradeSelector';
import SubjectCard from '@/components/SubjectCard';
import TopicCarousel from '@/components/TopicCarousel';
import { Student, StudentProfile } from '@/types/learning';
import { useStudentProfile } from '@/contexts/StudentProfileContext';

// Mock data for subjects
const subjects = [
  {
    id: 'math',
    name: 'Math',
    description: 'Learn fundamental math concepts through interactive lessons',
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
    icon: '123',
  },
  {
    id: 'science',
    name: 'Science',
    description: 'Discover scientific principles with engaging experiments',
    color: 'bg-green-500',
    textColor: 'text-green-500',
    icon: '🔬',
  },
  {
    id: 'english',
    name: 'English',
    description: 'Master language arts with fun reading and writing activities',
    color: 'bg-purple-500', 
    textColor: 'text-purple-500',
    icon: '📚',
  },
  {
    id: 'history',
    name: 'History',
    description: 'Explore the past with captivating historical stories',
    color: 'bg-amber-500',
    textColor: 'text-amber-500',
    icon: '🏛️',
  },
];

// Mock data for topics
const topics = {
  math: ['Addition & Subtraction', 'Multiplication', 'Division', 'Fractions', 'Geometry'],
  science: ['Animals', 'Plants', 'Weather', 'Human Body', 'Simple Machines'],
  english: ['Phonics', 'Reading Comprehension', 'Grammar', 'Vocabulary', 'Writing'],
  history: ['Ancient Civilizations', 'World Explorers', 'American History', 'Government', 'Cultural Studies'],
};

const Lessons = () => {
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<'k-3' | '4-6' | '7-9'>('k-3');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const { selectedProfile } = useStudentProfile();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for state from navigation
  useEffect(() => {
    if (location.state) {
      const { gradeLevel } = location.state;
      if (gradeLevel) {
        setSelectedGradeLevel(gradeLevel as 'k-3' | '4-6' | '7-9');
      }
    }
  }, [location.state]);

  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubject(subjectId);
  };

  const handleTopicSelect = (topic: string) => {
    if (!selectedSubject) return;
    
    // Adapt student profile to Student interface if necessary
    const student: Student = selectedProfile ? {
      id: selectedProfile.id,
      name: selectedProfile.name,
      grade_level: selectedProfile.grade_level,
      parent_id: selectedProfile.parent_id,
      created_at: selectedProfile.created_at,
      avatar_url: selectedProfile.avatar_url,
      age: 0 // Provide a default value
    } : {
      id: '',
      name: '',
      grade_level: '',
      parent_id: '',
      created_at: '',
      age: 0
    };
    
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Lessons</h1>
      
      {!selectedSubject ? (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-medium mb-4">Select Grade Level</h2>
            <GradeSelector 
              selectedGradeLevel={selectedGradeLevel} 
              onGradeLevelChange={setSelectedGradeLevel}
            />
          </div>
          
          <div>
            <h2 className="text-xl font-medium mb-4">Select Subject</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((subject) => (
                <SubjectCard 
                  key={subject.id}
                  subject={subject}
                  onClick={() => handleSubjectSelect(subject.id)}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <TopicCarousel
          subject={selectedSubject}
          topics={topics[selectedSubject as keyof typeof topics] || []}
          onTopicSelect={handleTopicSelect}
          onBackClick={handleBackClick}
        />
      )}
    </div>
  );
};

export default Lessons;
