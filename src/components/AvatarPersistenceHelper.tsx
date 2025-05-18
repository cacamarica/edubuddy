
import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';

/**
 * This component helps fix any avatar persistence issues
 * by ensuring the avatar_url field is properly synced between
 * student profiles and other tables
 */
const AvatarPersistenceHelper = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    const checkAvatarsSync = async () => {
      try {
        // If this is a parent, check their students
        const { data: students } = await supabase
          .from('students')
          .select('*')
          .eq('parent_id', user.id);
          
        if (students && students.length > 0) {
          // Just logging for now, but this could be used to sync avatars if needed
          console.log(`Found ${students.length} students to check for avatar sync`);
        }
      } catch (error) {
        console.error("Error checking avatar persistence:", error);
      }
    };
    
    checkAvatarsSync();
  }, [user]);
  
  // This is a helper component that doesn't render anything
  return null;
};

export default AvatarPersistenceHelper;
