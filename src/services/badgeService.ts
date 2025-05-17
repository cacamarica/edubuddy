import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge, StudentBadge } from "./studentProgressService";

// Badge types based on different achievements
export type BadgeType = 
  "quiz_completion" | 
  "perfect_score" | 
  "subject_mastery" | 
  "first_quiz" |
  "lesson_completion" |
  "streak";

interface BadgeAwardParams {
  studentId: string;
  badgeType: BadgeType;
  subject?: string;
  topic?: string;
  score?: number;
  totalQuestions?: number;
}

export const badgeService = {
  // Check and award badges based on achievements
  async checkAndAwardBadges(params: BadgeAwardParams): Promise<Badge | null> {
    try {
      const { studentId, badgeType, subject, topic, score, totalQuestions } = params;
      
      // First, get existing badges to prevent duplicates
      let existingBadges: any[] = [];
      try {
        // Use direct fetch to avoid TypeScript type issues
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/student_badges?student_id=eq.${studentId}&select=badge_id,badges(name,type)`,
          {
            headers: {
              "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            }
          }
        );
        
        if (response.ok) {
          existingBadges = await response.json();
        }
      } catch (err) {
        console.error("Error fetching badges:", err);
        // Continue with empty badges array
      }

      // Map of existing badge types this student has
      const existingBadgeTypes = new Set(existingBadges.map(eb => eb.badges?.type));

      if (badgeType === "quiz_completion" && subject) {
        const badgeName = `${subject.charAt(0).toUpperCase() + subject.slice(1)} Quiz Completed`;
        const badgeDesc = `Completed a quiz in ${subject}`;
        
        // Check if student already has this badge
        if (!existingBadgeTypes.has(`quiz_${subject.toLowerCase()}`)) {
          return this.awardBadge({
            studentId,
            name: badgeName,
            description: badgeDesc,
            type: `quiz_${subject.toLowerCase()}`,
            imageUrl: `/badges/quiz_${subject.toLowerCase()}.png`
          });
        }
      }
      
      if (badgeType === "perfect_score" && score === totalQuestions && score && score > 0) {
        const badgeName = "Perfect Score";
        const badgeDesc = "Achieved a perfect score on a quiz";
        
        // Check if student already has this badge
        if (!existingBadgeTypes.has("perfect_score")) {
          return this.awardBadge({
            studentId,
            name: badgeName,
            description: badgeDesc,
            type: "perfect_score",
            imageUrl: "/badges/perfect_score.png"
          });
        }
      }
      
      if (badgeType === "first_quiz") {
        const badgeName = "First Quiz Completed";
        const badgeDesc = "Completed your first quiz";
        
        // Check if student already has this badge
        if (!existingBadgeTypes.has("first_quiz")) {
          return this.awardBadge({
            studentId,
            name: badgeName,
            description: badgeDesc,
            type: "first_quiz",
            imageUrl: "/badges/first_quiz.png"
          });
        }
      }

      if (badgeType === "lesson_completion" && subject && topic) {
        const badgeName = `${topic} Lesson Completed`;
        const badgeDesc = `Completed the ${topic} lesson in ${subject}`;
        
        // Check if student already has this badge
        const badgeTypeId = `lesson_${subject.toLowerCase()}_${topic.toLowerCase().replace(/\s/g, "_")}`;
        if (!existingBadgeTypes.has(badgeTypeId)) {
          return this.awardBadge({
            studentId,
            name: badgeName,
            description: badgeDesc,
            type: badgeTypeId,
            imageUrl: `/badges/lesson_${subject.toLowerCase()}.png`
          });
        }
      }
      
      // No new badge awarded
      return null;
      
    } catch (error) {
      console.error("Error checking and awarding badges:", error);
      return null;
    }
  },
  
  // Award a badge to a student
  async awardBadge(params: {
    studentId: string;
    name: string;
    description: string;
    type: string;
    imageUrl?: string;
  }): Promise<Badge | null> {
    try {
      const { studentId, name, description, type, imageUrl } = params;
      let badgeId: string;
      
      // Fetch badge by type using fetch API directly instead of Supabase client
      // to avoid TypeScript deep instantiation issues
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/badges?type=eq.${type}&select=id`,
          {
            headers: {
              "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            }
          }
        );
        
        if (response.ok) {
          const badges = await response.json();
          if (badges.length > 0) {
            badgeId = badges[0].id;
          } else {
            // Create a new badge using supabase client
            const { data: newBadge, error: createError } = await (supabase as any)
              .from("badges")
              .insert({
                name,
                description,
                type,
                image_url: imageUrl
              })
              .select("id")
              .single();
              
            if (createError) {
              throw createError;
            }
            
            badgeId = newBadge.id;
          }
        } else {
          throw new Error(`Failed to fetch badge: ${response.statusText}`);
        }
      } catch (err) {
        // Create a new badge if fetch fails
        const { data: newBadge, error: createError } = await (supabase as any)
          .from("badges")
          .insert({
            name,
            description,
            type,
            image_url: imageUrl
          })
          .select("id")
          .single();
          
        if (createError) {
          throw createError;
        }
        
        badgeId = newBadge.id;
      }
      
      // Award the badge to the student
      const { data: studentBadge, error: awardError } = await (supabase as any)
        .from("student_badges")
        .insert({
          student_id: studentId,
          badge_id: badgeId,
          earned_at: new Date().toISOString()
        })
        .select(`
          id,
          student_id,
          badge_id,
          earned_at,
          badges (
            id,
            name,
            description,
            image_url
          )
        `)
        .single();
        
      if (awardError) {
        throw awardError;
      }
      
      if (!studentBadge) {
        throw new Error("Failed to award badge");
      }
      
      toast.success(`New badge awarded: ${name}`);
      
      // Return the badge that was awarded
      return studentBadge.badges;
      
    } catch (error) {
      console.error("Error awarding badge:", error);
      return null;
    }
  }
};
