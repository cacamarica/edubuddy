
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
        badgeType
      } = params;
      
      // Get badge name mapping
      const badgeName = this.getBadgeName(badgeType);
      
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

      // Get badge by name
      const { data: badgeData, error: nameError } = await supabase
        .from("badges")
        .select("id, name")
        .eq("name", badgeName)
        .maybeSingle();
      
      if (nameError) {
        console.error("Error fetching badge by name:", nameError);
        return null;
      }
      
      // Map of existing badge IDs this student has
      const existingBadgeIds = new Set(
        existingBadges?.map(eb => eb.badge_id) || []
      );

      // Check if the student already has this badge
      if (badgeData && !existingBadgeIds.has(badgeData.id)) {
        return this.awardBadgeById(studentId, badgeData.id);
      } else if (!badgeData) {
        // Badge doesn't exist yet, create it
        const description = this.getBadgeDescription(badgeType);
        const imageUrl = this.getBadgeImageUrl(badgeType);
        
        const { data: newBadge, error: createError } = await supabase
          .from("badges")
          .insert({
            name: badgeName,
            description,
            image_url: imageUrl
          })
          .select("id")
          .single();
          
        if (createError || !newBadge) {
          console.error("Error creating badge:", createError);
          return null;
        }
        
        return this.awardBadgeById(studentId, newBadge.id);
      }
      
      // Student already has this badge
      return null;
      
    } catch (error) {
      console.error("Error checking and awarding badges:", error);
      return null;
    }
  },
  
  // Get badge name from badge type
  getBadgeName(badgeType: BadgeType): string {
    switch (badgeType) {
      case "quiz_completion_first":
        return "Quiz Starter";
      case "quiz_completion_5":
        return "Quiz Master";
      case "quiz_completion_10":
        return "Quiz Champion";
      case "quiz_perfect_score":
        return "Perfect Score";
      case "quiz_score_improvement":
        return "Score Improver";
      case "lesson_completion_first":
        return "First Step";
      case "lesson_completion_5":
        return "Eager Reader";
      case "lesson_completion_10":
        return "Knowledge Explorer";
      case "lesson_completion_25":
        return "Learning Champion";
      case "subject_math_5":
        return "Math Explorer";
      case "subject_science_5":
        return "Science Discoverer";
      case "subject_language_5":
        return "Language Lover";
      case "streak_3_days":
        return "3-Day Streak";
      case "streak_7_days":
        return "Week Warrior";
      case "streak_14_days":
        return "Unstoppable";
      case "growth_retry_quiz":
        return "Bounce Back";
      case "growth_difficult_lesson":
        return "Problem Solver";
      case "game_first":
        return "Game Player";
      case "game_5":
        return "Game Enthusiast";
      case "curiosity_questions_5":
        return "Curious Mind";
      case "curiosity_questions_10":
        return "Deep Thinker";
      case "family_session":
        return "Family Support";
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
  
  // Get badge image URL from badge type
  getBadgeImageUrl(badgeType: BadgeType): string | undefined {
    // Map badge types to image paths
    switch (badgeType) {
      case "quiz_completion_first":
        return "/badges/quiz_starter.png";
      case "quiz_perfect_score":
        return "/badges/perfect_score.png";
      case "quiz_completion_5":
      case "quiz_completion_10":
        return "/badges/quiz_master.png";
      case "quiz_score_improvement":
        return "/badges/score_improver.png";
      case "lesson_completion_first":
        return "/badges/first_step.png";
      case "lesson_completion_5":
        return "/badges/eager_reader.png";
      case "lesson_completion_10":
        return "/badges/knowledge_explorer.png";
      case "lesson_completion_25":
        return "/badges/learning_champion.png";
      case "subject_math_5":
        return "/badges/math_explorer.png";
      case "subject_science_5":
        return "/badges/science_discoverer.png";
      case "subject_language_5":
        return "/badges/language_lover.png";
      case "streak_3_days":
        return "/badges/streak_3.png";
      case "streak_7_days":
        return "/badges/streak_7.png";
      case "streak_14_days":
        return "/badges/streak_14.png";
      case "growth_retry_quiz":
        return "/badges/bounce_back.png";
      case "growth_difficult_lesson":
        return "/badges/problem_solver.png";
      case "game_first":
        return "/badges/game_player.png";
      case "game_5":
        return "/badges/game_enthusiast.png";
      case "curiosity_questions_5":
        return "/badges/curious_mind.png";
      case "curiosity_questions_10":
        return "/badges/deep_thinker.png";
      case "family_session":
        return "/badges/family_support.png";
      default:
        return undefined;
    }
  }
};
