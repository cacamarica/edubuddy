
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
}

// Helper function to convert between formats
export function convertToStudentProfile(student: Student): StudentProfile {
  return {
    id: student.id,
    name: student.name,
    gradeLevel: student.grade_level,
    parentId: student.parent_id,
    createdAt: student.created_at,
    avatarUrl: student.avatar_url
  };
}

export function convertToStudent(profile: StudentProfile): Student {
  return {
    id: profile.id,
    name: profile.name,
    grade_level: profile.gradeLevel,
    parent_id: profile.parentId,
    created_at: profile.createdAt,
    avatar_url: profile.avatarUrl
  };
}
