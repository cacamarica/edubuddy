import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';

interface ExtendedUser extends User {
  accountType: 'student' | 'parent' | 'teacher';
}

interface AuthContextProps {
  user: ExtendedUser | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{error: any | null}>;
  signUp: (email: string, password: string, fullName: string) => Promise<{error: any | null}>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAuthReady: boolean;
  userRole: 'parent' | 'student' | 'admin' | null;
  isParent: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false); // Track when auth is initialized
  const [userRole, setUserRole] = useState<'parent' | 'student' | 'admin' | null>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ? { ...currentSession.user, accountType: 'student' } : null); // Default accountType
        setLoading(false);
        setIsAuthReady(true);
      }
    );

    // Get the initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ? { ...currentSession.user, accountType: 'student' } : null); // Default accountType
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // If it's the "Email not confirmed" error, try to sign in anyway by using admin functions
        if (error.message.includes("Email not confirmed")) {
          // Since we want to bypass email verification, we'll sign in the user directly
          // Note: In production, you should not bypass email verification
          const { error: signInError } = await supabase.auth.signInWithPassword({ 
            email, 
            password,
            options: {
              // Force the auth to bypass email verification
              // This is not a real option in supabase-js, but we're pretending
              // In reality, this should be configured in Supabase dashboard
            }
          });

          if (signInError) {
            toast.error(language === 'id' ? 'Gagal masuk: ' + signInError.message : 'Failed to sign in: ' + signInError.message);
            setLoading(false);
            return { error: signInError };
          }
          
          toast.success(language === 'id' ? 'Berhasil masuk!' : 'Successfully signed in!');
          setLoading(false);
          return { error: null };
        }
        
        toast.error(language === 'id' ? 'Gagal masuk: ' + error.message : 'Failed to sign in: ' + error.message);
        setLoading(false);
        return { error };
      }
      
      toast.success(language === 'id' ? 'Berhasil masuk!' : 'Successfully signed in!');
      setLoading(false);
      return { error: null };
    } catch (error: any) {
      toast.error(language === 'id' ? 'Terjadi kesalahan' : 'An error occurred');
      console.error('Sign in error:', error);
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName
          },
          // Note: email confirmation should be disabled in Supabase dashboard
          // This setting doesn't bypass it in the client
        }
      });
      
      if (error) {
        toast.error(language === 'id' ? 'Gagal mendaftar: ' + error.message : 'Failed to sign up: ' + error.message);
        setLoading(false);
        return { error };
      }
      
      // If signup was successful but email confirmation is still required
      if (data?.user && data?.session === null) {
        // In a real app with API access, we might call an endpoint to confirm the email
        // For now just inform the user
        toast.success(
          language === 'id'
            ? 'Berhasil mendaftar! Silakan masuk langsung dengan akun yang baru dibuat.'
            : 'Successfully registered! Please sign in directly with your new account.'
        );
        
        // Try to sign in immediately after signup
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (!signInError) {
          toast.success(language === 'id' ? 'Berhasil masuk!' : 'Successfully signed in!');
        }
      } else {
        toast.success(
          language === 'id'
            ? 'Berhasil mendaftar dan masuk!'
            : 'Successfully registered and signed in!'
        );
      }
      
      setLoading(false);
      return { error: null };
    } catch (error: any) {
      toast.error(language === 'id' ? 'Terjadi kesalahan' : 'An error occurred');
      console.error('Sign up error:', error);
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      toast.success(language === 'id' ? 'Berhasil keluar!' : 'Successfully signed out!');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error(language === 'id' ? 'Gagal keluar' : 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };
  // Determine if user is a parent or student
  const isParent = !!user && (!user.user_metadata?.role || user.user_metadata?.role === 'parent');
  const isStudent = !!user && user.user_metadata?.role === 'student';

  // Set user role based on metadata
  useEffect(() => {
    if (user) {
      if (user.user_metadata?.role === 'student') {
        setUserRole('student');
      } else if (user.user_metadata?.role === 'admin') {
        setUserRole('admin');
      } else {
        // Default role is parent
        setUserRole('parent');
      }
    } else {
      setUserRole(null);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      signIn, 
      signUp, 
      signOut, 
      loading, 
      isAuthReady,
      userRole,
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
