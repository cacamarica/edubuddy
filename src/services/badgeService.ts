
import { supabase } from "@/integrations/supabase/client";

// Interfaces for Badge Service
export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  awarded_at?: string;
  earned_at?: string;
  badge?: {
    id: string;
    name: string;
    description: string;
    image_url?: string;
    type: string;
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  type: string;
}

export interface BadgeAwardParams {
  studentId: string;
  badgeType: string;
  subject?: string;
  topic?: string;
  score?: number;
}

export const badgeService = {
  // Check achievements and award badges if criteria are met
  checkAndAwardBadges: async (params: BadgeAwardParams): Promise<Badge | null> => {
    try {
      // This is a placeholder implementation
      // In a real application, this would check various achievement criteria
      return null;
    } catch (error) {
      console.error("Error checking achievements:", error);
      return null;
    }
  },

  // Award a specific badge to a student
  awardBadge: async (params: {
    studentId: string;
    name: string;
    description: string;
    type: string;
    imageUrl?: string;
  }): Promise<Badge | null> => {
    try {
      // Check if badge type already exists
      const { data: existingBadge, error: badgeError } = await supabase
        .from('badges')
        .select('*')
        .eq('name', params.name)
        .single();

      let badgeId: string;
      
      if (badgeError || !existingBadge) {
        // Create the badge if it doesn't exist
        const { data: newBadge, error: createError } = await supabase
          .from('badges')
          .insert({
            name: params.name,
            description: params.description,
            type: params.type,
            image_url: params.imageUrl
          })
          .select()
          .single();
          
        if (createError || !newBadge) {
          console.error("Error creating badge:", createError);
          return null;
        }
        
        badgeId = newBadge.id;
      } else {
        badgeId = existingBadge.id;
      }
      
      // Award the badge to the student
      const { data: studentBadge, error: awardError } = await supabase
        .from('student_badges')
        .insert({
          student_id: params.studentId,
          badge_id: badgeId,
          awarded_at: new Date().toISOString()
        })
        .select('*, badge:badges(*)')
        .single();
        
      if (awardError) {
        console.error("Error awarding badge:", awardError);
        return null;
      }
      
      // Make sure we handle the type conversion correctly for the badge
      const badge = studentBadge?.badge;
      return badge ? {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        image_url: badge.image_url || undefined,
        type: badge.type || 'achievement' // Provide a default type if missing
      } : null;
    } catch (error) {
      console.error("Error in badge award process:", error);
      return null;
    }
  },

  // Fetch all badges for a student
  fetchStudentBadges: async (studentId: string): Promise<StudentBadge[]> => {
    try {
      const { data, error } = await supabase
        .from('student_badges')
        .select('*, badge:badges(*)')
        .eq('student_id', studentId);
        
      if (error) {
        console.error("Error fetching student badges:", error);
        return [];
      }
      
      // Transform the data to ensure it matches the StudentBadge type
      return (data || []).map(item => ({
        id: item.id,
        student_id: item.student_id,
        badge_id: item.badge_id,
        earned_at: item.earned_at,
        awarded_at: item.earned_at, // Using earned_at as a fallback for awarded_at
        badge: item.badge ? {
          id: item.badge.id,
          name: item.badge.name,
          description: item.badge.description,
          image_url: item.badge.image_url || undefined,
          // Use a default type if it's missing in the database
          type: item.badge.type || 'achievement'
        } : undefined
      })) as StudentBadge[];
    } catch (error) {
      console.error("Error in student badges fetch:", error);
      return [];
    }
  }
};

// Export the individual functions for direct imports
export const { fetchStudentBadges, awardBadge, checkAndAwardBadges } = badgeService;
