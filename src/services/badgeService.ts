
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Define proper interfaces for badges
export interface Badge {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  created_at: string;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

// Interface for badge checking parameters
export interface BadgeCheckOptions {
  studentId: string;
  badgeType: string;
  subject?: string;
  score?: number;
  totalQuestions?: number;
}

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

/**
 * Check and award badges based on specific criteria
 */
export const checkAndAwardBadges = async (options: BadgeCheckOptions): Promise<boolean> => {
  try {
    const { studentId, badgeType, subject, score, totalQuestions } = options;
    
    // Get all available badges
    const badges = await fetchAllBadges();
    
    // Find the appropriate badge based on type
    let badgeToAward: Badge | undefined;
    
    switch (badgeType) {
      case "quiz_completion_first":
        badgeToAward = badges.find(b => b.name === "First Quiz");
        break;
      case "quiz_completion_5":
        if (subject) {
          badgeToAward = badges.find(b => b.name === `${subject} Expert`);
        }
        break;
      case "quiz_perfect_score":
        if (score && totalQuestions && score === totalQuestions) {
          badgeToAward = badges.find(b => b.name === "Perfect Score");
        }
        break;
      default:
        console.log(`No badge type match for: ${badgeType}`);
        return false;
    }
    
    if (!badgeToAward) {
      console.log(`No badge found for type: ${badgeType}`);
      return false;
    }
    
    // Award the badge
    return await awardBadgeToStudent(studentId, badgeToAward.id);
    
  } catch (error) {
    console.error('Error in checkAndAwardBadges:', error);
    return false;
  }
};

// Export as a named export for use in components that import it as such
export const badgeService = {
  fetchAllBadges,
  fetchStudentBadges,
  awardBadgeToStudent,
  checkAndAwardBadges
};

// Also export as default for backward compatibility
export default {
  fetchAllBadges,
  fetchStudentBadges,
  awardBadgeToStudent,
  checkAndAwardBadges
};
