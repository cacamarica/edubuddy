
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
  grade_level: string;
  parent_id: string;
  created_at: string;
  avatar_url?: string;
}
