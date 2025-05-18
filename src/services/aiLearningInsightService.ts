import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AIRecommendation } from "./studentProgressService";

interface LearningInsightResponse {
  reasoning: string;
  expectedImpact: string;
  confidenceScore?: number;
  areasOfStrength?: string[];
  areasToImprove?: string[];
}

interface InsightRequestParams {
  studentId: string;
  subject?: string;
  topic?: string;
  activityType?: string;
  gradeLevel?: string;
  language?: 'en' | 'id';
}

/**
 * Service to get AI-generated insights about student learning patterns
 * and personalized recommendation reasoning
 */
export const aiLearningInsightService = {
  /**
   * Gets personalized insights for why a specific learning activity is recommended
   */
  async getPersonalizedInsight({
    studentId,
    subject,
    topic,
    activityType = 'lesson',
    gradeLevel,
    language = 'en'
  }: InsightRequestParams): Promise<LearningInsightResponse | null> {
    try {
      // First check if we can use our edge function
      try {
        // Try to use the edge function for real-time AI-generated insights
        const { data: aiData, error: aiError } = await supabase.functions.invoke('get-student-ai-insights', {
          body: {
            studentId,
            subject,
            topic,
            activityType,
            gradeLevel,
            language
          }
        });

        if (!aiError && aiData) {
          return aiData as LearningInsightResponse;
        }
      } catch (edgeFunctionError) {
        console.warn('Could not use edge function for insights, falling back to local logic', edgeFunctionError);
        // Continue to fallback logic
      }

      // Fallback: Get student performance data and generate insight
      const { data: quizData } = await supabase
        .from('quiz_scores')
        .select('*')
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false })
        .limit(10);
      
      const { data: activityData } = await supabase
        .from('learning_activities')
        .select('*')
        .eq('student_id', studentId)
        .order('last_interaction_at', { ascending: false })
        .limit(20);
        
      // Check if we have enough data for a meaningful analysis
      if (!quizData?.length && !activityData?.length) {
        return generateFallbackInsight(subject, topic, activityType, language);
      }
      
      // Generate insight based on available data
      return generateInsightFromData(
        subject, 
        topic, 
        activityType, 
        quizData || [], 
        activityData || [], 
        language
      );
    } catch (error) {
      console.error('Error getting personalized learning insight:', error);
      return generateFallbackInsight(subject, topic, activityType, language);
    }
  },
    /**
   * Enhances a set of recommendations with personalized insights
   * This is more efficient than calling getPersonalizedInsight multiple times
   * @param params Object containing recommendations and contextual data
   */
  async enhanceRecommendationsWithInsights(
    params: {
      recommendations: AIRecommendation[], 
      studentId: string,
      gradeLevel?: string,
      language?: 'en' | 'id'
    } | AIRecommendation[], 
    studentId?: string,
    gradeLevel?: string,
    language: 'en' | 'id' = 'en'
  ): Promise<AIRecommendation[]> {
    // Handle both new object param style and legacy param style
    let recommendations: AIRecommendation[];
    let studentIdValue: string;
    let gradeLevelValue: string | undefined;
    let languageValue: 'en' | 'id';
    
    if (Array.isArray(params)) {
      // Legacy parameter style
      recommendations = params;
      studentIdValue = studentId || '';
      gradeLevelValue = gradeLevel;
      languageValue = language;
    } else {
      // New object parameter style
      recommendations = params.recommendations;
      studentIdValue = params.studentId;
      gradeLevelValue = params.gradeLevel;
      languageValue = params.language || 'en';
    }
    
    if (!recommendations.length) return recommendations;
    
    try {
      // Try to use the bulk insights endpoint
      try {
        const recommendationData = recommendations.map(rec => ({
          id: rec.id,
          subject: rec.subject || rec.recommendation_type,
          topic: rec.topic || rec.recommendation,
          activityType: rec.recommendation?.toLowerCase()?.includes('quiz') ? 'quiz' : 'lesson'
        }));
          const { data: aiData, error: aiError } = await supabase.functions.invoke('get-student-bulk-insights', {
          body: {
            studentId: studentIdValue,
            recommendations: recommendationData,
            gradeLevel: gradeLevelValue,
            language: languageValue
          }
        });

        if (!aiError && aiData && Array.isArray(aiData)) {
          // Map the insights back to the original recommendations
          return recommendations.map(rec => {
            const insight = aiData.find(i => i.id === rec.id);
            if (!insight) return rec;
            
            return {
              ...rec,
              reasoning: insight.reasoning || rec.reasoning,
              expectedImpact: insight.expectedImpact || rec.expectedImpact
            };
          });
        }
      } catch (edgeFunctionError) {
        console.warn('Could not use edge function for bulk insights, falling back to local logic', edgeFunctionError);
        // Continue to fallback logic
      }
      
      // If bulk insights failed, enhance each recommendation one by one
      const enhancedRecommendations = [];
      
      for (const rec of recommendations) {
        const subject = rec.subject || rec.recommendation_type;
        const topic = rec.topic || rec.recommendation;
        const activityType = rec.recommendation?.toLowerCase()?.includes('quiz') ? 'quiz' : 'lesson';
          const insight = await this.getPersonalizedInsight({
          studentId: studentIdValue,
          subject,
          topic,
          activityType,
          gradeLevel: gradeLevelValue,
          language: languageValue
        });
        
        enhancedRecommendations.push({
          ...rec,
          reasoning: insight?.reasoning || rec.reasoning,
          expectedImpact: insight?.expectedImpact || rec.expectedImpact
        });
      }
      
      return enhancedRecommendations;
    } catch (error) {
      console.error('Error enhancing recommendations with insights:', error);
      return recommendations; // Return original recommendations if enhancement fails
    }
  }
};

/**
 * Generate a fallback insight when no student data is available
 */
function generateFallbackInsight(
  subject?: string, 
  topic?: string, 
  activityType: string = 'lesson',
  language: 'en' | 'id' = 'en'
): LearningInsightResponse {
  const subjectDisplay = subject || 'this subject';
  const topicDisplay = topic || 'this topic';
  const isQuiz = activityType?.toLowerCase() === 'quiz';
  
  // Enhanced fallback messages with more variability based on activity type and subject
  if (language === 'id') {
    const reasoningOptions = [
      `Materi ${topicDisplay} di ${subjectDisplay} merupakan bagian penting dari kurikulum pendidikan dan membantu membangun fondasi pengetahuan yang kuat.`,
      `Mempelajari ${topicDisplay} akan memperkuat pemahaman dasar Anda tentang ${subjectDisplay} dan membangun keterampilan yang diperlukan.`,
      `${topicDisplay} adalah konsep kunci dalam ${subjectDisplay} yang perlu dikuasai untuk memahami topik yang lebih kompleks.`
    ];
    
    const impactOptions = isQuiz ? [
      `Menguji pengetahuan Anda tentang ${topicDisplay} akan membantu mengidentifikasi area yang perlu ditingkatkan dalam ${subjectDisplay}.`,
      `Mengambil kuis ini akan mengukur pemahaman Anda tentang ${topicDisplay} dan memberikan wawasan tentang kekuatan dan kelemahan Anda.`,
      `Kuis ${topicDisplay} membantu memperkuat ingatan dan pemahaman konsep penting dalam ${subjectDisplay}.`
    ] : [
      `Menguasai ${topicDisplay} akan membantu Anda mengembangkan keterampilan kunci dalam ${subjectDisplay} dan mempersiapkan Anda untuk konsep pembelajaran yang lebih maju.`,
      `Mempelajari ${topicDisplay} akan meningkatkan pemahaman konseptual Anda tentang ${subjectDisplay} dan membangun fondasi yang kuat untuk materi selanjutnya.`,
      `Aktivitas belajar ini akan memperdalam pengetahuan Anda tentang ${topicDisplay} dan meningkatkan keterampilan pemecahan masalah dalam ${subjectDisplay}.`
    ];
    
    return {
      reasoning: reasoningOptions[Math.floor(Math.random() * reasoningOptions.length)],
      expectedImpact: impactOptions[Math.floor(Math.random() * impactOptions.length)]
    };
  }
  
  // English fallbacks with more variety
  const reasoningOptions = [
    `${topicDisplay} in ${subjectDisplay} is an essential part of the educational curriculum and helps build a strong knowledge foundation.`,
    `Learning ${topicDisplay} strengthens your fundamental understanding of ${subjectDisplay} and builds necessary skills.`,
    `${topicDisplay} is a key concept in ${subjectDisplay} that needs to be mastered to understand more complex topics.`
  ];
  
  const impactOptions = isQuiz ? [
    `Testing your knowledge about ${topicDisplay} will help identify areas for improvement in ${subjectDisplay}.`,
    `Taking this quiz will measure your understanding of ${topicDisplay} and provide insights into your strengths and weaknesses.`,
    `The ${topicDisplay} quiz helps reinforce memory and understanding of important concepts in ${subjectDisplay}.`
  ] : [
    `Mastering ${topicDisplay} will help you develop key skills in ${subjectDisplay} and prepare you for more advanced learning concepts.`,
    `Studying ${topicDisplay} will enhance your conceptual understanding of ${subjectDisplay} and build a strong foundation for subsequent material.`,
    `This learning activity will deepen your knowledge of ${topicDisplay} and improve problem-solving skills in ${subjectDisplay}.`
  ];
  
  return {
    reasoning: reasoningOptions[Math.floor(Math.random() * reasoningOptions.length)],
    expectedImpact: impactOptions[Math.floor(Math.random() * impactOptions.length)],
    confidenceScore: 0.75 // Lower confidence since this is a fallback
  };
}

/**
 * Generate an insight based on student performance data
 */
/**
 * Generate an insight based on student performance data
 * Uses more advanced pattern recognition to create personalized insights
 */
function generateInsightFromData(
  subject?: string,
  topic?: string,
  activityType: string = 'lesson',
  quizData: any[] = [],
  activityData: any[] = [],
  language: 'en' | 'id' = 'en'
): LearningInsightResponse {
  const subjectDisplay = subject || 'this subject';
  const topicDisplay = topic || 'this topic';
  const isQuiz = activityType?.toLowerCase() === 'quiz';
  
  // Check if there's any data for the specific subject
  const subjectQuizzes = quizData.filter(q => 
    q.subject?.toLowerCase() === subject?.toLowerCase()
  );
  
  const subjectActivities = activityData.filter(a => 
    a.subject?.toLowerCase() === subject?.toLowerCase()
  );
  
  // Advanced student performance pattern recognition
  const isStrugglingWithSubject = subjectQuizzes.length > 0 && 
    subjectQuizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) / subjectQuizzes.length < 70;
  
  const recentlyImproving = subjectQuizzes.length >= 2 && 
    subjectQuizzes.slice(0, 3).reduce((sum, q) => sum + (q.percentage || 0), 0) / Math.min(3, subjectQuizzes.length) > 
    subjectQuizzes.slice(3).reduce((sum, q) => sum + (q.percentage || 0), 0) / Math.max(1, subjectQuizzes.length - 3);
  
  const hasLowEngagementWithSubject = subjectActivities.length < 3;
  
  // Check if student has completed similar topics
  const relatedTopicsCompleted = activityData.filter(a => 
    a.subject?.toLowerCase() === subject?.toLowerCase() && 
    a.topic?.toLowerCase().includes(topic?.toLowerCase()?.substring(0, 5) || '') &&
    a.completed === true
  ).length;
  
  const hasStrengthInRelatedTopics = relatedTopicsCompleted > 0;
  
  // Generate areas of strength and improvement
  const areasOfStrength = [];
  const areasToImprove = [];
  
  if (hasStrengthInRelatedTopics) {
    areasOfStrength.push(subject || 'related topics');
  }
  
  if (recentlyImproving) {
    areasOfStrength.push('recent progress');
  }
  
  if (isStrugglingWithSubject) {
    areasToImprove.push(subject || 'fundamental concepts');
  }
  
  if (hasLowEngagementWithSubject) {
    areasToImprove.push('subject engagement');
  }
  
  // Generate reasoning and impact based on patterns
  let reasoning, expectedImpact;
  
  if (language === 'id') {
    if (isStrugglingWithSubject && hasStrengthInRelatedTopics) {
      reasoning = `Meskipun Anda memiliki kekuatan dalam beberapa topik terkait, Anda masih menghadapi tantangan dalam ${subjectDisplay}. Fokus pada ${topicDisplay} dapat membantu mengatasi kesenjangan pemahaman spesifik.`;
      expectedImpact = `Memahami ${topicDisplay} dengan baik dapat meningkatkan skor kuis Anda secara keseluruhan dalam ${subjectDisplay} dan mengubah area yang menantang menjadi kekuatan Anda.`;
    } else if (isStrugglingWithSubject) {
      reasoning = `Anda telah menunjukkan beberapa tantangan dengan konsep dalam ${subjectDisplay}. Fokus pada ${topicDisplay} dapat membantu memperkuat pemahaman dasar Anda dan mengatasi hambatan belajar.`;
      expectedImpact = `${isQuiz ? 'Mengambil kuis' : 'Mempelajari'} ${topicDisplay} akan membantu mengidentifikasi kesenjangan pengetahuan spesifik dan meningkatkan kepercayaan diri Anda dalam ${subjectDisplay}.`;
    } else if (hasLowEngagementWithSubject) {
      reasoning = `Anda belum banyak berinteraksi dengan aktivitas pembelajaran tentang ${subjectDisplay}. Mengeksplorasi ${topicDisplay} akan membantu memperluas pengetahuan dan keterampilan Anda dalam bidang ini.`;
      expectedImpact = `Terlibat dengan ${topicDisplay} akan membantu Anda mengembangkan pemahaman yang lebih komprehensif tentang ${subjectDisplay} dan membuka jalur belajar baru.`;
    } else if (recentlyImproving) {
      reasoning = `Anda menunjukkan peningkatan yang baik dalam ${subjectDisplay} baru-baru ini. Mempelajari ${topicDisplay} adalah langkah strategis berikutnya untuk mempertahankan momentum positif ini.`;
      expectedImpact = `${isQuiz ? 'Menguji pengetahuan Anda' : 'Mempelajari materi ini'} tentang ${topicDisplay} akan membangun di atas kemajuan terbaru Anda dan memperkuat pemahaman konseptual dalam ${subjectDisplay}.`;
    } else {
      reasoning = `Berdasarkan analisis pola belajar Anda, ${topicDisplay} di ${subjectDisplay} tampaknya sangat sesuai dengan kebutuhan pembelajaran Anda saat ini.`;
      expectedImpact = `Memperdalam pengetahuan tentang ${topicDisplay} akan membangun di atas keahlian Anda yang ada dan mempersiapkan Anda untuk konsep yang lebih maju dalam ${subjectDisplay}.`;
    }
  } else {
    if (isStrugglingWithSubject && hasStrengthInRelatedTopics) {
      reasoning = `While you have strengths in some related topics, you're still facing challenges in ${subjectDisplay}. Focusing on ${topicDisplay} can help address specific comprehension gaps.`;
      expectedImpact = `Understanding ${topicDisplay} well can improve your overall quiz scores in ${subjectDisplay} and turn challenging areas into strengths.`;
    } else if (isStrugglingWithSubject) {
      reasoning = `You've shown some challenges with concepts in ${subjectDisplay}. Focusing on ${topicDisplay} can help strengthen your foundational understanding and overcome learning obstacles.`;
      expectedImpact = `${isQuiz ? 'Taking this quiz about' : 'Learning about'} ${topicDisplay} will help identify specific knowledge gaps and build your confidence in ${subjectDisplay}.`;
    } else if (hasLowEngagementWithSubject) {
      reasoning = `You haven't interacted much with learning activities about ${subjectDisplay}. Exploring ${topicDisplay} will help broaden your knowledge and skills in this area.`;
      expectedImpact = `Engaging with ${topicDisplay} will help you develop a more comprehensive understanding of ${subjectDisplay} and open new learning pathways.`;
    } else if (recentlyImproving) {
      reasoning = `You're showing good improvement in ${subjectDisplay} recently. Learning about ${topicDisplay} is a strategic next step to maintain this positive momentum.`;
      expectedImpact = `${isQuiz ? 'Testing your knowledge' : 'Studying'} about ${topicDisplay} will build upon your recent progress and strengthen conceptual understanding in ${subjectDisplay}.`;
    } else {
      reasoning = `Based on analysis of your learning patterns, ${topicDisplay} in ${subjectDisplay} appears particularly well-suited to your current learning needs.`;
      expectedImpact = `Deepening your knowledge of ${topicDisplay} will build upon your existing expertise and prepare you for more advanced concepts in ${subjectDisplay}.`;
    }
  }
  
  return {
    reasoning,
    expectedImpact,
    confidenceScore: 0.85,
    areasOfStrength,
    areasToImprove
  };
}
