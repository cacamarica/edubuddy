
// Add student types
export interface Student {
  id: string;
  name: string;
  grade_level: string;
  age?: number;
  parent_id: string;
  created_at: string;
  avatar_url?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  gradeLevel: string;
  parentId: string;
  createdAt: string;
  avatarUrl?: string;
  age?: number; // Added age to match Student interface
}

// Helper function to convert between formats
export function convertToStudent(profile: StudentProfile): Student {
  return {
    id: profile.id,
    name: profile.name,
    grade_level: profile.gradeLevel,
    parent_id: profile.parentId,
    created_at: profile.createdAt,
    avatar_url: profile.avatarUrl,
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

// Define Subject interface
export interface Subject {
  id: string;
  name: string;
  description: string;
  color: string;
  textColor: string;
  icon: string;
}
