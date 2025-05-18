
import { supabase } from '@/integrations/supabase/client';

// Define Badge and StudentBadge interfaces
export interface Badge {
  id: string;
  name: string;
  description: string;
  image_url: string;
  category?: string;
  created_at: string;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  earned_at: string;
  awarded_at?: string; // Make awarded_at optional since it doesn't exist in the database
  badge?: Badge;
}

// Fetch all badges for a student
export const fetchStudentBadges = async (studentId: string): Promise<StudentBadge[]> => {
  try {
    const { data, error } = await supabase
      .from('student_badges')
      .select(`
        *,
        badges:badge_id (*)
      `)
      .eq('student_id', studentId);
      
    if (error) {
      console.error("Error fetching student badges:", error);
      return [];
    }
    
    // Type assertion to convert the query result to StudentBadge[]
    return data.map(item => ({
      ...item,
      badge: item.badges,
      awarded_at: item.earned_at // Map earned_at to awarded_at for compatibility
    })) as unknown as StudentBadge[];
  } catch (error) {
    console.error("Error in fetchStudentBadges:", error);
    return [];
  }
};

// Award a badge to a student
export const awardBadge = async (studentId: string, badgeId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('student_badges')
      .insert([
        {
          student_id: studentId,
          badge_id: badgeId,
          earned_at: new Date().toISOString()
        }
      ]);
      
    if (error) {
      console.error("Error awarding badge:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in awardBadge:", error);
    return false;
  }
};

// Export the badgeService object for components that need it
export const badgeService = {
  fetchStudentBadges,
  awardBadge
};
