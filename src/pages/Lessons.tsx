
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GradeSelector from '@/components/GradeSelector';
import SubjectCard from '@/components/SubjectCard';
import TopicCarousel from '@/components/TopicCarousel';
import { Student, StudentProfile, convertToStudent, Subject } from '@/types/learning';
import { useStudentProfile } from '@/contexts/StudentProfileContext';

// Mock data for subjects
const subjects: Subject[] = [
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
const topics: Record<string, string[]> = {
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
          
          <div>
            <h2 className="text-xl font-medium mb-4">Select Subject</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((subject) => (
                <SubjectCard 
                  key={subject.id}
                  subject={subject.id}
                  gradeLevel={selectedGradeLevel}
                  onClick={() => handleSubjectSelect(subject.id)}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <TopicCarousel
          gradeLevel={selectedGradeLevel}
          onSelectTopic={handleTopicSelect}
          onBackClick={handleBackClick}
          subjectName={selectedSubject}
          topicList={topics[selectedSubject] || []}
          currentGrade={selectedGradeLevel}
        />
      )}
    </div>
  );
};

export default Lessons;
