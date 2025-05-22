
import { supabase } from '@/integrations/supabase/client';
import { getAIEducationContent } from "./aiEducationService";
import { toast } from 'sonner'; // Import toast from sonner

// Types for lesson materials and progress
export interface LessonChapter {
  heading: string;
  content: string;
  image_url?: string;
}

export interface Lesson {
  id: string;
  title: string;
  introduction: string;
  chapters: LessonChapter[];
  conclusion: string;
  summary: string;
  fun_facts?: string[];
  activity?: {
    title: string;
    instructions: string;
    image_url?: string;
  };
  created_at: string;
  updated_at: string;
  grade_level: string;
  subject: string;
  topic: string;
  subtopic?: string; // Add subtopic field
}

export interface LessonProgress {
  id: string;
  lesson_id: string;
  student_id: string;
  current_chapter: number;
  is_completed: boolean;
  created_at: string;
  last_read_at: string;
}

// Interface for more detailed lesson content structure
export interface DetailedLessonChapter {
  heading: string;
  content: string[];
  imageUrl?: string;
  imageAlt?: string;
}

export interface DetailedLesson {
  id: string;
  title: string;
  introduction: string[];
  chapters: DetailedLessonChapter[];
  conclusion: string[];
  summary: string;
  funFacts?: string[];
  activity?: {
    title: string;
    instructions: string[];
    imageUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
  gradeLevel: string;
  subject: string;
  topic: string;
  subtopic?: string; // Add subtopic field
}

// Helper function to safely parse JSON data
function safeParseJson<T>(jsonData: any, defaultValue: T): T {
  if (jsonData === null) return defaultValue;
  
  if (typeof jsonData === 'object') {
    return jsonData as T;
  }
  
  try {
    return JSON.parse(jsonData) as T;
  } catch (e) {
    console.error('Error parsing JSON data:', e);
    return defaultValue;
  }
}

export const lessonService = {
  /**
   * Get a lesson by ID
   * 
   * @param lessonId The lesson ID
   * @returns The lesson if found, null otherwise
   */
  getLessonById: async (lessonId: string): Promise<Lesson | null> => {
    try {
      const { data, error } = await supabase
        .from('lesson_materials')
        .select('*')
        .eq('id', lessonId)
        .single();
      
      if (error) {
        console.error('Error fetching lesson:', error);
        return null;
      }
      
      if (!data) return null;
      
      // Parse chapters JSON if necessary
      const chapters = safeParseJson<LessonChapter[]>(data.chapters, []);
      const funFacts = safeParseJson<string[]>(data.fun_facts, []);
      const activity = safeParseJson<any>(data.activity, null);
      
      return {
        id: data.id,
        title: data.title,
        introduction: data.introduction,
        chapters,
        conclusion: data.conclusion || "",
        summary: data.summary || "",
        fun_facts: funFacts,
        activity,
        created_at: data.created_at,
        updated_at: data.updated_at,
        grade_level: data.grade_level,
        subject: data.subject,
        topic: data.topic,
        subtopic: data.subtopic // Include subtopic in the result
      };
    } catch (error) {
      console.error('Error in getLessonById:', error);
      return null;
    }
  },
  
  /**
   * Get lessons for a specific student
   * 
   * @param studentId The student ID
   * @param limit Optional limit for the number of lessons to return
   * @returns Array of lessons for the student
   */
  getLessonsForStudent: async (studentId: string, limit?: number): Promise<Lesson[]> => {
    try {
      // First, get the lesson progress entries for this student
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id, current_chapter, is_completed, last_read_at')
        .eq('student_id', studentId)
        .order('last_read_at', { ascending: false })
        .limit(limit || 10);
      
      if (progressError) {
        toast.error('Failed to fetch lesson progress');
        console.error('Error fetching lesson progress:', progressError);
        return [];
      }
      
      // No lessons found
      if (!progressData || progressData.length === 0) return [];
      
      // Get the actual lesson materials
      const lessonIds = progressData.map(progress => progress.lesson_id);
      const { data: lessonData, error: lessonError } = await supabase
        .from('lesson_materials')
        .select('*')
        .in('id', lessonIds);
      
      if (lessonError) {
        toast.error('Failed to fetch lesson materials');
        console.error('Error fetching lesson materials:', lessonError);
        return [];
      }
      
      if (!lessonData) return [];
      
      // Combine the lessons with their progress info
      return lessonData.map(lesson => {
        const progress = progressData.find(p => p.lesson_id === lesson.id);
        const chapters = safeParseJson<LessonChapter[]>(lesson.chapters, []);
        const funFacts = safeParseJson<string[]>(lesson.fun_facts, []);
        const activity = safeParseJson<any>(lesson.activity, null);
        
        return {
          id: lesson.id,
          title: lesson.title,
          introduction: lesson.introduction,
          chapters,
          conclusion: lesson.conclusion || "",
          summary: lesson.summary || "",
          fun_facts: funFacts,
          activity,
          created_at: lesson.created_at,
          updated_at: lesson.updated_at,
          grade_level: lesson.grade_level,
          subject: lesson.subject,
          topic: lesson.topic,
          subtopic: lesson.subtopic, // Include subtopic in the result
          // Add progress info
          currentChapter: progress?.current_chapter || 0,
          isCompleted: progress?.is_completed || false,
          lastReadAt: progress?.last_read_at || lesson.created_at
        } as Lesson & { currentChapter: number; isCompleted: boolean; lastReadAt: string };
      });
    } catch (error) {
      console.error('Error in getLessonsForStudent:', error);
      return [];
    }
  },
  
  /**
   * Get or create a lesson on a specific topic
   * 
   * @param subject The subject
   * @param topic The topic
   * @param gradeLevel The grade level
   * @param studentId Optional student ID
   * @param forceFresh Whether to force creation of a new lesson even if one exists
   * @returns The lesson
   */
  getOrCreateLesson: async (
    subject: string, 
    topic: string, 
    gradeLevel: string,
    studentId?: string,
    subtopic?: string,
    forceFresh = false
  ): Promise<{ lesson: Lesson | null; isNew: boolean }> => {
    try {
      // Check if a lesson already exists for this topic and grade level
      if (!forceFresh) {
        const query = supabase
          .from('lesson_materials')
          .select('*')
          .eq('subject', subject)
          .eq('topic', topic)
          .eq('grade_level', gradeLevel);

        // Add subtopic constraint if provided
        const { data: existingLessons, error } = subtopic 
          ? await query.eq('subtopic', subtopic) 
          : await query.is('subtopic', null);
        
        if (error) {
          console.error('Error checking for existing lesson:', error);
        } else if (existingLessons?.length > 0) {
          // Return the most recently created lesson
          const sortedLessons = existingLessons.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          const latestLesson = sortedLessons[0];
          
          // Parse JSON fields
          const chapters = safeParseJson<LessonChapter[]>(latestLesson.chapters, []);
          const funFacts = safeParseJson<string[]>(latestLesson.fun_facts, []);
          const activity = safeParseJson<any>(latestLesson.activity, null);
          
          const lesson: Lesson = {
            id: latestLesson.id,
            title: latestLesson.title,
            introduction: latestLesson.introduction,
            chapters,
            conclusion: latestLesson.conclusion || "",
            summary: latestLesson.summary || "",
            fun_facts: funFacts,
            activity,
            created_at: latestLesson.created_at,
            updated_at: latestLesson.updated_at,
            grade_level: latestLesson.grade_level,
            subject: latestLesson.subject,
            topic: latestLesson.topic,
            subtopic: latestLesson.subtopic
          };
          
          // Create progress entry for the student if not exists
          if (studentId) {
            const { data: progressData, error: progressError } = await supabase
              .from('lesson_progress')
              .select('*')
              .eq('lesson_id', lesson.id)
              .eq('student_id', studentId)
              .maybeSingle();
            
            if (progressError) {
              console.error('Error checking for existing progress:', progressError);
            } else if (!progressData) {
              // Create a new progress entry
              const { error: insertError } = await supabase
                .from('lesson_progress')
                .insert({
                  lesson_id: lesson.id,
                  student_id: studentId,
                  current_chapter: 0,
                  is_completed: false
                });
              
              if (insertError) {
                console.error('Error creating progress entry:', insertError);
              }
            }
          }
          
          return { lesson, isNew: false };
        }
      }
      
      // No existing lesson found or force fresh requested - generate a new one
      console.log('Generating new lesson for:', { subject, topic, subtopic, gradeLevel });
      
      const { content: lessonContent, error: aiError } = await getAIEducationContent({
        contentType: 'lesson',
        subject,
        topic,
        subtopic,
        gradeLevel: gradeLevel as any,
        studentId,
        includeImages: false // For faster generation
      });
      
      if (aiError || !lessonContent) {
        console.error('Error generating lesson:', aiError);
        toast.error('Failed to generate lesson content');
        return { lesson: null, isNew: false };
      }
      
      // Process AI-generated content
      const parsedLesson = typeof lessonContent === 'string' 
        ? JSON.parse(lessonContent) 
        : lessonContent;
      
      // Ensure we have chapters
      if (!parsedLesson.chapters || parsedLesson.chapters.length === 0) {
        console.error('Generated lesson has no chapters');
        toast.error('The generated lesson was incomplete');
        return { lesson: null, isNew: false };
      }
      
      // Prepare lesson data for insertion
      const lessonData = {
        title: parsedLesson.title || `${subject}: ${topic}`,
        introduction: parsedLesson.introduction || '',
        chapters: parsedLesson.chapters,
        conclusion: parsedLesson.conclusion || '',
        summary: parsedLesson.summary || '',
        fun_facts: parsedLesson.funFacts || [],
        activity: parsedLesson.activity,
        grade_level: gradeLevel,
        subject,
        topic,
        subtopic // Store the subtopic
      };
      
      // Insert the lesson into the database
      const { data: createdLesson, error: insertError } = await supabase
        .from('lesson_materials')
        .insert(lessonData)
        .select()
        .single();
      
      if (insertError || !createdLesson) {
        console.error('Error saving lesson:', insertError);
        toast.error('Failed to save lesson to database');
        return { lesson: null, isNew: false };
      }
      
      // Create a progress entry for the student if provided
      if (studentId) {
        const { error: progressError } = await supabase
          .from('lesson_progress')
          .insert({
            lesson_id: createdLesson.id,
            student_id: studentId,
            current_chapter: 0,
            is_completed: false
          });
        
        if (progressError) {
          console.error('Error creating progress entry:', progressError);
        }
      }
      
      // Format the lesson for return
      const chapters = safeParseJson<LessonChapter[]>(createdLesson.chapters, []);
      const funFacts = safeParseJson<string[]>(createdLesson.fun_facts, []);
      const activity = safeParseJson<any>(createdLesson.activity, null);
      
      const lesson: Lesson = {
        id: createdLesson.id,
        title: createdLesson.title,
        introduction: createdLesson.introduction,
        chapters,
        conclusion: createdLesson.conclusion || "",
        summary: createdLesson.summary || "",
        fun_facts: funFacts,
        activity,
        created_at: createdLesson.created_at,
        updated_at: createdLesson.updated_at,
        grade_level: createdLesson.grade_level,
        subject: createdLesson.subject,
        topic: createdLesson.topic,
        subtopic: createdLesson.subtopic
      };
      
      return { lesson, isNew: true };
    } catch (error) {
      console.error('Error in getOrCreateLesson:', error);
      toast.error('An unexpected error occurred');
      return { lesson: null, isNew: false };
    }
  },
  
  /**
   * Update a student's progress on a lesson
   * 
   * @param lessonId The lesson ID
   * @param studentId The student ID
   * @param chapter The current chapter number
   * @param isCompleted Whether the lesson is completed
   * @returns True if the update was successful, false otherwise
   */
  updateLessonProgress: async (
    lessonId: string, 
    studentId: string, 
    chapter: number, 
    isCompleted: boolean
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lesson_progress')
        .update({
          current_chapter: chapter,
          is_completed: isCompleted,
          last_read_at: new Date().toISOString()
        })
        .eq('lesson_id', lessonId)
        .eq('student_id', studentId);
      
      if (error) {
        console.error('Error updating lesson progress:', error);
        toast.error('Failed to save your progress');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in updateLessonProgress:', error);
      toast.error('An unexpected error occurred');
      return false;
    }
  }
};

export default lessonService;
