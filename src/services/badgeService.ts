
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
      const { data: existingBadges, error: badgeError } = await supabase
        .from("student_badges")
        .select(`
          badge_id,
          badges (
            id, 
            name
          )
        `)
        .eq("student_id", studentId);
        
      if (badgeError) {
        console.error("Error fetching badges:", badgeError);
        return null;
      }

      // Get badge type mappings
      const { data: badgeData } = await supabase
        .from("badges")
        .select("id, name")
        .eq("name", this.getBadgeName(badgeType));
      
      // Map of existing badge types this student has - using badge names as identifiers
      const existingBadgeIds = new Set(
        existingBadges?.map(eb => eb.badge_id) || []
      );

      // Check if the student already has this badge
      const matchingBadge = badgeData?.find(badge => 
        !existingBadgeIds.has(badge.id)
      );
      
      if (matchingBadge) {
        return this.awardBadgeById(studentId, matchingBadge.id);
      }
      
      // If we get here, either the student already has the badge or the badge doesn't exist
      // Let's create the badge if it doesn't exist
      return this.awardBadgeByType(studentId, badgeType);
      
    } catch (error) {
      console.error("Error checking and awarding badges:", error);
      return null;
    }
  },
  
  // Get badge name from badge type
  getBadgeName(badgeType: BadgeType): string {
    switch (badgeType) {
      case "quiz_completion_first":
        return "First Quiz";
      case "quiz_completion_5":
        return "Quiz Master";
      case "quiz_completion_10":
        return "Quiz Champion";
      case "quiz_perfect_score":
        return "Perfect Score";
      case "quiz_score_improvement":
        return "Rising Star";
      case "lesson_completion_first":
        return "First Lesson";
      case "lesson_completion_5":
        return "Study Buddy";
      case "lesson_completion_10":
        return "Knowledge Seeker";
      case "lesson_completion_25":
        return "Learning Legend";
      case "subject_math_5":
        return "Math Explorer";
      case "subject_science_5":
        return "Science Explorer";
      case "subject_language_5":
        return "Language Explorer";
      case "streak_3_days":
        return "3-Day Streak";
      case "streak_7_days":
        return "Week Warrior";
      case "streak_14_days":
        return "Fortnight Champion";
      case "growth_retry_quiz":
        return "Perseverance";
      case "growth_difficult_lesson":
        return "Challenge Accepted";
      case "game_first":
        return "Game Starter";
      case "game_5":
        return "Game Pro";
      case "curiosity_questions_5":
        return "Curious Mind";
      case "curiosity_questions_10":
        return "Knowledge Hunter";
      case "family_session":
        return "Family Learning";
      default:
        return "Achievement";
    }
  },
  
  // Award a badge to a student by badge ID
  async awardBadgeById(studentId: string, badgeId: string): Promise<Badge | null> {
    try {
      // Check if the student already has this badge
      const { data: existingBadge } = await supabase
        .from("student_badges")
        .select("id")
        .eq("student_id", studentId)
        .eq("badge_id", badgeId)
        .maybeSingle();
      
      if (existingBadge) {
        // Student already has this badge
        return null;
      }
      
      // Award the badge to the student
      const { data: studentBadge, error: awardError } = await supabase
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
        console.error("Error awarding badge:", awardError);
        return null;
      }
      
      if (!studentBadge) {
        throw new Error("Failed to award badge");
      }
      
      toast.success(`New badge awarded: ${studentBadge.badges.name}`);
      
      // Return the badge that was awarded
      return studentBadge.badges as Badge;
      
    } catch (error) {
      console.error("Error awarding badge by ID:", error);
      return null;
    }
  },
  
  // Award a badge by its type
  async awardBadgeByType(studentId: string, badgeType: BadgeType): Promise<Badge | null> {
    try {
      const badgeName = this.getBadgeName(badgeType);
      
      // Get badge data by name
      const { data: badgeData, error: badgeError } = await supabase
        .from("badges")
        .select("id, name, description, image_url")
        .eq("name", badgeName)
        .maybeSingle();
        
      if (badgeError) {
        console.error("Error finding badge with name:", badgeName, badgeError);
        return null;
      }
      
      if (badgeData) {
        // Badge exists, award it
        return this.awardBadgeById(studentId, badgeData.id);
      } else {
        // Badge doesn't exist, create it
        const description = this.getBadgeDescription(badgeType);
        const imageUrl = this.getBadgeImageUrl(badgeType);
        
        // Create a new badge
        const { data: newBadge, error: createError } = await supabase
          .from("badges")
          .insert({
            name: badgeName,
            description: description,
            image_url: imageUrl
          })
          .select("id")
          .single();
          
        if (createError || !newBadge) {
          console.error("Error creating badge:", createError);
          return null;
        }
        
        // Award the newly created badge
        return this.awardBadgeById(studentId, newBadge.id);
      }
    } catch (error) {
      console.error("Error awarding badge by type:", error);
      return null;
    }
  },
  
  // Get badge description from badge type
  getBadgeDescription(badgeType: BadgeType): string {
    switch (badgeType) {
      case "quiz_completion_first":
        return "Completed your first quiz!";
      case "quiz_completion_5":
        return "Completed 5 quizzes!";
      case "quiz_completion_10":
        return "Completed 10 quizzes!";
      case "quiz_perfect_score":
        return "Got a perfect score on a quiz!";
      case "quiz_score_improvement":
        return "Improved your quiz score!";
      case "lesson_completion_first":
        return "Completed your first lesson!";
      case "lesson_completion_5":
        return "Completed 5 lessons!";
      case "lesson_completion_10":
        return "Completed 10 lessons!";
      case "lesson_completion_25":
        return "Completed 25 lessons!";
      case "subject_math_5":
        return "Completed 5 Math activities!";
      case "subject_science_5":
        return "Completed 5 Science activities!";
      case "subject_language_5":
        return "Completed 5 Language activities!";
      case "streak_3_days":
        return "Learned for 3 days in a row!";
      case "streak_7_days":
        return "Learned for 7 days in a row!";
      case "streak_14_days":
        return "Learned for 14 days in a row!";
      case "growth_retry_quiz":
        return "Showed perseverance by retrying a quiz!";
      case "growth_difficult_lesson":
        return "Conquered a difficult lesson!";
      case "game_first":
        return "Played your first learning game!";
      case "game_5":
        return "Played 5 learning games!";
      case "curiosity_questions_5":
        return "Asked 5 questions to the learning buddy!";
      case "curiosity_questions_10":
        return "Asked 10 questions to the learning buddy!";
      case "family_session":
        return "Learned together with family!";
      default:
        return "Earned a special achievement!";
    }
  },
  
  // Get badge image URL from badge type (placeholder function)
  getBadgeImageUrl(badgeType: BadgeType): string | undefined {
    // This would typically return a URL to an image for the badge
    // For now, we'll return undefined and let the component handle fallbacks
    return undefined;
  }
};
