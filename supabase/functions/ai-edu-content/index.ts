
// NOTE: This file is designed to run in Supabase Edge Functions with Deno runtime
// These imports and globals won't be recognized in a regular Node.js environment 
// but will work correctly when deployed to Supabase
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// TypeScript interfaces to fix type errors 
interface RequestData {
  contentType: 'lesson' | 'quiz' | 'game' | 'buddy';
  subject?: string;
  gradeLevel?: 'k-3' | '4-6' | '7-9';
  topic?: string;
  question?: string;
  includeImages?: boolean;
  language?: 'en' | 'id';
  imageStyle?: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  [key: string]: any;
}

// Define content interfaces to improve type safety
interface LessonContent {
  title?: string;
  introduction?: string;
  mainContent?: Array<any>;
  funFacts?: Array<string>;
  activity?: {
    title?: string;
    instructions?: string;
    image?: any;
  };
  questions?: Array<any>;
  [key: string]: any;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Placeholder images for each subject with more cartoon/drawing style
const placeholderImages = {
  'Math': [
    'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1635372722656-389f87a941ae?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=800&q=80&style=cartoon', 
  ],
  'Science': [
    'https://images.unsplash.com/photo-1628595351029-c2bf17511435?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1517976384346-3136801d605d?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1554475900-0a0350e3fc7b?auto=format&fit=crop&w=800&q=80&style=cartoon', 
  ],
  'Reading': [
    'https://images.unsplash.com/photo-1512903989752-7f2c1bddc711?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1488381397757-59d6261610f4?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80&style=cartoon', 
  ],
  'Language Arts': [
    'https://images.unsplash.com/photo-1512903989752-7f2c1bddc711?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1510936111840-65e151ad71bb?auto=format&fit=crop&w=800&q=80&style=cartoon', 
  ],
  'Social Studies': [
    'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1559125148-869042e9d898?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1545670723-196ed0954986?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1533677308119-8b313fe7f72d?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1618477460930-8c4c6aa06af5?auto=format&fit=crop&w=800&q=80&style=cartoon', 
  ],
  'History': [
    'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1476990789491-712b869b91a5?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1491156855053-9cdff72c7f85?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1533294455009-a77b7557d2d1?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1495562569060-2eec283d3391?auto=format&fit=crop&w=800&q=80&style=cartoon', 
  ],
  'Geography': [
    'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1508900173264-5ff93ea3037e?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1531761535209-180857b9b45b?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1605142859862-978be7eba909?auto=format&fit=crop&w=800&q=80&style=cartoon', 
  ],
  'Art': [
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1513364778565-464df9a60104?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?auto=format&fit=crop&w=800&q=80&style=cartoon', 
  ],
  // Default for any other subject
  'default': [
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=800&q=80&style=cartoon', 
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80&style=cartoon', 
  ]
};

// Topic-specific images for common topics to ensure better connection with content
const topicSpecificImages = {
  // Math topics
  'Addition': [
    'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&w=800&q=80&style=cartoon',
    'https://images.unsplash.com/photo-1594077077765-3395a6c4ce2a?auto=format&fit=crop&w=800&q=80&style=cartoon',
  ],
  'Subtraction': [
    'https://images.unsplash.com/photo-1564984887003-45deacb5b1ea?auto=format&fit=crop&w=800&q=80&style=cartoon',
    'https://images.unsplash.com/photo-1616142802754-7153b4fab591?auto=format&fit=crop&w=800&q=80&style=cartoon',
  ],
  'Multiplication': [
    'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80&style=cartoon',
    'https://images.unsplash.com/photo-1544980944-0bf2ec0063ef?auto=format&fit=crop&w=800&q=80&style=cartoon',
  ],
  'Division': [
    'https://images.unsplash.com/photo-1564984887072-ec0431cc9a5c?auto=format&fit=crop&w=800&q=80&style=cartoon',
    'https://images.unsplash.com/photo-1589395937772-f67057001bc5?auto=format&fit=crop&w=800&q=80&style=cartoon',
  ],
  'Fractions': [
    'https://images.unsplash.com/photo-1555243896-c709bfa0b564?auto=format&fit=crop&w=800&q=80&style=cartoon',
    'https://images.unsplash.com/photo-1551275073-f8adef647c1d?auto=format&fit=crop&w=800&q=80&style=cartoon',
  ],
  
  // Science topics
  'Plants': [
    'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=800&q=80&style=cartoon',
    'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?auto=format&fit=crop&w=800&q=80&style=cartoon',
  ],
  'Animals': [
    'https://images.unsplash.com/photo-1535682886360-c429eb99a1a1?auto=format&fit=crop&w=800&q=80&style=cartoon',
    'https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&w=800&q=80&style=cartoon',
  ],
  'Weather': [
    'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=800&q=80&style=cartoon',
    'https://images.unsplash.com/photo-1580193769210-b8d1c049a7d9?auto=format&fit=crop&w=800&q=80&style=cartoon',
  ],
  'Solar System': [
    'https://images.unsplash.com/photo-1517976384346-3136801d605d?auto=format&fit=crop&w=800&q=80&style=cartoon',
    'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=800&q=80&style=cartoon',
  ],
};

// Get random image for a subject, with specific overrides for topics
function getRandomImage(subject: string, topic: string, alt: string): { url: string; alt: string; caption: string } {
  // Check if we have specific images for this topic
  const lowerTopic = topic.toLowerCase();
  let matchedTopic = null;
  
  // Look for topic-specific images first
  for (const key of Object.keys(topicSpecificImages)) {
    if (lowerTopic.includes(key.toLowerCase())) {
      matchedTopic = key;
      break;
    }
  }
  
  if (matchedTopic && topicSpecificImages[matchedTopic as keyof typeof topicSpecificImages]) {
    const topicImages = topicSpecificImages[matchedTopic as keyof typeof topicSpecificImages];
    const randomIndex = Math.floor(Math.random() * topicImages.length);
    return {
      url: topicImages[randomIndex],
      alt: alt || `Illustration of ${topic} for ${subject}`,
      caption: `Visual representation of ${alt || topic}`
    };
  }
  
  // Fallback to subject images
  const subjectImages = placeholderImages[subject as keyof typeof placeholderImages] || placeholderImages.default;
  const randomIndex = Math.floor(Math.random() * subjectImages.length);
  return {
    url: subjectImages[randomIndex],
    alt: alt || `Image related to ${topic} in ${subject}`,
    caption: `Illustration for ${alt || topic}`
  };
}

// Convert image description to actual image URL with topic-specific connections
function convertImageDescription(description: string, subject: string, topic: string, sectionHeading?: string): { url: string; alt: string; caption: string } {
  // If the string already looks like a URL, return it with a caption
  if (description.startsWith('http') && (description.includes('.jpg') || description.includes('.png') || description.includes('.webp') || description.includes('unsplash'))) {
    return { 
      url: description, 
      alt: sectionHeading || "Educational illustration", 
      caption: `Illustration for ${sectionHeading || topic}`
    };
  }
  
  // Use the description and section heading to create a more contextual image
  const contextualAlt = sectionHeading 
    ? `Illustration of ${sectionHeading} in ${topic}` 
    : `Visual aid for ${description}`;
  
  // Find keywords in the description for better matching
  const keywords = [
    "math", "numbers", "geometry", "algebra", "calculation", "addition", "subtraction", "multiplication", "division",
    "science", "chemistry", "biology", "physics", "experiment", "plants", "animals", "weather", "solar system",
    "book", "reading", "library", "writing", "language", 
    "history", "geography", "map", "social", "culture", "art", "drawing"
  ];
  
  let bestMatch = 'default';
  
  // Try to find a match in the description
  for (const keyword of keywords) {
    const lowerDescription = description.toLowerCase();
    const lowerSectionHeading = sectionHeading ? sectionHeading.toLowerCase() : '';
    
    if (lowerDescription.includes(keyword) || lowerSectionHeading.includes(keyword)) {
      if (["math", "numbers", "geometry", "algebra", "calculation", "addition", "subtraction", "multiplication", "division"].includes(keyword)) {
        bestMatch = "Math";
        break;
      } else if (["science", "chemistry", "biology", "physics", "experiment", "plants", "animals", "weather", "solar system"].includes(keyword)) {
        bestMatch = "Science";
        break;
      } else if (["book", "reading"].includes(keyword)) {
        bestMatch = "Reading";
        break;
      } else if (["writing", "language"].includes(keyword)) {
        bestMatch = "Language Arts";
        break;
      } else if (keyword === "history") {
        bestMatch = "History";
        break;
      } else if (["geography", "map"].includes(keyword)) {
        bestMatch = "Geography";
        break;
      } else if (["social", "culture"].includes(keyword)) {
        bestMatch = "Social Studies";
        break;
      } else if (["art", "drawing"].includes(keyword)) {
        bestMatch = "Art";
        break;
      }
    }
  }
  
  // If no match was found in the description, use the provided subject
  if (bestMatch === 'default' && subject) {
    bestMatch = subject;
  }
  
  // Get a random image for the best match
  return getRandomImage(bestMatch, topic, contextualAlt);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json() as RequestData;
    const { 
      contentType, 
      subject, 
      gradeLevel, 
      topic, 
      question, 
      includeImages = true,
      language = 'en' // Default to English if not provided
    } = requestData;
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // OpenAI API key from environment variable
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Define specific system prompts based on content type, grade level, and language
    const systemPrompts = {
      lesson: {
        en: `You are an educational content creator for ${gradeLevel} students. 
          Create an engaging, age-appropriate lesson about ${topic} in ${subject}. 
          Use simple language for K-3, more detailed explanations for 4-6, and deeper concepts for 7-9.
          
          The lesson should be comprehensive and take about 60-90 minutes to read through and engage with.
          
          Format as JSON with these sections:
          - title: A catchy, engaging title for the lesson
          - introduction: A brief, engaging introduction to the topic
          - mainContent: An array of 10-15 detailed sections, each with:
            - heading: A clear section heading
            - text: Detailed, age-appropriate explanation (400-600 words per section)
            - image (optional): Object with suggested image description if you want an image for this section
          - funFacts: Array of 8-10 interesting facts related to the topic
          - activity: Object with title and instructions for a hands-on activity
          - conclusion: A thorough conclusion tying everything together (250-350 words)
          - summary: A comprehensive summary of key points (300-400 words)
          
          Make the content educational, engaging, and rich in detail. Include examples, analogies, and real-world connections appropriate for the age group.
          
          For each section, provide a specific image description that directly relates to the content of that section.`,
        
        id: `Anda adalah pembuat konten pendidikan untuk siswa tingkat ${gradeLevel}.
          Buatlah pelajaran yang menarik dan sesuai usia tentang ${topic} dalam ${subject}.
          Gunakan bahasa sederhana untuk K-3, penjelasan lebih detail untuk 4-6, dan konsep yang lebih mendalam untuk 7-9.
          
          Pelajaran harus komprehensif dan membutuhkan sekitar 60-90 menit untuk dibaca dan dipahami.
          
          Format sebagai JSON dengan bagian-bagian berikut:
          - title: Judul yang menarik untuk pelajaran
          - introduction: Pengantar singkat dan menarik tentang topik
          - mainContent: Array dari 10-15 bagian detail, masing-masing dengan:
            - heading: Judul bagian yang jelas
            - text: Penjelasan sesuai usia yang detail (400-600 kata per bagian)
            - image (opsional): Objek dengan deskripsi gambar yang disarankan jika Anda ingin gambar untuk bagian ini
          - funFacts: Array dari 8-10 fakta menarik terkait topik
          - activity: Objek dengan judul dan instruksi untuk aktivitas praktis
          - conclusion: Ringkasan menyeluruh yang mengikat semua konten (250-350 kata)
          - summary: Ringkasan komprehensif dari poin-poin utama (300-400 kata)
          
          Buatlah konten yang mendidik, menarik, dan kaya detail. Sertakan contoh, analogi, dan koneksi dunia nyata yang sesuai untuk kelompok usia tersebut.
          
          Untuk setiap bagian, berikan deskripsi gambar spesifik yang berhubungan langsung dengan konten bagian tersebut.`
      },
      
      quiz: {
        en: `You are an educational quiz creator for ${gradeLevel} students.
          Create a set of 30-50 multiple-choice questions about ${topic} in ${subject}.
          Questions should be age-appropriate: simple and visual for K-3, moderately challenging for 4-6, and thought-provoking for 7-9.
          
          Include some story-based questions and scenarios to make the quiz more engaging and interactive.
          
          Format as JSON with an array of question objects, each with:
          - question: The question text
          - options: Array of 4 choices
          - correctAnswer: Index of correct option (0-based)
          - explanation: Kid-friendly explanation of the answer
          - image (optional): Object with suggested image description if the question would benefit from an image
          - scenario (optional): A brief story or context to make the question more engaging
          
          Make sure the questions cover different aspects of the topic and include a variety of difficulty levels.`,
        
        id: `Anda adalah pembuat kuis pendidikan untuk siswa tingkat ${gradeLevel}.
          Buatlah serangkaian 30-50 pertanyaan pilihan ganda tentang ${topic} dalam ${subject}.
          Pertanyaan harus sesuai usia: sederhana dan visual untuk K-3, cukup menantang untuk 4-6, dan merangsang pemikiran untuk 7-9.
          
          Sertakan beberapa pertanyaan berbasis cerita dan skenario untuk membuat kuis lebih menarik dan interaktif.
          
          Format sebagai JSON dengan array objek pertanyaan, masing-masing dengan:
          - question: Teks pertanyaan
          - options: Array dari 4 pilihan
          - correctAnswer: Indeks pilihan yang benar (berbasis-0)
          - explanation: Penjelasan jawaban yang ramah anak
          - image (opsional): Objek dengan deskripsi gambar yang disarankan jika pertanyaan akan lebih baik dengan gambar
          - scenario (opsional): Cerita singkat atau konteks untuk membuat pertanyaan lebih menarik
          
          Pastikan pertanyaan mencakup berbagai aspek dari topik dan termasuk berbagai tingkat kesulitan.`
      },
      
      game: {
        en: `You are an educational game designer for ${gradeLevel} students.
          Create a fun, interactive learning game related to ${topic} in ${subject}.
          Games should be age-appropriate: simple matching or sorting for K-3, word puzzles or simple logic games for 4-6, 
          and more complex strategy or creative challenges for 7-9.
          Format as JSON with: title, objective, instructions (step by step), materials (if any), and variations (simpler/harder versions).`,
        
        id: `Anda adalah perancang permainan pendidikan untuk siswa tingkat ${gradeLevel}.
          Buatlah permainan belajar yang menyenangkan dan interaktif terkait dengan ${topic} dalam ${subject}.
          Permainan harus sesuai usia: pencocokan sederhana atau penyortiran untuk K-3, teka-teki kata atau permainan logika sederhana untuk 4-6,
          dan strategi yang lebih kompleks atau tantangan kreatif untuk 7-9.
          Format sebagai JSON dengan: title (judul), objective (tujuan), instructions (instruksi langkah demi langkah), materials (bahan, jika ada), dan variations (variasi versi lebih sederhana/lebih sulit).`
      },
        
      buddy: {
        en: `You are a friendly and enthusiastic teacher named Learning Buddy. 
          Your goal is to help children (ages 5-13) learn in a fun and engaging way.
          Explain concepts in simple language appropriate for children. Use examples, analogies, 
          and occasionally emojis to make your explanations more engaging.
          Be encouraging, positive, and praise effort. Keep your responses concise 
          (about 2-4 sentences) unless a detailed explanation is needed.
          Be warm and supportive like a favorite teacher would be.
          
          Always maintain age-appropriate content with absolutely no inclusion of violence, 
          politics, religion, adult themes, or controversial topics.
          
          If you don't know the answer to something, it's okay to say so in a friendly way and 
          suggest where they might find the answer.`,
        
        id: `Anda adalah seorang guru yang ramah dan antusias bernama Learning Buddy.
          Tujuan Anda adalah membantu anak-anak (usia 5-13 tahun) belajar dengan cara yang menyenangkan dan menarik.
          Jelaskan konsep dalam bahasa sederhana yang sesuai untuk anak-anak. Gunakan contoh, analogi,
          dan sesekali emoji untuk membuat penjelasan Anda lebih menarik.
          Bersikaplah mendorong, positif, dan puji usaha. Jaga respons Anda singkat
          (sekitar 2-4 kalimat) kecuali jika diperlukan penjelasan terperinci.
          Bersikaplah hangat dan suportif seperti guru favorit.
          
          Selalu jaga konten yang sesuai usia dengan sama sekali tidak memasukkan kekerasan,
          politik, agama, tema dewasa, atau topik kontroversial.
          
          Jika Anda tidak tahu jawaban atas sesuatu, tidak apa-apa untuk mengatakannya dengan cara yang ramah dan
          sarankan di mana mereka mungkin menemukan jawabannya.`
      }
    };
    
    // Select the appropriate system prompt based on content type and language
    const systemPrompt = systemPrompts[contentType as keyof typeof systemPrompts][language] || 
                        systemPrompts[contentType as keyof typeof systemPrompts]['en'];
    
    // Prepare content for user message based on content type
    let userContent = '';
    
    if (contentType === 'buddy') {
      userContent = question || (language === 'id' ? 'Halo! Apa yang bisa saya bantu hari ini?' : 'Hi there! What can you help me with today?');
    } else {
      userContent = language === 'id' ?
        `Buat konten ${contentType} tentang ${topic} dalam ${subject} untuk siswa tingkat ${gradeLevel}. Buatlah mendidik, menarik, dan sesuai usia.` :
        `Create ${contentType} content about ${topic} in ${subject} for ${gradeLevel} students. Make it educational, engaging, and age-appropriate.`;
    }
    
    console.log(`Generating ${contentType} about ${topic} for ${gradeLevel} students in ${language}`);
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.7,
        max_tokens: 7000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as OpenAIResponse;
    let content = data.choices[0].message.content;
    
    // Process the response based on content type
    if (contentType === 'buddy') {
      // For buddy, we return the text directly
      return new Response(JSON.stringify({ content: content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // For other content types, try to parse JSON
      try {
        let parsedContent: LessonContent | null = null;
        
        if (typeof content === 'string') {
          // Extract JSON if it's wrapped in markdown code blocks
          if (content.includes('```json')) {
            content = content.split('```json')[1].split('```')[0].trim();
          } else if (content.includes('```')) {
            // Try to extract any code block
            content = content.split('```')[1].split('```')[0].trim();
          }
          
          // Try to parse JSON
          try {
            parsedContent = JSON.parse(content);
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            // If JSON parsing fails, structure the content properly
            if (contentType === 'quiz') {
              // For quiz, create a fallback structure with the content as text
              parsedContent = { questions: [] };
            }
          }
        } else {
          // Content is already parsed
          parsedContent = content as LessonContent;
        }
        
        // Add images to content if requested
        if (includeImages && contentType === 'lesson' && parsedContent) {
          // Add images to each section if mainContent exists
          if (parsedContent.mainContent && Array.isArray(parsedContent.mainContent)) {
            parsedContent.mainContent = parsedContent.mainContent.map((section: any) => {
              // Create a contextual image for each section based on its heading and content
              let imageObj;
              
              if (section.image && section.image.description) {
                // Convert the description to a proper image URL with context
                imageObj = convertImageDescription(section.image.description, subject || '', topic || '', section.heading);
              } else if (section.image && typeof section.image === 'string') {
                // Convert the string to a proper image URL with context
                imageObj = convertImageDescription(section.image, subject || '', topic || '', section.heading);
              } else {
                // Create a new image based on section heading and topic
                imageObj = getRandomImage(subject || '', topic || '', `Image illustrating ${section.heading} in ${topic || ''}`);
              }
              
              return {
                ...section,
                image: imageObj
              };
            });
          }
          
          // Add image to activity if it exists
          if (parsedContent.activity) {
            if (parsedContent.activity.image && parsedContent.activity.image.description) {
              parsedContent.activity.image = convertImageDescription(
                parsedContent.activity.image.description, 
                subject || '', 
                topic || '', 
                parsedContent.activity.title
              );
            } else if (parsedContent.activity.image && typeof parsedContent.activity.image === 'string') {
              parsedContent.activity.image = convertImageDescription(
                parsedContent.activity.image, 
                subject || '', 
                topic || '', 
                parsedContent.activity.title
              );
            } else {
              parsedContent.activity.image = getRandomImage(
                subject || '', 
                topic || '', 
                `Activity for ${parsedContent.activity.title || ''} in ${topic || ''}`
              );
            }
          }
        } else if (includeImages && contentType === 'quiz' && parsedContent) {
          // For quiz content
          let questions: any[] = [];
          
          if (Array.isArray(parsedContent)) {
            // Direct array of questions
            questions = parsedContent;
          } else if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
            // Already has questions array
            questions = parsedContent.questions;
          }
          
          // Process questions to ensure they have proper image URLs
          questions = questions.map((question: any, index: number) => {
            // Add images to some questions based on the question content
            if (index % 3 === 0 || question.image) {
              let imageObj;
              
              if (question.image && question.image.description) {
                // Convert the description to a proper image URL with context from the question
                imageObj = convertImageDescription(question.image.description, subject || '', topic || '', question.question);
              } else if (question.image && typeof question.image === 'string') {
                // Convert the string to a proper image URL with context
                imageObj = convertImageDescription(question.image, subject || '', topic || '', question.question);
              } else {
                // Create a new image related to the question content
                imageObj = getRandomImage(subject || '', topic || '', `Image illustrating: ${question.question}`);
              }
              
              return {
                ...question,
                image: imageObj
              };
            }
            return question;
          });
          
          // Wrap in a proper structure
          parsedContent = Array.isArray(parsedContent) ? { questions } : { ...parsedContent, questions };
        }
        
        return new Response(JSON.stringify({ content: parsedContent }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        console.log('Could not parse JSON from OpenAI response, returning raw content:', e);
        // Return the raw content as a fallback
        return new Response(JSON.stringify({ content: content }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  } catch (error: any) {
    console.error('Error in AI education content function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
