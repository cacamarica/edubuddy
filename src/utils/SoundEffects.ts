
/**
 * Sound Effects Utility for educational gamification
 */

export type SoundEffectType = 'success' | 'failure' | 'correct' | 'incorrect' | 'celebration' | 'level-up';

// Collection of sound effect URLs
const soundEffects: Record<SoundEffectType, string> = {
  success: 'https://cdn.freesound.org/previews/536/536782_11861866-lq.mp3',
  failure: 'https://cdn.freesound.org/previews/66/66136_634166-lq.mp3',
  correct: 'https://cdn.freesound.org/previews/580/580960_11861866-lq.mp3',
  incorrect: 'https://cdn.freesound.org/previews/362/362205_6742687-lq.mp3',
  celebration: 'https://cdn.freesound.org/previews/456/456966_5121236-lq.mp3',
  'level-up': 'https://cdn.freesound.org/previews/320/320775_5260872-lq.mp3'
};

// Cache for audio elements
const audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Play a sound effect
 * @param type The type of sound effect to play
 */
export const playSound = (type: SoundEffectType): void => {
  try {
    const url = soundEffects[type];
    if (!url) {
      console.error(`Sound effect type "${type}" not found`);
      return;
    }
    
    // Check if audio is already in cache
    if (!audioCache[type]) {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audioCache[type] = audio;
    }
    
    const audio = audioCache[type];
    audio.volume = 0.5; // Set default volume
    audio.currentTime = 0; // Reset to beginning
    
    try {
      audio.play().catch(err => {
        console.log("Audio autoplay was prevented:", err);
      });
    } catch (err) {
      console.log("Audio autoplay was prevented:", err);
    }
  } catch (error) {
    console.error("Error playing sound effect:", error);
  }
};

/**
 * Preload sound effects for better performance
 * @param types Array of sound effect types to preload
 */
export const preloadSounds = (types: SoundEffectType[] = Object.keys(soundEffects) as SoundEffectType[]) => {
  types.forEach(type => {
    if (!audioCache[type]) {
      const audio = new Audio(soundEffects[type]);
      audio.preload = 'auto';
      audioCache[type] = audio;
    }
  });
};

export default {
  play: playSound,
  preload: preloadSounds
};
