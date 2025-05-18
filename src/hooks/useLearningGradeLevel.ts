
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
  
  // Enhanced subject options based on grade level (expanded for K1-K9)
  const subjectOptions = {
    'k-3': [
      'Math',
      'Reading',
      'Science',
      'Social Studies',
      'Art',
      'Music',
      'Health',
      'Beginning Computer'
    ],
    '4-6': [
      'Math',
      'Language Arts',
      'Science',
      'Social Studies',
      'Art',
      'Music',
      'Health',
      'Technology',
      'Geography'
    ],
    '7-9': [
      'Mathematics',
      'Language Arts',
      'Science',
      'History',
      'Geography',
      'Art',
      'Computer Science',
      'Foreign Languages',
      'Health',
      'Physical Education',
      'Algebra',
      'Geometry'
    ]
  };

  // Topic suggestions based on subject and grade level (expanded for K1-K9)
  const topicSuggestions = {
    'k-3': {
      'Math': ['Numbers 1-10', 'Counting', 'Addition', 'Subtraction', 'Shapes', 'Patterns', 'Comparing Numbers', 'Basic Measurement'],
      'Mathematics': ['Numbers 1-10', 'Counting', 'Addition', 'Subtraction', 'Shapes', 'Patterns', 'Comparing Numbers', 'Basic Measurement'],
      'Reading': ['Alphabet', 'Sight Words', 'Phonics', 'Story Elements', 'Rhyming', 'Beginning Reading', 'Sentence Structure', 'Vocabulary Building'],
      'English': ['Alphabet', 'Sight Words', 'Phonics', 'Story Elements', 'Rhyming', 'Beginning Reading', 'Sentence Structure', 'Vocabulary Building'],
      'Science': ['Animals', 'Plants', 'Weather', 'Seasons', 'Five Senses', 'Living Things', 'Earth & Space', 'Simple Machines'],
      'Social Studies': ['Community Helpers', 'Maps', 'Holidays', 'Family', 'Rules', 'Neighborhoods', 'Cultural Awareness', 'Transportation'],
      'Art': ['Colors', 'Drawing', 'Crafts', 'Art Materials', 'Artists', 'Shapes in Art', 'Texture', 'Primary Colors'],
      'Music': ['Singing', 'Rhythm', 'Musical Instruments', 'Songs', 'Dance', 'Listening Skills', 'Musical Patterns', 'Sound Exploration'],
      'Health': ['Healthy Foods', 'Exercise', 'My Body', 'Feelings', 'Safety', 'Hygiene', 'Rest & Sleep', 'Nutrition'],
      'Beginning Computer': ['Mouse Skills', 'Keyboard Basics', 'Digital Safety', 'Simple Games', 'Educational Software', 'Computer Parts', 'Digital Etiquette']
    },
    '4-6': {
      'Math': ['Fractions', 'Decimals', 'Multiplication', 'Division', 'Measurement', 'Problem Solving', 'Geometry Basics', 'Data & Graphs'],
      'Mathematics': ['Fractions', 'Decimals', 'Multiplication', 'Division', 'Measurement', 'Problem Solving', 'Geometry Basics', 'Data & Graphs'],
      'Language Arts': ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing Process', 'Poetry', 'Literature', 'Research Skills', 'Spelling Patterns'],
      'English': ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing Process', 'Poetry', 'Literature', 'Research Skills', 'Spelling Patterns'],
      'Science': ['Life Cycles', 'Habitats', 'Simple Machines', 'Earth', 'Matter', 'Energy', 'Forces & Motion', 'Ecosystems'],
      'Social Studies': ['States', 'Historical Figures', 'Government', 'Economics', 'Geography', 'Ancient Civilizations', 'Map Skills', 'Current Events'],
      'Art': ['Color Theory', 'Famous Artists', 'Art Techniques', 'Art History', 'Crafts', 'Drawing Skills', 'Sculpture', 'Art Appreciation'],
      'Music': ['Music Reading', 'Composers', 'Music History', 'Instruments', 'Performances', 'Music Theory', 'Singing Techniques', 'World Music'],
      'Health': ['Nutrition', 'Hygiene', 'Growth and Development', 'Safety', 'First Aid', 'Disease Prevention', 'Emotional Health', 'Physical Activity'],
      'Technology': ['Typing', 'Internet Safety', 'Digital Citizenship', 'Coding Basics', 'Computer Parts', 'Word Processing', 'Presentation Software', 'Research Tools'],
      'Geography': ['Continents', 'Countries', 'Landforms', 'Map Reading', 'Natural Resources', 'Climate Zones', 'Cultural Geography', 'Physical Geography']
    },
    '7-9': {
      'Math': ['Algebra', 'Geometry', 'Statistics', 'Probability', 'Equations', 'Functions', 'Rational Numbers', 'Proportional Relationships'],
      'Mathematics': ['Algebra', 'Geometry', 'Statistics', 'Probability', 'Equations', 'Functions', 'Rational Numbers', 'Proportional Relationships'],
      'Algebra': ['Linear Equations', 'Functions', 'Expressions', 'Systems of Equations', 'Inequalities', 'Exponents', 'Polynomials', 'Quadratics'],
      'Geometry': ['Angles', 'Triangles', 'Circles', 'Area & Volume', 'Coordinate Geometry', 'Transformations', 'Congruence', 'Similarity'],
      'Language Arts': ['Literature Analysis', 'Essay Writing', 'Research Skills', 'Debate', 'Media Literacy', 'Grammar & Usage', 'Text Analysis', 'Rhetorical Devices'],
      'English': ['Literature Analysis', 'Essay Writing', 'Research Skills', 'Debate', 'Media Literacy', 'Grammar & Usage', 'Text Analysis', 'Rhetorical Devices'],
      'Science': ['Biology', 'Chemistry', 'Physics', 'Astronomy', 'Environmental Science', 'Genetics', 'Cell Structure', 'Scientific Method'],
      'History': ['Ancient Civilizations', 'World Wars', 'Civil Rights', 'American History', 'World History', 'Government Systems', 'Political Movements', 'Cultural Studies'],
      'Geography': ['Continents', 'Climate Zones', 'Natural Resources', 'Population', 'Cultures', 'Economic Geography', 'Human Geography', 'Cartography'],
      'Art': ['Perspective Drawing', 'Art Movements', 'Digital Art', 'Photography', 'Sculpture', 'Advanced Techniques', 'Art Criticism', 'Portfolio Development'],
      'Computer Science': ['Programming Basics', 'Web Design', 'Algorithm Design', 'Data Types', 'Problem Solving', 'Software Development', 'Digital Ethics', 'Computer Networks'],
      'Foreign Languages': ['Basic Vocabulary', 'Grammar Rules', 'Conversational Phrases', 'Cultural Studies', 'Reading', 'Writing Systems', 'Language Structure', 'Pronunciation'],
      'Health': ['Body Systems', 'Nutrition', 'Mental Health', 'Disease Prevention', 'Physical Fitness', 'Substance Abuse Prevention', 'Healthy Relationships', 'Personal Wellness'],
      'Physical Education': ['Team Sports', 'Individual Sports', 'Fitness Training', 'Health-Related Fitness', 'Movement Concepts', 'Recreational Activities', 'Sports Skills', 'Physical Activity']
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
