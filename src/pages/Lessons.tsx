import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SubjectCard from '@/components/SubjectCard';
import TopicCarousel from '@/components/TopicCarousel';
import { Student, StudentProfile, convertToStudent } from '@/types/learning';
import { useStudentProfile } from '@/contexts/StudentProfileContext';
import useLearningGradeLevel from '@/hooks/useLearningGradeLevel';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { BookOpen, GraduationCap, UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Define Subject interface
interface Subject {
  id: string;
  name: string;
  description: string;
  color: string;
  textColor: string;
  icon: string;
}

// Enhanced data for subjects with grade-appropriate descriptions based on Cambridge curriculum
const getSubjects = (gradeLevel: 'k-3' | '4-6' | '7-9'): Subject[] => {
  switch (gradeLevel) {
    case 'k-3':
      return [
        {
          id: 'math',
          name: 'Math',
          description: 'Explore numbers, shapes, patterns, and basic measurements',
          color: 'bg-blue-500',
          textColor: 'text-blue-500',
          icon: '123',
        },
        {
          id: 'science',
          name: 'Science',
          description: 'Discover living things, materials, and the world around us',
          color: 'bg-green-500',
          textColor: 'text-green-500',
          icon: '🔬',
        },
        {
          id: 'english',
          name: 'English',
          description: 'Learn reading, writing, and communication skills',
          color: 'bg-purple-500', 
          textColor: 'text-purple-500',
          icon: '📚',
        },
        {
          id: 'social-studies',
          name: 'Social Studies',
          description: 'Explore people, places, and communities',
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
          description: 'Work with numbers, fractions, geometry, and problem solving',
          color: 'bg-blue-500',
          textColor: 'text-blue-500',
          icon: '123',
        },
        {
          id: 'science',
          name: 'Science',
          description: 'Study living things, matter, forces, and energy',
          color: 'bg-green-500',
          textColor: 'text-green-500',
          icon: '🔬',
        },
        {
          id: 'english',
          name: 'English',
          description: 'Develop reading, writing, and speaking skills',
          color: 'bg-purple-500', 
          textColor: 'text-purple-500',
          icon: '📚',
        },
        {
          id: 'social-studies',
          name: 'Social Studies',
          description: 'Learn about history, geography, and societies',
          color: 'bg-amber-500',
          textColor: 'text-amber-500',
          icon: '🏛️',
        },
        {
          id: 'technology',
          name: 'Technology',
          description: 'Explore digital literacy and basic programming',
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
          description: 'Study algebra, geometry, statistics, and mathematical reasoning',
          color: 'bg-blue-500',
          textColor: 'text-blue-500',
          icon: '123',
        },
        {
          id: 'science',
          name: 'Science',
          description: 'Explore biology, chemistry, physics, and scientific methods',
          color: 'bg-green-500',
          textColor: 'text-green-500',
          icon: '🔬',
        },
        {
          id: 'english',
          name: 'English',
          description: 'Develop literature analysis, composition, and language skills',
          color: 'bg-purple-500', 
          textColor: 'text-purple-500',
          icon: '📚',
        },
        {
          id: 'history',
          name: 'History',
          description: 'Study historical events, civilizations, and global developments',
          color: 'bg-amber-500',
          textColor: 'text-amber-500',
          icon: '🏛️',
        },
        {
          id: 'computer-science',
          name: 'Computer Science',
          description: 'Learn programming, computational thinking, and digital creation',
          color: 'bg-indigo-500',
          textColor: 'text-indigo-500',
          icon: '💻',
        },
      ];
  }
};

// Cambridge curriculum-aligned topics for each subject and grade level
const getCurriculumTopics = (subject: string, gradeLevel: 'k-3' | '4-6' | '7-9'): string[] => {
  // Math topics by grade level
  if (subject === 'Math' || subject === 'Mathematics') {
    switch (gradeLevel) {
      case 'k-3':
        return ['Numbers', 'Shapes', 'Patterns', 'Measurement', 'Addition', 'Subtraction'];
      case '4-6':
        return ['Numbers', 'Fractions', 'Decimals', 'Geometry', 'Measurement', 'Multiplication', 'Division'];
      case '7-9':
        return ['Algebra', 'Geometry', 'Statistics', 'Number Theory', 'Proportional Reasoning', 'Equations'];
    }
  }
  // Science topics by grade level
  else if (subject === 'Science') {
    switch (gradeLevel) {
      case 'k-3':
        return ['Living Things', 'Materials', 'Forces and Movement', 'Earth and Space', 'Light and Sound'];
      case '4-6':
        return ['Living Things', 'Matter', 'Forces and Energy', 'Earth and Space', 'Ecosystems'];
      case '7-9':
        return ['Living Things', 'Chemistry', 'Physics', 'Earth Science', 'Environmental Science'];
    }
  }
  // English topics by grade level
  else if (subject === 'English' || subject === 'Language Arts') {
    switch (gradeLevel) {
      case 'k-3':
        return ['Reading', 'Writing', 'Speaking', 'Listening', 'Phonics'];
      case '4-6':
        return ['Reading', 'Writing', 'Speaking and Listening', 'Grammar', 'Comprehension'];
      case '7-9':
        return ['Literature', 'Composition', 'Language Skills', 'Media Literacy', 'Research'];
    }
  }
  // Social Studies topics by grade level
  else if (subject === 'Social Studies' || subject === 'History') {
    switch (gradeLevel) {
      case 'k-3':
        return ['Family', 'Community', 'Maps', 'Culture', 'Jobs and Work'];
      case '4-6':
        return ['Geography', 'Early Civilizations', 'Government', 'Economics', 'Culture and Heritage'];
      case '7-9':
        return ['World History', 'Ancient Civilizations', 'Government Systems', 'Economics', 'Global Issues'];
    }
  }
  // Default/Technology/Computer Science topics
  else {
    switch (gradeLevel) {
      case 'k-3':
        return ['Digital Basics', 'Internet Safety', 'Simple Coding', 'Technology Tools'];
      case '4-6':
        return ['Digital Citizenship', 'Basic Programming', 'Online Research', 'Digital Creation'];
      case '7-9':
        return ['Programming', 'Web Development', 'Data and Information', 'Computational Thinking'];
    }
  }
}

const Lessons = () => {
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<'k-3' | '4-6' | '7-9'>('k-3');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [recentlyViewedTopics, setRecentlyViewedTopics] = useState<{subject: string, topic: string, id: string}[]>([]);
  const { selectedProfile } = useStudentProfile();
  const { language, t } = useLanguage();
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
    
    // If we have a selected profile, use the student's grade level
    if (selectedProfile?.gradeLevel) {
      setSelectedGradeLevel(selectedProfile.gradeLevel as 'k-3' | '4-6' | '7-9');
    }
    
    // If we have a selected profile, fetch their recently viewed topics
    if (selectedProfile?.id) {
      fetchRecentTopics(selectedProfile.id);
    }
  }, [location.state, selectedProfile]);

  // Get the grade level display text
  const getGradeLevelText = (gradeLevel: string) => {
    if (language === 'id') {
      switch (gradeLevel) {
        case 'k-3': return 'Kelas Awal (K-3)';
        case '4-6': return 'Kelas Menengah (4-6)';
        case '7-9': return 'Kelas Atas (7-9)';
        default: return gradeLevel;
      }
    } else {
      switch (gradeLevel) {
        case 'k-3': return 'Early Elementary (K-3)';
        case '4-6': return 'Upper Elementary (4-6)';
        case '7-9': return 'Middle School (7-9)';
        default: return gradeLevel;
      }
    }
  };

  // Fetch recently viewed topics for the student
  const fetchRecentTopics = async (studentId: string) => {
    try {
      const { data } = await supabase
        .from('learning_activities')
        .select('id, subject, topic, last_interaction_at')
        .eq('student_id', studentId)
        .order('last_interaction_at', { ascending: false })
        .limit(3);
        
      if (data) {
        const uniqueTopics = data.filter((item, index, self) => 
          index === self.findIndex((t) => t.topic === item.topic && t.subject === item.subject)
        );
        
        setRecentlyViewedTopics(uniqueTopics.map(item => ({
          id: item.id,
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

  const handleTopicSelect = (topic: string, subtopic?: string) => {
    if (!selectedSubject) return;
    
    // Convert selectedProfile to Student interface if available
    let student: Student | undefined;
    
    if (selectedProfile) {
      student = convertToStudent(selectedProfile);
    }
    
    if (!student) {
      navigate('/dashboard');
      return;
    }
    
    navigate('/ai-learning', {
      state: {
        gradeLevel: selectedGradeLevel,
        subject: selectedSubject,
        topic: topic,
        subtopic: subtopic,
        studentId: student.id,
        studentName: student.name,
        autoStart: true
      }
    });
  };

  const handleBackClick = () => {
    setSelectedSubject(null);
  };

  // Determine topics based on selected subject using Cambridge curriculum
  const getTopicsForSubject = () => {
    if (!selectedSubject) return [];
    // Use our new curriculum-aligned topics
    return getCurriculumTopics(selectedSubject, selectedGradeLevel);
  };

  const continueRecentActivity = (activity: {subject: string, topic: string}) => {
    if (!selectedProfile) return;
    
    const student = convertToStudent(selectedProfile);
    
    navigate('/ai-learning', {
      state: {
        gradeLevel: selectedProfile.gradeLevel || 'k-3',
        subject: activity.subject,
        topic: activity.topic,
        studentId: student.id,
        studentName: student.name,
        autoStart: true
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">Lessons</h1>
        
        {!selectedSubject ? (
          <>
            {/* Student profile and grade level info instead of grade selector */}
            <div className="mb-8">
              {selectedProfile ? (
                <Card className="p-4 border border-eduPurple/20 bg-eduPastel-purple/10">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-eduPurple/20 p-3 rounded-full">
                        <UserCircle className="h-8 w-8 text-eduPurple" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">{selectedProfile.name}</h2>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <GraduationCap className="h-4 w-4 mr-1 text-eduPurple" />
                          {getGradeLevelText(selectedProfile.gradeLevel || 'k-3')}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-eduPurple/80 hover:bg-eduPurple">
                      {language === 'id' ? 'Konten Disesuaikan untuk Tingkat Kelas' : 'Content Tailored for Grade Level'}
                    </Badge>
                  </div>
                  <div className="mt-3 text-sm">
                    <p className="text-muted-foreground">
                      {language === 'id' 
                        ? `Semua pelajaran disesuaikan untuk tingkat kelas ${getGradeLevelText(selectedGradeLevel)}.` 
                        : `All lessons are tailored for ${getGradeLevelText(selectedGradeLevel)} grade level.`}
                    </p>
                  </div>
                </Card>
              ) : (
                <Card className="p-4 border border-yellow-200 bg-yellow-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 p-2 rounded-full">
                      <BookOpen className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{language === 'id' ? 'Tidak Ada Profil Terpilih' : 'No Profile Selected'}</h2>
                      <p className="text-sm text-muted-foreground">
                        {language === 'id' 
                          ? 'Pilih profil siswa untuk konten yang dipersonalisasi' 
                          : 'Select a student profile for personalized content'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => navigate('/dashboard')}
                    >
                      {language === 'id' ? 'Pilih Profil Siswa' : 'Select Student Profile'}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
            
            {/* Rest of the existing content */}
            {recentlyViewedTopics.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-medium mb-4">Recently Viewed</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {recentlyViewedTopics.map((item, index) => (
                    <Card 
                      key={item.id || index}
                      className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                      onClick={() => continueRecentActivity(item)}
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
      <Footer />
    </div>
  );
};

export default Lessons;
