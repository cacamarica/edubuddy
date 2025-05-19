import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIContentRequestParams {
  contentType: 'lesson' | 'quiz' | 'game' | 'buddy';
  subject?: string;
  gradeLevel?: 'k-3' | '4-6' | '7-9';
  topic?: string;
  question?: string;
  includeImages?: boolean;
  imageStyle?: 'cartoon' | 'drawing' | 'realistic' | 'comic' | 'watercolor';
  language?: 'en' | 'id';
}

export async function getAIEducationContent({
  contentType,
  subject,
  gradeLevel,
  topic,
  question,
  includeImages = true,
  imageStyle = 'cartoon',
  language = 'en'
}: AIContentRequestParams) {
  try {
    console.log(`Fetching ${contentType} content for ${topic || question} in ${subject || 'general'} (grade: ${gradeLevel}, language: ${language})`);
    
    // Always use ai-lesson-generator for lessons to ensure full 10-15 chapters
    const functionName = contentType === 'lesson' ? 'ai-lesson-generator' : 'ai-edu-content';
    
    console.log(`Calling edge function: ${functionName}, force longer lessons with 10-15 chapters`);
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        contentType,
        subject,
        gradeLevel,
        topic,
        question,
        includeImages,
        imageStyle,
        language,
        forceLongerLessons: true  // Flag to ensure 10-15 chapters are generated
      }
    });

    if (error) {
      console.error(`Supabase function error (${functionName}):`, error);
      const errorMessage = language === 'id' 
        ? `Gagal mengakses konten ${contentType}. Silakan coba lagi.` 
        : `Failed to access ${contentType} content. Please try again.`;
      toast.error(errorMessage);
      throw error;
    }
    
    console.log(`Successfully received ${contentType} content`);
    console.log(`Content data:`, JSON.stringify(data?.content).substring(0, 200) + '...');
    
    // For lesson content from ai-lesson-generator, process and return all chapters
    if (contentType === 'lesson' && functionName === 'ai-lesson-generator') {
      console.log(`Processing lesson from ai-lesson-generator, chapters:`, 
                 data?.content?.chapters ? data.content.chapters.length : 'none');
                 
      // Convert chapters format to mainContent format if needed
      if (data?.content?.chapters && !data.content.mainContent) {
        console.log(`Converting ${data.content.chapters.length} chapters to mainContent format`);
        data.content.mainContent = data.content.chapters;
      }
      
      return data;
    }
    
    // Process and normalize image data
    if (contentType === 'lesson' && data?.content?.mainContent) {
      console.log(`Processing ${data.content.mainContent.length} chapters in mainContent`);
      
      // Process lesson content to ensure images are properly formatted
      data.content.mainContent = data.content.mainContent.map((section: any) => {
        // Ensure each section has properly formatted images
        if (section.image) {
          if (typeof section.image === 'string') {
            // Convert string to proper image object
            section.image = {
              url: section.image,
              alt: `Image for ${section.heading}`,
              caption: `Visual aid for ${section.heading}`,
              searchQuery: `${topic} ${section.heading} educational illustration`
            };
          } else if (section.image && !section.image.caption) {
            // Add caption if it's missing
            section.image.caption = section.image.alt || `Visual aid for ${section.heading}`;
          }
          
          // Add searchQuery for better image searching if missing
          if (!section.image.searchQuery) {
            section.image.searchQuery = `${topic} ${section.heading} educational illustration`;
          }
          
          // Handle case where image might be missing
          if (!section.image.url || section.image.url.trim() === '') {
            // Generate a placeholder image related to the topic
            section.image.url = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(topic || 'default')}-${encodeURIComponent(section.heading)}&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9,b6e3f4`;
            section.image.alt = `Illustration for ${section.heading}`;
            section.image.caption = `Visual representation for ${section.heading}`;
          }
        }
        return section;
      });
      
      // Log the number of chapters to verify we're preserving all of them
      console.log(`Processed mainContent has ${data.content.mainContent.length} chapters`);
      
      // Process activity image if it exists
      if (data.content.activity && data.content.activity.image) {
        if (typeof data.content.activity.image === 'string') {
          data.content.activity.image = {
            url: data.content.activity.image,
            alt: `Image for ${data.content.activity.title} activity`,
            caption: `Activity visual for ${data.content.activity.title}`
          };
        } else if (!data.content.activity.image.caption) {
          data.content.activity.image.caption = 
            data.content.activity.image.alt || `Activity visual for ${data.content.activity.title}`;
        }
        
        // Handle case where activity image might be missing
        if (!data.content.activity.image.url || data.content.activity.image.url.trim() === '') {
          data.content.activity.image.url = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(topic || 'default')}-activity&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9,b6e3f4`;
          data.content.activity.image.alt = `Illustration for ${data.content.activity.title} activity`;
          data.content.activity.image.caption = `Visual aid for this activity`;
        }
      }
    } 
    else if (contentType === 'quiz' && data?.content) {
      // Ensure quiz data is properly structured
      if (Array.isArray(data.content)) {
        // Normalize image data in questions
        const questions = data.content.map((q: any) => {
          if (q.image && typeof q.image === 'string') {
            q.image = { 
              url: q.image, 
              alt: `Image for question: ${q.question}`,
              caption: `Visual aid for this question`
            };
          } else if (q.image && !q.image.caption) {
            q.image.caption = q.image.alt || `Visual aid for this question`;
          }
          
          // Handle case where question image might be missing
          if (q.image && (!q.image.url || q.image.url.trim() === '')) {
            q.image.url = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(topic || 'default')}-q${q.id || Math.floor(Math.random() * 1000)}&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9,b6e3f4`;
            q.image.alt = `Illustration for question about ${q.question.substring(0, 20)}...`;
            q.image.caption = `Visual aid related to this question`;
          }
          return q;
        });
        
        // Wrap array in expected format
        return { content: { questions } };
      } 
      else if (data.content.questions) {
        // Normalize image data in questions
        data.content.questions = data.content.questions.map((q: any, index: number) => {
          if (q.image && typeof q.image === 'string') {
            q.image = { 
              url: q.image, 
              alt: `Image for question: ${q.question}`,
              caption: `Visual aid for this question`
            };
          } else if (q.image && !q.image.caption) {
            q.image.caption = q.image.alt || `Visual aid for this question`;
          }
          
          // Handle case where question image might be missing
          if (q.image && (!q.image.url || q.image.url.trim() === '')) {
            q.image.url = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(topic || 'default')}-q${index}&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9,b6e3f4`;
            q.image.alt = `Illustration for question about ${q.question.substring(0, 20)}...`;
            q.image.caption = `Visual aid related to this question`;
          }
          
          // If question doesn't have an image, add a placeholder
          if (!q.image) {
            q.image = {
              url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(topic || 'default')}-q${index}&backgroundColor=ffdfbf,ffd5dc,c0aede,d1d4f9,b6e3f4`,
              alt: `Illustration for question about ${q.question.substring(0, 20)}...`,
              caption: `Visual aid related to this question`
            };
          }
          
          return q;
        });
      }
    }

    return data;
  } catch (error) {
    console.error('Error fetching AI education content:', error);
    const errorMessage = language === 'id' 
      ? `Gagal memuat konten ${contentType}` 
      : `Failed to load ${contentType} content`;
    toast.error(errorMessage);
    
    // Return a fallback minimal data structure based on content type
    if (contentType === 'lesson') {
      return { 
        content: {
          title: topic || "Lesson content unavailable",
          introduction: "Content could not be loaded. Please try again later.",
          chapters: [{ 
            heading: "Error loading content", 
            text: "We're experiencing technical difficulties. Please try again later." 
          }],
          funFacts: [],
          activity: { title: "Activity unavailable", instructions: "Please try again later." }
        }
      };
    }
    if (contentType === 'quiz') {
      return { content: { questions: [] } };
    }
    return null;
  }
}
