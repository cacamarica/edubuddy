import { supabase } from "@/integrations/supabase/client";
import { getChatCompletion } from "@/api/openai";

// Interfaces for AI Education Service
interface AILessonRequest {
  subject: string;
  topic: string;
  gradeLevel: string;
  studentId?: string;
  language?: string;
}

interface AILessonResponse {
  title: string;
  content: string;
  recommendations?: string[];
  summary?: string;
  error?: string;
  lessonId?: string;
}

export interface AIEducationContentRequest {
  contentType: 'lesson' | 'quiz' | 'game' | 'chat';
  subject: string;
  gradeLevel: 'k-3' | '4-6' | '7-9';
  topic: string;
  subtopic?: string;
  language?: string;
  studentId?: string;
  studentAge?: number;
  studentName?: string;
  studentProfile?: {
    age?: number;
    name?: string;
    interests?: string[];
    learningStyle?: string;
    comprehensionLevel?: 'basic' | 'intermediate' | 'advanced';
  };
  enhancedParams?: {
    gameType?: 'scientific_activity' | 'experiment' | 'simulation' | 'field_study';
    useHouseholdMaterials?: boolean;
    requireMinimalEquipment?: boolean;
    collaborativeActivity?: boolean;
    curriculumStandard?: 'cambridge' | 'common_core' | 'national';
    emphasizeSubtopics?: string[];
    difficultyLevel?: 'easy' | 'medium' | 'challenging';
    learningObjectives?: boolean;
    focusOnSubtopic?: boolean; // Flag to indicate stronger focus on subtopic
    alignWithCurriculum?: boolean; // Flag to align content with standard curriculum
    [key: string]: any; // Allow for additional parameters
  };
}

// Enhanced lesson content with references
interface ChapterContent {
  text: string;
  references?: Reference[];
}

interface Reference {
  title: string;
  author?: string;
  year?: string;
  url?: string;
  publicationName?: string;
  description?: string;
}

export const aiEducationService = {
  // Fetch AI-generated lesson content
  async generateLesson(params: AILessonRequest): Promise<AILessonResponse> {
    try {
      // This is a placeholder that would normally call a Supabase function or API
      // For now, we'll return some dummy content
      return {
        title: `${params.topic} - ${params.subject}`,
        content: `This is an AI-generated lesson about ${params.topic} for ${params.gradeLevel} grade level students.`,
        recommendations: ["Practice with related quizzes", "Explore additional resources"],
        summary: `A summary of the ${params.topic} lesson for ${params.gradeLevel} students.`,
        lessonId: `lesson-${Date.now()}`
      };
    } catch (error) {
      console.error("Error generating AI lesson:", error);
      return {
        title: "Error",
        content: "Could not generate lesson content",
        error: "Could not generate lesson content"
      };
    }
  },

  // Save learning interaction
  async trackLearningActivity(studentId: string, params: {
    subject: string;
    topic: string;
    activityType: 'lesson' | 'quiz' | 'game';
    completed?: boolean;
    progress?: number;
  }): Promise<void> {
    try {
      const { subject, topic, activityType, completed = false, progress = 0 } = params;
      
      await supabase.from('learning_activities').insert({
        student_id: studentId,
        subject,
        topic,
        activity_type: activityType,
        completed,
        progress
      });
    } catch (error) {
      console.error("Error tracking learning activity:", error);
      // Don't throw here, just log - we don't want tracking errors to disrupt the user experience
    }
  }
};

// Function to query OpenAI for detailed chapter content with references
async function getEnhancedChapterContent(topic: string, chapterTitle: string, subject: string, gradeLevel: string): Promise<ChapterContent> {
  try {
    console.log(`Starting enhanced content generation for: ${chapterTitle}`);
    
    // First request: Get core content for the chapter - improved for more engaging, conversational teacher-like content
    const coreContentMessages = [
      {
        role: "system" as "system",
        content: `You are an exceptional, passionate teacher for ${gradeLevel} students learning about ${subject}. 
        Create engaging, clear, and conversational educational content as if you're directly speaking to your students.
        Your content MUST be specifically about "${chapterTitle}" as it relates to "${topic}" - ensure strong topical relevance.
        
        IMPORTANT TEACHER GUIDELINES:
        - Use a warm, conversational tone like a great teacher explaining to students
        - Explain concepts clearly using simple, everyday language and relatable examples
        - Include "I'll explain this to you..." or "Let's think about this..."
        - Break down difficult concepts with relevant analogies students can understand
        - Add occasional rhetorical questions to engage students (e.g., "Have you ever wondered...?")
        - Highlight key terms and concepts in **bold** with clear explanations
        - Use excitement and enthusiasm in your tone ("Isn't that amazing?")
        - Include 3-4 meaningful, memorable examples students can relate to their daily lives
        - Enhance explanations with mini stories, scenarios or thought experiments
        - Organize content with clear section headings that spark curiosity
        
        Content structure must include:
        - A warm introduction connecting to students' experiences
        - At least 5-6 substantial, conversational paragraphs explaining core concepts
        - Multiple real-world examples and analogies that make abstract concepts concrete
        - Section where you directly address common student questions/misconceptions
        - Brief summary that reinforces key learning points
        
        The tone should be like a skilled teacher in a classroom explaining concepts in a way that makes students excited to learn more.`
      },
      {
        role: "user" as "user",
        content: `Create engaging, teacher-like educational content for a chapter titled "${chapterTitle}" in a lesson about "${topic}" for ${gradeLevel} students.
        
        Write this content exactly as if you are an exceptional teacher standing in front of a classroom, explaining this topic to your students. Use a conversational, friendly tone that builds connection with students.
        
        Your explanation should:
        1. Be focused specifically on "${chapterTitle}" as it relates to "${topic}"
        2. Begin with a warm opener that sparks curiosity about the topic
        3. Use a mix of clear explanations and engaging questions
        4. Include 3-4 memorable, concrete examples students can relate to
        5. Use analogies that simplify complex aspects of the topic
        6. Highlight important vocabulary in **bold** with student-friendly definitions
        7. Connect content to students' lives and experiences
        8. Address 2-3 common questions or misconceptions students typically have
        9. Include occasional moments of excitement and enthusiasm ("Isn't that fascinating?")
        10. End with a brief summary that reinforces the main points
        
        Make this content genuinely engaging - as if you're teaching a lively, interesting class where students are hanging on your every word. Use the techniques great teachers use to explain concepts clearly while keeping students interested.
        
        Focus purely on creating teacher-like educational content. Do NOT include references in this response.`
      }
    ];

    // Second request: Get supplementary details with real-world applications kids care about
    const supplementaryMessages = [
      {
        role: "system" as "system",
        content: `You are an inspiring, enthusiastic teacher who excels at showing ${gradeLevel} students why ${subject} matters in their world.
        Create supplementary content that shows students why "${chapterTitle}" in "${topic}" is relevant, fascinating, and worth learning about.
        
        CONTENT GUIDELINES:
        - Connect concepts to things students actually care about (games, sports, technology, social media, etc.)
        - Include 3-4 "Did you know?" fun facts that will genuinely surprise and delight students
        - Add real, specific examples of how this knowledge is used in careers students find exciting
        - Incorporate mini-stories about young people using this knowledge in cool ways
        - Consider cultural relevance to diverse student backgrounds
        - Address "Why should I care about this?" directly with compelling answers
        - Add interactive thought experiments students can discuss with friends
        - Mention current trends, technologies, or issues related to the topic that students follow
        
        Make this content as engaging and relevant as possible - content that makes students say "Wow, I never knew this was so interesting!"`
      },
      {
        role: "user" as "user",
        content: `Create additional supplementary content for a chapter titled "${chapterTitle}" in a lesson about "${topic}" for ${gradeLevel} students that shows them why this topic is actually interesting and relevant to their lives.
        
        Include:
        1. 3-4 "Did you know?" fascinating facts that will genuinely surprise and interest students
        2. Real examples connecting "${chapterTitle}" to things students actually care about (games, music, sports, social media, etc.)
        3. Brief stories about how real kids or teens have used knowledge of this topic in cool ways
        4. 2-3 examples of how this knowledge is applied in careers students find exciting (game design, sports, entertainment, etc.)
        5. A "Why This Matters To You" section with compelling reasons students should care about this topic
        6. 1-2 thought experiments or discussion questions students would actually want to talk about with friends
        
        Make this content genuinely engaging to students of this age group. Focus on aspects that would make them think "I never knew this topic was so cool!" Use an enthusiastic, relatable tone throughout.`
      }
    ];

    // Third request: Get references with detailed citations
    const referencesMessages = [
      {
        role: "system" as "system",
        content: `You are an expert educational researcher with access to all major academic and educational resources about ${subject}.
        Create a comprehensive list of high-quality references related to "${topic}" and specifically "${chapterTitle}".
        Include a mix of textbooks, academic papers, educational websites, videos, and other resources appropriate for ${gradeLevel} students.
        Each reference should have complete citation information.
        IMPORTANT: All references MUST be directly relevant to both "${topic}" and "${chapterTitle}" - avoid generic references.`
      },
      {
        role: "user" as "user",
        content: `Create a comprehensive list of 5-8 high-quality references specifically about "${chapterTitle}" in the context of ${topic} in ${subject}.
        
        For each reference, include:
        1. Title (exact publication title)
        2. Author(s) full name
        3. Year of publication/creation
        4. URL (if available online)
        5. Publisher/publication name
        6. Brief description of how this reference relates to "${chapterTitle}" and "${topic}"
        
        Return the data as a valid JSON array of reference objects with these fields, suitable for direct parsing.`
      }
    ];

    // Make all requests in parallel for better performance
    console.log(`Making parallel OpenAI requests for ${chapterTitle}`);
    const [coreCompletion, supplementaryCompletion, referencesCompletion] = await Promise.all([
      getChatCompletion(coreContentMessages).catch(error => {
        console.error(`Error in core content generation: ${error}`);
        return { content: `# ${chapterTitle}\n\nCore content unavailable. Please try again later.` };
      }),
      getChatCompletion(supplementaryMessages).catch(error => {
        console.error(`Error in supplementary content generation: ${error}`);
        return { content: '' };
      }),
      getChatCompletion(referencesMessages).catch(error => {
        console.error(`Error in references generation: ${error}`);
        return { content: '[]' };
      })
    ]);
    
    // Validate topic relevance in the generated content
    const coreContent = coreCompletion.content;
    const lowerCaseContent = coreContent.toLowerCase();
    const lowerCaseTopic = topic.toLowerCase();
    const lowerCaseChapterTitle = chapterTitle.toLowerCase();
    
    // Check if the content adequately mentions the topic and chapter title
    const topicMentions = countOccurrences(lowerCaseContent, lowerCaseTopic);
    const chapterTitleMentions = countOccurrences(lowerCaseContent, lowerCaseChapterTitle);
    
    // If content doesn't mention topic enough times, request improved content
    if (topicMentions < 3 || chapterTitleMentions < 2) {
      console.log(`Content not sufficiently relevant to topic (${topicMentions} topic mentions, ${chapterTitleMentions} chapter mentions), requesting improved content...`);
      
      // Request more relevant content with teacher-like approach
      const improvedContentMessages = [
        {
          role: "system" as "system",
          content: `You are a passionate, engaging teacher who explains concepts clearly and makes learning exciting.
          The previous content did not adequately address the specific topic.
          Create new teacher-like content that frequently and meaningfully references "${topic}" and "${chapterTitle}".
          Use a warm, conversational tone as if speaking directly to your students, explaining this specific topic in an engaging way.`
        },
        {
          role: "user" as "user",
          content: `The following content about "${chapterTitle}" in the context of "${topic}" is not sufficiently focused on the requested topic:
          
          ${coreContent}
          
          Please rewrite this as an engaging, conversational teacher explanation that is much more focused on "${topic}" and specifically the aspect covered by "${chapterTitle}".
          
          Write as if you are standing in front of a classroom of ${gradeLevel} students, explaining this topic with enthusiasm and clarity. Use a friendly, conversational tone throughout.
          
          Your improved explanation should:
          1. Use phrases like "Let me explain..." or "Have you ever wondered..." that a teacher would use
          2. Frequently and meaningfully mention "${topic}" (at least 5-8 times)
          3. Specifically address "${chapterTitle}" as an aspect of "${topic}" (at least 3-5 times)
          4. Include 3-4 concrete, relatable examples students can easily understand
          5. Use analogies that simplify the concept (e.g., "It's like..." or "Think of it this way...")
          6. Address students directly with questions and encouragement
          7. Highlight key terms in **bold** with clear, simple explanations
          8. Include at least 5-7 substantial, conversational paragraphs
          
          Format the content with markdown, including appropriate headers, emphasis, and structure.`
        }
      ];
      
      try {
        const improvedCompletion = await getChatCompletion(improvedContentMessages);
        // Use the improved content instead
        const updatedContent = improvedCompletion.content;
        
        // Combine the improved core content with supplementary content
        const combinedText = `# ${chapterTitle}\n\n${updatedContent}\n\n## Why This Is Actually Cool\n\n${supplementaryCompletion.content}`;
        
        console.log(`Successfully generated improved content for ${chapterTitle} with better topic relevance`);
        
        // Parse references
        let references: Reference[] = parseReferences(referencesCompletion.content);
        
        return {
          text: combinedText,
          references: references
        };
      } catch (error) {
        console.error(`Error generating improved content: ${error}`);
        // Continue with the original content
      }
    }
    
    // Check if the content has at least 5 paragraphs, if not, add additional paragraphs
    const paragraphs = coreContent.split('\n\n').filter(para => para.trim().length > 0);
    
    let finalCoreContent = coreContent;
    if (paragraphs.length < 5) {
      console.log(`Content has only ${paragraphs.length} paragraphs, requesting additional content...`);
      
      // Request additional paragraphs with teacher-like approach
      const additionalContentMessages = [
        {
          role: "system" as "system",
          content: `You are an exceptional, enthusiastic teacher for ${gradeLevel} students. 
          You need to add more to your lesson explanation to make it more engaging and comprehensive.
          The existing content is your lesson about "${chapterTitle}" in "${topic}" for your students.
          Add 3-4 more conversational paragraphs that expand on different aspects of the topic using a teacher's tone.
          Focus on providing relatable examples, addressing common student questions, and making the material engaging.`
        },
        {
          role: "user" as "user",
          content: `The following is part of your lesson explanation about "${chapterTitle}" in "${topic}" for your ${gradeLevel} students, but it needs additional content:
          
          ${coreContent}
          
          Please add 3-4 more conversational teacher-like paragraphs that would make this lesson more engaging and complete. Write as if you're speaking directly to your students.
          
          Your additional content should include:
          1. At least one relatable real-world example or analogy
          2. A section addressing common questions students might have
          3. An engaging "Did you know?" section with interesting facts
          4. Content that makes students understand why this matters to their lives
          
          Keep your tone warm, enthusiastic and conversational throughout, like a great teacher explaining to their class.`
        }
      ];
      
      try {
        const additionalCompletion = await getChatCompletion(additionalContentMessages);
        // Extract just the new paragraphs from the response
        const newContent = additionalCompletion.content
          .replace(/^Here are (some )?additional paragraphs:/i, '')
          .replace(/^I've added (some )?additional paragraphs:/i, '')
          .trim();
        
        // Append the new content to the existing content
        finalCoreContent = `${coreContent}\n\n## More Great Things to Know\n\n${newContent}`;
        console.log(`Successfully added additional paragraphs. Total length now: ${finalCoreContent.length} chars`);
      } catch (error) {
        console.error(`Error generating additional paragraphs: ${error}`);
        // Continue with the content we have
      }
    }
    
    // Parse references
    let references: Reference[] = parseReferences(referencesCompletion.content);
    
    // Combine the core content and supplementary content with a more engaging title
    const combinedText = `# ${chapterTitle}\n\n${finalCoreContent}\n\n## Why This Is Actually Cool\n\n${supplementaryCompletion.content}`;
    
    console.log(`Successfully generated enhanced content for ${chapterTitle} (${combinedText.length} chars, ${references.length} references)`);
    
    return {
      text: combinedText,
      references: references
    };
  } catch (error) {
    console.error("Error getting enhanced chapter content:", error);
    return {
      text: `# ${chapterTitle}\n\nDetailed content for this chapter could not be generated. Please try again later.`,
      references: []
    };
  }
}

// Helper function to count occurrences of a substring in a string
function countOccurrences(text: string, searchString: string): number {
  if (!searchString || searchString.length === 0) return 0;
  
  let count = 0;
  let position = text.indexOf(searchString);
  
  while (position !== -1) {
    count++;
    position = text.indexOf(searchString, position + 1);
  }
  
  return count;
}

// Helper function to parse references from OpenAI response
function parseReferences(content: string): Reference[] {
  try {
    // Parse the references response - handle both JSON and non-JSON formats
    if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
      // Try direct JSON parsing
      return JSON.parse(content);
    } else {
      // Try to extract JSON from text (in case response has explanation text before/after JSON)
      const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create a simple reference from the text
        return [{ 
          title: "Generated References",
          description: "References could not be properly formatted" 
        }];
      }
    }
  } catch (e) {
    console.error(`Error parsing references:`, e);
    return [{ 
      title: "References",
      description: "References information is available but could not be formatted correctly" 
    }];
  }
}

// Helper function to generate relevant chapter titles based on topic and subject
function generateRelevantChapterTitles(topic: string, subject: string, gradeLevel: string): string[] {
  // Request AI to generate relevant chapter titles specifically for this topic
  return [
    `Introduction to ${topic}`,
    `Key Concepts of ${topic}`,
    `Understanding ${topic} in ${subject}`,
    `Exploring ${topic} Further`,
    `Applications of ${topic}`,
    `${topic} in the Real World`,
    `Advanced Concepts in ${topic}`,
    `Review of ${topic}`
  ];
}

// Helper function to generate a comprehensive list of chapters
async function generateComprehensiveChapters(topic: string, subject: string, gradeLevel: string, studentProfile?: any, subtopic?: string) {
  // Determine comprehension level based on grade and profile
  const comprehensionLevel = studentProfile?.comprehensionLevel || 
    (gradeLevel === 'k-3' ? 'basic' : 
     gradeLevel === '4-6' ? 'intermediate' : 'advanced');
  
  // Generate chapter titles specifically relevant to this topic and subtopic if provided
  let chapterTitles: string[] = [];
  
  try {
    // Generate topic-specific chapter titles using AI
    const chapterTitleMessages = [
      {
        role: "system" as "system",
        content: `You are an expert curriculum designer specializing in ${subject} education for ${gradeLevel} students.
        ${subtopic ? 
          `Create a logical sequence of chapter titles for a lesson about "${subtopic}" within the broader topic of "${topic}".
          The titles should focus EXCLUSIVELY on "${subtopic}" with minimal reference to general "${topic}" concepts.` 
        : 
          `Create a logical sequence of chapter titles for a lesson about "${topic}" in ${subject}.
          The titles should be specific to "${topic}" and follow a natural learning progression.`
        }
        Each title should clearly indicate what specific concept or aspect it covers.
        ${subtopic ? `Your focus must be 100% on "${subtopic}" - every chapter should directly address this subtopic.` : ''}`
      },
      {
        role: "user" as "user",
        content: `Create a list of 6-8 chapter titles for a lesson about ${subtopic ? `"${subtopic}" (which is part of the broader topic "${topic}")` : `"${topic}"`} in ${subject} for ${gradeLevel} students.
        
        The chapter titles should:
        1. ${subtopic ? 
            `Focus 100% on "${subtopic}" specifically, NOT the general topic of "${topic}"` 
           : 
            `Be specific to "${topic}" (not generic titles that could apply to any topic)`
           }
        2. Cover different concepts/aspects of ${subtopic ? `"${subtopic}"` : `"${topic}"`} in a logical learning sequence
        3. Progress from basic to more advanced concepts
        4. Include specific terminology relevant to ${subtopic ? `"${subtopic}"` : `"${topic}"`} in ${subject}
        5. Be engaging and interesting for ${gradeLevel} students
        ${subtopic ? 
          `6. Make EVERY chapter directly relate to "${subtopic}" specifically
           7. Treat "${subtopic}" as THE learning topic, not as a subtopic of "${topic}"`
         : ''}
        
        Return ONLY the list of chapter titles, numbered 1-8, without any additional text or explanation.
        Each title should clearly indicate what specific concept or aspect of ${subtopic ? `"${subtopic}"` : `"${topic}"`} it addresses.`
      }
    ];
    
    const chapterTitleCompletion = await getChatCompletion(chapterTitleMessages);
    // Process the returned titles - extract numbered list items
    const titleMatches = chapterTitleCompletion.content.match(/\d+\.\s*(.*?)(?=\n\d+\.|\n*$)/gs);
    if (titleMatches && titleMatches.length >= 4) {
      chapterTitles = titleMatches.map(match => {
        // Remove the number and any extra whitespace
        return match.replace(/^\d+\.\s*/, '').trim();
      });
      console.log(`Generated ${chapterTitles.length} topic-specific chapter titles`);
    } else {
      console.log(`Could not parse generated chapter titles, using fallback titles`);
      chapterTitles = generateRelevantChapterTitles(topic, subject, gradeLevel);
    }
  } catch (error) {
    console.error("Error generating chapter titles:", error);
    // Fallback to manually generated titles
    chapterTitles = generateRelevantChapterTitles(topic, subject, gradeLevel);
  }
  
  // Adjust chapter count based on comprehension level
  const desiredChapterCount = comprehensionLevel === 'basic' ? 6 :
                              comprehensionLevel === 'intermediate' ? 8 : 10;
  
  // Ensure we have the right number of chapters
  if (chapterTitles.length > desiredChapterCount) {
    chapterTitles = chapterTitles.slice(0, desiredChapterCount);
  } else if (chapterTitles.length < desiredChapterCount) {
    // Add generic chapters to reach desired count
    const additionalTitles = [
      `More About ${topic}`,
      `Understanding ${topic} Better`,
      `${topic} in Context`,
      `Expanding on ${topic}`
    ];
    
    while (chapterTitles.length < desiredChapterCount && additionalTitles.length > 0) {
      chapterTitles.push(additionalTitles.shift()!);
    }
  }
  
  // Always add introduction and conclusion chapters
  chapterTitles.unshift(`Introduction to ${topic}`);
  chapterTitles.push(`Review and Summary of ${topic}`);
  
  // Create chapter structures with placeholders
  let chapters: Array<{
    heading: string;
    text: string;
    references?: Reference[];
    image?: {
      url: string;
      alt: string;
      caption?: string;
      searchQuery?: string;
    };
  }> = chapterTitles.map(title => ({
    heading: title,
    text: `Content about ${title} related to ${topic} in ${subject}.`,
    image: {
      url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(title)}-${topic}`,
      alt: `Image illustrating ${title}`
    }
  }));

  // Add personalization based on student profile if available
  if (studentProfile) {
    const personalizedHeading = studentProfile.name 
      ? `${topic} Topics for ${studentProfile.name}` 
      : `Personalized ${topic} Topics`;
      
    const interestsText = studentProfile.interests && studentProfile.interests.length > 0
      ? `This chapter explores ${topic} through the lens of ${studentProfile.interests.join(', ')}, connecting these interests to key concepts.`
      : `This chapter provides a personalized exploration of ${topic} tailored to your specific learning journey.`;
      
    chapters.push({
      heading: personalizedHeading,
      text: interestsText,
      image: {
        url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent('personalized')}-${topic}`,
        alt: `Personalized exploration of ${topic}`
      }
    });
  }
  
  console.log(`Enhancing content for all ${chapters.length} chapters...`);
  
  // Process chapters and enhance ALL with OpenAI (not just a subset)
  const enhancedChapters: Array<{
    title: string;
    content: string;
    references: Reference[];
    image?: {
      url: string;
      alt: string;
      caption?: string;
      searchQuery?: string;
    };
  }> = [];
  
  for (const chapter of chapters) {
    try {
      console.log(`Enhancing chapter: ${chapter.heading}`);
      const enhancedContent = await getEnhancedChapterContent(topic, chapter.heading, subject, gradeLevel);
      // Update the chapter with enhanced content
      chapter.text = enhancedContent.text;
      chapter.references = enhancedContent.references;
      enhancedChapters.push({
        title: chapter.heading,
        content: chapter.text,
        references: chapter.references || [],
        image: chapter.image
      });
    } catch (error) {
      console.error(`Error enhancing chapter ${chapter.heading}:`, error);
      // Keep the original content if enhancement fails
      enhancedChapters.push({
        title: chapter.heading,
        content: chapter.text,
        references: chapter.references || [],
        image: chapter.image
      });
    }
  }
  
  return enhancedChapters;
}

// Generate a comprehensive set of fun facts
function generateComprehensiveFunFacts(topic: string, subject: string) {
  return [
    `Did you know? The study of ${topic} began over a century ago.`,
    `Fun fact: ${topic} looks very different across various cultures around the world.`,
    `Interesting fact: There are more than 1,000 research papers published about ${topic} each year.`,
    `Surprising fact: Some aspects of ${topic} were discovered completely by accident!`,
    `The smallest elements of ${topic} can only be seen with specialized equipment.`,
    `Some experts spend their entire careers studying just one aspect of ${topic}.`,
    `In some countries, ${topic} is taught very differently than in others.`,
    `The understanding of ${topic} has changed dramatically in the last 50 years.`,
    `If you're interested in ${topic}, you might consider a career in ${subject} research.`,
    `There are international conferences dedicated solely to advancements in understanding ${topic}.`
  ];
}

// Export getAIEducationContent function with enhanced content generation
export async function getAIEducationContent(params: AIEducationContentRequest): Promise<{content: any} | null> {
  try {
    // Log the request parameters
    console.log("Generating AI content for:", params);
    
    // Get student profile information if available
    const studentProfile = params.studentProfile || {
      age: params.studentAge,
      name: params.studentName
    };
    
    let content: any = {};
    
    if (params.contentType === 'lesson') {
      // Create a combined context for better content generation
      const combinedContext = params.subtopic 
        ? `${params.subject}: ${params.topic} - ${params.subtopic}`
        : `${params.subject}: ${params.topic}`;
      
      // First, generate a focused introduction to the topic
      const introductionMessages = [
        {
          role: "system" as "system",
          content: `You are an expert educational content creator for ${params.gradeLevel} students learning about ${params.subject}.
          ${params.subtopic ? 
            `Create a focused, comprehensive introduction about "${params.subtopic}" which is a specific concept within "${params.topic}".
            The introduction must treat "${params.subtopic}" as THE primary subject, not merely as a subtopic.` 
          : 
            `Create a focused, comprehensive introduction about "${params.topic}" that is engaging and educational.`
          }
          The introduction should be tailored to ${params.gradeLevel} level students and specifically address ${params.subtopic ? `"${params.subtopic}"` : `"${params.topic}"`} - not generic content.
          ${params.subtopic ? `You must focus 100% on "${params.subtopic}" with only minimal reference to the general topic "${params.topic}".` : ''}`
        },
        {
          role: "user" as "user",
          content: `Write a focused, comprehensive introduction paragraph for a lesson about ${params.subtopic ? 
            `"${params.subtopic}" (which is a specific concept within the broader topic of "${params.topic}")` 
          : 
            `"${params.topic}"`
          } in ${params.subject} for ${params.gradeLevel} students.

          The introduction should:
          1. Clearly define what ${params.subtopic ? `"${params.subtopic}"` : `"${params.topic}"`} is
          2. Explain why ${params.subtopic ? `"${params.subtopic}"` : `"${params.topic}"`} is important in ${params.subject}
          3. Outline what students will learn about this specific concept in this lesson
          4. Be engaging and interesting for ${params.gradeLevel} students
          5. Be 2-3 paragraphs long (150-250 words)
          ${params.subtopic ? 
            `6. Focus 100% on "${params.subtopic}" specifically - only briefly mention the broader topic "${params.topic}" for context` 
          : ''}
          7. Align with Cambridge curriculum standards for ${params.gradeLevel} level
          
          The introduction should be highly specific to ${params.subtopic ? `"${params.subtopic}"` : `"${params.topic}"`} and not contain generic content.`
        }
      ];
      
      // Generate comprehensive chapter content with topic-specific chapters
      // If subtopic is specified, focus more directly on that subtopic
      const chapters = await generateComprehensiveChapters(
        params.topic,
        params.subject, 
        params.gradeLevel,
        studentProfile,
        params.subtopic // Pass the subtopic to focus the content
      );
      
      // Generate a focused conclusion
      const conclusionMessages = [
        {
          role: "system" as "system",
          content: `You are an expert educational content creator for ${params.gradeLevel} students learning about ${params.subject}.
          Create a focused, comprehensive conclusion specifically about "${params.topic}${params.subtopic ? ` with focus on ${params.subtopic}` : ''}" that summarizes key points and reinforces learning.
          The conclusion should be tailored to ${params.gradeLevel} level students and specifically address "${params.topic}${params.subtopic ? ` and ${params.subtopic}` : ''}" - not generic content.`
        },
        {
          role: "user" as "user",
          content: `Write a focused, comprehensive conclusion paragraph for a lesson about "${params.topic}${params.subtopic ? ` focusing on ${params.subtopic}` : ''}" in ${params.subject} for ${params.gradeLevel} students.

          The conclusion should:
          1. Summarize key points about "${params.topic}${params.subtopic ? ` and ${params.subtopic}` : ''}"
          2. Reinforce why this topic is important
          3. Suggest how students can apply what they've learned
          4. Be 2-3 paragraphs long (150-250 words)
          
          The conclusion should be highly specific to the topic and not contain generic content that could apply to other topics.`
        }
      ];
      
      // Generate tailored fun facts
      const funFactsMessages = [
        {
          role: "system" as "system",
          content: `You are an expert educator who knows fascinating, accurate fun facts about ${params.subject}.
          Create a list of interesting, educational fun facts specifically about "${params.topic}" that will engage ${params.gradeLevel} students.
          Each fact should be directly related to "${params.topic}" - not generic facts about ${params.subject}.`
        },
        {
          role: "user" as "user",
          content: `Create 5-7 fascinating, educational fun facts specifically about "${params.topic}" in ${params.subject} that will interest ${params.gradeLevel} students.

          Each fun fact should:
          1. Be directly related to "${params.topic}"
          2. Be accurate and educational
          3. Be engaging and surprising
          4. Be 1-2 sentences long
          
          Return only the list of fun facts, each starting with "Fun fact:" - without any additional text or explanation.`
        }
      ];
      
      // Generate engaging, interactive activity
      const activityMessages = [
        {
          role: "system" as "system",
          content: `You are a creative, inspiring teacher who designs fun, engaging educational activities for ${params.gradeLevel} students learning about ${params.subject}.
          Create an exciting, hands-on activity about "${params.topic}${params.subtopic ? ` focusing on ${params.subtopic}` : ''}" that will make learning fun and interactive.
          Design the activity to reinforce key concepts while being genuinely enjoyable for students to complete.
          The activity should be appropriate for ${params.gradeLevel} students and relate directly to "${params.topic}${params.subtopic ? ` and ${params.subtopic}` : ''}".`
        },
        {
          role: "user" as "user",
          content: `Create an engaging educational activity about "${params.topic}${params.subtopic ? ` focusing on ${params.subtopic}` : ''}" for ${params.gradeLevel} students.

          The activity should:
          1. Be creative, fun, and hands-on
          2. Use readily available materials students would have at home or in a classroom
          3. Include clear, step-by-step instructions
          4. Connect directly to key concepts in "${params.topic}${params.subtopic ? ` and ${params.subtopic}` : ''}"
          5. Take approximately 15-30 minutes to complete
          6. Be appropriate for individual students or small groups
          7. Include discussion questions or reflection prompts at the end
          8. Have a catchy, interesting title

          Return the activity in JSON format with these fields:
          - title: Catchy title for the activity
          - materials: Array of materials needed
          - timeRequired: Estimated time to complete
          - instructions: Array of step-by-step instructions
          - discussionQuestions: Array of 3-4 questions for reflection
          - learningObjectives: Array of what students will learn
          - tips: Any tips for success
          
          Ensure all parts of the activity are directly related to "${params.topic}${params.subtopic ? ` and ${params.subtopic}` : ''}" in ${params.subject}.`
        }
      ];
      
      // Execute all remaining API calls in parallel
      const [introductionResponse, conclusionResponse, funFactsResponse, activityResponse] = await Promise.all([
        getChatCompletion(introductionMessages),
        getChatCompletion(conclusionMessages),
        getChatCompletion(funFactsMessages),
        getChatCompletion(activityMessages)
      ]);
      
      // Process fun facts - extract just the facts
      const factMatches = funFactsResponse.content.match(/Fun fact:.*?(?=\n|$)/gi) || [];
      const funFacts = factMatches.length > 0 ? 
        factMatches.map(fact => fact.replace(/^Fun fact:\s*/i, '').trim()) : 
        generateComprehensiveFunFacts(params.topic, params.subject);
      
      // Validate introduction mentions the topic
      let introduction = introductionResponse.content;
      if (!introduction.toLowerCase().includes(params.topic.toLowerCase())) {
        introduction = `Welcome to our lesson on ${params.topic} in ${params.subject}! ${introduction}`;
      }
      
      // Validate conclusion mentions the topic
      let conclusion = conclusionResponse.content;
      if (!conclusion.toLowerCase().includes(params.topic.toLowerCase())) {
        conclusion = `In conclusion, we've explored many fascinating aspects of ${params.topic}. ${conclusion}`;
      }
      
      // Parse activity JSON from response
      let activity = {
        title: `Interactive Exploration of ${params.topic}`,
        instructions: `This activity will help you apply what you've learned about ${params.topic} through hands-on exploration and critical thinking. Follow these steps and record your observations and insights as you go.`,
        materials: ["Paper", "Pencil"],
        timeRequired: "15-20 minutes",
        discussionQuestions: [
          `How does ${params.topic} relate to your everyday life?`,
          `What was the most interesting thing you learned about ${params.topic}?`,
          `What questions do you still have about ${params.topic}?`
        ],
        learningObjectives: [`Understand the key concepts of ${params.topic}`],
        tips: "Take your time and have fun with this activity!",
        image: {
          url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(params.topic)}-activity`,
          alt: `Activity about ${params.topic}`
        }
      };
      
      try {
        // Extract JSON object from response
        const jsonMatch = activityResponse.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedActivity = JSON.parse(jsonMatch[0]);
          // Update with parsed activity data, keeping fallback values for any missing fields
          activity = {
            ...activity,
            ...parsedActivity,
            // Ensure the image is always included
            image: parsedActivity.image || activity.image
          };
        }
      } catch (error) {
        console.error("Error parsing activity JSON:", error);
        // Fall back to default activity defined above
      }
      
      content = {
        title: params.topic,
        introduction: introduction,
        mainContent: chapters,
        funFacts: funFacts,
        activity: activity,
        conclusion: conclusion,
        summary: `In this lesson, we explored ${params.topic} in the context of ${params.subject}. We covered key concepts, practical applications, and much more across ${chapters.length} detailed chapters. We examined how ${params.topic} relates to real-world situations and considered its importance in ${params.subject}.`
      };
    } else if (params.contentType === 'quiz') {
      // Enhanced quiz content with subtopic support
      const topicToFocusOn = params.subtopic || params.topic;
      
      const quizGenerationInstructions = [
        {
          role: "system" as "system",
          content: `You are an expert educational quiz creator specializing in ${params.subject} for ${params.gradeLevel} students.
          ${params.subtopic ? 
            `Create a quiz that focuses 100% on "${params.subtopic}" as a specific concept within "${params.topic}".
            Questions should test understanding of "${params.subtopic}" specifically, not general knowledge about "${params.topic}".` 
           : 
            `Create a quiz on "${params.topic}" appropriate for ${params.gradeLevel} students.`
           }
          Create questions that test understanding of specific concepts, principles, and applications.
          Ensure the questions align with Cambridge curriculum standards and are appropriate for ${params.gradeLevel} level students.`
        },
        {
          role: "user" as "user",
          content: `Create a comprehensive quiz on ${params.subtopic ? 
            `"${params.subtopic}" (which is a specific concept within the topic "${params.topic}")` 
          : 
            `"${params.topic}"`
          } for ${params.gradeLevel} students studying ${params.subject}.
          
          The quiz should:
          1. Include 10 multiple-choice questions and 2 essay questions
          2. ${params.subtopic ? 
              `Focus 100% on "${params.subtopic}" specifically, not the general topic of "${params.topic}"` 
            : 
              `Cover key concepts within "${params.topic}"`
            }
          3. Test understanding of specific concepts, not just recall of facts
          4. Include questions about applications and real-world examples
          5. Provide detailed explanations for the correct answers
          6. For essay questions, include model answers for reference
          
          Return the quiz as a structured JSON array of question objects with these properties:
          - question: The question text
          - questionType: 'multiple-choice' or 'essay'
          - options: Array of answer options (for multiple-choice)
          - correctAnswer: Index of correct answer (for multiple-choice)
          - explanation: Explanation of the correct answer
          - modelAnswer: Model answer (for essay questions)
          
          Make sure all questions focus specifically on ${params.subtopic || params.topic}.`
        }
      ];
      
      try {
        const quizCompletion = await getChatCompletion(quizGenerationInstructions);
        
        // Parse the JSON response
        let parsedContent;
        try {
          // Extract JSON array from the response
          const jsonMatch = quizCompletion.content.match(/\[\s*\{.*\}\s*\]/s);
          if (jsonMatch) {
            parsedContent = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("Could not extract JSON from response");
          }
        } catch (parseError) {
          console.error("Error parsing quiz content:", parseError);
          // Fallback to default questions
          parsedContent = [
            {
              question: `What is a key principle of ${topicToFocusOn}?`,
              questionType: 'multiple-choice',
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: 0,
              explanation: `Explanation about ${topicToFocusOn}`
            },
            {
              question: `How does ${topicToFocusOn} apply in real-world situations?`,
              questionType: 'multiple-choice',
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: 1,
              explanation: `Explanation about ${topicToFocusOn} applications`
            },
            {
              question: `Explain the concept of ${topicToFocusOn} in your own words.`,
              questionType: 'essay',
              options: [],
              correctAnswer: 0,
              explanation: "The answer should demonstrate understanding of the core principles.",
              modelAnswer: `A comprehensive explanation of ${topicToFocusOn}...`
            }
          ];
        }
        
        content = {
          questions: parsedContent
        };
      } catch (error) {
        console.error("Error generating quiz content:", error);
        // Fallback content
        content = {
          questions: [
            {
              question: `What is a key characteristic of ${topicToFocusOn}?`,
              questionType: 'multiple-choice',
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: 0,
              explanation: "Explanation for the correct answer"
            },
            {
              question: `How does ${topicToFocusOn} apply in the real world?`,
              questionType: 'multiple-choice',
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: 1,
              explanation: "Explanation for the correct answer"
            },
            {
              question: `Explain the importance of ${topicToFocusOn} in your own words.`,
              questionType: 'essay',
              options: [],
              correctAnswer: 0,
              explanation: "The answer should demonstrate understanding of the core principles.",
              modelAnswer: `A comprehensive explanation of ${topicToFocusOn}...`
            }
          ]
        };
      }
    } else if (params.contentType === 'game') {
      // Enhanced game content with concept focus
      const topicToFocusOn = params.subtopic || params.topic;
      const gameContext = params.subtopic ? 
        `${params.subtopic} (a specific concept within ${params.topic})` : 
        params.topic;
      
      const gameGenerationInstructions = [
        {
          role: "system" as "system",
          content: `You are an expert educational game designer specializing in creating engaging, hands-on learning activities for ${params.gradeLevel} students.
          ${params.subtopic ? 
            `Create a game that teaches specifically about "${params.subtopic}" as a key concept within the broader topic of "${params.topic}".
            The game should focus 100% on helping students understand and apply concepts related to "${params.subtopic}" specifically.`
           :
            `Create a game that teaches about "${params.topic}" in an engaging way.`
          }
          The game should be appropriate for ${params.gradeLevel} students, require minimal materials, and provide clear learning outcomes.`
        },
        {
          role: "user" as "user",
          content: `Design an educational game about ${params.subtopic ? 
            `"${params.subtopic}" (which is a specific concept within the topic "${params.topic}")` 
          : 
            `"${params.topic}"`
          } for ${params.gradeLevel} students studying ${params.subject}.
          
          The game should:
          1. Focus specifically on teaching key concepts related to ${topicToFocusOn}
          2. Be engaging and fun while remaining educational
          3. Require minimal, easily available materials
          4. Include clear instructions and learning objectives
          5. Be adaptable for different skill levels
          6. Take 15-30 minutes to complete
          7. Reinforce specific curriculum concepts, not just general knowledge
          
          Return the game as a structured JSON object with these properties:
          - title: Name of the game
          - objective: Learning objective
          - materials: Array of required materials
          - setup: How to set up the game
          - instructions: Step by step instructions
          - variations: Easier and harder variations
          - learningObjectives: Specific learning objectives
          - conceptsReinforced: Key concepts this game reinforces
          
          Make sure the game focuses 100% on ${topicToFocusOn} specifically.`
        }
      ];
      
      try {
        const gameCompletion = await getChatCompletion(gameGenerationInstructions);
        
        // Parse the JSON response
        let parsedContent;
        try {
          // Extract JSON object from the response
          const jsonMatch = gameCompletion.content.match(/\{\s*".*\}\s*/s);
          if (jsonMatch) {
            parsedContent = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("Could not extract JSON from response");
          }
        } catch (parseError) {
          console.error("Error parsing game content:", parseError);
          // Fallback to default game content
          parsedContent = {
            title: `${topicToFocusOn} Explorer Game`,
            objective: `Learn about ${topicToFocusOn} through interactive play`,
            materials: ["Paper", "Pencil", "Scissors", "Index cards"],
            setup: `Prepare the game by writing key concepts about ${topicToFocusOn} on index cards.`,
            instructions: `Players take turns drawing cards and explaining the concepts in their own words.`,
            variations: {
              easier: "For younger students, use pictures along with simple terms.",
              harder: "For advanced students, include application challenges for each concept."
            },
            learningObjectives: [
              `Understand key concepts of ${topicToFocusOn}`,
              `Apply knowledge of ${topicToFocusOn} to solve problems`,
              `Develop critical thinking about ${topicToFocusOn}`
            ],
            conceptsReinforced: [
              `Core principles of ${topicToFocusOn}`,
              `Applications of ${topicToFocusOn}`,
              `Problem-solving related to ${topicToFocusOn}`
            ]
          };
        }
        
        content = parsedContent;
      } catch (error) {
        console.error("Error generating game content:", error);
        // Fallback content
        content = {
          title: `${topicToFocusOn} Game`,
          objective: `Learn about ${topicToFocusOn} through play and hands-on activities`,
          materials: ["Paper", "Pencil", "Imagination"],
          setup: `Set up the game by creating a playing area that represents ${topicToFocusOn}.`,
          instructions: `Follow these steps to explore and learn about ${topicToFocusOn}...`,
          variations: {
            easier: "For younger students...",
            harder: "For more advanced students..."
          },
          learningObjectives: [
            `Understanding key concepts of ${topicToFocusOn}`,
            `Practical application of ${topicToFocusOn} principles`,
            `Development of critical thinking skills related to ${topicToFocusOn}`
          ],
          conceptsReinforced: [
            `Key terminology related to ${topicToFocusOn}`,
            `Processes involved in ${topicToFocusOn}`,
            `Real-world applications of ${topicToFocusOn}`
          ]
        };
      }
    }
    
    return { content };
  } catch (error) {
    console.error("Error in getAIEducationContent:", error);
    return null;
  }
}
