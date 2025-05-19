
// Student types
export interface Student {
  id: string;
  name: string;
  grade_level: string;
  age?: number | null; // Changed to allow null
  parent_id: string;
  created_at: string;
  avatar_url?: string | null; // Changed to allow null
}

export interface StudentProfile {
  id: string;
  name: string;
  gradeLevel: string;
  parentId: string;
  createdAt: string;
  avatarUrl?: string | null; // Changed to allow null
  age?: number | null; // Changed to allow null
  grade_level?: string;
  parent_id?: string;
  created_at?: string;
  avatar_url?: string | null; // Changed to allow null
}

// Helper function to convert between formats
export function convertToStudent(profile: StudentProfile): Student {
  return {
    id: profile.id,
    name: profile.name,
    grade_level: profile.gradeLevel || profile.grade_level || 'k-3',
    parent_id: profile.parentId || profile.parent_id || '',
    created_at: profile.createdAt || profile.created_at || new Date().toISOString(),
    avatar_url: profile.avatarUrl || profile.avatar_url,
    age: profile.age
  };
}

export function convertToStudentProfile(student: Student): StudentProfile {
  return {
    id: student.id,
    name: student.name,
    gradeLevel: student.grade_level,
    parentId: student.parent_id,
    createdAt: student.created_at,
    avatarUrl: student.avatar_url,
    age: student.age
  };
}

// Subject interface for consistency
export interface Subject {
  id: string;
  name: string;
  description: string;
  color: string;
  textColor: string;
  icon: string;
}

// Define interfaces for quiz history
export interface QuizAttempt {
  id: string;
  quiz_title?: string;
  question_text: string;
  student_answer?: string;
  correct_answer: string;
  is_correct: boolean;
  attempted_at: string;
}

export interface TopicQuizHistory {
  topic: string;
  topicName?: string;
  attempts: QuizAttempt[];
}
