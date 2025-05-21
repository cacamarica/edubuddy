import { supabase } from "@/integrations/supabase/client";
import { QuizQuestion } from "@/components/QuizComponents/QuizQuestionCard";

interface QuizProgress {
  student_id: string;
  subject: string;
  topic: string;
  grade_level: string;
  current_question: number;
  questions_answered: number[];
  correct_answers: number[];
  is_completed: boolean;
}

interface QuizOptions {
  subject: string;
  gradeLevel: string;
  topic: string;
  subtopic?: string;
  language?: 'en' | 'id';
  questionCount?: number;
  includeLessonContent?: boolean;
  specificSubtopics?: string[];
  includeLearnedConcepts?: boolean;
  forceRefresh?: boolean;
}

// Helper to generate a cache key for quiz questions
const generateCacheKey = (options: QuizOptions): string => {
  const { subject, gradeLevel, topic, subtopic, language } = options;
  return `quiz_cache_${subject.toLowerCase()}_${gradeLevel}_${topic.toLowerCase()}_${subtopic || 'none'}_${language || 'en'}`;
};

// This helper function ensures options arrays are properly cast to string[]
const ensureStringArray = (options: any[]): string[] => {
  return options.map(option => String(option));
};

// Check if we have cached questions in localStorage
const getCachedQuestions = async (options: QuizOptions): Promise<QuizQuestion[] | null> => {
  try {
    const cacheKey = generateCacheKey(options);
    
    console.log('[Cache] Checking for cached quiz questions');
    
    // Try to get from localStorage
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) {
      console.log('[Cache] No cached questions found');
      return null;
    }
    
    try {
      const parsedData = JSON.parse(cachedData);
      
      if (!parsedData || !parsedData.questions || !Array.isArray(parsedData.questions)) {
        console.log('[Cache] Invalid cached questions format');
        return null;
      }
      
      // Check if cache is recent (within 7 days)
      const cacheDate = new Date(parsedData.timestamp);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 7) {
        console.log('[Cache] Cached questions are older than 7 days, refreshing');
        return null;
      }
      
      console.log('[Cache] Found cached questions, count:', parsedData.questions.length);
      return parsedData.questions as QuizQuestion[];
    } catch (parseError) {
      console.error('[Cache] Error parsing cached data:', parseError);
      return null;
    }
  } catch (error) {
    console.error('[Cache] Error checking for cached questions:', error);
    return null;
  }
};

// Save questions to cache in localStorage
const cacheQuestions = async (options: QuizOptions, questions: QuizQuestion[]): Promise<void> => {
  try {
    if (!questions || questions.length === 0) {
      console.log('[Cache] Not caching empty question set');
      return;
    }
    
    const cacheKey = generateCacheKey(options);
    
    console.log('[Cache] Caching quiz questions');
    
    // Store data with timestamp
    const cacheData = {
      questions: questions,
      timestamp: new Date().toISOString(),
      options
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log('[Cache] Successfully cached quiz questions');
  } catch (error) {
    console.error('[Cache] Error caching quiz questions:', error);
  }
};

// Fallback questions for different subjects
const FALLBACK_QUESTIONS: Record<string, QuizQuestion[]> = {
  'Math': [
    {
      question: "What is 8 + 5?",
      options: ["12", "13", "14", "15"],
      correctAnswer: 1,
      explanation: "8 + 5 = 13",
      questionType: "multiple-choice"
    },
    {
      question: "What is 7 × 6?",
      options: ["36", "42", "48", "54"],
      correctAnswer: 1,
      explanation: "7 × 6 = 42",
      questionType: "multiple-choice"
    },
    {
      question: "What is half of 36?",
      options: ["16", "18", "20", "24"],
      correctAnswer: 1,
      explanation: "Half of 36 is 36 ÷ 2 = 18",
      questionType: "multiple-choice"
    },
    {
      question: "What is 24 ÷ 6?",
      options: ["3", "4", "6", "8"],
      correctAnswer: 1,
      explanation: "24 ÷ 6 = 4",
      questionType: "multiple-choice"
    },
    {
      question: "What comes next in the sequence: 2, 4, 6, 8, ...?",
      options: ["9", "10", "11", "12"],
      correctAnswer: 1,
      explanation: "The sequence increases by 2 each time, so 8 + 2 = 10",
      questionType: "multiple-choice"
    }
  ],
  'Science': [
    {
      question: "Which of these is a renewable energy source?",
      options: ["Coal", "Solar", "Oil", "Natural gas"],
      correctAnswer: 1,
      explanation: "Solar energy comes from the sun which is renewable, unlike fossil fuels like coal, oil, and natural gas.",
      questionType: "multiple-choice"
    },
    {
      question: "What is the largest organ in the human body?",
      options: ["Heart", "Brain", "Skin", "Liver"],
      correctAnswer: 2,
      explanation: "The skin is the largest organ, covering the entire exterior of the body.",
      questionType: "multiple-choice"
    },
    {
      question: "Which gas do plants absorb from the atmosphere?",
      options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
      correctAnswer: 1,
      explanation: "Plants absorb carbon dioxide from the atmosphere during photosynthesis.",
      questionType: "multiple-choice"
    },
    {
      question: "What is the hardest natural substance on Earth?",
      options: ["Gold", "Iron", "Diamond", "Granite"],
      correctAnswer: 2,
      explanation: "Diamond is the hardest naturally occurring substance.",
      questionType: "multiple-choice"
    },
    {
      question: "Which of these is NOT a state of matter?",
      options: ["Solid", "Liquid", "Gas", "Energy"],
      correctAnswer: 3,
      explanation: "The three common states of matter are solid, liquid, and gas. Energy is a form of power, not a state of matter.",
      questionType: "multiple-choice"
    }
  ],
  'English': [
    {
      question: "Which of these is a noun?",
      options: ["Run", "Beautiful", "House", "Quickly"],
      correctAnswer: 2,
      explanation: "A noun is a person, place, thing, or idea. 'House' is a thing, making it a noun.",
      questionType: "multiple-choice"
    },
    {
      question: "What is the past tense of 'eat'?",
      options: ["Eating", "Eaten", "Ate", "Eated"],
      correctAnswer: 2,
      explanation: "The past tense of 'eat' is 'ate'.",
      questionType: "multiple-choice"
    },
    {
      question: "Which punctuation mark ends a statement?",
      options: ["Period (.)", "Question mark (?)", "Exclamation point (!)", "Comma (,)"],
      correctAnswer: 0,
      explanation: "A period (.) is used to end a statement.",
      questionType: "multiple-choice"
    },
    {
      question: "What is an antonym for 'happy'?",
      options: ["Sad", "Joyful", "Excited", "Pleased"],
      correctAnswer: 0,
      explanation: "An antonym is a word that means the opposite. 'Sad' is the opposite of 'happy'.",
      questionType: "multiple-choice"
    },
    {
      question: "Which of these is an adjective?",
      options: ["Quickly", "Beautiful", "Run", "Talk"],
      correctAnswer: 1,
      explanation: "An adjective describes a noun. 'Beautiful' describes how something looks.",
      questionType: "multiple-choice"
    }
  ],
  'default': [
    {
      question: "What is the capital of France?",
      options: ["London", "Paris", "Berlin", "Madrid"],
      correctAnswer: 1,
      explanation: "Paris is the capital city of France.",
      questionType: "multiple-choice"
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Earth", "Mars", "Jupiter", "Venus"],
      correctAnswer: 1,
      explanation: "Mars is known as the Red Planet due to its reddish appearance.",
      questionType: "multiple-choice"
    },
    {
      question: "How many sides does a hexagon have?",
      options: ["5", "6", "7", "8"],
      correctAnswer: 1,
      explanation: "A hexagon has 6 sides.",
      questionType: "multiple-choice"
    },
    {
      question: "What is H2O commonly known as?",
      options: ["Oxygen", "Hydrogen", "Water", "Carbon dioxide"],
      correctAnswer: 2,
      explanation: "H2O is the chemical formula for water.",
      questionType: "multiple-choice"
    },
    {
      question: "Which animal is known as the 'King of the Jungle'?",
      options: ["Tiger", "Lion", "Elephant", "Giraffe"],
      correctAnswer: 1,
      explanation: "The lion is often called the 'King of the Jungle'.",
      questionType: "multiple-choice"
    }
  ]
};

// Helper function to process and validate quiz data
function processQuizData(data: any[], questionCount: number): QuizQuestion[] {
  // Validate each question
  const validatedQuestions = data.filter(q => 
    q && 
    typeof q.question === 'string' && 
    Array.isArray(q.options) && 
    q.options.length >= 2 && 
    typeof q.correctAnswer === 'number'
  );
  
  console.log(`Validated ${validatedQuestions.length} of ${data.length} questions`);
  
  if (validatedQuestions.length === 0) {
    console.error('All received questions were invalid');
    throw new Error('All questions received were invalid');
  }
  
  // Transform the data to match the QuizQuestion interface and ensure options are strings
  const transformedQuestions = validatedQuestions.map((q: any) => ({
    question: q.question,
    options: ensureStringArray(q.options),
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || '',
    questionType: q.questionType || 'multiple-choice'
  }));
  
  // Ensure we have enough questions by duplicating if needed
  let finalQuestions = [...transformedQuestions];
  while (finalQuestions.length < questionCount && transformedQuestions.length > 0) {
    finalQuestions = [...finalQuestions, ...transformedQuestions];
  }
  
  // Return the requested number of questions
  return finalQuestions.slice(0, questionCount);
}

export const fetchQuizQuestions = async (options: QuizOptions): Promise<QuizQuestion[]> => {
  try {
    const { 
      subject, 
      gradeLevel, 
      topic,
      subtopic,
      language = 'en', 
      questionCount = 10,
      includeLessonContent = false,
      specificSubtopics,
      includeLearnedConcepts = false,
      forceRefresh = false
    } = options;
    
    console.log('Requesting quiz questions with options:', {
      subject, gradeLevel, topic, subtopic, language, questionCount, 
      includeLessonContent, specificSubtopics, includeLearnedConcepts, forceRefresh
    });
    
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedQuestions = await getCachedQuestions(options);
      if (cachedQuestions) {
        console.log('Using cached quiz questions');
        
        // Ensure we have the right number of questions
        if (cachedQuestions.length >= questionCount) {
          return cachedQuestions.slice(0, questionCount);
        } else {
          // If we don't have enough cached questions, duplicate until we do
          let questions = [...cachedQuestions];
          while (questions.length < questionCount) {
            questions = [...questions, ...cachedQuestions];
          }
          return questions.slice(0, questionCount);
        }
      }
    }
    
    // Validate parameters before sending them
    const validatedParams = {
      subject: subject || 'General',
      gradeLevel: gradeLevel || 'k-3',
      topic: topic || 'General Knowledge',
      subtopic: subtopic,
      language: language === 'id' ? 'id' : 'en',
      questionCount: Math.min(Math.max(1, questionCount || 5), 20), // Ensure between 1-20
      includeLessonContent: !!includeLessonContent,
      specificSubtopics: Array.isArray(specificSubtopics) ? specificSubtopics : undefined,
      includeLearnedConcepts: !!includeLearnedConcepts
    };
    
    // Add validation for stringifying large objects which might cause issues
    // Ensure the body size is reasonable by limiting array sizes
    if (validatedParams.specificSubtopics && validatedParams.specificSubtopics.length > 10) {
      validatedParams.specificSubtopics = validatedParams.specificSubtopics.slice(0, 10);
    }
    
    // Try to call the edge function with validated parameters
    console.log('Calling Supabase function with params:', JSON.stringify(validatedParams));
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-quiz-generator', {
        body: validatedParams
      }).catch(err => {
        // Handle network errors or other exceptions from the fetch request
        console.error('Network error calling Supabase function:', err);
        // Return a structured response with error to be handled by the outer catch
        return { data: null, error: { message: `Network error: ${err.message || 'Unknown error'}` } };
      });
      
      // Handle API errors
      if (error) {
        console.error('Error response from Supabase function:', error);
        throw new Error(`Quiz API error: ${error.message || 'Unknown error'}`);
      }

      // Validate the response
      if (!data) {
        console.error('Empty response from quiz generator API');
        throw new Error('Empty response from quiz generator API');
      }
      
      if (!Array.isArray(data)) {
        console.error('Non-array response from quiz generator API:', data);
        
        // If we got an object with questions property that's an array, try to use that
        if (data && typeof data === 'object' && 'questions' in data && Array.isArray(data.questions)) {
          console.log('Found questions array in response object, attempting to use it');
          const processedQuestions = processQuizData(data.questions, questionCount);
          
          // Cache the questions
          await cacheQuestions(options, processedQuestions);
          
          return processedQuestions;
        }
        
        throw new Error('Invalid response format from quiz generator API');
      }
      
      if (data.length === 0) {
        console.error('Empty array response from quiz generator API');
        throw new Error('No questions returned from quiz generator API');
      }
      
      const processedQuestions = processQuizData(data, questionCount);
      
      // Cache the questions
      await cacheQuestions(options, processedQuestions);
      
      return processedQuestions;
    } catch (apiError) {
      console.error('Error with quiz API, using fallback questions:', apiError);
      
      // Use fallback questions based on subject
      const fallbackSubject = subject.toLowerCase();
      let fallbackQuestions: QuizQuestion[] = [];
      
      if (fallbackSubject.includes('math')) {
        fallbackQuestions = FALLBACK_QUESTIONS['Math'];
      } else if (fallbackSubject.includes('science')) {
        fallbackQuestions = FALLBACK_QUESTIONS['Science'];
      } else if (fallbackSubject.includes('english') || fallbackSubject.includes('language')) {
        fallbackQuestions = FALLBACK_QUESTIONS['English'];
      } else {
        fallbackQuestions = FALLBACK_QUESTIONS['default'];
      }
      
      // Ensure we have the right number of questions (duplicate if needed)
      while (fallbackQuestions.length < questionCount) {
        const additionalQuestions = [...fallbackQuestions];
        fallbackQuestions = [...fallbackQuestions, ...additionalQuestions];
      }
      
      // Trim to requested question count
      return fallbackQuestions.slice(0, questionCount);
    }
  } catch (error) {
    console.error('Error in fetchQuizQuestions:', error);
    // Return default questions instead of re-throwing
    return FALLBACK_QUESTIONS['default'].slice(0, 5);
  }
};

export const getQuizProgress = async (studentId: string, subject: string, topic: string, gradeLevel: string): Promise<QuizProgress | null> => {
  try {
    const { data, error } = await supabase
      .from('quiz_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('subject', subject)
      .eq('topic', topic)
      .eq('grade_level', gradeLevel)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching quiz progress:', error);
      return null;
    }
    
    return data as QuizProgress;
  } catch (error) {
    console.error('Error in getQuizProgress:', error);
    return null;
  }
};

export const saveQuizProgress = async (studentId: string, progress: QuizProgress): Promise<boolean> => {
  try {
    // Check if progress entry already exists
    const existing = await getQuizProgress(
      studentId,
      progress.subject,
      progress.topic,
      progress.grade_level
    );
    
    if (existing) {
      // Update existing progress
      const { error } = await supabase
        .from('quiz_progress')
        .update(progress)
        .eq('student_id', studentId)
        .eq('subject', progress.subject)
        .eq('topic', progress.topic)
        .eq('grade_level', progress.grade_level);
        
      if (error) {
        console.error('Error updating quiz progress:', error);
        return false;
      }
    } else {
      // Insert new progress
      const { error } = await supabase
        .from('quiz_progress')
        .insert([progress]);
        
      if (error) {
        console.error('Error inserting quiz progress:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in saveQuizProgress:', error);
    return false;
  }
}; 