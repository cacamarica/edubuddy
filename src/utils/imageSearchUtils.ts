// Utility to search for images based on search terms
import axios from 'axios';

// Define the structure of an image result
export interface ImageSearchResult {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  source?: string;
}

/**
 * Search for images related to a query using a combination of methods
 * @param searchTerm The search term to find images for
 * @param safeSearch Whether to enforce safe search (for children)
 * @param maxResults Maximum number of results to return
 * @returns Array of image results
 */
export async function searchImages(
  searchTerm: string,
  safeSearch: boolean = true,
  maxResults: number = 5
): Promise<ImageSearchResult[]> {
  try {
    console.log(`[ImageSearch] Searching for images related to: ${searchTerm}`);
    
    // Create a specific search term that's educational and child-appropriate
    const enhancedSearchTerm = searchTerm.includes('educational') ? 
      searchTerm : `${searchTerm} educational illustration diagram`;
    
    // Try to get real images from Unsplash API
    try {
      // Using Unsplash API - this is a public access key for demo purposes
      // In production, you should use environment variables for the access key
      const unsplashAccessKey = 'eoEOKAIPk5nxBk0U4F-8GXq3QHvefF6HmAnhPW3RbLw';
      const unsplashResponse = await axios.get(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(enhancedSearchTerm)}&per_page=${maxResults}`,
        {
          headers: {
            'Authorization': `Client-ID ${unsplashAccessKey}`
          }
        }
      );
      
      if (unsplashResponse.data?.results && unsplashResponse.data.results.length > 0) {
        console.log(`[ImageSearch] Found ${unsplashResponse.data.results.length} images from Unsplash for "${searchTerm}"`);
        
        return unsplashResponse.data.results.map((result: any) => ({
          url: result.urls.regular,
          width: result.width,
          height: result.height,
          alt: result.alt_description || `Educational illustration of ${searchTerm}`,
          source: 'Unsplash'
        }));
      }
    } catch (apiError) {
      console.warn('[ImageSearch] Unsplash API error, falling back to placeholders:', apiError);
    }
    
    // Fallback to placeholders if API fails
    const placeholders: ImageSearchResult[] = [];
    
    // Create multiple different placeholder images based on the search term
    for (let i = 0; i < maxResults; i++) {
      // Use different seed params to get varied placeholder images
      const seed = `${enhancedSearchTerm.slice(0, 30)}-variety-${i}`;
      const colorParams = [
        'ffdfbf,ffd5dc,c0aede', // warm colors
        'd1d4f9,b6e3f4,c1f0e1', // cool colors
        'f5f7b2,c1e1c1,c3c9dd', // pastel colors
        'c4ddff,7fb4ff,dab6fc', // purplish blues
        'b6e6bd,c5e17a,f4f7be'  // nature greens
      ][i % 5];
      
      placeholders.push({
        url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${colorParams}`,
        alt: `Educational illustration of ${searchTerm}`,
        source: 'EduBuddy'
      });
    }
    
    console.log(`[ImageSearch] Created ${placeholders.length} placeholder images for "${searchTerm}"`);
    return placeholders;
  } catch (error) {
    console.error('[ImageSearch] Error searching for images:', error);
    // Return a single placeholder image in case of error
    return [{
      url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(searchTerm)}&backgroundColor=ffdfbf`,
      alt: `Fallback image for ${searchTerm}`,
      source: 'Error Fallback'
    }];
  }
}

/**
 * Generate a relevant image for a specific lesson topic and chapter
 * @param subject The subject of the lesson
 * @param topic The main topic of the lesson
 * @param chapterHeading The specific chapter heading
 * @returns An image result object
 */
export async function generateLessonImage(
  subject: string,
  topic: string,
  chapterHeading: string
): Promise<ImageSearchResult> {
  try {
    // Create a specific search term that combines all context elements
    const searchTerm = `${subject} ${topic} ${chapterHeading} educational diagram illustration`;
    
    // Use the Pexels API as another source of high-quality images
    try {
      // This is a demo API key - in production, use environment variables
      const pexelsApiKey = '563492ad6f917000010000015c73123c87fe478b9c35f09ba7e98a4c';
      const pexelsResponse = await axios.get(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerm)}&per_page=1`,
        {
          headers: {
            'Authorization': pexelsApiKey
          }
        }
      );
      
      if (pexelsResponse.data?.photos && pexelsResponse.data.photos.length > 0) {
        const photo = pexelsResponse.data.photos[0];
        console.log(`[ImageSearch] Found image from Pexels for "${searchTerm}"`);
        return {
          url: photo.src.large,
          width: photo.width,
          height: photo.height,
          alt: `Image illustrating ${chapterHeading} in ${topic}`,
          source: 'Pexels'
        };
      }
    } catch (apiError) {
      console.warn('[ImageSearch] Pexels API error, trying alternative sources:', apiError);
    }
    
    // If Pexels fails, try the regular image search
    const results = await searchImages(searchTerm, true, 1);
    
    // Return the first result (or a placeholder if empty)
    return results[0] || {
      url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(searchTerm)}&backgroundColor=ffdfbf`,
      alt: `Image illustrating ${chapterHeading} in ${topic}`,
      source: 'Placeholder'
    };
  } catch (error) {
    console.error('[ImageSearch] Error generating lesson image:', error);
    return {
      url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(`${topic}-${chapterHeading}`)}&backgroundColor=ffdfbf`,
      alt: `Image illustrating ${chapterHeading} in ${topic}`,
      source: 'Error Fallback'
    };
  }
} 