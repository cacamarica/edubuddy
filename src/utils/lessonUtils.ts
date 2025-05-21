// Utility to normalize lesson content from AI or DB
export function normalizeLessonContent(raw: any): any | null {
  if (!raw) return null;
  
  console.log('[Normalize] Processing raw lesson content:', 
             raw.mainContent ? `mainContent: ${raw.mainContent.length} chapters` : '',
             raw.chapters ? `chapters: ${raw.chapters.length} chapters` : '');
  
  // Accept both mainContent and chapters as input
  let chapters = Array.isArray(raw.mainContent)
    ? raw.mainContent
    : Array.isArray(raw.chapters)
    ? raw.chapters
    : [];
  
  // Handle database format where chapters might be a JSON string
  if (!Array.isArray(chapters) && typeof raw.chapters === 'string') {
    try {
      chapters = JSON.parse(raw.chapters);
      console.log('[Normalize] Parsed chapters from JSON string:', chapters.length);
    } catch (e) {
      console.error('[Normalize] Failed to parse chapters from JSON string:', e);
    }
  }
    
  if (!Array.isArray(chapters) || chapters.length === 0) {
    console.error('[Normalize] No valid chapters found in content');
    return null;
  }
  
  console.log(`[Normalize] Processing ${chapters.length} chapters`);
  
  // Ensure each chapter has proper formatting
  const formattedChapters = chapters.map((ch: any, index: number) => {
    // If the chapter is in database format (has title instead of heading)
    const heading = ch.heading || ch.title || `Chapter ${index + 1}`;
    const text = ch.text || ch.content || '';
    
    // If image is missing, create empty placeholder
    if (!ch.image) {
      ch.image = {
        url: '',
        alt: `Image for ${heading}`,
        searchQuery: `${raw.title || ''} ${heading} educational illustration`
      };
    }
    
    return {
      heading: heading,
      text: text,
      content: text, // Add content field for compatibility
      title: heading, // Add title field for compatibility
      image: ch.image
    };
  });
  
  console.log(`[Normalize] Formatted ${formattedChapters.length} chapters`);

  const normalizedContent = {
    title: raw.title || '',
    introduction: raw.introduction || '',
    mainContent: formattedChapters,
    funFacts: Array.isArray(raw.funFacts) ? raw.funFacts : 
              Array.isArray(raw.fun_facts) ? raw.fun_facts : [],
    activity: raw.activity || null,
    conclusion: raw.conclusion || '',
    summary: raw.summary || '',
  };
  
  console.log(`[Normalize] Final content has ${normalizedContent.mainContent.length} chapters`);
  
  return normalizedContent;
} 

/**
 * Enhanced function to clean up markdown text for display
 * Handles various markdown artifacts and improves readability
 * 
 * @param text - The markdown text to clean
 * @param options - Optional configuration
 * @returns Cleaned text suitable for display
 */
export function cleanMarkdownText(text: string, options: {
  removeFormatting?: boolean, // Remove all formatting (**, __, etc.)
  preserveLinks?: boolean,    // Keep link text but remove markdown formatting
  preserveHeadings?: boolean, // Keep headings but remove # symbols
  replaceLatex?: boolean,     // Replace LaTeX delimiters ($) with proper symbols
  improveReadability?: boolean // Add spacing for better readability
} = {}): string {
  if (!text) return '';
  
  // Set default options
  const {
    removeFormatting = true,
    preserveLinks = true,
    preserveHeadings = true,
    replaceLatex = true,
    improveReadability = true
  } = options;
  
  let cleanedText = text;
  
  // Pre-process content to handle specific patterns
  if (preserveLinks) {
    // Temporarily replace links to preserve them
    cleanedText = cleanedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '___LINK___$1___URL___$2___END___');
  }
  
  if (removeFormatting) {
    // Remove bold formatting but keep content
    cleanedText = cleanedText.replace(/\*\*([^*]+)\*\*/g, '$1');
    // Remove italic formatting but keep content
    cleanedText = cleanedText.replace(/\*([^*]+)\*/g, '$1');
    // Remove underscore emphasis but keep content
    cleanedText = cleanedText.replace(/__([^_]+)__/g, '$1');
    cleanedText = cleanedText.replace(/_([^_]+)_/g, '$1');
  }
  
  if (preserveHeadings) {
    // Remove heading markers but preserve heading text
    cleanedText = cleanedText.replace(/^#{1,6}\s+(.+)$/gm, '$1');
  } else {
    // Remove headings completely
    cleanedText = cleanedText.replace(/^#{1,6}\s+.+$/gm, '');
  }
  
  if (replaceLatex) {
    // Remove LaTeX delimiters but preserve content
    cleanedText = cleanedText.replace(/\$([^$]+)\$/g, '$1');
  }
  
  // Remove escaped characters (common in markdown)
  cleanedText = cleanedText.replace(/\\([\\`*_{}[\]()#+-.!])/g, '$1');
  
  if (improveReadability) {
    // Add spacing after periods if missing
    cleanedText = cleanedText.replace(/\.(\w)/g, '. $1');
    
    // Remove excessive blank lines
    cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
  }
  
  // Restore links if they were preserved
  if (preserveLinks) {
    cleanedText = cleanedText.replace(/___LINK___([^_]+)___URL___([^_]+)___END___/g, '$1 ($2)');
  }
  
  return cleanedText.trim();
} 

/**
 * Extract key concepts and terms from educational content
 * More sophisticated algorithm to identify important terminology
 * 
 * @param content - The text content to analyze
 * @param subject - The educational subject
 * @param topic - The specific topic
 * @returns Array of key concepts with explanations
 */
export function extractKeyConcepts(
  content: string,
  subject: string,
  topic: string
): Array<{ term: string; explanation: string }> {
  if (!content || content.length < 50) {
    return [];
  }
  
  // Clean the content for better processing
  const cleanContent = cleanMarkdownText(content, { 
    removeFormatting: true, 
    preserveHeadings: false 
  });
  
  // Default concepts (empty array to start)
  let extractedConcepts: Array<{ term: string; explanation: string }> = [];
  
  // Step 1: Look for emphasized text (bold/italic) in original content as it often indicates key terms
  const emphasizedTermsRegex = /\*\*([^*]+)\*\*|\*([^*]+)\*|__([^_]+)__|_([^_]+)_/g;
  let match;
  let emphasizedTerms: string[] = [];
  
  // Original content is used here to find formatting markers
  while ((match = emphasizedTermsRegex.exec(content)) !== null) {
    // The match could be in any of the capture groups
    const term = match[1] || match[2] || match[3] || match[4];
    // Only add if term is reasonable length and not already included
    if (term && term.length > 2 && term.length < 50 && !emphasizedTerms.includes(term)) {
      emphasizedTerms.push(term);
    }
  }
  
  // Step 2: Look for phrases in headings
  const headingRegex = /#{1,3}\s+(.+)$/gm;
  let headingTerms: string[] = [];
  
  while ((match = headingRegex.exec(content)) !== null) {
    const heading = match[1].trim();
    // Check if heading is appropriate length and contains meaningful content
    if (heading && heading.length > 3 && heading.length < 100) {
      headingTerms.push(heading);
      
      // Also extract potential terms from the heading
      const headingWords = heading.split(/\s+/);
      for (let i = 0; i < headingWords.length; i++) {
        const word = headingWords[i];
        // Look for capitalized words that aren't common
        if (word.length > 3 && word[0] === word[0].toUpperCase()) {
          headingTerms.push(word);
        }
        
        // Try two-word combinations (common for scientific terms)
        if (i < headingWords.length - 1) {
          const twoWords = headingWords[i] + ' ' + headingWords[i+1];
          if (twoWords.length > 5) {
            headingTerms.push(twoWords);
          }
        }
      }
    }
  }
  
  // Step 3: Subject-specific term detection
  let subjectSpecificTerms: string[] = [];
  
  const lowerSubject = subject.toLowerCase();
  const lowerTopic = topic.toLowerCase();
  
  // Science-specific term detection
  if (lowerSubject.includes('science')) {
    // Scientific phenomena often contain these words
    const scientificKeywords = ['process', 'reaction', 'system', 'principle', 'theory', 'law', 'cycle', 'force'];
    
    // Weather/climate specific terms (if topic is related)
    if (lowerTopic.includes('weather') || lowerTopic.includes('climate') || lowerTopic.includes('atmosphere')) {
      subjectSpecificTerms = [
        'atmosphere', 'humidity', 'precipitation', 'temperature', 'barometric pressure', 
        'front', 'cyclone', 'anticyclone', 'meteorology', 'climate', 'weather system',
        'air mass', 'dew point', 'atmospheric pressure', 'greenhouse effect', 'jet stream'
      ];
    }
    
    // Water cycle specific terms
    if (lowerTopic.includes('water') || lowerTopic.includes('hydro')) {
      subjectSpecificTerms = [
        'evaporation', 'condensation', 'precipitation', 'collection', 'transpiration',
        'groundwater', 'runoff', 'aquifer', 'water vapor', 'hydrologic cycle', 
        'water table', 'infiltration', 'percolation', 'watershed', 'reservoir'
      ];
    }
    
    // Look for sentences containing these keywords
    for (const keyword of scientificKeywords) {
      const keywordRegex = new RegExp(`[^.!?]*\\b${keyword}\\b[^.!?]*[.!?]`, 'gi');
      while ((match = keywordRegex.exec(cleanContent)) !== null) {
        const sentence = match[0].trim();
        // Extract potential term from the sentence
        const beforeKeyword = sentence.split(new RegExp(`\\b${keyword}\\b`, 'i'))[0].trim();
        const words = beforeKeyword.split(/\s+/);
        if (words.length > 0) {
          // Get the last 1-3 words before the keyword as they likely form the term
          const lastWords = words.slice(Math.max(0, words.length - 3)).join(' ');
          if (lastWords && lastWords.length > 2) {
            subjectSpecificTerms.push(lastWords + ' ' + keyword);
          }
        }
      }
    }
  }
  
  // History/Social Studies specific term detection
  if (lowerSubject.includes('history') || lowerSubject.includes('social')) {
    // Look for dates, historical periods, proper nouns (potentially historical figures or events)
    const dateRegex = /\b(\d{4}s?|\d{1,2}(st|nd|rd|th) century|ancient|medieval|modern|renaissance|revolution)\b/gi;
    while ((match = dateRegex.exec(cleanContent)) !== null) {
      const date = match[0];
      
      // Get the surrounding sentence to extract the event
      const start = Math.max(0, match.index - 100);
      const end = Math.min(cleanContent.length, match.index + 100);
      const surroundingText = cleanContent.substring(start, end);
      
      // Try to extract the event associated with the date
      const sentenceRegex = /[^.!?]*\b(\d{4}s?|\d{1,2}(st|nd|rd|th) century|ancient|medieval|modern|renaissance|revolution)\b[^.!?]*[.!?]/i;
      const sentenceMatch = surroundingText.match(sentenceRegex);
      
      if (sentenceMatch && sentenceMatch[0]) {
        // Find proper nouns near the date (possible events)
        const properNounRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b|\b[A-Z][a-z]+ (War|Revolution|Movement|Period|Empire|Dynasty|Treaty|Act)\b/g;
        let properMatch;
        while ((properMatch = properNounRegex.exec(sentenceMatch[0])) !== null) {
          subjectSpecificTerms.push(properMatch[0]);
        }
        
        // Also add the date itself as a potential key term
        subjectSpecificTerms.push(date);
      }
    }
  }
  
  // Math specific term detection
  if (lowerSubject.includes('math')) {
    // Look for mathematical terms and formulas
    const mathTerms = [
      'equation', 'function', 'variable', 'expression', 'formula', 'theorem',
      'proof', 'calculation', 'algorithm', 'probability', 'statistics'
    ];
    
    for (const term of mathTerms) {
      const termRegex = new RegExp(`[^.!?]*\\b${term}\\b[^.!?]*[.!?]`, 'gi');
      while ((match = termRegex.exec(cleanContent)) !== null) {
        const sentence = match[0].trim();
        subjectSpecificTerms.push(sentence);
      }
    }
    
    // Look for mathematical expressions/formulas
    const formulaRegex = /\$[^$]+\$|\b[a-z](\s*=\s*[a-z0-9+\-*/^()]+)/gi;
    while ((match = formulaRegex.exec(content)) !== null) {
      subjectSpecificTerms.push(match[0]);
    }
  }
  
  // Combine all potential terms from different methods
  const allTerms = [...new Set([...emphasizedTerms, ...headingTerms, ...subjectSpecificTerms])];
  
  // For each potential term, try to find an explanation in the content
  for (const term of allTerms) {
    // Skip very short terms or very long terms (likely not actual concepts)
    if (term.length < 3 || term.length > 50) continue;
    
    // Look for sentences containing this term, which might provide an explanation
    const termEscaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const termRegex = new RegExp(`[^.!?]*\\b${termEscaped}\\b[^.!?]*[.!?]`, 'gi');
    
    let explanation = '';
    let bestSentence = '';
    let maxScore = 0;
    
    // Find the best sentence that explains this term
    while ((match = termRegex.exec(cleanContent)) !== null) {
      const sentence = match[0].trim();
      
      // Skip sentences that are too short or too long
      if (sentence.length < 20 || sentence.length > 300) continue;
      
      // Score this sentence as a potential explanation
      let score = 0;
      
      // Sentences containing definition keywords score higher
      if (/\b(is|are|refers to|defined as|means|consists of|comprises)\b/i.test(sentence)) {
        score += 5;
      }
      
      // Sentences near the beginning of the content might be definitions
      score += Math.max(0, 5 - (match.index / 500));
      
      // Sentences with appropriate length are preferred
      const idealLength = 150;
      score += Math.max(0, 5 - Math.abs(sentence.length - idealLength) / 50);
      
      // Sentences containing the term near the beginning score higher
      const termPosition = sentence.toLowerCase().indexOf(term.toLowerCase());
      if (termPosition < sentence.length / 3) {
        score += 3;
      }
      
      // If this is the best sentence so far, keep it
      if (score > maxScore) {
        maxScore = score;
        bestSentence = sentence;
      }
    }
    
    // If we found a good sentence, use it as the explanation
    if (bestSentence) {
      explanation = bestSentence;
      
      // If the sentence doesn't start with the term, try to improve it
      if (!explanation.toLowerCase().startsWith(term.toLowerCase())) {
        explanation = `${term} - ${explanation}`;
      }
      
      // Add this concept to our list
      extractedConcepts.push({ 
        term, 
        explanation 
      });
    }
  }
  
  // Remove duplicates and limit to a reasonable number
  extractedConcepts = extractedConcepts
    .filter((concept, index, self) => 
      index === self.findIndex(c => c.term.toLowerCase() === concept.term.toLowerCase()))
    .slice(0, 10);
  
  // If we couldn't extract enough concepts, generate some basic ones from the topic
  if (extractedConcepts.length < 3) {
    const topicWords = topic.split(/\s+/);
    for (const word of topicWords) {
      if (word.length > 3 && !extractedConcepts.some(c => c.term.toLowerCase() === word.toLowerCase())) {
        // Create a basic explanation
        const explanation = `${word} is a key concept in understanding ${topic}.`;
        extractedConcepts.push({ term: word, explanation });
      }
    }
  }
  
  return extractedConcepts;
} 