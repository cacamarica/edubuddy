
import { useState, useEffect } from 'react';

interface Student {
  id: string;
  name: string;
  age: number;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  avatar?: string;
}

const useLearningGradeLevel = (initialGradeLevel: 'k-3' | '4-6' | '7-9' = 'k-3') => {
  const [gradeLevel, setGradeLevel] = useState<'k-3' | '4-6' | '7-9'>(initialGradeLevel);
  
  // Common subject options based on grade level
  const subjectOptions = {
    'k-3': ['Math', 'Reading', 'Science', 'Social Studies'],
    '4-6': ['Math', 'Language Arts', 'Science', 'Social Studies', 'Art'],
    '7-9': ['Mathematics', 'Language Arts', 'Science', 'History', 'Geography', 'Art']
  };

  // Topic suggestions based on subject and grade level
  const topicSuggestions = {
    'k-3': {
      'Math': ['Counting', 'Addition', 'Subtraction', 'Shapes', 'Patterns'],
      'Mathematics': ['Counting', 'Addition', 'Subtraction', 'Shapes', 'Patterns'],
      'Reading': ['Alphabet', 'Sight Words', 'Phonics', 'Story Elements', 'Rhyming'],
      'English': ['Alphabet', 'Sight Words', 'Phonics', 'Story Elements', 'Rhyming'],
      'Science': ['Animals', 'Plants', 'Weather', 'Seasons', 'Five Senses'],
      'Social Studies': ['Community Helpers', 'Maps', 'Holidays', 'Family', 'Rules']
    },
    '4-6': {
      'Math': ['Fractions', 'Decimals', 'Multiplication', 'Division', 'Measurement'],
      'Mathematics': ['Fractions', 'Decimals', 'Multiplication', 'Division', 'Measurement'],
      'Language Arts': ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing Process', 'Poetry'],
      'English': ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing Process', 'Poetry'],
      'Science': ['Life Cycles', 'Habitats', 'Simple Machines', 'Earth', 'Matter'],
      'Social Studies': ['States', 'Historical Figures', 'Government', 'Economics', 'Geography'],
      'Art': ['Color Theory', 'Famous Artists', 'Art Techniques', 'Art History', 'Crafts']
    },
    '7-9': {
      'Math': ['Algebra', 'Geometry', 'Statistics', 'Probability', 'Equations'],
      'Mathematics': ['Algebra', 'Geometry', 'Statistics', 'Probability', 'Equations'],
      'Language Arts': ['Literature Analysis', 'Essay Writing', 'Research Skills', 'Debate', 'Media Literacy'],
      'English': ['Literature Analysis', 'Essay Writing', 'Research Skills', 'Debate', 'Media Literacy'],
      'Science': ['Biology', 'Chemistry', 'Physics', 'Astronomy', 'Environmental Science'],
      'History': ['Ancient Civilizations', 'World Wars', 'Civil Rights', 'American History', 'World History'],
      'Geography': ['Continents', 'Climate Zones', 'Natural Resources', 'Population', 'Cultures'],
      'Art': ['Perspective Drawing', 'Art Movements', 'Digital Art', 'Photography', 'Sculpture']
    }
  };

  // Update grade level when student profile changes
  const updateGradeLevelFromStudent = (student: Student) => {
    if (student) {
      setGradeLevel(student.gradeLevel);
    }
  };

  // Find the right topic suggestions based on subject name
  const getTopicSuggestionsForSubject = (subj: string) => {
    // Handle different naming conventions for similar subjects
    if (subj === 'Mathematics') return topicSuggestions[gradeLevel]['Math'] || [];
    if (subj === 'English') return topicSuggestions[gradeLevel]['Language Arts'] || topicSuggestions[gradeLevel]['Reading'] || [];
    return topicSuggestions[gradeLevel][subj] || [];
  };

  return {
    gradeLevel,
    setGradeLevel,
    subjectOptions: subjectOptions[gradeLevel],
    getTopicSuggestionsForSubject,
    updateGradeLevelFromStudent,
  };
};

export default useLearningGradeLevel;
