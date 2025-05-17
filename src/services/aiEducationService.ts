
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
    
    // Make sure the data has the expected structure
    if (contentType === 'quiz' && data?.content) {
      // Ensure quiz data is properly structured
      if (Array.isArray(data.content)) {
        // Wrap array in expected format
        return { content: { questions: data.content } };
      } else if (data.content.questions) {
        // Already properly structured
        return data;
      }
    }

    return data;
  } catch (error) {
    console.error('Error fetching AI education content:', error);
    throw error;
  }
}
