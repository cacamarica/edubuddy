
// Define interfaces for AI learning components
export interface AILessonProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  limitProgress?: boolean;
}

export interface AIQuizProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  onComplete?: (score: number) => void;
  limitProgress?: boolean;
}

export interface AIGameProps {
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  limitProgress?: boolean;
}

// Define subject list by grade level
export interface SubjectsByGradeLevel {
  'k-3': string[];
  '4-6': string[];
  '7-9': string[];
}

export const subjectsByGradeLevel: SubjectsByGradeLevel = {
  'k-3': [
    'Math',
    'English',
    'Science',
    'Art',
    'Music',
    'Social Studies'
  ],
  '4-6': [
    'Math',
    'English',
    'Science',
    'History',
    'Geography',
    'Art',
    'Music',
    'Physical Education'
  ],
  '7-9': [
    'Math',
    'English',
    'Biology',
    'Chemistry',
    'Physics',
    'History',
    'Geography',
    'Computer Science',
    'Foreign Languages',
    'Literature'
  ]
};

// Define topic suggestions by subject
export interface TopicSuggestionsBySubject {
  [key: string]: string[];
}

export const topicSuggestionsBySubject: TopicSuggestionsBySubject = {
  'Math': [
    'Counting',
    'Addition',
    'Subtraction',
    'Multiplication',
    'Division',
    'Fractions',
    'Decimals',
    'Geometry',
    'Algebra',
    'Probability'
  ],
  'English': [
    'Alphabet',
    'Phonics',
    'Grammar',
    'Vocabulary',
    'Reading Comprehension',
    'Writing',
    'Parts of Speech',
    'Punctuation',
    'Essay Writing',
    'Creative Writing'
  ],
  'Science': [
    'Plants',
    'Animals',
    'Weather',
    'Seasons',
    'Human Body',
    'Solar System',
    'Water Cycle',
    'Ecosystems',
    'Simple Machines',
    'States of Matter'
  ],
  'Biology': [
    'Cells',
    'Genetics',
    'Human Body Systems',
    'Plants',
    'Animals',
    'Ecosystems',
    'Evolution',
    'Microorganisms'
  ],
  'Chemistry': [
    'Atoms',
    'Elements',
    'Periodic Table',
    'Chemical Reactions',
    'States of Matter',
    'Solutions'
  ],
  'Physics': [
    'Forces',
    'Motion',
    'Energy',
    'Light',
    'Sound',
    'Electricity',
    'Magnetism'
  ],
  'History': [
    'Ancient Civilizations',
    'Middle Ages',
    'World Wars',
    'Local History',
    'Famous People',
    'Government'
  ],
  'Geography': [
    'Continents',
    'Countries',
    'Oceans',
    'Maps',
    'Climate',
    'Natural Resources'
  ],
  'Art': [
    'Colors',
    'Shapes',
    'Drawing',
    'Painting',
    'Crafts',
    'Famous Artists'
  ],
  'Music': [
    'Instruments',
    'Rhythm',
    'Melody',
    'Famous Composers',
    'Singing',
    'Reading Music'
  ],
  'Social Studies': [
    'Communities',
    'Families',
    'Cultures',
    'Holidays',
    'Jobs',
    'Transportation'
  ],
  'Computer Science': [
    'Algorithms',
    'Coding Basics',
    'Internet Safety',
    'Hardware',
    'Software',
    'Programming Concepts'
  ],
  'Foreign Languages': [
    'Spanish Basics',
    'French Basics',
    'Mandarin Basics',
    'Greetings',
    'Numbers',
    'Everyday Phrases'
  ],
  'Literature': [
    'Fiction',
    'Poetry',
    'Drama',
    'Literary Analysis',
    'Famous Authors',
    'Creative Writing'
  ],
  'Physical Education': [
    'Team Sports',
    'Individual Sports',
    'Fitness',
    'Health',
    'Nutrition',
    'Safety'
  ]
};
