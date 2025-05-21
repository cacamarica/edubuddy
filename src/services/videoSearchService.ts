import axios from 'axios';

interface VideoResult {
  videoId: string;
  title: string;
  thumbnailUrl: string;
}

/**
 * Extract key concepts and themes from content text
 * to improve video search relevance
 * 
 * @param content - The text content to analyze
 * @returns Array of key concepts and themes
 */
export function extractContentKeywords(content: string): string[] {
  if (!content || typeof content !== 'string') return [];
  
  // Clean up the content - remove markdown formatting
  const cleanedContent = content
    .replace(/#{1,6}\s+([^\n]+)/g, '$1') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // Remove bold
    .replace(/\*([^*]+)\*/g, '$1')       // Remove italic
    .replace(/\n/g, ' ');                // Replace newlines with spaces
  
  // Extract potential key phrases 
  // Look for sentences with educational indicators like "is defined as", "refers to", etc.
  const keyPhrases: string[] = [];
  
  const definitionPatterns = [
    /([^.!?]+) is defined as ([^.!?]+)[.!?]/gi,
    /([^.!?]+) refers to ([^.!?]+)[.!?]/gi,
    /([^.!?]+) is a ([^.!?]+)[.!?]/gi,
    /([^.!?]+) are ([^.!?]+)[.!?]/gi,
    /the concept of ([^.!?]+)[.!?]/gi,
    /the process of ([^.!?]+)[.!?]/gi,
    /important ([^.!?]+) include/gi,
    /known as ([^.!?]+)[.!?]/gi,
    /called ([^.!?]+)[.!?]/gi
  ];
  
  for (const pattern of definitionPatterns) {
    const matches = cleanedContent.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) keyPhrases.push(match[1].trim());
      if (match[2]) keyPhrases.push(match[2].trim());
    }
  }
  
  // Extract bold text which often indicates key terms
  const boldTextMatches = content.matchAll(/\*\*([^*]+)\*\*/g);
  for (const match of Array.from(boldTextMatches)) {
    if (match[1] && match[1].length > 3) {
      keyPhrases.push(match[1].trim());
    }
  }
  
  // Look for sentences that contain educational indicators
  const educationalTerms = ['important', 'key', 'fundamental', 'essential', 'critical', 'primary', 'major', 'significant'];
  const sentences = cleanedContent.split(/[.!?]/);
  
  for (const sentence of sentences) {
    if (educationalTerms.some(term => sentence.toLowerCase().includes(term))) {
      // Extract noun phrases following educational terms
      for (const term of educationalTerms) {
        const termIndex = sentence.toLowerCase().indexOf(term);
        if (termIndex >= 0 && termIndex + term.length + 1 < sentence.length) {
          const remainingText = sentence.substring(termIndex + term.length + 1).trim();
          if (remainingText.length > 3 && remainingText.length < 50) {
            keyPhrases.push(remainingText);
          }
        }
      }
    }
  }
  
  // Handle short content by getting the first sentence
  if (keyPhrases.length === 0 && cleanedContent.length > 0) {
    const firstSentence = cleanedContent.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length > 5) {
      keyPhrases.push(firstSentence.trim());
    }
  }
  
  // Extract individual keywords from the content
  const commonWords = new Set(['the', 'a', 'an', 'is', 'are', 'to', 'in', 'on', 'of', 'for', 'and', 'or', 'but', 'with', 'this', 'that', 'these', 'those']);
  
  // Get potential keywords by finding words that appear frequently
  const words = cleanedContent.toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 3 && !commonWords.has(word));
  
  // Count word frequency
  const wordFreq: Record<string, number> = {};
  for (const word of words) {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  }
  
  // Get the top keywords based on frequency
  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);
  
  // Combine key phrases and top keywords
  const allKeywords = [...new Set([...keyPhrases, ...topKeywords])];
  
  // Return a limited number of keywords to avoid overly specific queries
  return allKeywords.slice(0, 4);
}

/**
 * Search for educational videos related to the query
 * Provides curated educational video content for lessons
 * 
 * @param query - The search query for videos
 * @param contentText - Optional full content text for deeper analysis
 * @returns Promise with video results or null if unsuccessful
 */
export async function searchVideos(query: string, contentText?: string): Promise<VideoResult | null> {
  try {
    // For demonstration/placeholder purposes
    // In a production environment, you would use YouTube Data API
    
    // Define mapping of topics to video IDs for combined subjects
    const topicVideoMap: Record<string, string> = {
      'science: water cycle': 'al-do-HGuIk',
      'science: weather': 'v-KFzBhs5J4',
      'science: climate': 'G4H1N_yXBiA',
      'math: geometry': 'Kpn2ajSa92c',
      'physics: force': 'kV33t8U6XV8',
      'chemistry: reactions': '6pmc6E88jkA',
      'biology: cells': 'QCmT9DHcKaM',
      'history: timeline': '9Xu2GUV8pVA',
      'geography: map': 'QrcjfvCVUa0',
      'science: experiment': '1VPfZ_XzisU',
      'water cycle': 'al-do-HGuIk',
      'weather': 'v-KFzBhs5J4',
      'climate': 'G4H1N_yXBiA',
      'math': 'eI9NwI1VY0k',
      'physics': 'kV33t8U6XV8',
      // Add more specific content-based mappings
      'evaporation water': 'nJdhAxqSAx0',
      'condensation clouds': 'QCABqfKJlLc',
      'precipitation rainfall': 'ZmGuHyZmFiI',
      'weather instruments': 'EJJ0lvVWjqQ',
      'atmosphere layers': 'DgbDy0WjzDQ',
      'climate change': 'G4H1N_yXBiA',
      'force motion': 'IqV5L66EP2E',
      'plant photosynthesis': 'nC_n8VD_q3A',
      'animal adaptation': 'uT7DeIoiGBw',
      'human body systems': 'TL-Qoh3QMkU',
      'ecosystem': 'wUSKm2ZXUkU',
      // Physical science topics
      'energy transfer': 'q2vVQfcGZGo',
      'simple machines': 'fvOmaf2GfCY', 
      'states of matter': 'O4RcDwtPPpk',
      'electricity circuits': 'HOFp8bHTN30',
      'magnetism': 'exZfXDuGpQA',
      'sound waves': 'TfYCnOvNnN0',
      'light reflection': 'vt-SG3vYkIk',
      // Earth science topics
      'rock cycle': 'pm6cCg_Do6k',
      'plate tectonics': 'RA2-Vc4CZTI',
      'natural resources': 'Sk4scOWGwE8',
      'fossil formation': '3rkGu0BItKM',
      'volcanoes': 'VNGUdObDoLk',
      'earthquakes': 'AArne-wh_Uc',
      // Life science topics
      'food chains': 'YuO4WB4SwCg',
      'habitats': 'ZrSWYE37MJs',
      'life cycles': 'ivx6w56Zad4',
      'classification': 'F38BmGPKsY0',
      'genetics inheritance': 'qIGXTJLrLf8',
      'evolution': 'hOfRN0KihOU',
      // Mathematics topics
      'addition subtraction': '2X38xelNFSQ',
      'multiplication division': 'gS6T47gdEZI',
      'fractions': 'kn83BA7cRNM',
      'decimals': 'ctlKlZ41xOk',
      'algebra basics': 'NybHckSEQBI',
      'percentages': 'G8DlQ0NDgdw',
      'statistics': 'QoQo2nYHaYA',
      'geometry shapes': '24Uv8Cl5hvI',
      'area perimeter': 'Pv1dz7jq4Tc',
      'volume': '8X6_uMY_sH0'
    };
    
    // Use preset educational videos based on categories
    const topicKeywords = [
      { 
        keywords: ['weather', 'climate', 'atmosphere', 'meteorology'], 
        videoId: 'v-KFzBhs5J4', 
        title: 'Weather vs. Climate: Crash Course Kids #28.1',
        thumbnailUrl: 'https://img.youtube.com/vi/v-KFzBhs5J4/hqdefault.jpg'
      },
      { 
        keywords: ['water', 'cycle', 'hydrology', 'precipitation'], 
        videoId: 'al-do-HGuIk', 
        title: 'The Water Cycle | Educational Video for Kids',
        thumbnailUrl: 'https://img.youtube.com/vi/al-do-HGuIk/hqdefault.jpg'
      },
      { 
        keywords: ['science', 'experiment', 'laboratory'], 
        videoId: '1VPfZ_XzisU', 
        title: 'Science Experiments for Kids: Amazing Scientific Experiments',
        thumbnailUrl: 'https://img.youtube.com/vi/1VPfZ_XzisU/hqdefault.jpg'
      },
      { 
        keywords: ['math', 'equation', 'geometry'], 
        videoId: 'Kpn2ajSa92c', 
        title: 'Geometry Introduction - Basic Overview',
        thumbnailUrl: 'https://img.youtube.com/vi/Kpn2ajSa92c/hqdefault.jpg'
      },
      { 
        keywords: ['history', 'timeline', 'historical'], 
        videoId: 'WhtuC9dp0Hk', 
        title: 'The History of the World: Every Year',
        thumbnailUrl: 'https://img.youtube.com/vi/WhtuC9dp0Hk/hqdefault.jpg'
      },
      { 
        keywords: ['geography', 'map', 'earth'], 
        videoId: 'gFIS3aLQPfs', 
        title: 'Geography Lesson: What is a Map? | Homeschool',
        thumbnailUrl: 'https://img.youtube.com/vi/gFIS3aLQPfs/hqdefault.jpg'
      },
      { 
        keywords: ['biology', 'cells', 'organism'], 
        videoId: 'URUJD5NEXC8', 
        title: 'Biology: Cell Structure',
        thumbnailUrl: 'https://img.youtube.com/vi/URUJD5NEXC8/hqdefault.jpg'
      },
      { 
        keywords: ['physics', 'energy', 'force'], 
        videoId: 'IqV5L66EP2E', 
        title: 'Force and Motion | Science Video for Kids',
        thumbnailUrl: 'https://img.youtube.com/vi/IqV5L66EP2E/hqdefault.jpg'
      },
      { 
        keywords: ['chemistry', 'reactions', 'elements'], 
        videoId: 'Aula8rTdvMQ', 
        title: 'Chemical Reactions and Equations Class 10',
        thumbnailUrl: 'https://img.youtube.com/vi/Aula8rTdvMQ/hqdefault.jpg'
      },
      { 
        keywords: ['solar', 'system', 'planets', 'space'], 
        videoId: 'libKVRa01L8', 
        title: 'The Solar System | Educational Video for Kids',
        thumbnailUrl: 'https://img.youtube.com/vi/libKVRa01L8/hqdefault.jpg'
      },
    ];
    
    // If we have content text, analyze it to enhance the query
    let enhancedQuery = query;
    let contentKeywords: string[] = [];
    
    if (contentText && contentText.length > 50) {
      contentKeywords = extractContentKeywords(contentText);
      
      if (contentKeywords.length > 0) {
        // Create an enhanced query that includes key concepts from the content
        const keywordString = contentKeywords.join(' ');
        enhancedQuery = `${query} ${keywordString}`;
        console.log(`Enhanced video search query: "${enhancedQuery}"`);
      }
    }
    
    // Check for exact topic matches first
    const lowercaseQuery = enhancedQuery.toLowerCase();
    for (const [topic, videoId] of Object.entries(topicVideoMap)) {
      if (lowercaseQuery.includes(topic.toLowerCase())) {
        // Found direct match in topic map
        const title = `Educational video about ${topic}`;
        console.log(`Found exact topic match for "${topic}" - Video ID: ${videoId}`);
        return {
          videoId,
          title,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        };
      }
    }
    
    // Next, try content keywords with topic map for partial matches
    if (contentKeywords.length > 0) {
      const combinedContentKeywords = contentKeywords.join(' ').toLowerCase();
      for (const [topic, videoId] of Object.entries(topicVideoMap)) {
        const topicWords = topic.toLowerCase().split(/\W+/);
        // Check if ANY of the topic words match ANY of the content keywords
        if (topicWords.some(word => 
            word.length > 3 && combinedContentKeywords.includes(word)) ||
            topicWords.some(word => 
            word.length > 3 && contentKeywords.some(keyword => 
            keyword.toLowerCase().includes(word)))) {
          
          console.log(`Found partial topic match with content keywords - Topic: "${topic}", Keywords: ${contentKeywords.join(', ')}`);
          return {
            videoId,
            title: `Educational video about ${topic}`,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          };
        }
      }
    }
    
    // Then try keyword-based matching from preset categories
    for (const category of topicKeywords) {
      if (category.keywords.some(keyword => lowercaseQuery.includes(keyword))) {
        console.log(`Found keyword match for category with: ${category.keywords.join(', ')}`);
        return {
          videoId: category.videoId,
          title: category.title,
          thumbnailUrl: category.thumbnailUrl
        };
      }
      
      // Also check if content keywords match category keywords
      if (contentKeywords.length > 0 && 
          category.keywords.some(keyword => 
          contentKeywords.some(contentKeyword => 
          contentKeyword.toLowerCase().includes(keyword)))) {
        
        console.log(`Found content keyword match for category with: ${category.keywords.join(', ')}`);
        return {
          videoId: category.videoId,
          title: category.title,
          thumbnailUrl: category.thumbnailUrl
        };
      }
    }
    
    // Fallback to general educational videos if no match found
    const fallbackVideos = [
      { id: 'eI9NwI1VY0k', title: 'How to Learn Anything Fast' },
      { id: 'UF8uR6Z6KLc', title: 'Stay Hungry, Stay Foolish - Educational Motivation' },
      { id: 'Ucg8lmx3l_Y', title: 'How to Study Effectively for School or College' },
      { id: 'J7MYJ8Kxd3Q', title: 'The Science of Learning - How to Learn Anything' }
    ];
    
    // Use first letter of query to select a fallback video (simple randomization)
    const firstChar = enhancedQuery.charAt(0).toLowerCase();
    const charCode = firstChar.charCodeAt(0);
    const index = charCode % fallbackVideos.length;
    
    console.log(`No specific match found. Using fallback video: ${fallbackVideos[index].title}`);
    
    return {
      videoId: fallbackVideos[index].id,
      title: fallbackVideos[index].title,
      thumbnailUrl: `https://img.youtube.com/vi/${fallbackVideos[index].id}/hqdefault.jpg`
    };
    
  } catch (error) {
    console.error('Error fetching videos:', error);
    return null;
  }
} 