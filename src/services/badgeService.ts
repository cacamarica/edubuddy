
import { supabase } from '@/integrations/supabase/client';
import { Badge, StudentBadge } from './studentProgressService';

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
    
    return data.map(item => ({
      ...item,
      badge: item.badges
    })) as StudentBadge[];
  } catch (error) {
    console.error("Error in fetchStudentBadges:", error);
    return [];
  }
};

// Export the badgeService object for components that need it
export const badgeService = {
  fetchStudentBadges
};

