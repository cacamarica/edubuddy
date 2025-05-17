
import { supabase } from "@/integrations/supabase/client";

interface AIContentRequestParams {
  contentType: 'lesson' | 'quiz' | 'game';
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
}

export async function getAIEducationContent({
  contentType,
  subject,
  gradeLevel,
  topic
}: AIContentRequestParams) {
  try {
    const { data, error } = await supabase.functions.invoke('ai-edu-content', {
      body: {
        contentType,
        subject,
        gradeLevel,
        topic
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching AI education content:', error);
    throw error;
  }
}
