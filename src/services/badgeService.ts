
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge, StudentBadge } from "./studentProgressService";

// Badge types based on different achievements
export type BadgeType = 
  "quiz_completion_first" | 
  "quiz_completion_5" |
  "quiz_completion_10" |
  "quiz_perfect_score" | 
  "quiz_score_improvement" |
  "lesson_completion_first" |
  "lesson_completion_5" |
  "lesson_completion_10" |
  "lesson_completion_25" |
  "subject_math_5" |
  "subject_science_5" |
  "subject_language_5" |
  "streak_3_days" |
  "streak_7_days" |
  "streak_14_days" |
  "growth_retry_quiz" |
  "growth_difficult_lesson" |
  "game_first" |
  "game_5" |
  "curiosity_questions_5" |
  "curiosity_questions_10" |
  "family_session";

interface BadgeAwardParams {
  studentId: string;
  badgeType: BadgeType;
  subject?: string;
  topic?: string;
  score?: number;
  totalQuestions?: number;
  streakDays?: number;
  questionsAsked?: number;
  lessonCount?: number;
}

export const badgeService = {
  // Check and award badges based on achievements
  async checkAndAwardBadges(params: BadgeAwardParams): Promise<Badge | null> {
    try {
      const { 
        studentId, 
        badgeType, 
        subject, 
        topic, 
        score, 
        totalQuestions, 
        streakDays, 
        questionsAsked, 
        lessonCount 
      } = params;
      
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
      
      // Check for first quiz badge
      if (badgeType === "quiz_completion_first") {
        if (!existingBadgeTypes.has("quiz_completion_first")) {
          return this.awardBadgeByType(studentId, "quiz_completion_first");
        }
      }
      
      // Check for perfect score badge
      if (badgeType === "quiz_perfect_score" && score === totalQuestions && score && score > 0) {
        if (!existingBadgeTypes.has("quiz_perfect_score")) {
          return this.awardBadgeByType(studentId, "quiz_perfect_score");
        }
      }
      
      // Check for quiz improvement badge
      if (badgeType === "quiz_score_improvement") {
        if (!existingBadgeTypes.has("quiz_score_improvement")) {
          return this.awardBadgeByType(studentId, "quiz_score_improvement");
        }
      }
      
      // Check for lesson completion badges
      if (badgeType === "lesson_completion_first") {
        if (!existingBadgeTypes.has("lesson_completion_first")) {
          return this.awardBadgeByType(studentId, "lesson_completion_first");
        }
      }
      
      // Check for completed 5 lessons badge
      if (badgeType === "lesson_completion_5" && lessonCount && lessonCount >= 5) {
        if (!existingBadgeTypes.has("lesson_completion_5")) {
          return this.awardBadgeByType(studentId, "lesson_completion_5");
        }
      }
      
      // Check for completed 10 lessons badge
      if (badgeType === "lesson_completion_10" && lessonCount && lessonCount >= 10) {
        if (!existingBadgeTypes.has("lesson_completion_10")) {
          return this.awardBadgeByType(studentId, "lesson_completion_10");
        }
      }
      
      // Check for completed 25 lessons badge
      if (badgeType === "lesson_completion_25" && lessonCount && lessonCount >= 25) {
        if (!existingBadgeTypes.has("lesson_completion_25")) {
          return this.awardBadgeByType(studentId, "lesson_completion_25");
        }
      }
      
      // Check for subject badges
      if (badgeType.startsWith("subject_") && subject) {
        // Extract subject name from badge type or use provided subject
        const subjectFromBadge = badgeType.split('_')[1];
        const targetSubject = subjectFromBadge || subject.toLowerCase();
        
        if (subject.toLowerCase() === targetSubject && !existingBadgeTypes.has(badgeType)) {
          return this.awardBadgeByType(studentId, badgeType);
        }
      }
      
      // Check for streak badges
      if (badgeType.startsWith("streak_") && streakDays) {
        const daysRequired = parseInt(badgeType.split('_')[1]);
        if (streakDays >= daysRequired && !existingBadgeTypes.has(badgeType)) {
          return this.awardBadgeByType(studentId, badgeType);
        }
      }
      
      // Check for growth mindset badges
      if (badgeType.startsWith("growth_") && !existingBadgeTypes.has(badgeType)) {
        return this.awardBadgeByType(studentId, badgeType);
      }
      
      // Check for game badges
      if (badgeType.startsWith("game_")) {
        if (!existingBadgeTypes.has(badgeType)) {
          return this.awardBadgeByType(studentId, badgeType);
        }
      }
      
      // Check for curiosity badges
      if (badgeType.startsWith("curiosity_") && questionsAsked) {
        const questionsRequired = parseInt(badgeType.split('_')[2]);
        if (questionsAsked >= questionsRequired && !existingBadgeTypes.has(badgeType)) {
          return this.awardBadgeByType(studentId, badgeType);
        }
      }
      
      // Check for family engagement badge
      if (badgeType === "family_session" && !existingBadgeTypes.has("family_session")) {
        return this.awardBadgeByType(studentId, "family_session");
      }
      
      // No new badge awarded
      return null;
      
    } catch (error) {
      console.error("Error checking and awarding badges:", error);
      return null;
    }
  },
  
  // Award a badge by its type
  async awardBadgeByType(studentId: string, badgeType: BadgeType): Promise<Badge | null> {
    try {
      // Get badge data by type
      const { data: badgeData, error: badgeError } = await supabase
        .from("badges")
        .select("*")
        .eq("type", badgeType)
        .single();
        
      if (badgeError || !badgeData) {
        console.error("Error finding badge with type:", badgeType, badgeError);
        return null;
      }
      
      // Award the badge using the existing method
      return this.awardBadge({
        studentId,
        name: badgeData.name,
        description: badgeData.description,
        type: badgeType,
        imageUrl: badgeData.image_url
      });
    } catch (error) {
      console.error("Error awarding badge by type:", error);
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
