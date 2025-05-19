// Utility to normalize lesson content from AI or DB
export function normalizeLessonContent(raw: any): any | null {
  if (!raw) return null;
  
  console.log('[Normalize] Processing raw lesson content:', 
             raw.mainContent ? `mainContent: ${raw.mainContent.length} chapters` : '',
             raw.chapters ? `chapters: ${raw.chapters.length} chapters` : '');
  
  // Accept both mainContent and chapters as input
  const chapters = Array.isArray(raw.mainContent)
    ? raw.mainContent
    : Array.isArray(raw.chapters)
    ? raw.chapters
    : [];
    
  if (!Array.isArray(chapters) || chapters.length === 0) {
    console.error('[Normalize] No valid chapters found in content');
    return null;
  }
  
  console.log(`[Normalize] Processing ${chapters.length} chapters`);
  
  // Ensure each chapter has proper formatting
  const formattedChapters = chapters.map((ch: any, index: number) => {
    // If image is missing, create empty placeholder
    if (!ch.image) {
      ch.image = {
        url: '',
        alt: `Image for ${ch.heading || `Chapter ${index + 1}`}`,
        searchQuery: `${raw.title || ''} ${ch.heading || `Chapter ${index + 1}`} educational illustration`
      };
    }
    
    return {
      heading: ch.heading || `Chapter ${index + 1}`,
      text: ch.text || '',
      image: ch.image
    };
  });
  
  console.log(`[Normalize] Formatted ${formattedChapters.length} chapters`);

  const normalizedContent = {
    title: raw.title || '',
    introduction: raw.introduction || '',
    mainContent: formattedChapters,
    funFacts: Array.isArray(raw.funFacts) ? raw.funFacts : [],
    activity: raw.activity || null,
    conclusion: raw.conclusion || '',
    summary: raw.summary || '',
  };
  
  console.log(`[Normalize] Final content has ${normalizedContent.mainContent.length} chapters`);
  
  return normalizedContent;
} 