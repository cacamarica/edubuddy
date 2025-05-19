import { supabase } from "@/integrations/supabase/client";
import { getAIEducationContent } from "./aiEducationService";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

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

// Service functions
export const lessonService = {
  // Get lesson material by subject, topic, and grade level
  async getLessonMaterial(subject: string, topic: string, gradeLevel: "k-3" | "4-6" | "7-9"): Promise<LessonMaterial | null> {
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
        return await this.generateAndStoreLessonMaterial(subject, topic, gradeLevel);
      }

      // Format the data to match our interface
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
        summary: data.summary || undefined,
        created_at: data.created_at || undefined,
        updated_at: data.updated_at || undefined,
      };
    } catch (error) {
      console.error("Error in getLessonMaterial:", error);
      toast.error("Failed to load the lesson material");
      return null;
    }
  },

  // Get lesson material by ID directly
  getLessonMaterialById: async (id: string): Promise<LessonMaterial | null> => {
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
      }

      return {
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
        summary: data.summary || undefined,
        created_at: data.created_at || undefined,
        updated_at: data.updated_at || undefined,
      };
    } catch (error) {
      console.error("Error in getLessonMaterialById:", error);
      return null;
    }
  },

  // Generate lesson material using AI and store in database
  async generateAndStoreLessonMaterial(subject: string, topic: string, gradeLevel: "k-3" | "4-6" | "7-9"): Promise<LessonMaterial | null> {
    try {
      // Generate content using AI
      const result = await getAIEducationContent({
        contentType: 'lesson',
        subject,
        gradeLevel,
        topic
      });

      if (!result || !result.content) {
        throw new Error("Failed to generate lesson content");
      }

      // Process the AI response to ensure it has the right format
      const processedContent = this.processAIContent(result.content, subject, topic, gradeLevel);
      
      // Save to database
      const { data, error } = await supabase
        .from('lesson_materials')
        .insert([processedContent])
        .select()
        .single();

      if (error) {
        console.error("Error saving lesson to database:", error);
        console.error("Payload:", JSON.stringify(processedContent, null, 2));
        throw error;
      }

      // Convert the database result back to our interface
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
        summary: data.summary || undefined,
        created_at: data.created_at || undefined,
        updated_at: data.updated_at || undefined,
      };
    } catch (error) {
      console.error("Error generating lesson material:", error);
      toast.error("Failed to generate the lesson material");
      return null;
    }
  },

  // Process AI content to ensure it matches our schema
  processAIContent(content: any, subject: string, topic: string, gradeLevel: "k-3" | "4-6" | "7-9"): any {
    // Ensure chapters have the right format
    const chapters = Array.isArray(content.chapters) 
      ? content.chapters.map((chapter: any) => ({
          heading: chapter.heading,
          text: chapter.text,
          image: chapter.image 
            ? {
                url: chapter.image.url || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(chapter.heading)}`,
                alt: chapter.image.alt || `Image for ${chapter.heading}`,
                caption: chapter.image.caption || chapter.image.description || ''
              }
            : undefined
        }))
      : [];

    // Process activity image if needed
    let activity = content.activity || { title: "Activity", instructions: "No activity available" };
    if (activity && activity.image) {
      activity.image = {
        url: activity.image.url || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(activity.title || 'activity')}`,
        alt: activity.image.alt || `Image for ${activity.title || 'activity'}`,
        caption: activity.image.caption || activity.image.description || ''
      };
    }

    // Return properly formatted lesson material for database storage
    return {
      subject,
      topic,
      grade_level: gradeLevel,
      title: content.title || `${topic} in ${subject}`,
      introduction: content.introduction || "",
      chapters: chapters,
      fun_facts: Array.isArray(content.funFacts) ? content.funFacts : [],
      activity: activity,
      conclusion: content.conclusion || null,
      summary: content.summary || null,
    };
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

  // Create initial progress record for a lesson
  createLessonProgress: async (studentId: string, lessonId: string): Promise<LessonProgress | null> => {
    try {
      // Check if progress already exists
      const { data: existingProgress } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("student_id", studentId)
        .eq("lesson_id", lessonId)
        .single();

      if (existingProgress) {
        return existingProgress as LessonProgress;
      }

      // Create new progress record
      const initialProgress: LessonProgress = {
        student_id: studentId,
        lesson_id: lessonId,
        current_chapter: 0,
        is_completed: false,
        last_read_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("lesson_progress")
        .insert([initialProgress])
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
