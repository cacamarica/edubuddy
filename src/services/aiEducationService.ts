
import { supabase } from "@/integrations/supabase/client";

interface AIContentRequestParams {
  contentType: 'lesson' | 'quiz' | 'game' | 'buddy';
  subject?: string;
  gradeLevel?: 'k-3' | '4-6' | '7-9';
  topic?: string;
  question?: string;
  includeImages?: boolean;
}

export async function getAIEducationContent({
  contentType,
  subject,
  gradeLevel,
  topic,
  question,
  includeImages = true
}: AIContentRequestParams) {
  try {
    console.log(`Fetching ${contentType} content for ${topic} in ${subject} (grade: ${gradeLevel})`);
    
    const { data, error } = await supabase.functions.invoke('ai-edu-content', {
      body: {
        contentType,
        subject,
        gradeLevel,
        topic,
        question,
        includeImages
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }
    
    console.log(`Successfully received ${contentType} content`);
    
    // Process and normalize image data to ensure consistency
    if (contentType === 'lesson' && data?.content?.mainContent) {
      // Process lesson content to ensure images are properly formatted
      data.content.mainContent = data.content.mainContent.map((section: any) => {
        // Ensure each section has properly formatted images
        if (section.image) {
          if (typeof section.image === 'string') {
            // Convert string to proper image object
            section.image = {
              url: section.image,
              alt: `Image for ${section.heading}`,
              caption: `Visual aid for ${section.heading}`
            };
          } else if (section.image && !section.image.caption) {
            // Add caption if it's missing
            section.image.caption = section.image.alt || `Visual aid for ${section.heading}`;
          }
        }
        return section;
      });
      
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
          return q;
        });
        
        // Wrap array in expected format
        return { content: { questions } };
      } 
      else if (data.content.questions) {
        // Normalize image data in questions
        data.content.questions = data.content.questions.map((q: any) => {
          if (q.image && typeof q.image === 'string') {
            q.image = { 
              url: q.image, 
              alt: `Image for question: ${q.question}`,
              caption: `Visual aid for this question`
            };
          } else if (q.image && !q.image.caption) {
            q.image.caption = q.image.alt || `Visual aid for this question`;
          }
          return q;
        });
      }
    }

    return data;
  } catch (error) {
    console.error('Error fetching AI education content:', error);
    throw error;
  }
}
