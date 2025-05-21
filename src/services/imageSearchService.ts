import axios from 'axios';
import { extractContentKeywords } from './videoSearchService';

interface ImageResult {
  url: string;
  alt: string;
}

/**
 * Validates if an image URL appears to be educational and relevant
 * @param url - The image URL to validate
 * @param searchContext - The search context for relevance check
 * @returns boolean indicating if the image is likely educational
 */
function validateEducationalImage(url: string, searchContext: string): boolean {
  // Check for common non-educational image patterns
  const nonEducationalPatterns = [
    'music', 'concert', 'poster', 'flyer', 'advertisement', 
    'fashion', 'party', 'entertainment', 'social-media', 'product',
    'marketing', 'promotion', 'banner', 'template', 'mockup'
  ];
  
  // Convert URL and search context to lowercase for case-insensitive matching
  const lowercaseUrl = url.toLowerCase();
  const lowercaseContext = searchContext.toLowerCase();
  
  // Reject if URL contains clearly non-educational terms
  if (nonEducationalPatterns.some(pattern => lowercaseUrl.includes(pattern))) {
    console.log(`Rejecting image with non-educational pattern: ${url}`);
    return false;
  }
  
  // Check for educational image characteristics 
  const educationalPatterns = [
    'diagram', 'chart', 'education', 'science', 'biology', 'illustration',
    'physics', 'chemistry', 'history', 'geography', 'math', 'infographic',
    'educational', 'learning', 'school', 'academic', 'study', 'concept'
  ];
  
  // Higher confidence if educational patterns exist in URL
  if (educationalPatterns.some(pattern => lowercaseUrl.includes(pattern))) {
    return true;
  }
  
  // Living things patterns for biology and life sciences
  const livingThingsPatterns = [
    'biology', 'living', 'organism', 'cell', 'animal', 'plant',
    'ecosystem', 'habitat', 'species', 'classification', 'life-cycle'
  ];
  
  // If search context is about living things, prioritize related images
  if (livingThingsPatterns.some(pattern => lowercaseContext.includes(pattern))) {
    return livingThingsPatterns.some(pattern => lowercaseUrl.includes(pattern));
  }
  
  // Default to rejecting the image if it doesn't match positive patterns
  // This is more cautious to prevent irrelevant images
  return false;
}

/**
 * Search for images related to the query
 * For education purposes, we'll search for relevant images with safe search enabled
 * 
 * @param query - The search query for images
 * @param contentText - Optional full content text for deeper analysis
 * @returns Promise with image results or null if unsuccessful
 */
export async function searchImages(query: string, contentText?: string): Promise<ImageResult | null> {
  try {
    // For demo/placeholder purposes
    // In a production environment, you would use a proper image search API like Google Custom Search API
    
    // Add educational context to ensure relevant results
    const enhancedQuery = `${query} educational diagram`;
    
    // Define mapping of topics to specific educational images
    const topicImageMap: Record<string, {url: string, alt: string}> = {
      'water cycle': {
        url: 'https://www.weather.gov/images/jetstream/atmos/hydro_cycle_large.jpg',
        alt: 'Water cycle diagram showing evaporation, condensation, precipitation and collection phases'
      },
      'weather': {
        url: 'https://scied.ucar.edu/sites/default/files/images/large_image_for_image_content/water_cycle_nasa_noaa.jpg',
        alt: 'Weather patterns diagram showing clouds, precipitation and atmospheric processes'
      },
      'climate': {
        url: 'https://scied.ucar.edu/sites/default/files/images/large_image_for_image_content/climate_system_overview_720px.jpg',
        alt: 'Earth climate zones and global warming concept diagram'
      },
      'geometry': {
        url: 'https://www.varsitytutors.com/assets/vt-backlink-images/geometric-shapes.jpg',
        alt: 'Geometric shapes and mathematical formulas diagram for education'
      },
      'forces': {
        url: 'https://scienceprojectideas.org/wp-content/uploads/2018/08/Law-of-Motion.jpg',
        alt: 'Physics forces and Newton\'s laws illustration'
      },
      'photosynthesis': {
        url: 'https://www.yourgenome.org/wp-content/uploads/2022/10/photosynthesis-leaves-stomata-yourgenome.png',
        alt: 'Plant photosynthesis process diagram showing the conversion of light energy'
      },
      'cells': {
        url: 'https://www.vedantu.com/seo/content-images/61c9f88b-d6b5-4fd3-a40e-6c773209b6d0.png',
        alt: 'Biological cell structure and organelles educational diagram'
      },
      'living things': {
        url: 'https://i.pinimg.com/originals/65/e9/4c/65e94c53da7a5b5ec6772e359d721b28.jpg',
        alt: 'Living things characteristics educational diagram for students'
      },
      'characteristics of living things': {
        url: 'https://cdn1.byjus.com/wp-content/uploads/2018/11/biology/2016/07/09170938/7-characteristics-of-living-organisms.png',
        alt: 'Comprehensive diagram showing all characteristics of living organisms for education'
      },
      'life processes': {
        url: 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Life-Processes-all-process.png',
        alt: 'Life processes diagram showing nutrition, respiration, and other processes'
      },
      'solar system': {
        url: 'https://science.nasa.gov/wp-content/uploads/2023/03/solar-system-nasa-02-2048x1152-1.jpg',
        alt: 'Solar system with planets orbiting the sun educational diagram'
      },
      'sound waves': {
        url: 'https://study.com/learn/lesson/sound-wave-amplitude-frequency-lesson-quiz.html',
        alt: 'Sound wave frequency and amplitude visualization for educational purposes'
      },
      'food chains': {
        url: 'https://cdn1.byjus.com/wp-content/uploads/2018/11/biology/2016/08/11052954/food-chain.png',
        alt: 'Food chain and ecosystem relationship educational diagram'
      },
      'rock cycle': {
        url: 'https://www.geolsoc.org.uk/~/media/shared/images/education%20and%20careers/Resources/Rock%20Cycle/Rock%20Cycle%20no%20arrows.jpg',
        alt: 'Rock cycle showing sedimentary, metamorphic and igneous rocks for education'
      },
      'fractions': {
        url: 'https://cdn.britannica.com/14/94514-050-7A8D5A55/Example-technique-fractions-rectangles.jpg',
        alt: 'Mathematical fractions and decimal equivalents educational diagram'
      },
      'human body': {
        url: 'https://www.genome.gov/sites/default/files/tg/en/illustration/body_systems.jpg',
        alt: 'Human body systems and anatomy educational diagram'
      },
      'electricity': {
        url: 'https://cdn1.byjus.com/wp-content/uploads/2022/09/Electrical-Circuit-1.png',
        alt: 'Electrical circuit and components diagram for education'
      },
      'fossils': {
        url: 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Fossils.png',
        alt: 'Fossil formation and prehistoric life educational diagram'
      }
    };
    
    // Add specific mappings for biology and living things topics
    const livingThingsMap: Record<string, {url: string, alt: string}> = {
      'characteristics of living things': {
        url: 'https://cdn1.byjus.com/wp-content/uploads/2018/11/biology/2016/07/09170938/7-characteristics-of-living-organisms.png',
        alt: 'The seven characteristics of living organisms educational diagram'
      },
      'living organisms': {
        url: 'https://t3.ftcdn.net/jpg/03/15/10/14/360_F_315101480_QoQdSVOwEsZnqESGZnlzOUQOADrKvT0V.jpg',
        alt: 'Diverse living organisms classification educational diagram'
      },
      'life processes': {
        url: 'https://biologydictionary.net/wp-content/uploads/2020/11/Metabolism-overview.jpg',
        alt: 'Life processes in organisms educational diagram showing key metabolic pathways'
      },
      'animal classification': {
        url: 'https://cdn1.byjus.com/wp-content/uploads/2019/04/Animal-Kingdom-Classification-of-Animal-Kingdom.png',
        alt: 'Animal kingdom classification educational diagram for biology students'
      },
      'plant classification': {
        url: 'https://cdn1.byjus.com/wp-content/uploads/2019/07/Plant-Classification-1.png',
        alt: 'Plant kingdom classification educational diagram for biology students'
      }
    };
    
    // Merge the specialized maps into the main map
    Object.assign(topicImageMap, livingThingsMap);
    
    // Use placeholder images based on educational categories - guaranteed to be educational
    const topicKeywords = [
      { keywords: ['weather', 'climate', 'atmosphere', 'meteorology'], url: 'https://scied.ucar.edu/sites/default/files/images/large_image_for_image_content/water_cycle_nasa_noaa.jpg', alt: 'Weather patterns showing clouds and atmosphere' },
      { keywords: ['water', 'cycle', 'hydrology', 'precipitation'], url: 'https://www.weather.gov/images/jetstream/atmos/hydro_cycle_large.jpg', alt: 'Water cycle illustration' },
      { keywords: ['science', 'experiment', 'laboratory'], url: 'https://cdn.vectorstock.com/i/preview-1x/90/04/kids-science-education-laboratory-vector-29399004.webp', alt: 'Scientific equipment in a laboratory' },
      { keywords: ['math', 'equation', 'geometry'], url: 'https://www.varsitytutors.com/assets/vt-backlink-images/geometric-shapes.jpg', alt: 'Mathematical geometry patterns' },
      { keywords: ['history', 'timeline', 'historical'], url: 'https://cdn.britannica.com/39/73739-050-BC232621/eras-Cenozoic-Mesozoic-Paleozoic-rocks-events-period.jpg', alt: 'Historical timeline representation' },
      { keywords: ['geography', 'map', 'earth'], url: 'https://cdn.britannica.com/15/64715-050-E719D308/Earth-view-Bolivia-Brazil-Peru-Amazon-Basin.jpg', alt: 'Earth globe map view' },
      { keywords: ['biology', 'cells', 'organism'], url: 'https://www.vedantu.com/seo/content-images/61c9f88b-d6b5-4fd3-a40e-6c773209b6d0.png', alt: 'Biological cell structure' },
      { keywords: ['physics', 'energy', 'force'], url: 'https://scienceprojectideas.org/wp-content/uploads/2018/08/Law-of-Motion.jpg', alt: 'Physics forces diagram' },
      { keywords: ['living', 'things', 'characteristics', 'life'], url: 'https://cdn1.byjus.com/wp-content/uploads/2018/11/biology/2016/07/09170938/7-characteristics-of-living-organisms.png', alt: 'Characteristics of living things educational diagram' },
      { keywords: ['chemistry', 'elements', 'reactions'], url: 'https://cdn1.byjus.com/wp-content/uploads/2020/02/Chemical-Reactions-and-Equations.png', alt: 'Chemistry reactions educational diagram' },
      { keywords: ['plants', 'photosynthesis', 'botany'], url: 'https://www.yourgenome.org/wp-content/uploads/2022/10/photosynthesis-leaves-stomata-yourgenome.png', alt: 'Plant growth and photosynthesis' },
      { keywords: ['animals', 'species', 'zoology'], url: 'https://cdn1.byjus.com/wp-content/uploads/2022/10/Animal-kingdom-1.png', alt: 'Animal classification educational diagram' },
      { keywords: ['solar', 'system', 'planets', 'astronomy'], url: 'https://science.nasa.gov/wp-content/uploads/2023/03/solar-system-nasa-02-2048x1152-1.jpg', alt: 'Solar system and planetary motion' },
      { keywords: ['human', 'body', 'anatomy'], url: 'https://www.genome.gov/sites/default/files/tg/en/illustration/body_systems.jpg', alt: 'Human body systems diagram' },
      { keywords: ['ecosystem', 'ecology', 'environment'], url: 'https://cdn1.byjus.com/wp-content/uploads/2020/04/An-Ecosystem.png', alt: 'Ecosystem and biodiversity illustration' }
    ];
    
    // If we have content text, analyze it to enhance the query
    let contentKeywords: string[] = [];
    
    if (contentText && contentText.length > 50) {
      contentKeywords = extractContentKeywords(contentText);
      console.log("Extracted content keywords:", contentKeywords);
    }
    
    // Convert the query to lowercase for matching
    const lowercaseQuery = enhancedQuery.toLowerCase();
    
    // Check for exact topic matches first, especially for living things
    for (const [topic, imageInfo] of Object.entries(topicImageMap)) {
      if (lowercaseQuery.includes(topic.toLowerCase())) {
        console.log(`Found exact topic match for image: "${topic}"`);
        return imageInfo;
      }
    }
    
    // Living things specific check - prioritize these for biology topics
    if (lowercaseQuery.includes('living thing') || 
        lowercaseQuery.includes('characteristic') || 
        lowercaseQuery.includes('life process')) {
      const livingThingsResult = topicImageMap['characteristics of living things'];
      if (livingThingsResult) {
        console.log("Found living things match for biology topic");
        return livingThingsResult;
      }
    }
    
    // Next, try content keywords with topic map for partial matches
    if (contentKeywords.length > 0) {
      const combinedContentKeywords = contentKeywords.join(' ').toLowerCase();
      for (const [topic, imageInfo] of Object.entries(topicImageMap)) {
        const topicWords = topic.toLowerCase().split(/\W+/);
        // Check if ANY of the topic words match ANY of the content keywords
        if (topicWords.some(word => 
            word.length > 3 && combinedContentKeywords.includes(word)) ||
            topicWords.some(word => 
            word.length > 3 && contentKeywords.some(keyword => 
            keyword.toLowerCase().includes(word)))) {
          
          console.log(`Found partial topic match with content keywords for image - Topic: "${topic}"`);
          return imageInfo;
        }
      }
    }
    
    // Then try keyword-based matching from preset categories
    for (const category of topicKeywords) {
      if (category.keywords.some(keyword => lowercaseQuery.includes(keyword))) {
        console.log(`Found keyword match for image category with: ${category.keywords.join(', ')}`);
        return {
          url: category.url,
          alt: category.alt
        };
      }
      
      // Also check if content keywords match category keywords
      if (contentKeywords.length > 0 && 
          category.keywords.some(keyword => 
          contentKeywords.some(contentKeyword => 
          contentKeyword.toLowerCase().includes(keyword)))) {
        
        console.log(`Found content keyword match for image category with: ${category.keywords.join(', ')}`);
        return {
          url: category.url,
          alt: category.alt
        };
      }
    }
    
    // If no specific match found, use a general educational diagram
    if (lowercaseQuery.includes('living thing') || lowercaseQuery.includes('biology')) {
      // Biology fallback
      return {
        url: 'https://cdn1.byjus.com/wp-content/uploads/2018/11/biology/2016/07/09170938/7-characteristics-of-living-organisms.png',
        alt: 'Characteristics of living things educational diagram'
      };
    } else if (lowercaseQuery.includes('science')) {
      // Science fallback
      return {
        url: 'https://cdn1.byjus.com/wp-content/uploads/2023/02/Scientific-Method.png',
        alt: 'Scientific method educational diagram'
      };
    } else {
      // Generic educational fallback
      return {
        url: 'https://img.freepik.com/free-vector/hand-drawn-science-education-background_23-2148499325.jpg',
        alt: 'Educational learning concept diagram'
      };
    }
    
  } catch (error) {
    console.error('Error fetching images:', error);
    // Even on error, return a generic educational image
    return {
      url: 'https://img.freepik.com/free-vector/hand-drawn-science-education-background_23-2148499325.jpg',
      alt: 'Educational learning concept'
    };
  }
} 