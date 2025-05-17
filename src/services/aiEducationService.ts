
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

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching AI education content:', error);
    throw error;
  }
}
