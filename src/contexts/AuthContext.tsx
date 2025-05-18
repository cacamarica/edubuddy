import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';
import { AuthContextProps, AuthState, ExtendedUser } from '@/types/auth';
import { handleAuthError } from '@/utils/errorHandling';

// Create context with default undefined value
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with a single state object
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthReady: false,
    userRole: null
  });
  
  // Ensure the LanguageContext is available
  const languageContext = useLanguage();
  const language = languageContext?.language || 'en';

  // Helper function to update state
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    // Helper function to handle auth state updates
    const handleAuthStateChange = (currentSession: Session | null) => {
      const user = currentSession?.user 
        ? { 
            ...currentSession.user, 
            accountType: currentSession.user.user_metadata?.role || 'student'
          } as ExtendedUser 
        : null;

      const userRole = user?.user_metadata?.role || null;

      updateState({
        session: currentSession,
        user,
        userRole,
        loading: false,
        isAuthReady: true
      });
    };

    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log("Auth state changed:", event);
      handleAuthStateChange(currentSession);
    });

    // Check for existing session
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        handleAuthStateChange(currentSession);
      } catch (error) {
        console.error("Error initializing auth:", error);
        updateState({ loading: false, isAuthReady: true });
      }
    };

    initAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [updateState]);

  const signIn = async (email: string, password: string) => {
    updateState({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        const errorMessage = handleAuthError(error, language);
        toast.error(errorMessage);
        return { error };
      }
      
      toast.success(language === 'id' ? 'Berhasil masuk!' : 'Successfully signed in!');
      return { error: null };
    } catch (error: any) {
      const errorMessage = handleAuthError(error, language);
      toast.error(errorMessage);
      return { error };
    } finally {
      updateState({ loading: false });
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'student' | 'parent') => {
    updateState({ loading: true });
    try {
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      });
      
      if (error) {
        const errorMessage = handleAuthError(error, language);
        toast.error(errorMessage);
        return { error };
      }
      
      if (data?.user && !data?.session) {
        toast.success(
          language === 'id'
            ? 'Berhasil mendaftar! Silakan periksa email Anda untuk konfirmasi.'
            : 'Successfully registered! Please check your email for confirmation.'
        );
      } else {
        toast.success(
          language === 'id'
            ? 'Berhasil mendaftar dan masuk!'
            : 'Successfully registered and signed in!'
        );
      }
      
      return { error: null };
    } catch (error: any) {
      const errorMessage = handleAuthError(error, language);
      toast.error(errorMessage);
      return { error };
    } finally {
      updateState({ loading: false });
    }
  };

  const signOut = async () => {
    updateState({ loading: true });
    try {
      await supabase.auth.signOut();
      toast.success(language === 'id' ? 'Berhasil keluar!' : 'Successfully signed out!');
    } catch (error) {
      const errorMessage = handleAuthError(error, language);
      toast.error(errorMessage);
    } finally {
      updateState({ loading: false });
    }
  };

  // Determine if user is a parent or student
  const isParent = !!state.user && state.userRole === 'parent';
  const isStudent = !!state.user && state.userRole === 'student';

  return (
    <AuthContext.Provider value={{ 
      ...state,
      signIn, 
      signUp, 
      signOut,
      isParent,
      isStudent
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
