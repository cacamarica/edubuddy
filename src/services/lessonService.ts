import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";
import { APICallTracker } from "@/utils/rateLimiter";
import { TOKEN_OPTIMIZATION_CONFIG } from "@/config/aiOptimizationConfig";
import { getAIEducationContent } from "./optimizedAIEducationService";

// Types for lesson materials and progress
export interface LessonChapter {
  heading: string;
  text: string;
  image?: {
    url: string;
    alt: string;
    caption?: string;
  };
}

export interface LessonActivity {
  title: string;
  instructions: string;
  image?: {
    url: string;
    alt: string;
    caption?: string;
  };
}

export interface LessonMaterial {
  id?: string;
  subject: string;
  topic: string;
  grade_level: "k-3" | "4-6" | "7-9";
  title: string;
  introduction: string;
  chapters: LessonChapter[];
  fun_facts: string[];
  activity: LessonActivity;
  conclusion?: string;
  summary?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LessonProgress {
  id?: string;
  student_id: string;
  lesson_id: string;
  current_chapter: number;
  is_completed: boolean;
  last_read_at?: string;
  created_at?: string;
}

// Helper function to safely parse JSON data
function safeParseJson<T>(jsonData: Json | null, defaultValue: T): T {
  if (jsonData === null) return defaultValue;
  
  if (typeof jsonData === 'object') {
    return jsonData as unknown as T;
  }
  
  try {
    if (typeof jsonData === 'string') {
      return JSON.parse(jsonData) as T;
    }
    return defaultValue;
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return defaultValue;
  }
}

// Initialize rate limiter for lesson generation
const lessonRateLimiter = new APICallTracker({
  maxCallsPerMinute: TOKEN_OPTIMIZATION_CONFIG.RATE_LIMITS?.LESSONS_PER_MINUTE || 3,
  maxCallsPerHour: TOKEN_OPTIMIZATION_CONFIG.RATE_LIMITS?.LESSONS_PER_HOUR || 20,
  cacheDurationMinutes: TOKEN_OPTIMIZATION_CONFIG.CACHE.TTL_MINUTES
});

// Service functions with performance optimization
export const lessonService = {
  // Get lesson material by subject, topic, and grade level - optimized with caching
  async getLessonMaterial(subject: string, topic: string, gradeLevel: "k-3" | "4-6" | "7-9", subtopic?: string): Promise<LessonMaterial | null> {
    // Create a cache key including subtopic if it exists
    const cacheKey = `lesson_${subject}_${topic}_${gradeLevel}${subtopic ? `_${subtopic}` : ''}`;
    
    // Try to get from session storage first for instant loading on repeat visits
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        return JSON.parse(cachedData) as LessonMaterial;
      } catch (e) {
        console.error('Error parsing cached lesson:', e);
        // Continue to fetch from database if cache parsing fails
      }
    }
    
    try {
      // First, try to get from database
      const { data, error } = await supabase
        .from('lesson_materials')
        .select('*')
        .eq('subject', subject)
        .eq('topic', topic)
        .eq('grade_level', gradeLevel)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // code for no rows returned
          console.error("Error fetching lesson:", error);
          throw error;
        }
        
        // If not found in database, generate using AI
        console.log("Lesson not found in database, generating with AI...");
        const result = await this.generateAndStoreLessonMaterial(subject, topic, gradeLevel, subtopic);
        
        // Cache the result if we got one
        if (result) {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(result));
          } catch (e) {
            console.error('Error caching lesson:', e);
          }
        }
        
        return result;
      }

      // Format the data to match our interface
      const formattedData = {
        id: data.id,
        subject: data.subject,
        topic: data.topic,
        grade_level: data.grade_level as "k-3" | "4-6" | "7-9",
        title: data.title,
        introduction: data.introduction,
        chapters: safeParseJson<LessonChapter[]>(data.chapters, []),
        fun_facts: safeParseJson<string[]>(data.fun_facts, []),
        activity: safeParseJson<LessonActivity>(data.activity, { title: "Activity", instructions: "No activity available" }),
        conclusion: data.conclusion || undefined,
        summary: data.summary || undefined,
        created_at: data.created_at || undefined,
        updated_at: data.updated_at || undefined,
      };
      
      // Cache the result for future use
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(formattedData));
      } catch (e) {
        console.error('Error caching lesson:', e);
      }
      
      return formattedData;
    } catch (error) {
      console.error("Error in getLessonMaterial:", error);
      toast.error("Failed to load the lesson material");
      return null;
    }
  },

  // Get lesson material by ID directly - optimized with caching
  getLessonMaterialById: async (id: string): Promise<LessonMaterial | null> => {
    // Create a cache key for this specific lesson ID
    const cacheKey = `lesson_id_${id}`;
    
    // Try to get from session storage first for instant loading
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        return JSON.parse(cachedData) as LessonMaterial;
      } catch (e) {
        console.error('Error parsing cached lesson:', e);
        // Continue to fetch if cache parsing fails
      }
    }
    
    try {
      const { data, error } = await supabase
        .from("lesson_materials")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }      const formattedData = {
        id: data.id,
        subject: data.subject,
        topic: data.topic,
        grade_level: data.grade_level as "k-3" | "4-6" | "7-9",
        title: data.title,
        introduction: data.introduction,
        chapters: safeParseJson<LessonChapter[]>(data.chapters, []),
        fun_facts: safeParseJson<string[]>(data.fun_facts, []),
        activity: safeParseJson<LessonActivity>(data.activity, {
          title: "Activity", 
          instructions: "No activity available"
        }),
        conclusion: data.conclusion || undefined,
        summary: data.summary || undefined
      };
      
      // Cache the result for future use
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(formattedData));
      } catch (e) {
        console.error('Error caching lesson by ID:', e);
      }
      
      return formattedData;
    } catch (error) {
      console.error("Error in getLessonMaterialById:", error);
      return null;
    }
  },

  // Generate lesson material using AI and store in database - optimized for fast loading
  async generateAndStoreLessonMaterial(subject: string, topic: string, gradeLevel: "k-3" | "4-6" | "7-9", subtopic?: string): Promise<LessonMaterial | null> {
    try {
      // Show loading toast to improve perceived performance
      toast.loading("Preparing your lesson...", { id: "lesson-generation" });
      
      // Use optimized AI content generation with performance features
      const result = await getAIEducationContent({
        contentType: 'lesson',
        subject,
        gradeLevel,
        topic,
        subtopic, // Pass subtopic for more specific content
        skipMediaSearch: true, // Skip all media searches for speed
        fastMode: true // Use faster generation mode
      });

      if (!result || !result.content) {
        toast.error("Couldn't create the lesson content");
        throw new Error("Failed to generate lesson content");
      }

      // Process the AI response - simplified for speed
      const processedContent = this.processAIContent(result.content, subject, topic, gradeLevel);
      
      // Save to database with optimized fields (fewer fields = faster)
      const { data, error } = await supabase
        .from('lesson_materials')
        .insert([processedContent])
        .select('id, subject, topic, grade_level, title, introduction, chapters, fun_facts, activity, conclusion, summary')
        .single();

      toast.dismiss("lesson-generation");
      if (error) {
        console.error("Error saving lesson to database:", error);
        throw error;
      }      // Convert the database result back to our interface
      return {
        id: data.id,
        subject: data.subject,
        topic: data.topic,
        grade_level: data.grade_level as "k-3" | "4-6" | "7-9",
        title: data.title,
        introduction: data.introduction,
        chapters: safeParseJson<LessonChapter[]>(data.chapters, []),
        fun_facts: safeParseJson<string[]>(data.fun_facts, []),
        activity: safeParseJson<LessonActivity>(data.activity, { title: "Activity", instructions: "No activity available" }),
        conclusion: data.conclusion || undefined,
        summary: data.summary || undefined
      };
    } catch (error) {
      console.error("Error generating lesson material:", error);
      toast.error("Failed to generate the lesson material");
      return null;
    }
  },

  // Process AI content to ensure it matches our schema - extremely optimized for speed
  processAIContent(content: any, subject: string, topic: string, gradeLevel: "k-3" | "4-6" | "7-9"): any {
    // Limit to max 5 chapters for faster loading
    const maxChapters = 5;
    
    // Process only essential chapter content - no image processing for speed
    const chapters = Array.isArray(content.chapters) 
      ? content.chapters.slice(0, maxChapters).map((chapter: any, index: number) => {
          // Use a single shared placeholder image for all chapters to avoid multiple image loads
          const sharedPlaceholderImage = {
            url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(topic)}&backgroundColor=ffdfbf`,
            alt: `Visual concept for ${chapter.heading || `Chapter ${index + 1}`}`,
            caption: 'Lesson visual concept'
          };
          
          return {
            heading: chapter.heading || chapter.title || `Chapter ${index + 1}`,
            text: chapter.text || chapter.content || '',
            image: sharedPlaceholderImage // Always use the shared placeholder for speed
          };
        })
      : [];

    // Simplified activity with no image processing
    let activity = content.activity || { title: "Practice Activity", instructions: "Answer the questions related to the lesson." };
    
    // Use the same shared placeholder for activity to avoid processing
    const sharedPlaceholderImage = {
      url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(topic)}&backgroundColor=ffdfbf`,
      alt: "Activity visual",
      caption: "Interactive activity"
    };
    
    activity = {
      title: activity.title || "Practice Activity",
      instructions: activity.instructions || "Apply what you've learned from this lesson.",
      image: sharedPlaceholderImage // Always use the same placeholder
    };

    // Return streamlined lesson material with focus only on essential educational content
    return {
      subject,
      topic,
      grade_level: gradeLevel,
      title: content.title || `Learning about ${topic}`,
      introduction: content.introduction?.substring(0, 500) || `Let's learn about ${topic}!`, // Limit introduction length
      chapters: chapters,
      fun_facts: Array.isArray(content.funFacts) ? content.funFacts.slice(0, 3) : [], // Limit to 3 facts for speed
      activity: activity,
      conclusion: content.conclusion?.substring(0, 300) || `We hope you enjoyed learning about ${topic}!`, // Limit conclusion length
      summary: content.summary?.substring(0, 200) || `This lesson covered key concepts about ${topic}.` // Limit summary length
      // Remove conclusion and summary for faster loading - they can be generated on-demand if needed
    };
  },

  // Create initial lesson progress entry
  async createLessonProgress(studentId: string, lessonId: string): Promise<LessonProgress | null> {
    try {
      const { data, error } = await supabase.from("lesson_progress").insert([
        {
          student_id: studentId,
          lesson_id: lessonId,
          current_chapter: 0,
          is_completed: false,
          last_read_at: new Date().toISOString(),
        }
      ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Also create or update learning activity record for analytics
      await supabase.from("learning_activities").upsert([
        {
          student_id: studentId,
          activity_type: "lesson",
          subject: '',
          topic: '',
          progress: 0,
          started_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
          lesson_id: lessonId,
          completed: false,
          grade_level: '',
        }
      ], {
        onConflict: "student_id,activity_type,lesson_id"
      });

      return data as LessonProgress;
    } catch (error) {
      console.error("Error creating lesson progress:", error);
      return null;
    }
  },

  // Save or update lesson progress
  async saveProgress(progress: LessonProgress): Promise<LessonProgress | null> {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert([progress])
        .select()
        .single();

      if (error) throw error;
      
      return data as LessonProgress;
    } catch (error) {
      console.error("Error saving lesson progress:", error);
      toast.error("Failed to save your progress");
      return null;
    }
  },

  // Get lesson progress for a student
  async getLessonProgress(studentId: string, lessonId: string): Promise<LessonProgress | null> {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) throw error;
      
      return data as LessonProgress;
    } catch (error) {
      console.error("Error fetching lesson progress:", error);
      return null;
    }
  },

  // Mark a lesson as complete
  async markLessonComplete(studentId: string, lessonId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert([{
          student_id: studentId,
          lesson_id: lessonId,
          is_completed: true,
          current_chapter: 999, // A high number to indicate completion
          last_read_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      // Also record this in learning_activities table
      await supabase
        .from('learning_activities')
        .insert([{
          student_id: studentId,
          activity_type: 'lesson',
          subject: '',
          topic: '',
          completed: true,
          progress: 100,
          stars_earned: 5,
          completed_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
          lesson_id: lessonId,
          grade_level: '',
        }]);
      
      return true;
    } catch (error) {
      console.error("Error marking lesson as complete:", error);
      toast.error("Failed to update lesson completion status");
      return false;
    }
  }
};
