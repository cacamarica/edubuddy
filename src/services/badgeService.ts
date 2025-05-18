
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge, StudentBadge } from "./studentProgressService";

/**
 * Fetches all available badges in the system
 */
export const fetchAllBadges = async (): Promise<Badge[]> => {
  try {
    const { data, error } = await supabase.from('badges').select('*');
    if (error) {
      console.error('Error fetching badges:', error);
      return [];
    }
    
    return data as Badge[];
  } catch (error) {
    console.error('Error in fetchAllBadges:', error);
    return [];
  }
};

/**
 * Fetches badges earned by a specific student
 */
export const fetchStudentBadges = async (studentId: string): Promise<StudentBadge[]> => {
  try {
    const { data, error } = await supabase
      .from('student_badges')
      .select('*, badges(*)')
      .eq('student_id', studentId);
      
    if (error) {
      console.error('Error fetching student badges:', error);
      return [];
    }
    
    return data.map(item => ({
      id: item.id,
      student_id: item.student_id,
      badge_id: item.badge_id,
      earned_at: item.earned_at,
      badge: item.badges ? {
        id: item.badges.id,
        name: item.badges.name,
        description: item.badges.description,
        image_url: item.badges.image_url,
        created_at: item.badges.created_at
      } : undefined
    }));
  } catch (error) {
    console.error('Error in fetchStudentBadges:', error);
    return [];
  }
};

/**
 * Awards a badge to a student
 */
export const awardBadgeToStudent = async (studentId: string, badgeId: string): Promise<boolean> => {
  try {
    // Check if the student already has this badge
    const { data: existingBadge } = await supabase
      .from('student_badges')
      .select('*')
      .eq('student_id', studentId)
      .eq('badge_id', badgeId)
      .maybeSingle();
      
    if (existingBadge) {
      console.log('Student already has this badge');
      return false;
    }
    
    // Award the badge
    const { error } = await supabase
      .from('student_badges')
      .insert([{ student_id: studentId, badge_id: badgeId }]);
      
    if (error) {
      console.error('Error awarding badge:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in awardBadgeToStudent:', error);
    return false;
  }
};

export default {
  fetchAllBadges,
  fetchStudentBadges,
  awardBadgeToStudent
};
